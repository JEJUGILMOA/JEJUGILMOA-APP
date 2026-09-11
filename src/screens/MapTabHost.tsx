import React, { useCallback, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import {
  setCurrentTripFromWeb,
  setMapExploreFromWeb,
  setPlanDetailFromWeb,
  setTripCompleteFromWeb,
  setTripVisitResultFromWeb,
} from '../bridge/mapDataStore';
import { setPlanListFromWeb } from '../bridge/planListStore';
import {
  handleBridgeMessage,
  injectStoredWebAuthToWeb,
  sendToWeb,
} from '../bridge/webviewBridge';
import { registerBridgeWebView } from '../bridge/webviewRegistry';
import { getStoredWebAuth } from '../auth/webAuthSession';
import { WEB_BASE_URL } from '../constants/config';
import MapScreen from '../screens/MapScreen';

const HIDE_WEB_CHROME = `
(function() {
  var style = document.createElement('style');
  style.setAttribute('data-gilmoa-map-data', '1');
  style.textContent = [
    'html,body,#root,[data-gilmoa-shell],main{background:transparent!important;margin:0!important;padding:0!important;overflow:hidden!important;}',
    'nav[aria-label="하단 내비게이션"]{display:none!important;}',
    '[data-gilmoa-map-data-host]{display:none!important;}',
  ].join('');
  document.documentElement.appendChild(style);
  true;
})();
`;

/**
 * 지도 탭 호스트: 네이티브 MapScreen(화면) + 숨은 /map WebView(인증·API)
 */
export default function MapTabHost(): React.JSX.Element {
  const webviewRef = useRef<WebView>(null);
  const unregisterRef = useRef<(() => void) | null>(null);

  const attachWebView = useCallback((instance: WebView | null) => {
    unregisterRef.current?.();
    unregisterRef.current = null;
    webviewRef.current = instance;
    if (instance) {
      unregisterRef.current = registerBridgeWebView(instance);
    }
  }, []);

  const onMessage = useCallback((event: WebViewMessageEvent) => {
    handleBridgeMessage(event.nativeEvent.data, webviewRef.current, {
      onSetMap: (message) => {
        if (!message.visible) return;
        if (message.places != null || message.heatmap != null) {
          setMapExploreFromWeb(message.places ?? [], message.heatmap ?? []);
        }
      },
      onSetPlanSummaries: ({ plans, error }) => {
        setPlanListFromWeb(plans, error);
      },
      onMapPlanDetail: (message) => {
        if (message.error) {
          setPlanDetailFromWeb(null, message.error);
          return;
        }
        setPlanDetailFromWeb({
          planId: message.planId,
          title: message.title,
          nights: message.nights,
          days: message.days,
          durationLabel: message.durationLabel,
          waypoints: message.waypoints,
          routePath: message.routePath ?? [],
          dayRoutes: message.dayRoutes ?? [],
          legs: message.legs ?? [],
        });
      },
      onMapCurrentTrip: (message) => {
        setCurrentTripFromWeb(message.trip, message.error);
      },
      onMapTripVisitResult: (message) => {
        if (message.error) {
          setTripVisitResultFromWeb(null, message.error);
          return;
        }
        setTripVisitResultFromWeb({
          tripId: message.tripId,
          title: '',
          status: 'IN_PROGRESS',
          waypoints: message.waypoints,
        });
      },
      onMapTripCompleteResult: (message) => {
        if (message.error) {
          setTripCompleteFromWeb(null, message.error);
          return;
        }
        setTripCompleteFromWeb({
          tripId: message.tripId,
          title: message.title,
          earnedBadges: message.earnedBadges ?? [],
        });
      },
      onMapError: (message) => {
        console.warn('[map-bridge]', message);
      },
      onWebReady: () => {
        injectStoredWebAuthToWeb(webviewRef.current, getStoredWebAuth());
      },
    });
  }, []);

  const onLoadEnd = useCallback(() => {
    sendToWeb(webviewRef.current, {
      type: 'NATIVE_READY',
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
    });
    injectStoredWebAuthToWeb(webviewRef.current, getStoredWebAuth());
  }, []);

  return (
    <View style={styles.root}>
      <View style={styles.mapLayer}>
        <MapScreen />
      </View>
      {/*
        WebView는 Yoga에서 intrinsic size를 잡아 지도 아래에 빈 칸을 만들 수 있음.
        0×0 absolute 호스트로 레이아웃에서 완전히 제외한다.
      */}
      <View style={styles.hiddenHost} pointerEvents="none" collapsable={false}>
        <WebView
          ref={attachWebView}
          style={styles.hiddenWeb}
          source={{ uri: `${WEB_BASE_URL}/map` }}
          onMessage={onMessage}
          onLoadEnd={onLoadEnd}
          injectedJavaScript={HIDE_WEB_CHROME}
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          javaScriptEnabled
          domStorageEnabled
          originWhitelist={['*']}
          setSupportMultipleWindows={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  mapLayer: {
    flex: 1,
  },
  hiddenHost: {
    position: 'absolute',
    width: 0,
    height: 0,
    overflow: 'hidden',
    opacity: 0,
  },
  /** 로드·JS 실행을 위해 최소 크기만 유지 (호스트가 클리핑) */
  hiddenWeb: {
    width: 8,
    height: 8,
  },
});

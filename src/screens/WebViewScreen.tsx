import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

import {
  handleBridgeMessage,
  HIDDEN_ITINERARY_CHROME,
  mergePlanMap,
  sendToWeb,
  type HeaderState,
  type PlanItineraryChromeState,
  type PlanMapState,
} from '../bridge/webviewBridge';
import ItineraryChrome from '../components/map/ItineraryChrome';
import ItineraryNativeSheet, {
  ITINERARY_SHEET_HANDLE_HEIGHT,
  ItinerarySheetExpandChip,
  type ItinerarySheetRef,
} from '../components/map/ItineraryNativeSheet';
import PlanItineraryMap from '../components/map/PlanItineraryMap';
import PageHeader from '../components/PageHeader';
import WebDialog, { HIDDEN_WEB_DIALOG } from '../components/WebDialog';
import WebToast, { HIDDEN_NATIVE_TOAST } from '../components/WebToast';
import { WEB_BASE_URL } from '../constants/config';
import { TabBarTokens } from '../constants/tabs';

type Props = {
  /** 웹앱 내 경로. 예: '/', '/plan', '/record', '/my' */
  path: string;
};

/** 네이티브 탭바·페이지 헤더·일정 지도가 있으므로 웹 대응 UI는 숨김 */
const HIDE_WEB_CHROME = `
(function() {
  var style = document.createElement('style');
  style.setAttribute('data-gilmoa-native', '1');
  style.textContent = [
    'nav[aria-label="하단 내비게이션"]{display:none!important;}',
    'header[data-gilmoa-page-header]{display:none!important;}',
    '[data-gilmoa-itinerary-map]{display:none!important;}',
    '[data-gilmoa-itinerary-zoom]{display:none!important;}',
    '[data-gilmoa-itinerary-float]{display:none!important;}',
    '[data-gilmoa-itinerary-sheet-chrome]{display:none!important;}',
    'html.gilmoa-native-map,html.gilmoa-native-map body,html.gilmoa-native-map #root,html.gilmoa-native-map [data-gilmoa-shell],html.gilmoa-native-map main{background:transparent!important;height:100%!important;max-height:100%!important;overflow:hidden!important;}',
    'html.gilmoa-native-map [data-gilmoa-itinerary-sheet-body]{height:100%!important;max-height:100%!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch!important;touch-action:pan-y!important;}',
    'html,body,#root,[data-gilmoa-shell],main{height:100%!important;min-height:100%!important;}'
  ].join('');
  document.documentElement.appendChild(style);
  true;
})();
`;

const HIDDEN_HEADER: HeaderState = {
  visible: false,
  title: '',
  showBack: false,
  actions: [],
};

const HIDDEN_MAP: PlanMapState = {
  visible: false,
  departure: null,
  stops: [],
  unassigned: [],
  overlayTop: 120,
  sheetHeight: 0,
  cameraFitKey: undefined,
  webOnTop: false,
};

export default function WebViewScreen({ path }: Props) {
  const insets = useSafeAreaInsets();
  const webviewRef = useRef<WebView>(null);
  const itinerarySheetRef = useRef<ItinerarySheetRef>(null);
  const sheetPosition = useSharedValue(0);
  const isItinerarySV = useSharedValue(0);
  const uri = useMemo(() => `${WEB_BASE_URL}${path}`, [path]);
  const [header, setHeader] = useState<HeaderState>(HIDDEN_HEADER);
  const [planMap, setPlanMap] = useState<PlanMapState>(HIDDEN_MAP);
  const [zoomPulse, setZoomPulse] = useState({ seq: 0, delta: 0 });
  const [webDialog, setWebDialog] = useState(HIDDEN_WEB_DIALOG);
  const [webToast, setWebToast] = useState(HIDDEN_NATIVE_TOAST);
  const [itineraryChrome, setItineraryChrome] =
    useState<PlanItineraryChromeState>(HIDDEN_ITINERARY_CHROME);
  const [sheetCollapsed, setSheetCollapsed] = useState(false);

  const onMessage = useCallback((event: WebViewMessageEvent) => {
    handleBridgeMessage(event.nativeEvent.data, webviewRef.current, {
      onSetHeader: setHeader,
      onSetMap: (message) => {
        setPlanMap((prev) => mergePlanMap(prev, message));
        if (!message.visible) {
          setItineraryChrome(HIDDEN_ITINERARY_CHROME);
          setSheetCollapsed(false);
        }
      },
      onMapZoom: (delta) => setZoomPulse((prev) => ({ seq: prev.seq + 1, delta })),
      onSetModal: (message) => {
        if (!message.visible) {
          setWebDialog((prev) => (message.id && prev.id !== message.id ? prev : HIDDEN_WEB_DIALOG));
          return;
        }
        setWebDialog({
          visible: true,
          id: message.id ?? 'modal',
          title: message.title ?? '',
          description: message.description,
          actions: message.actions ?? [],
        });
      },
      onSetToast: (message) => {
        if (!message.visible) {
          setWebToast(HIDDEN_NATIVE_TOAST);
          return;
        }
        setWebToast({
          visible: true,
          id: message.id ?? 'toast',
          kind: message.kind ?? 'info',
          message: message.message ?? '',
          duration: message.duration ?? 2000,
          actions: message.actions ?? [],
        });
      },
      onSetItineraryChrome: (message) => {
        if (!message.visible) {
          setItineraryChrome(HIDDEN_ITINERARY_CHROME);
          setPlanMap(HIDDEN_MAP);
          setSheetCollapsed(false);
          return;
        }
        setItineraryChrome((prev) => ({
          visible: true,
          day: message.day ?? prev.day,
          totalDays: message.totalDays ?? prev.totalDays,
          dateLabel: message.dateLabel ?? prev.dateLabel,
          searchQuery: message.searchQuery ?? prev.searchQuery,
          searchPlaceholder: message.searchPlaceholder ?? prev.searchPlaceholder,
          isSelectingDeparture: message.isSelectingDeparture ?? prev.isSelectingDeparture,
          nextLabel: message.nextLabel ?? prev.nextLabel,
          sheetTitle: message.sheetTitle ?? prev.sheetTitle,
        }));
      },
    });
  }, []);

  const onLoadEnd = useCallback(() => {
    sendToWeb(webviewRef.current, {
      type: 'NATIVE_READY',
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
    });
  }, []);

  const onBack = useCallback(() => {
    sendToWeb(webviewRef.current, { type: 'HEADER_BACK' });
  }, []);

  const onAction = useCallback((id: string) => {
    sendToWeb(webviewRef.current, { type: 'HEADER_ACTION', id });
  }, []);

  const onAssignPlace = useCallback((id: string) => {
    sendToWeb(webviewRef.current, { type: 'MAP_ASSIGN_PLACE', id });
  }, []);

  const onTapMap = useCallback(() => {
    sendToWeb(webviewRef.current, { type: 'MAP_TAPPED' });
  }, []);

  const onModalAction = useCallback((id: string) => {
    sendToWeb(webviewRef.current, { type: 'MODAL_ACTION', id });
  }, []);

  const onModalDismiss = useCallback(() => {
    sendToWeb(webviewRef.current, { type: 'MODAL_DISMISS' });
  }, []);

  const onHideToast = useCallback(() => {
    setWebToast(HIDDEN_NATIVE_TOAST);
  }, []);

  const onToastAction = useCallback((id: string) => {
    setWebToast(HIDDEN_NATIVE_TOAST);
    sendToWeb(webviewRef.current, { type: 'TOAST_ACTION', id });
  }, []);

  const onItineraryDay = useCallback((day: number) => {
    sendToWeb(webviewRef.current, { type: 'ITINERARY_DAY', day });
  }, []);

  const onItinerarySearch = useCallback((query: string) => {
    sendToWeb(webviewRef.current, { type: 'ITINERARY_SEARCH', query });
  }, []);

  const onItinerarySearchClear = useCallback(() => {
    sendToWeb(webviewRef.current, { type: 'ITINERARY_SEARCH', query: '' });
  }, []);

  const onItineraryNext = useCallback(() => {
    sendToWeb(webviewRef.current, { type: 'ITINERARY_NEXT' });
  }, []);

  const onItineraryDepartureCancel = useCallback(() => {
    sendToWeb(webviewRef.current, { type: 'ITINERARY_DEPARTURE_CANCEL' });
  }, []);

  const itineraryMode = planMap.visible;

  useEffect(() => {
    isItinerarySV.value = itineraryMode ? 1 : 0;
    if (!itineraryMode) sheetPosition.value = 0;
  }, [isItinerarySV, itineraryMode, sheetPosition]);

  const webviewWrapStyle = useAnimatedStyle(() => {
    if (isItinerarySV.value === 0) {
      return {
        flex: 1,
        position: 'relative' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1,
        elevation: 1,
      };
    }
    return {
      flex: 0,
      position: 'absolute' as const,
      left: 0,
      right: 0,
      bottom: 0,
      top: sheetPosition.value + ITINERARY_SHEET_HANDLE_HEIGHT,
      zIndex: 12,
      elevation: 12,
    };
  });

  const topInset = itineraryMode ? 0 : header.visible ? 0 : insets.top;
  const expandToMid =
    itineraryChrome.isSelectingDeparture || Boolean(itineraryChrome.searchQuery.trim());

  return (
    <View
      style={[
        styles.container,
        { paddingTop: topInset, backgroundColor: itineraryMode ? '#F3F4F8' : '#fff' },
      ]}
    >
      {header.visible && !itineraryMode ? (
        <View style={styles.headerLayer}>
          <PageHeader
            title={header.title}
            showBack={header.showBack}
            insetTop={insets.top}
            rightText={header.rightText}
            actions={header.actions}
            onBack={onBack}
            onAction={onAction}
          />
        </View>
      ) : null}
      {itineraryMode ? (
        <View style={styles.mapFull} pointerEvents="auto">
          <PlanItineraryMap
            map={planMap}
            zoomPulse={zoomPulse}
            controlsTop={insets.top + 100}
            onAssignPlace={onAssignPlace}
            onTapMap={onTapMap}
          />
        </View>
      ) : null}
      <ItineraryNativeSheet
        ref={itinerarySheetRef}
        visible={itineraryMode}
        title={itineraryChrome.sheetTitle}
        expandToMid={expandToMid}
        animatedPosition={sheetPosition}
        onCollapsedChange={setSheetCollapsed}
      />
      <Animated.View style={[styles.webviewHost, webviewWrapStyle]}>
        <WebView
          ref={webviewRef}
          style={[styles.webviewFill, { backgroundColor: itineraryMode ? 'transparent' : '#fff' }]}
          containerStyle={itineraryMode ? styles.webviewContainerTransparent : undefined}
          nestedScrollEnabled
          scrollEnabled
          overScrollMode="content"
          source={{ uri }}
          onMessage={onMessage}
          onLoadEnd={onLoadEnd}
          startInLoadingState={!itineraryMode}
          injectedJavaScriptBeforeContentLoaded={HIDE_WEB_CHROME}
          injectedJavaScript={HIDE_WEB_CHROME}
          renderLoading={() => (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color={TabBarTokens.active} />
            </View>
          )}
        />
      </Animated.View>
      {itineraryMode ? (
        <ItineraryChrome
          chrome={itineraryChrome}
          insetTop={insets.top}
          onBack={onBack}
          onNext={onItineraryNext}
          onDayChange={onItineraryDay}
          onSearchChange={onItinerarySearch}
          onSearchClear={onItinerarySearchClear}
          onDepartureCancel={onItineraryDepartureCancel}
        />
      ) : null}
      <ItinerarySheetExpandChip
        visible={itineraryMode && sheetCollapsed}
        label={itineraryChrome.sheetTitle}
        onPress={() => itinerarySheetRef.current?.snapToIndex(1)}
      />
      <WebToast
        toast={webToast}
        insetTop={insets.top}
        onHide={onHideToast}
        onAction={onToastAction}
      />
      <WebDialog
        dialog={webDialog}
        onAction={onModalAction}
        onDismiss={onModalDismiss}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  mapFull: {
    ...StyleSheet.absoluteFill,
    zIndex: 0,
    elevation: 0,
  },
  webviewHost: {
    flex: 1,
    zIndex: 1,
  },
  webviewFill: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  webviewContainerTransparent: { flex: 1, backgroundColor: 'transparent' },
  headerLayer: {
    zIndex: 3,
    elevation: 5,
  },
  loading: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

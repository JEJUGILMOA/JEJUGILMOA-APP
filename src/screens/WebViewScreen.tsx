import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  WebView,
  type WebViewMessageEvent,
  type WebViewNavigation,
} from 'react-native-webview';
import { router, useFocusEffect } from 'expo-router';

import { getStoredWebAuth } from '../auth/webAuthSession';
import { completeNativeLogin } from '../auth/completeNativeLogin';
import { completeNativeLogout } from '../auth/completeNativeLogout';
import { setPendingOAuthLaunch } from '../auth/oauthLaunch';
import {
  handleBridgeMessage,
  HIDDEN_ITINERARY_CHROME,
  injectStoredWebAuthToWeb,
  mergePlanMap,
  sendToWeb,
  type HeaderState,
  type PlanItineraryChromeState,
  type PlanMapState,
} from '../bridge/webviewBridge';
import { setPlanListFromWeb } from '../bridge/planListStore';
import { registerBridgeWebView } from '../bridge/webviewRegistry';
import ItineraryChrome from '../components/map/ItineraryChrome';
import ItineraryNativeSheet, {
  DEFAULT_OPEN_SNAP_INDEX,
  ITINERARY_SHEET_HANDLE_HEIGHT,
  ItinerarySheetExpandChip,
  type ItinerarySheetRef,
} from '../components/map/ItineraryNativeSheet';
import VisitedPlaceNativeSheet, {
  type VisitedPlaceSheetPlace,
} from '../components/map/VisitedPlaceNativeSheet';
import NativePhotoViewer from '../components/map/NativePhotoViewer';
import PlanItineraryMap from '../components/map/PlanItineraryMap';
import PageHeader from '../components/PageHeader';
import WebDialog, { HIDDEN_WEB_DIALOG } from '../components/WebDialog';
import WebToast, { HIDDEN_NATIVE_TOAST } from '../components/WebToast';
import { WEB_BASE_URL } from '../constants/config';
import { MapTokens } from '../constants/map';
import { TabBarTokens } from '../constants/tabs';
import { useAuth } from '../context/AuthContext';
import { takePendingNativeToast } from '../nativeToastQueue';
import { setPendingMapMode } from '../pendingMapMode';
import { setPendingWebPath, takePendingWebPath, subscribeForceTabWebPath } from '../pendingWebPath';
import { useTabRepress } from '../hooks/useTabRepress';
import type { MapBounds } from '../api/map';
import {
  JEJU_DEFAULT_BOUNDS,
  roundBounds,
  shrinkBounds,
} from '../utils/mapBounds';

/** 일반 지도와 동일 — 화면 가운데 약 55% 영역으로 검색 */
const SEARCH_BOUNDS_RATIO = 0.55;
/** Day 페이저(높이 40) 바로 아래 — paddingTop(inset+8) + row(40) + gap(8) */
const ITINERARY_DAY_PAGER_ROW = 40;
const ITINERARY_SEARCH_HERE_GAP = 8;

function toSearchArea(bounds: MapBounds): MapBounds {
  return roundBounds(shrinkBounds(bounds, SEARCH_BOUNDS_RATIO));
}

type Props = {
  /** 웹앱 내 경로. 예: '/', '/plan', '/record', '/my', '/login' */
  path: string;
  /** expo-router Tabs route name. 탭이 아니면 생략 */
  tabName?: string;
};

/** 네이티브 탭바·일정 지도가 있으므로 웹 대응 UI는 숨김.
 * 페이지 헤더는 FE가 라우트 showHeader에 따라 숨김(네이티브 헤더) / 표시(웹 헤더)를 결정한다. */
const HIDE_WEB_CHROME = `
(function() {
  var style = document.createElement('style');
  style.setAttribute('data-gilmoa-native', '1');
  style.textContent = [
    'nav[aria-label="하단 내비게이션"]{display:none!important;}',
    '[data-gilmoa-itinerary-map]{display:none!important;}',
    '[data-gilmoa-itinerary-zoom]{display:none!important;}',
    '[data-gilmoa-itinerary-float]{display:none!important;}',
    '[data-gilmoa-itinerary-sheet-chrome]{display:none!important;}',
    'html.gilmoa-native-map,html.gilmoa-native-map body,html.gilmoa-native-map #root,html.gilmoa-native-map [data-gilmoa-shell],html.gilmoa-native-map main{background:transparent!important;height:100%!important;max-height:100%!important;overflow:hidden!important;padding-bottom:0!important;}',
    'html.gilmoa-native-map [data-gilmoa-itinerary-sheet-body]{flex:1!important;min-height:0!important;max-height:none!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch!important;touch-action:pan-y!important;}',
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
  places: [],
  heatmap: [],
  overlayTop: 120,
  sheetHeight: 0,
  cameraFitKey: undefined,
  webOnTop: false,
};

export default function WebViewScreen({ path, tabName }: Props) {
  const { signIn, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const webviewRef = useRef<WebView>(null);
  const itinerarySheetRef = useRef<ItinerarySheetRef>(null);
  const sheetPosition = useSharedValue(0);
  const isItinerarySV = useSharedValue(0);
  const [activePath, setActivePath] = useState(path);
  const uri = useMemo(() => `${WEB_BASE_URL}${activePath}`, [activePath]);
  const [header, setHeader] = useState<HeaderState>(HIDDEN_HEADER);
  const [planMap, setPlanMap] = useState<PlanMapState>(HIDDEN_MAP);
  const [zoomPulse, setZoomPulse] = useState({ seq: 0, delta: 0 });
  const [webDialog, setWebDialog] = useState(HIDDEN_WEB_DIALOG);
  const [webToast, setWebToast] = useState(HIDDEN_NATIVE_TOAST);
  const [visitedPlaceSheet, setVisitedPlaceSheet] =
    useState<VisitedPlaceSheetPlace | null>(null);
  const [photoViewer, setPhotoViewer] = useState<{
    photoUrls: string[];
    initialIndex: number;
  } | null>(null);
  const [itineraryChrome, setItineraryChrome] =
    useState<PlanItineraryChromeState>(HIDDEN_ITINERARY_CHROME);
  const [sheetCollapsed, setSheetCollapsed] = useState(false);
  const lastMapBoundsRef = useRef<MapBounds>(JEJU_DEFAULT_BOUNDS);
  const [itineraryViewBounds, setItineraryViewBounds] =
    useState<MapBounds>(JEJU_DEFAULT_BOUNDS);
  /** 로그인 후 탭 루트 로드 뒤 push할 경로 */
  const pendingPushPathRef = useRef<string | null>(null);

  const flushPendingPushPath = useCallback(() => {
    const pushPath = pendingPushPathRef.current;
    if (!pushPath) return;
    pendingPushPathRef.current = null;
    sendToWeb(webviewRef.current, { type: 'NAVIGATE_WEB_PATH', path: pushPath });
  }, []);

  useEffect(() => {
    setActivePath(path);
  }, [path]);

  const unregisterWebViewRef = useRef<(() => void) | null>(null);
  const bindWebViewRef = useCallback((instance: WebView | null) => {
    unregisterWebViewRef.current?.();
    unregisterWebViewRef.current = null;
    webviewRef.current = instance;
    if (instance) {
      unregisterWebViewRef.current = registerBridgeWebView(instance, tabName);
    }
  }, [tabName]);

  useEffect(
    () => () => {
      unregisterWebViewRef.current?.();
      unregisterWebViewRef.current = null;
    },
    [],
  );

  // 화면 전환 후 마운트/포커스 시 대기 중인 네이티브 토스트·딥링크
  useFocusEffect(
    useCallback(() => {
      const pendingToast = takePendingNativeToast();
      if (pendingToast) setWebToast(pendingToast);

      if (!tabName) return;
      const pending = takePendingWebPath(tabName);
      if (!pending) return;

      pendingPushPathRef.current = pending.pushPath ?? null;
      const nextPath = pending.path;
      // activePath를 deps에 넣지 않음 — setActivePath 후 effect가 다시 돌며 push ref를 잃는 것 방지
      setActivePath((current) => {
        if (nextPath === current) {
          // 이미 탭 루트면 remount 없이 바로 push (마이크로태스크로 ref 세팅 이후)
          queueMicrotask(() => flushPendingPushPath());
          return current;
        }
        return nextPath;
      });
      setHeader(HIDDEN_HEADER);
      setPlanMap(HIDDEN_MAP);
      setItineraryChrome(HIDDEN_ITINERARY_CHROME);
      setSheetCollapsed(false);
    }, [tabName, flushPendingPushPath]),
  );

  // 이미 포커스된 탭에도 강제 경로 적용 (로그아웃 후 /my 복귀 등)
  useEffect(() => {
    if (!tabName) return;
    return subscribeForceTabWebPath((name, nextPath) => {
      if (name !== tabName) return;
      takePendingWebPath(tabName);
      pendingPushPathRef.current = null;
      setActivePath(nextPath);
      setHeader(HIDDEN_HEADER);
      setPlanMap(HIDDEN_MAP);
      setItineraryChrome(HIDDEN_ITINERARY_CHROME);
      setSheetCollapsed(false);
    });
  }, [tabName]);

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
      onRequestMapRegion: () => {
        sendToWeb(webviewRef.current, {
          type: 'MAP_REGION_CHANGED',
          ...lastMapBoundsRef.current,
        });
      },
      onSetModal: (message) => {
        if (!message.visible) {
          // 닫을 때 title/description을 바로 비우면 fade-out 중 빈 패널이 보인다
          setWebDialog((prev) => {
            if (message.id && prev.id && prev.id !== message.id) return prev;
            return { ...prev, visible: false };
          });
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
          showSearchHere: message.showSearchHere ?? prev.showSearchHere,
        }));
      },
      onRequestAppleLogin: () => {
        // expo-crypto / Apple Auth는 네이티브 모듈 — 앱 기동 시 import하면
        // 재빌드 전 바이너리에서 WebView 전체가 깨지므로 요청 시에만 로드한다.
        void (async () => {
          try {
            const { signInWithAppleNative } = await import('../auth/appleAuth');
            const credential = await signInWithAppleNative();
            sendToWeb(webviewRef.current, {
              type: 'APPLE_CREDENTIAL',
              identityToken: credential.identityToken,
              rawNonce: credential.rawNonce,
              authorizationCode: credential.authorizationCode,
              email: credential.email,
              fullName: credential.fullName,
            });
          } catch (error) {
            const code =
              error && typeof error === 'object' && 'code' in error
                ? String((error as { code?: string }).code)
                : '';
            if (code === 'ERR_REQUEST_CANCELED') {
              sendToWeb(webviewRef.current, { type: 'APPLE_LOGIN_CANCELLED' });
              return;
            }
            const message =
              error instanceof Error ? error.message : 'Apple 로그인에 실패했습니다.';
            sendToWeb(webviewRef.current, {
              type: 'APPLE_LOGIN_ERROR',
              message,
            });
          }
        })();
      },
      onOpenOAuthLogin: ({ url, title }) => {
        setPendingOAuthLaunch(url, title);
        router.push({
          pathname: '/oauth',
          params: { title: title ?? '로그인' },
        });
      },
      onLoginSuccess: (payload) => {
        void completeNativeLogin({
          provider: payload?.provider,
          returnTo: payload?.returnTo,
          accessToken: payload?.accessToken,
          user: payload?.user,
          signIn,
        });
      },
      onWebReady: () => {
        injectStoredWebAuthToWeb(webviewRef.current, getStoredWebAuth());
        // 로그인 후 탭 루트 로드가 끝난 뒤 returnTo로 push
        flushPendingPushPath();
      },
      onNavigateToMap: (payload) => {
        const mode = payload?.mode;
        if (
          mode === 'general' ||
          mode === 'plan' ||
          mode === 'activeTrip' ||
          mode === 'heatmap'
        ) {
          setPendingMapMode(mode);
        } else {
          setPendingMapMode('general');
        }
        router.navigate('/(tabs)/map');
      },
      onNavigateToTab: ({ tab, path }) => {
        const pendingTab = tab === 'home' ? 'index' : tab;
        if (path) {
          setPendingWebPath(pendingTab, path);
        }
        if (tab === 'home') {
          router.navigate('/(tabs)');
          return;
        }
        router.navigate(`/(tabs)/${tab}`);
      },
      onSetPlanSummaries: ({ plans, error }) => {
        setPlanListFromWeb(plans, error);
      },
      onLogout: () => {
        completeNativeLogout({ signOut });
      },
      onToggleTripVisitSpoof: () => {
        void (async () => {
          const { toggleTripVisitSpoof } = await import('../utils/tripVisitSpoof');
          const enabled = await toggleTripVisitSpoof();
          setWebToast({
            visible: true,
            id: `trip-visit-spoof-${Date.now()}`,
            kind: 'info',
            message: enabled
              ? '개발자 옵션: 방문 인증 시뮬레이션 ON'
              : '개발자 옵션: 방문 인증 시뮬레이션 OFF',
            duration: 2500,
            actions: [],
          });
        })();
      },
      onOpenVisitedPlaceSheet: (message) => {
        setVisitedPlaceSheet(message.place);
      },
      onCloseVisitedPlaceSheet: () => {
        setVisitedPlaceSheet(null);
      },
      onOpenNativePhotoViewer: (message) => {
        if (!message.photoUrls?.length) return;
        setPhotoViewer({
          photoUrls: message.photoUrls,
          initialIndex: message.initialIndex ?? 0,
        });
      },
      onCloseNativePhotoViewer: () => {
        setPhotoViewer(null);
      },
    });
  }, [signIn, signOut, flushPendingPushPath]);

  const onLoadEnd = useCallback(() => {
    sendToWeb(webviewRef.current, {
      type: 'NATIVE_READY',
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
    });
    injectStoredWebAuthToWeb(webviewRef.current, getStoredWebAuth());
  }, []);

  const onWebError = useCallback((event: { nativeEvent: { code?: number; description?: string } }) => {
    // console.warn('[WebView] load error', event.nativeEvent.code, event.nativeEvent.description);
  }, []);

  /** http(s)·about 외 메인 프레임 이동은 iOS에서 "Load Failed"로 깨지기 쉬워 차단 */
  const onShouldStartLoadWithRequest = useCallback((request: WebViewNavigation) => {
    const url = request.url ?? '';
    if (
      url.startsWith('http://') ||
      url.startsWith('https://') ||
      url.startsWith('about:') ||
      url === 'blank'
    ) {
      return true;
    }
    // console.warn('[WebView] blocked navigation', url.slice(0, 120));
    return false;
  }, []);

  const reloadWebView = useCallback(() => {
    webviewRef.current?.reload();
  }, []);

  useTabRepress(
    tabName ?? '',
    useCallback(() => {
      if (!tabName) return;
      setActivePath(path);
      sendToWeb(webviewRef.current, { type: 'TAB_POP_TO_ROOT', path });
    }, [path, tabName]),
  );

  const onBack = useCallback(() => {
    // `/login?returnTo=...` 도 로그인 스택 — 네이티브 화면을 pop
    const pathOnly = path.split('?')[0];
    const activeOnly = activePath.split('?')[0];
    if (pathOnly === '/login' || activeOnly === '/login') {
      if (router.canGoBack()) {
        router.back();
      }
      return;
    }
    sendToWeb(webviewRef.current, { type: 'HEADER_BACK' });
  }, [activePath, path]);

  const onAction = useCallback((id: string) => {
    sendToWeb(webviewRef.current, { type: 'HEADER_ACTION', id });
  }, []);

  const onAssignPlace = useCallback((id: string) => {
    sendToWeb(webviewRef.current, { type: 'MAP_ASSIGN_PLACE', id });
  }, []);

  const onTapMap = useCallback(() => {
    sendToWeb(webviewRef.current, { type: 'MAP_TAPPED' });
  }, []);

  const onMapRegionChanged = useCallback((bounds: MapBounds) => {
    lastMapBoundsRef.current = bounds;
    setItineraryViewBounds(bounds);
    sendToWeb(webviewRef.current, {
      type: 'MAP_REGION_CHANGED',
      ...bounds,
    });
  }, []);

  const itineraryLiveSearchArea = useMemo(
    () => toSearchArea(itineraryViewBounds),
    [itineraryViewBounds],
  );

  const handleItinerarySearchHere = useCallback(() => {
    sendToWeb(webviewRef.current, {
      type: 'ITINERARY_SEARCH_HERE',
      ...itineraryLiveSearchArea,
    });
  }, [itineraryLiveSearchArea]);

  // Day N · 날짜 페이저 바로 아래 (시트 위치가 아니라 상단 크롬 기준)
  const itinerarySearchHereTop =
    insets.top + 8 + ITINERARY_DAY_PAGER_ROW + ITINERARY_SEARCH_HERE_GAP;

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

  // 장소 추가 탭이면 바로 표시(일반 지도처럼 '이동 후' 조건이면 시트가 지도를 가려 버튼을 못 봄)
  const showItinerarySearchHere =
    itineraryMode &&
    itineraryChrome.showSearchHere &&
    !itineraryChrome.searchQuery.trim();

  useEffect(() => {
    isItinerarySV.value = itineraryMode ? 1 : 0;
    if (!itineraryMode) {
      sheetPosition.value = 0;
      setSheetCollapsed(false);
      return;
    }
    // 지도 진입 시 시트를 최대(88%)로 연다
    setSheetCollapsed(false);
    const timer = setTimeout(() => {
      itinerarySheetRef.current?.snapToIndex(DEFAULT_OPEN_SNAP_INDEX);
    }, 80);
    return () => clearTimeout(timer);
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
            onRegionChanged={onMapRegionChanged}
          />
        </View>
      ) : null}
      <ItineraryNativeSheet
        ref={itinerarySheetRef}
        visible={itineraryMode}
        animatedPosition={sheetPosition}
        onCollapsedChange={setSheetCollapsed}
      />
      <Animated.View style={[styles.webviewHost, webviewWrapStyle]}>
        <WebView
          ref={bindWebViewRef}
          style={[styles.webviewFill, { backgroundColor: itineraryMode ? 'transparent' : '#fff' }]}
          containerStyle={itineraryMode ? styles.webviewContainerTransparent : undefined}
          nestedScrollEnabled
          scrollEnabled
          overScrollMode="content"
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          javaScriptEnabled
          domStorageEnabled
          originWhitelist={['*']}
          setSupportMultipleWindows={false}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          mixedContentMode="always"
          source={{ uri }}
          key={uri}
          onMessage={onMessage}
          onLoadEnd={onLoadEnd}
          onError={onWebError}
          onHttpError={(event) => {
            if (event.nativeEvent.statusCode >= 500) {
              // console.warn('[WebView] http error', event.nativeEvent.statusCode, event.nativeEvent.url);
            }
          }}
          onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
          startInLoadingState={!itineraryMode}
          injectedJavaScriptBeforeContentLoaded={HIDE_WEB_CHROME}
          injectedJavaScript={HIDE_WEB_CHROME}
          renderLoading={() => (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color={TabBarTokens.active} />
            </View>
          )}
          renderError={(_domain, _code, description) => (
            <View style={styles.error}>
              <Text style={styles.errorTitle}>페이지를 불러오지 못했어요</Text>
              <Text style={styles.errorBody}>
                네트워크 상태를 확인한 뒤 다시 시도해 주세요.
              </Text>
              {__DEV__ && description ? (
                <Text style={styles.errorDetail} numberOfLines={3}>
                  {description}
                </Text>
              ) : null}
              <Pressable
                accessibilityRole="button"
                onPress={reloadWebView}
                style={({ pressed }) => [styles.retryButton, pressed && styles.retryButtonPressed]}
              >
                <Text style={styles.retryLabel}>다시 시도</Text>
              </Pressable>
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
      {showItinerarySearchHere ? (
        <View
          style={[styles.searchHereWrap, { top: itinerarySearchHereTop }]}
          pointerEvents="box-none"
        >
          <Pressable
            style={styles.searchHereButton}
            onPress={handleItinerarySearchHere}
            accessibilityRole="button"
            accessibilityLabel="현 위치에서 검색"
          >
            <Text style={styles.searchHereLabel}>현 위치에서 검색</Text>
          </Pressable>
        </View>
      ) : null}
      <ItinerarySheetExpandChip
        visible={itineraryMode && sheetCollapsed}
        onPress={() => itinerarySheetRef.current?.snapToIndex(DEFAULT_OPEN_SNAP_INDEX)}
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
      <VisitedPlaceNativeSheet
        place={visitedPlaceSheet}
        onClose={() => setVisitedPlaceSheet(null)}
      />
      <NativePhotoViewer
        visible={photoViewer != null}
        photoUrls={photoViewer?.photoUrls ?? []}
        initialIndex={photoViewer?.initialIndex ?? 0}
        onClose={() => setPhotoViewer(null)}
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
  error: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 32,
    backgroundColor: '#fff',
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#212529',
    textAlign: 'center',
  },
  errorBody: {
    fontSize: 14,
    lineHeight: 20,
    color: '#5B5C60',
    textAlign: 'center',
  },
  errorDetail: {
    marginTop: 4,
    fontSize: 12,
    color: '#9C9C97',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    minHeight: 44,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TabBarTokens.active,
  },
  retryButtonPressed: {
    opacity: 0.85,
  },
  retryLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  searchHereWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 40,
    elevation: 40,
    alignItems: 'center',
  },
  searchHereButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: MapTokens.surface,
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  searchHereLabel: {
    color: MapTokens.text,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});

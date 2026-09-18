import type WebView from 'react-native-webview';
import { Alert, Linking, Platform } from 'react-native';
import { router } from 'expo-router';

import type { TravelPlanSummary } from '../api/plans';
import type { HeaderAction } from '../constants/header';
import { requestMapTabRefresh } from '../pendingMapRefresh';
import { setPendingWebPath } from '../pendingWebPath';
import { sendToTabWeb } from './webviewRegistry';

export type WebDialogAction = {
  id: string;
  label: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
};

/**
 * 웹(React 웹앱) <-> 네이티브(RN) 간 postMessage 프로토콜
 *
 * 웹 쪽에서 보낼 때:
 *   window.ReactNativeWebView.postMessage(JSON.stringify(message))
 */
export type MapPin = {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
};

export type PlanMapStop = MapPin & {
  order: number;
  mustVisit?: boolean;
};

export type PlanItineraryChromeState = {
  visible: boolean;
  day: number;
  totalDays: number;
  dateLabel: string;
  searchQuery: string;
  searchPlaceholder: string;
  isSelectingDeparture: boolean;
  nextLabel: string;
  sheetTitle: string;
  /** 장소 추가 탭일 때만 true — 시트 위 「현 위치에서 검색」 표시 여부 */
  showSearchHere: boolean;
};

export const HIDDEN_ITINERARY_CHROME: PlanItineraryChromeState = {
  visible: false,
  day: 1,
  totalDays: 1,
  dateLabel: '',
  searchQuery: '',
  searchPlaceholder: '장소, 주소를 검색해보세요',
  isSelectingDeparture: false,
  nextLabel: '다음',
  sheetTitle: '',
  showSearchHere: false,
};

export type ExploreMapPlace = MapPin & {
  categoryName?: string;
  imageUrl?: string;
};

export type ExploreHeatmapPoint = {
  latitude: number;
  longitude: number;
  level: 'CROWDED' | 'MODERATE';
  intensity: number;
};

export type PlanMapState = {
  visible: boolean;
  departure: MapPin | null;
  stops: PlanMapStop[];
  unassigned: ExploreMapPlace[];
  /** 탐색 지도(/map) — API 장소 마커 */
  places: ExploreMapPlace[];
  /** 탐색 지도(/map) — 혼잡도 히트맵 */
  heatmap: ExploreHeatmapPoint[];
  overlayTop: number;
  sheetHeight: number;
  cameraFitKey?: string;
  webOnTop?: boolean;
};

export type WebToNativeMessage =
  | { type: 'WEB_READY' }
  | { type: 'REQUEST_LOCATION' }
  | { type: 'REQUEST_BACK_HANDLER'; enabled: boolean }
  | { type: 'OPEN_EXTERNAL_URL'; url: string; fallbackUrl?: string }
  | { type: 'HAPTIC'; style?: 'light' | 'medium' | 'heavy' }
  | { type: 'CLOSE_WEBVIEW' }
  | {
      type: 'NAVIGATE_TO_MAP';
      payload?: {
        placeId?: string;
        mode?: 'general' | 'plan' | 'activeTrip' | 'heatmap';
      };
    }
  | {
      type: 'NAVIGATE_TO_TAB';
      tab: 'home' | 'map' | 'plan' | 'record' | 'my';
      path?: string;
    }
  | { type: 'SHARE'; payload: { url: string; title: string } }
  | {
      type: 'SET_HEADER';
      title?: string;
      showBack?: boolean;
      visible?: boolean;
      rightText?: string;
      actions?: HeaderAction[];
    }
  | {
      type: 'SET_MAP';
      visible: boolean;
      departure?: MapPin | null;
      stops?: PlanMapStop[];
      unassigned?: ExploreMapPlace[];
      places?: ExploreMapPlace[];
      heatmap?: ExploreHeatmapPoint[];
      overlayTop?: number;
      sheetHeight?: number;
      cameraFitKey?: string;
      webOnTop?: boolean;
    }
  | { type: 'MAP_ZOOM'; delta: number }
  | { type: 'REQUEST_MAP_REGION' }
  | {
      type: 'SET_MODAL';
      visible: boolean;
      id?: string;
      title?: string;
      description?: string;
      actions?: WebDialogAction[];
    }
  | {
      type: 'SET_TOAST';
      visible: boolean;
      id?: string;
      kind?: 'success' | 'error' | 'info';
      message?: string;
      duration?: number;
      actions?: { id: string; label: string; tone?: 'default' | 'primary' | 'danger' }[];
    }
  | {
      type: 'SET_ITINERARY_CHROME';
      visible: boolean;
      day?: number;
      totalDays?: number;
      dateLabel?: string;
      searchQuery?: string;
      searchPlaceholder?: string;
      isSelectingDeparture?: boolean;
      nextLabel?: string;
      sheetTitle?: string;
      showSearchHere?: boolean;
    }
  /** WebView /login 에서 Apple 버튼 → 네이티브 Sign in with Apple 요청 */
  | { type: 'REQUEST_APPLE_LOGIN' }
  /** 카카오/네이버/구글 OAuth를 네이티브 스택 새 화면(WebView)으로 연다 */
  | {
      type: 'OPEN_OAUTH_LOGIN';
      url: string;
      title?: string;
      provider?: 'kakao' | 'google' | 'naver';
    }
  /** 탭과 분리된 네이티브 로그인 스택 화면 */
  | {
      type: 'OPEN_NATIVE_LOGIN';
      returnTo?: string;
    }
  /** 웹 로그아웃 성공 → 네이티브가 tabs로 전환 */
  | {
      type: 'LOGIN_SUCCESS';
      provider?: 'kakao' | 'google' | 'naver' | 'apple' | 'temp';
      returnTo?: string;
      accessToken?: string;
      user?: { id: string; nickname: string; profileImageUrl?: string };
    }
  /** 웹이 쿠키로 GET /api/plans 한 뒤 지도 계획 목록에 전달 */
  | {
      type: 'SET_PLAN_SUMMARIES';
      plans?: TravelPlanSummary[];
      error?: string;
    }
  | {
      type: 'MAP_PLAN_DETAIL';
      planId: number;
      title: string;
      nights: number;
      days: number;
      durationLabel: string;
      waypoints: {
        id: string;
        name: string;
        latitude: number;
        longitude: number;
        categoryName?: string;
        imageUrl?: string;
        address?: string;
        order: number;
        dayNumber?: number;
      }[];
      routePath?: { latitude: number; longitude: number }[];
      dayRoutes?: {
        dayNumber: number;
        path: { latitude: number; longitude: number }[];
      }[];
      legs?: {
        fromId: string;
        toId: string;
        durationMinutes: number;
        distanceKm: number;
        dayNumber?: number;
      }[];
      error?: string;
    }
  | {
      type: 'MAP_CURRENT_TRIP';
      trip: {
        tripId: number;
        title: string;
        status: string;
        actualStartedAt?: string;
        waypoints: {
          waypointId: number;
          visitDate: string;
          sequenceOrder: number;
          placeId: number;
          placeName: string;
          categoryName?: string;
          imageUrl?: string;
          address?: string;
          visited: boolean;
          visitedAt?: string;
          skipped?: boolean;
          latitude?: number;
          longitude?: number;
        }[];
        dayRoutes?: {
          dayNumber: number;
          path: { latitude: number; longitude: number }[];
        }[];
      } | null;
      error?: string;
    }
  | {
      type: 'MAP_TRIP_VISIT_RESULT';
      tripId: number;
      waypoints: {
        waypointId: number;
        visitDate: string;
        sequenceOrder: number;
        placeId: number;
        placeName: string;
        categoryName?: string;
        imageUrl?: string;
        address?: string;
        visited: boolean;
        visitedAt?: string;
        skipped?: boolean;
        latitude?: number;
        longitude?: number;
      }[];
      autoCompleted?: boolean;
      earnedBadges?: {
        badgeId: number;
        name: string;
        description?: string;
        imageUrl?: string;
      }[];
      error?: string;
    }
  | {
      type: 'MAP_TRIP_COMPLETE_RESULT';
      tripId: number;
      title?: string;
      durationDays?: number;
      placeCount?: number;
      totalDistanceKm?: number;
      startDate?: string;
      endDate?: string;
      earnedBadges?: {
        badgeId: number;
        name: string;
        description?: string;
        imageUrl?: string;
      }[];
      error?: string;
    }
  | { type: 'MAP_ERROR'; code?: string; message: string }
  | {
      type: 'MAP_PLACE_DETAIL';
      placeId: string;
      name?: string;
      address?: string;
      description?: string;
      imageUrl?: string;
      imageUrls?: string[];
      photoCount?: number;
      phone?: string;
      homepage?: string;
      latitude?: number;
      longitude?: number;
      categoryName?: string;
      error?: string;
    }
  | {
      type: 'MAP_PLACE_SEARCH_RESULTS';
      keyword: string;
      places: {
        id: string;
        name: string;
        address?: string;
        imageUrl?: string;
        categoryName?: string;
      }[];
      error?: string;
    }
  | {
      type: 'MAP_FAVORITE_PLACE_IDS';
      placeIds: string[];
      error?: string;
    }
  | {
      type: 'MAP_PLACE_FAVORITE_RESULT';
      placeId: string;
      isFavorite: boolean;
      error?: string;
    }
  | { type: 'LOGOUT' }
  /** 설정 > 위치 7회 탭 — 방문 인증 시뮬레이션 토글 */
  | { type: 'TOGGLE_TRIP_VISIT_SPOOF' }
  /** 계획 저장·여행 시작 후 해당 탭 데이터/화면 갱신 */
  | { type: 'REFRESH_TABS'; tabs: Array<'plan' | 'map' | 'home' | 'record' | 'my'> }
  | {
      type: 'OPEN_VISITED_PLACE_SHEET';
      place: {
        placeId: string;
        placeName: string;
        address: string;
        visitDate: string;
        note: string;
        photoUrls: string[];
      };
    }
  | { type: 'CLOSE_VISITED_PLACE_SHEET' }
  | {
      type: 'OPEN_NATIVE_PHOTO_VIEWER';
      photoUrls: string[];
      initialIndex?: number;
    }
  | { type: 'CLOSE_NATIVE_PHOTO_VIEWER' };

export type NativeToWebMessage =
  | { type: 'NATIVE_READY'; platform: 'ios' | 'android' }
  | {
      type: 'AUTH_TOKEN';
      accessToken: string;
      user?: { id: string; nickname: string; profileImageUrl?: string };
    }
  /** Apple/소셜 쿠키 세션 — 탭 WebView authStore에 user만 주입 */
  | {
      type: 'AUTH_SESSION';
      user: { id: string; nickname: string; profileImageUrl?: string };
    }
  /** 보관 세션 없음 — 웹이 게스트 UI를 확정 */
  | { type: 'AUTH_GUEST' }
  | { type: 'ANDROID_BACK' }
  | { type: 'HEADER_BACK' }
  | { type: 'HEADER_ACTION'; id: string }
  | { type: 'MAP_ASSIGN_PLACE'; id: string }
  | { type: 'MAP_TAPPED' }
  | {
      type: 'MAP_REGION_CHANGED';
      minLat: number;
      maxLat: number;
      minLng: number;
      maxLng: number;
    }
  | { type: 'MODAL_ACTION'; id: string }
  | { type: 'MODAL_DISMISS' }
  | { type: 'TOAST_ACTION'; id: string }
  | { type: 'ITINERARY_DAY'; day: number }
  | { type: 'ITINERARY_SEARCH'; query: string }
  /** 일정 지도 — 현재 뷰포트로 장소 재검색 (GET /map/places) */
  | {
      type: 'ITINERARY_SEARCH_HERE';
      minLat: number;
      maxLat: number;
      minLng: number;
      maxLng: number;
    }
  | { type: 'ITINERARY_NEXT' }
  | { type: 'ITINERARY_DEPARTURE_CANCEL' }
  | { type: 'NATIVE_LAYOUT'; screenHeight: number }
  /** 같은 탭을 다시 눌렀을 때 웹을 탭 루트 경로로 되돌림 */
  | { type: 'TAB_POP_TO_ROOT'; path: string }
  /** 로그인 후 등 — 현재 문서 히스토리 위에 경로 push (WebView remount 없이) */
  | { type: 'NAVIGATE_WEB_PATH'; path: string }
  /** 웹 React Query 캐시 무효화 (탭 WebView별) */
  | { type: 'INVALIDATE_DATA'; scopes: Array<'plans' | 'currentTrip'> }
  | {
      type: 'APPLE_CREDENTIAL';
      identityToken: string;
      /** BE 검증용 원본 nonce (Apple에는 SHA256 해시만 전달됨) */
      rawNonce: string;
      authorizationCode?: string;
      email?: string;
      fullName?: { givenName?: string | null; familyName?: string | null };
    }
  | { type: 'APPLE_LOGIN_CANCELLED' }
  | { type: 'APPLE_LOGIN_ERROR'; message: string }
  /** 지도 계획 모드: 웹에 GET /api/plans 후 SET_PLAN_SUMMARIES 요청 */
  | { type: 'REQUEST_PLAN_SUMMARIES' }
  | { type: 'REQUEST_PLAN_DETAIL'; planId: number }
  | { type: 'REQUEST_CURRENT_TRIP' }
  | {
      type: 'REQUEST_MAP_SEARCH';
      minLat: number;
      maxLat: number;
      minLng: number;
      maxLng: number;
      category?: string;
    }
  | {
      type: 'REQUEST_TRIP_VISIT';
      tripId: number;
      waypointId: number;
      latitude: number;
      longitude: number;
    }
  | {
      type: 'REQUEST_TRIP_SKIP';
      tripId: number;
      waypointId: number;
    }
  | { type: 'REQUEST_TRIP_COMPLETE'; tripId: number }
  | { type: 'REQUEST_PLACE_DETAIL'; placeId: string }
  | { type: 'REQUEST_PLACE_SEARCH'; keyword: string }
  | { type: 'REQUEST_FAVORITE_PLACE_IDS' }
  | {
      type: 'REQUEST_TOGGLE_PLACE_FAVORITE';
      placeId: string;
      nextFavorite: boolean;
    };

export type HeaderState = {
  visible: boolean;
  title: string;
  showBack: boolean;
  rightText?: string;
  actions: HeaderAction[];
};

export type BridgeHandlers = {
  onSetHeader?: (header: HeaderState) => void;
  onSetMap?: (message: Extract<WebToNativeMessage, { type: 'SET_MAP' }>) => void;
  onMapZoom?: (delta: number) => void;
  onRequestMapRegion?: () => void;
  onSetModal?: (message: Extract<WebToNativeMessage, { type: 'SET_MODAL' }>) => void;
  onSetToast?: (message: Extract<WebToNativeMessage, { type: 'SET_TOAST' }>) => void;
  onSetItineraryChrome?: (
    message: Extract<WebToNativeMessage, { type: 'SET_ITINERARY_CHROME' }>,
  ) => void;
  onRequestAppleLogin?: () => void;
  onOpenOAuthLogin?: (payload: {
    url: string;
    title?: string;
    provider?: 'kakao' | 'google' | 'naver';
  }) => void;
  onLoginSuccess?: (payload?: {
    provider?: 'kakao' | 'google' | 'naver' | 'apple' | 'temp';
    returnTo?: string;
    accessToken?: string;
    user?: { id: string; nickname: string; profileImageUrl?: string };
  }) => void;
  /** 웹 브릿지 리스너 준비 완료 — AUTH_TOKEN 재주입 타이밍 */
  onWebReady?: () => void;
  onNavigateToMap?: (payload?: {
    placeId?: string;
    mode?: 'general' | 'plan' | 'activeTrip' | 'heatmap';
  }) => void;
  onNavigateToTab?: (payload: {
    tab: 'home' | 'map' | 'plan' | 'record' | 'my';
    path?: string;
  }) => void;
  onSetPlanSummaries?: (payload: {
    plans: TravelPlanSummary[];
    error?: string;
  }) => void;
  onMapPlanDetail?: (
    message: Extract<WebToNativeMessage, { type: 'MAP_PLAN_DETAIL' }>,
  ) => void;
  onMapCurrentTrip?: (
    message: Extract<WebToNativeMessage, { type: 'MAP_CURRENT_TRIP' }>,
  ) => void;
  onMapTripVisitResult?: (
    message: Extract<WebToNativeMessage, { type: 'MAP_TRIP_VISIT_RESULT' }>,
  ) => void;
  onMapTripCompleteResult?: (
    message: Extract<WebToNativeMessage, { type: 'MAP_TRIP_COMPLETE_RESULT' }>,
  ) => void;
  onMapPlaceDetail?: (
    message: Extract<WebToNativeMessage, { type: 'MAP_PLACE_DETAIL' }>,
  ) => void;
  onMapPlaceSearchResults?: (
    message: Extract<WebToNativeMessage, { type: 'MAP_PLACE_SEARCH_RESULTS' }>,
  ) => void;
  onMapFavoritePlaceIds?: (
    message: Extract<WebToNativeMessage, { type: 'MAP_FAVORITE_PLACE_IDS' }>,
  ) => void;
  onMapPlaceFavoriteResult?: (
    message: Extract<WebToNativeMessage, { type: 'MAP_PLACE_FAVORITE_RESULT' }>,
  ) => void;
  onMapError?: (message: string) => void;
  onLogout?: () => void;
  onToggleTripVisitSpoof?: () => void;
  onOpenVisitedPlaceSheet?: (
    message: Extract<WebToNativeMessage, { type: 'OPEN_VISITED_PLACE_SHEET' }>,
  ) => void;
  onCloseVisitedPlaceSheet?: () => void;
  onOpenNativePhotoViewer?: (
    message: Extract<WebToNativeMessage, { type: 'OPEN_NATIVE_PHOTO_VIEWER' }>,
  ) => void;
  onCloseNativePhotoViewer?: () => void;
};

const HIDDEN_PLAN_MAP: PlanMapState = {
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

export function mergePlanMap(
  prev: PlanMapState,
  message: Extract<WebToNativeMessage, { type: 'SET_MAP' }>,
): PlanMapState {
  if (!message.visible) return HIDDEN_PLAN_MAP;
  return {
    visible: true,
    departure: message.departure !== undefined ? message.departure : prev.departure,
    stops: message.stops ?? prev.stops,
    unassigned: message.unassigned ?? prev.unassigned,
    places: message.places ?? prev.places,
    heatmap: message.heatmap ?? prev.heatmap,
    overlayTop: message.overlayTop ?? prev.overlayTop,
    sheetHeight: message.sheetHeight ?? prev.sheetHeight,
    cameraFitKey: message.cameraFitKey ?? prev.cameraFitKey,
    webOnTop: message.webOnTop ?? prev.webOnTop,
  };
}

function parseWebToNative(raw: string): WebToNativeMessage | null {
  try {
    const message = JSON.parse(raw) as WebToNativeMessage;
    if (!message || typeof message.type !== 'string') return null;
    return message;
  } catch {
    // console.warn('[bridge] JSON 파싱 실패:', raw);
    return null;
  }
}

/** maps:// · maps.apple.com · geo: · Google Maps 등 외부 지도 URL */
function isExternalMapUrl(url: string | undefined): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return (
    lower.startsWith('maps://') ||
    lower.startsWith('geo:') ||
    lower.includes('maps.apple.com') ||
    lower.includes('google.com/maps') ||
    lower.includes('maps.google.com')
  );
}

export function handleBridgeMessage(
  raw: string,
  _webview: WebView | null,
  handlers?: BridgeHandlers,
) {
  const message = parseWebToNative(raw);
  if (!message) return;

  switch (message.type) {
    case 'WEB_READY':
      handlers?.onWebReady?.();
      break;
    case 'NAVIGATE_TO_MAP':
      handlers?.onNavigateToMap?.(message.payload);
      break;
    case 'NAVIGATE_TO_TAB':
      handlers?.onNavigateToTab?.({ tab: message.tab, path: message.path });
      break;
    case 'OPEN_EXTERNAL_URL':
      void (async () => {
        const primaryUrl = message.url;
        const fallbackUrl = message.fallbackUrl;
        const isMapUrl = isExternalMapUrl(primaryUrl) || isExternalMapUrl(fallbackUrl);

        const openExternal = async () => {
          try {
            const canOpenPrimary = await Linking.canOpenURL(primaryUrl);
            if (canOpenPrimary) {
              await Linking.openURL(primaryUrl);
              return;
            }
          } catch {
            // 앱 열기 실패 시 웹으로
          }
          if (!fallbackUrl) {
            // canOpenURL false여도 https는 시도
            try {
              await Linking.openURL(primaryUrl);
            } catch {
              // ignore
            }
            return;
          }
          try {
            await Linking.openURL(fallbackUrl);
          } catch {
            // console.warn('[bridge] OPEN_EXTERNAL_URL failed');
          }
        };

        // 취소해도 열리지 않도록 확인 Alert를 먼저 띄운다
        Alert.alert(
          isMapUrl ? '지도에서 볼까요?' : '외부 링크로 이동할까요?',
          isMapUrl
            ? Platform.OS === 'ios'
              ? 'Apple 지도로 이 장소를 엽니다.'
              : '지도 앱으로 이 장소를 엽니다.'
            : '브라우저에서 페이지를 엽니다.',
          [
            { text: '취소', style: 'cancel' },
            { text: '열기', onPress: () => void openExternal() },
          ],
        );
      })();
      break;
    case 'SET_HEADER':
      handlers?.onSetHeader?.({
        visible: message.visible !== false,
        title: message.title ?? '',
        showBack: Boolean(message.showBack),
        rightText: message.rightText,
        actions: message.actions ?? [],
      });
      break;
    case 'SET_MAP':
      handlers?.onSetMap?.(message);
      break;
    case 'MAP_ZOOM':
      handlers?.onMapZoom?.(message.delta);
      break;
    case 'REQUEST_MAP_REGION':
      handlers?.onRequestMapRegion?.();
      break;
    case 'SET_MODAL':
      handlers?.onSetModal?.(message);
      break;
    case 'SET_TOAST':
      handlers?.onSetToast?.(message);
      break;
    case 'SET_ITINERARY_CHROME':
      handlers?.onSetItineraryChrome?.(message);
      break;
    case 'REQUEST_APPLE_LOGIN':
      handlers?.onRequestAppleLogin?.();
      break;
    case 'OPEN_OAUTH_LOGIN':
      handlers?.onOpenOAuthLogin?.({
        url: message.url,
        title: message.title,
        provider: message.provider,
      });
      break;
    case 'OPEN_NATIVE_LOGIN':
      router.push({
        pathname: '/login',
        params: { returnTo: message.returnTo ?? '/' },
      });
      break;
    case 'LOGIN_SUCCESS':
      handlers?.onLoginSuccess?.({
        provider: message.provider,
        returnTo: message.returnTo,
        accessToken: message.accessToken,
        user: message.user,
      });
      break;
    case 'SET_PLAN_SUMMARIES':
      handlers?.onSetPlanSummaries?.({
        plans: Array.isArray(message.plans) ? message.plans : [],
        error: message.error,
      });
      break;
    case 'MAP_PLAN_DETAIL':
      handlers?.onMapPlanDetail?.(message);
      break;
    case 'MAP_CURRENT_TRIP':
      handlers?.onMapCurrentTrip?.(message);
      break;
    case 'MAP_TRIP_VISIT_RESULT':
      handlers?.onMapTripVisitResult?.(message);
      break;
    case 'MAP_TRIP_COMPLETE_RESULT':
      handlers?.onMapTripCompleteResult?.(message);
      break;
    case 'MAP_PLACE_DETAIL':
      handlers?.onMapPlaceDetail?.(message);
      break;
    case 'MAP_PLACE_SEARCH_RESULTS':
      handlers?.onMapPlaceSearchResults?.(message);
      break;
    case 'MAP_FAVORITE_PLACE_IDS':
      handlers?.onMapFavoritePlaceIds?.(message);
      break;
    case 'MAP_PLACE_FAVORITE_RESULT':
      handlers?.onMapPlaceFavoriteResult?.(message);
      break;
    case 'MAP_ERROR':
      handlers?.onMapError?.(message.message);
      break;
    case 'LOGOUT':
      handlers?.onLogout?.();
      break;
    case 'TOGGLE_TRIP_VISIT_SPOOF':
      handlers?.onToggleTripVisitSpoof?.();
      break;
    case 'REFRESH_TABS': {
      const tabs = Array.isArray(message.tabs) ? message.tabs : [];
      if (tabs.includes('plan')) {
        setPendingWebPath('plan', '/plan');
        sendToTabWeb('plan', { type: 'TAB_POP_TO_ROOT', path: '/plan' });
        sendToTabWeb('plan', { type: 'INVALIDATE_DATA', scopes: ['plans', 'currentTrip'] });
      }
      if (tabs.includes('map')) {
        requestMapTabRefresh();
      }
      break;
    }
    case 'OPEN_VISITED_PLACE_SHEET':
      handlers?.onOpenVisitedPlaceSheet?.(message);
      break;
    case 'CLOSE_VISITED_PLACE_SHEET':
      handlers?.onCloseVisitedPlaceSheet?.();
      break;
    case 'OPEN_NATIVE_PHOTO_VIEWER':
      handlers?.onOpenNativePhotoViewer?.(message);
      break;
    case 'CLOSE_NATIVE_PHOTO_VIEWER':
      handlers?.onCloseNativePhotoViewer?.();
      break;
    default:
      break;
  }
}

/** 네이티브 → 웹으로 메시지를 보낼 때 사용 */
export function sendToWeb(webview: WebView | null, message: NativeToWebMessage) {
  if (!webview) return;
  const payload = JSON.stringify(message);
  webview.injectJavaScript(`
    (function() {
      var data = ${JSON.stringify(payload)};
      window.dispatchEvent(new MessageEvent('message', { data: data }));
      document.dispatchEvent(new MessageEvent('message', { data: data }));
    })();
    true;
  `);
}

/** 보관 중인 웹 세션을 해당 WebView에 주입 (JWT / 쿠키 세션 / 게스트) */
export function injectStoredWebAuthToWeb(
  webview: WebView | null,
  auth: {
    accessToken?: string;
    user: { id: string; nickname: string; profileImageUrl?: string };
  } | null,
) {
  if (!webview) return;
  if (auth?.accessToken && auth.user) {
    sendToWeb(webview, {
      type: 'AUTH_TOKEN',
      accessToken: auth.accessToken,
      user: auth.user,
    });
    return;
  }
  if (auth?.user) {
    sendToWeb(webview, {
      type: 'AUTH_SESSION',
      user: auth.user,
    });
    return;
  }
  sendToWeb(webview, { type: 'AUTH_GUEST' });
}

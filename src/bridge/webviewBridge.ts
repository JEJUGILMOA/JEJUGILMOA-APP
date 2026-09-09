import type WebView from 'react-native-webview';

import type { HeaderAction } from '../constants/header';

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
  sheetTitle: '일정',
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
  unassigned: MapPin[];
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
  | { type: 'OPEN_EXTERNAL_URL'; url: string }
  | { type: 'HAPTIC'; style?: 'light' | 'medium' | 'heavy' }
  | { type: 'CLOSE_WEBVIEW' }
  | { type: 'NAVIGATE_TO_MAP'; payload?: { placeId?: string } }
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
      unassigned?: MapPin[];
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
  /** 웹 로그인 성공 → 네이티브가 tabs로 전환 */
  | {
      type: 'LOGIN_SUCCESS';
      provider?: 'kakao' | 'google' | 'naver' | 'apple' | 'temp';
      returnTo?: string;
    }
  /** 웹 로그아웃 → 네이티브가 로그인 화면으로 전환 */
  | { type: 'LOGOUT' };

export type NativeToWebMessage =
  | { type: 'NATIVE_READY'; platform: 'ios' | 'android' }
  | {
      type: 'AUTH_TOKEN';
      accessToken: string;
      user?: { id: string; nickname: string; profileImageUrl?: string };
    }
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
  | { type: 'ITINERARY_NEXT' }
  | { type: 'ITINERARY_DEPARTURE_CANCEL' }
  | { type: 'NATIVE_LAYOUT'; screenHeight: number }
  /** 같은 탭을 다시 눌렀을 때 웹을 탭 루트 경로로 되돌림 */
  | { type: 'TAB_POP_TO_ROOT'; path: string }
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
  | { type: 'APPLE_LOGIN_ERROR'; message: string };

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
  }) => void;
  onLogout?: () => void;
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
    console.warn('[bridge] JSON 파싱 실패:', raw);
    return null;
  }
}

export function handleBridgeMessage(
  raw: string,
  _webview: WebView | null,
  handlers?: BridgeHandlers,
) {
  const message = parseWebToNative(raw);
  if (!message) return;

  switch (message.type) {
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
    case 'LOGIN_SUCCESS':
      handlers?.onLoginSuccess?.({
        provider: message.provider,
        returnTo: message.returnTo,
      });
      break;
    case 'LOGOUT':
      handlers?.onLogout?.();
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

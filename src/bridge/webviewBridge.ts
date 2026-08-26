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

export type PlanMapState = {
  visible: boolean;
  departure: MapPin | null;
  stops: PlanMapStop[];
  unassigned: MapPin[];
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
      overlayTop?: number;
      sheetHeight?: number;
      cameraFitKey?: string;
      webOnTop?: boolean;
    }
  | { type: 'MAP_ZOOM'; delta: number }
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
    };

export type NativeToWebMessage =
  | { type: 'NATIVE_READY'; platform: 'ios' | 'android' }
  | {
      type: 'AUTH_TOKEN'
      accessToken: string
      user?: { id: string; nickname: string; profileImageUrl?: string }
    }
  | { type: 'ANDROID_BACK' }
  | { type: 'HEADER_BACK' }
  | { type: 'HEADER_ACTION'; id: string }
  | { type: 'MAP_ASSIGN_PLACE'; id: string }
  | { type: 'MAP_TAPPED' }
  | { type: 'MODAL_ACTION'; id: string }
  | { type: 'MODAL_DISMISS' }
  | { type: 'TOAST_ACTION'; id: string }
  | { type: 'ITINERARY_DAY'; day: number }
  | { type: 'ITINERARY_SEARCH'; query: string }
  | { type: 'ITINERARY_NEXT' }
  | { type: 'ITINERARY_DEPARTURE_CANCEL' }
  | { type: 'NATIVE_LAYOUT'; screenHeight: number };

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
  onSetModal?: (message: Extract<WebToNativeMessage, { type: 'SET_MODAL' }>) => void;
  onSetToast?: (message: Extract<WebToNativeMessage, { type: 'SET_TOAST' }>) => void;
  onSetItineraryChrome?: (
    message: Extract<WebToNativeMessage, { type: 'SET_ITINERARY_CHROME' }>,
  ) => void;
};

const HIDDEN_PLAN_MAP: PlanMapState = {
  visible: false,
  departure: null,
  stops: [],
  unassigned: [],
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
    case 'SET_MODAL':
      handlers?.onSetModal?.(message);
      break;
    case 'SET_TOAST':
      handlers?.onSetToast?.(message);
      break;
    case 'SET_ITINERARY_CHROME':
      handlers?.onSetItineraryChrome?.(message);
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

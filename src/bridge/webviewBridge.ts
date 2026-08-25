import type WebView from 'react-native-webview';

import type { HeaderAction } from '../constants/header';

/**
 * 웹(React 웹앱) <-> 네이티브(RN) 간 postMessage 프로토콜
 *
 * 웹 쪽에서 보낼 때:
 *   window.ReactNativeWebView.postMessage(JSON.stringify(message))
 */
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
    };

export type NativeToWebMessage =
  | { type: 'NATIVE_READY'; platform: 'ios' | 'android' }
  | { type: 'ANDROID_BACK' }
  | { type: 'HEADER_BACK' }
  | { type: 'HEADER_ACTION'; id: string };

export type HeaderState = {
  visible: boolean;
  title: string;
  showBack: boolean;
  rightText?: string;
  actions: HeaderAction[];
};

export type BridgeHandlers = {
  onSetHeader?: (header: HeaderState) => void;
};

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

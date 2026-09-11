import type { WebView } from 'react-native-webview';

import { sendToWeb, type NativeToWebMessage } from './webviewBridge';

/** 탭 WebView들. 지도 등 WebView 없는 화면에서 웹으로 브로드캐스트할 때 사용 */
const webViews = new Set<WebView>();

export function registerBridgeWebView(webview: WebView | null): () => void {
  if (!webview) {
    return () => undefined;
  }
  webViews.add(webview);
  return () => {
    webViews.delete(webview);
  };
}

export function broadcastToWeb(message: NativeToWebMessage): void {
  webViews.forEach((webview) => {
    sendToWeb(webview, message);
  });
}

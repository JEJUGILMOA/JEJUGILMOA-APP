import type { WebView } from 'react-native-webview';

import { sendToWeb, type NativeToWebMessage } from './webviewBridge';

/** 탭 WebView들. 지도 등 WebView 없는 화면에서 웹으로 브로드캐스트할 때 사용 */
const webViews = new Set<WebView>();
/** expo-router 탭 route name → WebView (plan/index/record/my/map) */
const webViewsByTab = new Map<string, WebView>();

export function registerBridgeWebView(
  webview: WebView | null,
  tabName?: string,
): () => void {
  if (!webview) {
    return () => undefined;
  }
  webViews.add(webview);
  if (tabName) {
    webViewsByTab.set(tabName, webview);
  }
  return () => {
    webViews.delete(webview);
    if (tabName && webViewsByTab.get(tabName) === webview) {
      webViewsByTab.delete(tabName);
    }
  };
}

export function broadcastToWeb(message: NativeToWebMessage): void {
  webViews.forEach((webview) => {
    sendToWeb(webview, message);
  });
}

/** 특정 탭 WebView에만 메시지 전송 */
export function sendToTabWeb(tabName: string, message: NativeToWebMessage): void {
  sendToWeb(webViewsByTab.get(tabName) ?? null, message);
}

import type WebView from 'react-native-webview';

/**
 * 웹(React 웹앱) <-> 네이티브(RN) 간 postMessage 프로토콜
 *
 * 웹 쪽에서 보낼 때:
 *   window.ReactNativeWebView.postMessage(JSON.stringify(message))
 */
export type BridgeMessage =
  | { type: 'NAVIGATE_TO_MAP'; payload?: { placeId?: string } }
  | { type: 'SHARE'; payload: { url: string; title: string } }
  | { type: 'REQUEST_LOCATION' };

export function handleBridgeMessage(raw: string, _webview: WebView | null) {
  let message: BridgeMessage;
  try {
    message = JSON.parse(raw);
  } catch {
    console.warn('[bridge] JSON 파싱 실패:', raw);
    return;
  }

  switch (message.type) {
    case 'NAVIGATE_TO_MAP':
      // TODO: expo-router의 router.push()/router.navigate()로 지도 탭 이동 + placeId 전달
      // 예: router.push({ pathname: '/(tabs)/map', params: { placeId: message.payload?.placeId } })
      // (router는 'expo-router'에서 import, 컴포넌트 밖에서도 호출 가능)
      break;
    case 'SHARE':
      // TODO: RN Share API 연동 (Share.share({ message, url }))
      break;
    case 'REQUEST_LOCATION':
      // TODO: expo-location으로 권한 요청 후 결과를 다시 웹으로 postMessage
      break;
    default:
      console.warn('[bridge] 알 수 없는 메시지 타입:', message);
  }
}

/** 네이티브 -> 웹으로 메시지를 보낼 때 사용 */
export function sendToWeb(webview: WebView | null, message: BridgeMessage) {
  webview?.postMessage(JSON.stringify(message));
}

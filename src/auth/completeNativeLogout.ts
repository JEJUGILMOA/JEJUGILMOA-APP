import { router } from 'expo-router';

import { clearStoredWebAuth } from '@/auth/webAuthSession';
import { injectStoredWebAuthToWeb } from '@/bridge/webviewBridge';
import { clearPlanList } from '@/bridge/planListStore';
import { forEachBridgeWebView, reloadAllTabWebViews, sendToTabWeb } from '@/bridge/webviewRegistry';
import { requestMapTabRefresh } from '@/pendingMapRefresh';
import { setPendingNativeToast } from '@/nativeToastQueue';
import { forceTabWebPath } from '@/pendingWebPath';

/** 로그아웃 후: 세션 제거 → AUTH_GUEST 주입 → 전 탭 하드 리로드 → 홈 */
export function completeNativeLogout(options: { signOut: () => void }) {
  clearStoredWebAuth();
  clearPlanList();
  options.signOut();

  forEachBridgeWebView((webview) => {
    injectStoredWebAuthToWeb(webview, null);
  });

  // 설정 등 하위 경로를 /my 로 되돌린 뒤, 소스 반영 후 하드 리로드한다
  forceTabWebPath('my', '/my');
  sendToTabWeb('my', { type: 'TAB_POP_TO_ROOT', path: '/my' });
  forceTabWebPath('index', '/');

  setPendingNativeToast({
    kind: 'success',
    message: '로그아웃되었어요.',
  });

  // activePath(/my)가 WebView source에 반영된 뒤 reload — 마이 포함 전체
  setTimeout(() => {
    reloadAllTabWebViews();
    requestMapTabRefresh();

    if (router.canDismiss()) {
      router.dismissAll();
    }
    router.replace('/(tabs)');
  }, 50);
}

import { router } from 'expo-router';

import {
  clearStoredWebAuth,
  getStoredWebAuth,
  setStoredWebAuth,
  type StoredWebAuth,
} from '@/auth/webAuthSession';
import { injectStoredWebAuthToWeb } from '@/bridge/webviewBridge';
import { forEachBridgeWebView, reloadAllTabWebViews } from '@/bridge/webviewRegistry';
import { requestMapTabRefresh } from '@/pendingMapRefresh';
import { setPendingWebPath } from '@/pendingWebPath';
import type { AuthProvider } from '@/context/AuthContext';

/** returnTo 경로 → 네이티브 탭 + WebView path */
export function resolveLoginReturnTo(returnTo?: string): {
  tabRoute: '/(tabs)' | '/(tabs)/map' | '/(tabs)/plan' | '/(tabs)/record' | '/(tabs)/my';
  tabName: 'index' | 'map' | 'plan' | 'record' | 'my';
  path: string;
} {
  const raw = (returnTo || '/').trim() || '/';
  const pathOnly = raw.split('?')[0] || '/';

  if (pathOnly === '/map' || pathOnly.startsWith('/map/')) {
    return { tabRoute: '/(tabs)/map', tabName: 'map', path: raw };
  }
  if (pathOnly === '/plan' || pathOnly.startsWith('/plan/')) {
    return { tabRoute: '/(tabs)/plan', tabName: 'plan', path: raw };
  }
  if (pathOnly === '/record' || pathOnly.startsWith('/record/')) {
    return { tabRoute: '/(tabs)/record', tabName: 'record', path: raw };
  }
  if (pathOnly === '/my' || pathOnly.startsWith('/my/')) {
    return { tabRoute: '/(tabs)/my', tabName: 'my', path: raw };
  }
  return { tabRoute: '/(tabs)', tabName: 'index', path: raw === '/login' ? '/' : raw };
}

function applyStoredAuth(auth?: {
  accessToken?: string;
  user?: { id: string; nickname: string; profileImageUrl?: string };
}): StoredWebAuth | null {
  if (auth?.accessToken) {
    const next = {
      accessToken: auth.accessToken,
      user: auth.user ?? { id: 'native-user', nickname: '길모아 사용자' },
    };
    setStoredWebAuth(next);
    return next;
  }
  if (auth?.user) {
    const next = { user: auth.user };
    setStoredWebAuth(next);
    return next;
  }
  clearStoredWebAuth();
  return null;
}

/** 로그인 성공 후: 세션 저장 → 전 탭 AUTH 주입·리로드 → returnTo 탭으로 복귀 */
export async function completeNativeLogin(options: {
  provider?: AuthProvider;
  returnTo?: string;
  accessToken?: string;
  user?: { id: string; nickname: string; profileImageUrl?: string };
  signIn: (provider: AuthProvider) => Promise<void>;
}) {
  const stored = applyStoredAuth({
    accessToken: options.accessToken,
    user: options.user,
  });
  await options.signIn(options.provider ?? 'apple');

  const auth = stored ?? getStoredWebAuth();
  forEachBridgeWebView((webview) => {
    injectStoredWebAuthToWeb(webview, auth);
  });

  const { tabRoute, tabName, path } = resolveLoginReturnTo(options.returnTo);
  if (path && path !== '/') {
    setPendingWebPath(tabName, path);
  }

  // 로그인 세션으로 모든 탭 WebView·지도 데이터를 다시 불러온다
  reloadAllTabWebViews();
  requestMapTabRefresh();

  if (router.canDismiss()) {
    router.dismissAll();
  }
  router.replace(tabRoute);
}

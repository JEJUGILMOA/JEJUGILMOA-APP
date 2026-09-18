/** 탭 WebView로 넘길 딥링크. 해당 탭 포커스 시 take 한다. */
export type PendingWebPath = {
  tabName: string;
  /** WebView 최초 로드 URL (히스토리 바닥) */
  path: string;
  /** path 로드 후 React Router로 push할 경로 (뒤로가기용) */
  pushPath?: string;
};

type ForceListener = (tabName: string, path: string) => void;

let pending: PendingWebPath | null = null;
const forceListeners = new Set<ForceListener>();

export function setPendingWebPath(tabName: string, path: string, pushPath?: string) {
  pending = {
    tabName,
    path,
    ...(pushPath && pushPath !== path ? { pushPath } : {}),
  };
}

/**
 * 이미 포커스된 탭에도 즉시 경로를 적용한다.
 * (로그아웃 후 /my/settings → /my 처럼, focus effect가 다시 안 도는 경우)
 */
export function forceTabWebPath(tabName: string, path: string) {
  pending = { tabName, path };
  forceListeners.forEach((listener) => listener(tabName, path));
}

export function takePendingWebPath(tabName: string): PendingWebPath | null {
  if (!pending || pending.tabName !== tabName) return null;
  const next = pending;
  pending = null;
  return next;
}

export function subscribeForceTabWebPath(listener: ForceListener): () => void {
  forceListeners.add(listener);
  return () => {
    forceListeners.delete(listener);
  };
}

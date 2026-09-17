/** 탭 WebView로 넘길 딥링크. 해당 탭 포커스 시 take 한다. */
type Pending = { tabName: string; path: string };

type ForceListener = (tabName: string, path: string) => void;

let pending: Pending | null = null;
const forceListeners = new Set<ForceListener>();

export function setPendingWebPath(tabName: string, path: string) {
  pending = { tabName, path };
}

/**
 * 이미 포커스된 탭에도 즉시 경로를 적용한다.
 * (로그아웃 후 /my/settings → /my 처럼, focus effect가 다시 안 도는 경우)
 */
export function forceTabWebPath(tabName: string, path: string) {
  pending = { tabName, path };
  forceListeners.forEach((listener) => listener(tabName, path));
}

export function takePendingWebPath(tabName: string): string | null {
  if (!pending || pending.tabName !== tabName) return null;
  const next = pending.path;
  pending = null;
  return next;
}

export function subscribeForceTabWebPath(listener: ForceListener): () => void {
  forceListeners.add(listener);
  return () => {
    forceListeners.delete(listener);
  };
}

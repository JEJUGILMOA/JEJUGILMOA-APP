/** 탭 WebView로 넘길 딥링크. 해당 탭 포커스 시 take 한다. */
type Pending = { tabName: string; path: string };

let pending: Pending | null = null;

export function setPendingWebPath(tabName: string, path: string) {
  pending = { tabName, path };
}

export function takePendingWebPath(tabName: string): string | null {
  if (!pending || pending.tabName !== tabName) return null;
  const next = pending.path;
  pending = null;
  return next;
}

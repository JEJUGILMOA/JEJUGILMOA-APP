/**
 * 로그인 WebView에서 받은 세션을 네이티브가 잠시 보관했다가
 * 각 탭 WebView에 AUTH_TOKEN / AUTH_SESSION으로 주입한다.
 * - accessToken: 개발 로그인 등 body JWT
 * - user only: Apple/소셜 쿠키 세션 (HttpOnly 쿠키는 WKWebView jar로 공유)
 */
export type StoredWebAuth = {
  accessToken?: string;
  user: { id: string; nickname: string; profileImageUrl?: string };
};

let stored: StoredWebAuth | null = null;

export function setStoredWebAuth(next: StoredWebAuth | null) {
  stored = next;
}

export function getStoredWebAuth(): StoredWebAuth | null {
  return stored;
}

export function clearStoredWebAuth() {
  stored = null;
}

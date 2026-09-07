/** OPEN_OAUTH_LOGIN → /oauth 화면으로 넘길 URL (라우트 params 길이 제한 회피) */
let pendingOAuthUrl: string | null = null;
let pendingOAuthTitle: string | null = null;

export function setPendingOAuthLaunch(url: string, title?: string) {
  pendingOAuthUrl = url;
  pendingOAuthTitle = title?.trim() || null;
}

export function takePendingOAuthLaunch(): { url: string; title: string } | null {
  if (!pendingOAuthUrl) return null;
  const url = pendingOAuthUrl;
  const title = pendingOAuthTitle || '로그인';
  pendingOAuthUrl = null;
  pendingOAuthTitle = null;
  return { url, title };
}

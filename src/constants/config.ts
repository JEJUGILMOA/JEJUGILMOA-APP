// 웹뷰로 띄울 React 웹앱 base URL (.env의 EXPO_PUBLIC_WEB_BASE_URL)
// 개발 중에는 로컬 dev 서버(예: http://192.168.0.x:5173)로 바꿔서 테스트 가능합니다.
const raw =
  process.env.EXPO_PUBLIC_WEB_BASE_URL?.trim() || 'https://web.jejugilmoa.com';

export const WEB_BASE_URL = raw.replace(/\/$/, '');

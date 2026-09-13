// 웹뷰로 띄울 React 웹앱 base URL (.env의 EXPO_PUBLIC_WEB_BASE_URL)
// 개발 중에는 로컬 dev 서버(예: http://192.168.0.x:5173)로 바꿔서 테스트 가능합니다.
const raw =
  process.env.EXPO_PUBLIC_WEB_BASE_URL?.trim() || 'https://web.jejugilmoa.com';

export const WEB_BASE_URL = raw.replace(/\/$/, '');

const apiRaw =
  process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || 'https://gilmoa-dev.gyeonseo.com';

export const API_BASE_URL = apiRaw.replace(/\/$/, '');

/**
 * DEV 전용 기본값: 방문 인증 시 GPS 대신 목적지 좌표를 보냄.
 * 런타임 토글(지도 모드 시트)이 AsyncStorage에 저장된 값을 우선한다.
 */
export const TRIP_VISIT_SPOOF_DEFAULT =
  process.env.EXPO_PUBLIC_TRIP_VISIT_SPOOF?.trim() === 'true';

/** 피그마 지도(MAP) 팔레트 — 탭바 활성색(#24B95C)과 분리 */
export const MapTokens = {
  green: '#17783C',
  greenSoft: '#E8F5EE',
  blue: '#1E4FC4',
  blueSoft: '#E8EEFA',
  amber: '#F5A623',
  amberSoft: '#FFF4E0',
  coral: '#E85D4C',
  yellow: '#F5C542',
  background: '#F3F4F8',
  surface: '#FFFFFF',
  text: '#1A1A1A',
  textMuted: '#6B7280',
  border: '#E5E7EB',
  modeActiveBg: '#F6F1E6',
  overlayScrim: 'rgba(0,0,0,0.35)',
} as const;

export type MapMode = 'general' | 'plan' | 'activeTrip' | 'heatmap';

export type PlaceCategory = 'all' | 'food' | 'cafe' | 'spot' | 'favorite';

export const MAP_MODE_OPTIONS: ReadonlyArray<{
  id: MapMode;
  title: string;
  description: string;
}> = [
  { id: 'general', title: '일반 지도', description: '주변 장소 탐색' },
  { id: 'plan', title: '계획 지도', description: '제주 3박4일 계획 표시' },
  { id: 'activeTrip', title: '진행중 여행', description: '실시간 경로 안내' },
  { id: 'heatmap', title: '인기 지역', description: '혼잡도 히트맵' },
];

export const CATEGORY_CHIPS: ReadonlyArray<{
  id: PlaceCategory;
  label: string;
}> = [
  { id: 'all', label: '전체' },
  { id: 'food', label: '맛집' },
  { id: 'cafe', label: '카페' },
  { id: 'spot', label: '관광지' },
  { id: 'favorite', label: '즐겨찾기' },
];

export const JEJU_CENTER = {
  latitude: 33.3846,
  longitude: 126.5535,
} as const;

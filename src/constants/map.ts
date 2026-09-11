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
  purple: '#534AB7',
  background: '#F3F4F8',
  surface: '#FFFFFF',
  text: '#1A1A1A',
  textMuted: '#6B7280',
  border: '#E5E7EB',
  modeActiveBg: '#F6F1E6',
  overlayScrim: 'rgba(0,0,0,0.35)',
} as const;

/** 계획 지도 N일차 핀·경로 색 (넘치면 순환) */
export const PLAN_DAY_COLORS = [
  MapTokens.green,
  MapTokens.blue,
  MapTokens.coral,
  MapTokens.amber,
  MapTokens.purple,
  '#C2410C',
] as const;

export function planDayColor(dayNumber: number): string {
  const index = Math.max(0, dayNumber - 1);
  return PLAN_DAY_COLORS[index % PLAN_DAY_COLORS.length]!;
}

export type MapMode = 'general' | 'plan' | 'activeTrip' | 'heatmap';

/** Swagger places category + 지도 전용 칩 */
export type PlaceCategory =
  | 'all'
  | 'nature'
  | 'food'
  | 'cafe'
  | 'activity'
  | 'history'
  | 'shopping'
  | 'festival'
  | 'stay'
  | 'favorite';

export type PlaceApiCategory = Exclude<PlaceCategory, 'all' | 'favorite'>;

export const MAP_MODE_OPTIONS: ReadonlyArray<{
  id: MapMode;
  title: string;
  description: string;
}> = [
  { id: 'general', title: '일반 지도', description: '주변 장소 탐색' },
  { id: 'plan', title: '계획 지도', description: '내 여행 계획을 지도에 표시' },
  { id: 'activeTrip', title: '진행중 여행', description: '실시간 경로 안내' },
  { id: 'heatmap', title: '인기 지역', description: '혼잡도 히트맵' },
];

/** GET /places·/map/places category 값과 동일한 라벨 */
export const CATEGORY_CHIPS: ReadonlyArray<{
  id: PlaceCategory;
  label: string;
}> = [
  { id: 'all', label: '전체' },
  { id: 'nature', label: '자연' },
  { id: 'food', label: '음식' },
  { id: 'cafe', label: '카페' },
  { id: 'activity', label: '체험' },
  { id: 'history', label: '역사' },
  { id: 'shopping', label: '쇼핑' },
  { id: 'festival', label: '축제' },
  { id: 'stay', label: '숙박' },
  { id: 'favorite', label: '즐겨찾기' },
];

export const CATEGORY_LABELS: Record<Exclude<PlaceCategory, 'all'>, string> = {
  nature: '자연',
  food: '음식',
  cafe: '카페',
  activity: '체험',
  history: '역사',
  shopping: '쇼핑',
  festival: '축제',
  stay: '숙박',
  favorite: '즐겨찾기',
};

export const PLACE_CATEGORY_API_NAME: Record<PlaceApiCategory, string> = {
  nature: '자연',
  food: '음식',
  cafe: '카페',
  activity: '체험',
  history: '역사',
  shopping: '쇼핑',
  festival: '축제',
  stay: '숙박',
};

export const JEJU_CENTER = {
  latitude: 33.3846,
  longitude: 126.5535,
} as const;

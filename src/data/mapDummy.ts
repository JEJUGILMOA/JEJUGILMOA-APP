import type { HeatZone, Place, PlanWaypoint } from '../types/map';

/** Phase 6 API 연동 전 더미 데이터 (제주 일대) */
export const DUMMY_PLACES: Place[] = [
  {
    id: 'p1',
    name: '협재해변',
    latitude: 33.3940,
    longitude: 126.2394,
    category: 'spot',
    rating: 4.7,
    address: '제주시 한림읍 협재리',
    description: '에메랄드빛 바다와 비양도가 보이는 대표 해변.',
    isFavorite: true,
  },
  {
    id: 'p2',
    name: '오설록 티뮤지엄',
    latitude: 33.3059,
    longitude: 126.2895,
    category: 'cafe',
    rating: 4.5,
    address: '서귀포시 안덕면 신화역사로',
    description: '녹차밭과 티 카페를 함께 즐길 수 있는 명소.',
  },
  {
    id: 'p3',
    name: '성산일출봉',
    latitude: 33.4581,
    longitude: 126.9425,
    category: 'spot',
    rating: 4.8,
    address: '서귀포시 성산읍 일출로',
    description: '유네스코 세계자연유산, 일출 명소.',
    isFavorite: true,
  },
  {
    id: 'p4',
    name: '흑돼지거리 맛집',
    latitude: 33.4996,
    longitude: 126.5312,
    category: 'food',
    rating: 4.4,
    address: '제주시 연동',
    description: '제주 흑돼지 구이를 대표하는 먹거리 거리.',
  },
  {
    id: 'p5',
    name: '카페델문도',
    latitude: 33.5437,
    longitude: 126.6685,
    category: 'cafe',
    rating: 4.6,
    address: '제주시 조천읍 함덕리',
    description: '함덕 해변 앞 감성 카페.',
  },
  {
    id: 'p6',
    name: '동문시장',
    latitude: 33.5120,
    longitude: 126.5290,
    category: 'food',
    rating: 4.3,
    address: '제주시 건입동',
    description: '올레국수·고기국수 등 제주 먹거리 시장.',
  },
];

export const DUMMY_PLAN_WAYPOINTS: PlanWaypoint[] = [
  { ...DUMMY_PLACES[0], order: 1 },
  { ...DUMMY_PLACES[1], order: 2 },
  { ...DUMMY_PLACES[4], order: 3 },
  { ...DUMMY_PLACES[3], order: 4 },
  { ...DUMMY_PLACES[2], order: 5 },
];

export const DUMMY_HEAT_ZONES: HeatZone[] = [
  {
    id: 'h1',
    latitude: 33.4996,
    longitude: 126.5312,
    radius: 1200,
    level: 'high',
  },
  {
    id: 'h2',
    latitude: 33.4581,
    longitude: 126.9425,
    radius: 1500,
    level: 'high',
  },
  {
    id: 'h3',
    latitude: 33.3940,
    longitude: 126.2394,
    radius: 1000,
    level: 'medium',
  },
  {
    id: 'h4',
    latitude: 33.2539,
    longitude: 126.5600,
    radius: 900,
    level: 'medium',
  },
];

export const DUMMY_RECENT_SEARCHES: string[] = [
  '협재해변',
  '오설록',
  '성산일출봉',
  '함덕해수욕장',
];

export const ACTIVE_TRIP_NEXT = {
  place: DUMMY_PLACES[2],
  distanceMeters: 850,
  walkMinutes: 12,
} as const;

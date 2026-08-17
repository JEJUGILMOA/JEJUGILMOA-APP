import type { HeatZone, Place, PlanTravelLeg, PlanWaypoint } from '../types/map';

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
    photoCount: 8,
    hoursLabel: '상시 개방',
    phone: '064-796-2222',
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
    photoCount: 5,
    hoursLabel: '영업 중 09:00 - 18:00',
    phone: '064-794-5312',
  },
  {
    id: 'p3',
    name: '성산일출봉',
    latitude: 33.4581,
    longitude: 126.9425,
    category: 'spot',
    rating: 4.6,
    address: '제주 서귀포시 성산읍 고성리',
    description:
      '유네스코 세계자연유산으로 등재된 화산 분화구. 일출 명소로 유명하며 정상까지 산책로가 이어집니다.',
    isFavorite: true,
    photoCount: 6,
    hoursLabel: '영업 중 07:00 - 20:00',
    phone: '064-783-0959',
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
    photoCount: 4,
    hoursLabel: '영업 중 11:00 - 22:00',
    phone: '064-711-1234',
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
    photoCount: 7,
    hoursLabel: '영업 중 09:00 - 21:00',
    phone: '064-702-0007',
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
    photoCount: 3,
    hoursLabel: '영업 중 08:00 - 21:00',
    phone: '064-752-3001',
  },
];

export const DUMMY_PLAN_WAYPOINTS: PlanWaypoint[] = [
  { ...DUMMY_PLACES[0], order: 1, visitTime: '09:00' },
  { ...DUMMY_PLACES[1], order: 2, visitTime: '11:00' },
  { ...DUMMY_PLACES[4], order: 3, visitTime: '13:30' },
  { ...DUMMY_PLACES[3], order: 4, visitTime: '15:30' },
  { ...DUMMY_PLACES[2], order: 5, visitTime: '17:30' },
];

/** 경유지 사이 이동 정보 (더미) */
export const DUMMY_PLAN_LEGS: PlanTravelLeg[] = [
  { fromId: 'p1', toId: 'p2', durationMinutes: 23, distanceKm: 18 },
  { fromId: 'p2', toId: 'p5', durationMinutes: 45, distanceKm: 42 },
  { fromId: 'p5', toId: 'p4', durationMinutes: 28, distanceKm: 22 },
  { fromId: 'p4', toId: 'p3', durationMinutes: 55, distanceKm: 48 },
];

export const DUMMY_PLAN_META = {
  title: '제주 3박 4일',
  totalDurationLabel: '약 2시간 30분 소요',
} as const;

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

export const ACTIVE_TRIP = {
  title: '제주 동부 여행',
  currentStop: 2,
  totalStops: 5,
  arrivalTimeLabel: '09:30',
  walkMinutes: 12,
  distanceMeters: 850,
  /** 현위치 (더미) */
  currentLocation: { latitude: 33.4892, longitude: 126.751 },
  /** 다음 목적지 */
  nextPlace: DUMMY_PLACES[2],
  /**
   * 지나온 경로(진한 파랑) / 남은 경로(연한 청록)
   * TODO: Directions API 연동 시 도로 폴리라인으로 교체
   */
  traveledPath: [
    { latitude: 33.4996, longitude: 126.5312 },
    { latitude: 33.495, longitude: 126.62 },
    { latitude: 33.4892, longitude: 126.751 },
  ],
  remainingPath: [
    { latitude: 33.4892, longitude: 126.751 },
    { latitude: 33.475, longitude: 126.85 },
    { latitude: 33.4581, longitude: 126.9425 },
  ],
} as const;


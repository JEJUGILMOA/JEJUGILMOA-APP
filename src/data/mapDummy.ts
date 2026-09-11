import type { Place, PlanTravelLeg, PlanWaypoint } from '../types/map';

/** 계획/진행중 여행 모드용 더미 (탐색 마커·히트맵은 API 사용) */
export const DUMMY_PLACES: Place[] = [
  {
    id: 'p1',
    name: '협재해변',
    latitude: 33.3940,
    longitude: 126.2394,
    category: 'nature',
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
    category: 'nature',
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
  { ...DUMMY_PLACES[0], order: 1, dayNumber: 1, visitTime: '09:00' },
  { ...DUMMY_PLACES[1], order: 2, dayNumber: 1, visitTime: '11:00' },
  { ...DUMMY_PLACES[4], order: 3, dayNumber: 1, visitTime: '13:30' },
  { ...DUMMY_PLACES[3], order: 1, dayNumber: 2, visitTime: '15:30' },
  { ...DUMMY_PLACES[2], order: 2, dayNumber: 2, visitTime: '17:30' },
];

/** 경유지 사이 이동 정보 (더미) */
export const DUMMY_PLAN_LEGS: PlanTravelLeg[] = [
  { fromId: 'p1', toId: 'p2', durationMinutes: 23, distanceKm: 18, dayNumber: 1 },
  { fromId: 'p2', toId: 'p5', durationMinutes: 45, distanceKm: 42, dayNumber: 1 },
  { fromId: 'p4', toId: 'p3', durationMinutes: 55, distanceKm: 48, dayNumber: 2 },
];

export const DUMMY_PLAN_META = {
  title: '제주 3박 4일',
  totalDurationLabel: '약 2시간 30분 소요',
} as const;

/** API 실패·미로그인 시 계획 지도 목록 폴백 */
export const DUMMY_PLAN_SUMMARIES = [
  {
    planId: -1,
    title: '제주 3박 4일',
    startDate: '2024-07-20',
    endDate: '2024-07-23',
    status: 'DRAFT' as const,
    waypointCount: DUMMY_PLAN_WAYPOINTS.length,
    nights: 3,
    days: 4,
    dDay: 12,
  },
  {
    planId: -2,
    title: '제주 힐링 2박',
    startDate: '2024-08-01',
    endDate: '2024-08-03',
    status: 'DRAFT' as const,
    waypointCount: 3,
    nights: 2,
    days: 3,
    dDay: 24,
  },
];

export const DUMMY_PLAN_WAYPOINTS_SHORT = DUMMY_PLAN_WAYPOINTS.slice(0, 3);

export const DUMMY_PLAN_LEGS_SHORT = DUMMY_PLAN_LEGS.slice(0, 2);

/** MAP-03 진행중 여행 경유지 (캐러셀용) */
export type ActiveTripStop = {
  id: string;
  order: number;
  place: Place;
  status: 'visited' | 'current' | 'upcoming';
  transport: 'car' | 'walk';
  travelMinutes: number;
  distanceMeters: number;
  scheduledTime: string;
};

export type ActiveTripBadge = {
  id: string;
  title: string;
  description: string;
  collected: number;
  total: number;
};

/** MAP-03 / 03b / 03c 더미 — 로그인 시 진행중 여행 UI */
export const ACTIVE_TRIP = {
  title: '제주 3박4일',
  dayLabel: '2일차',
  visitedCount: 3,
  totalStops: 6,
  /** 현재 목적지(0-based). 4번째 = index 3 */
  currentStopIndex: 3,
  /** 더미 GPS: 200m 이내라 방문 인증 가능 — 3→4번 구간(제주시→성산) 중간 */
  canVerifyVisit: true,
  walkMinutes: 11,
  distanceMeters: 350,
  arrivalTimeLabel: '13:00',
  currentLocation: { latitude: 33.478, longitude: 126.78 },
  nextPlace: DUMMY_PLACES[2],
  /** 서쪽→시내→동쪽→북동→시내 (지리적으로 이어지는 순서) */
  stops: [
    {
      id: 's1',
      order: 1,
      place: DUMMY_PLACES[0],
      status: 'visited' as const,
      transport: 'car' as const,
      travelMinutes: 20,
      distanceMeters: 12000,
      scheduledTime: '09:00',
    },
    {
      id: 's2',
      order: 2,
      place: DUMMY_PLACES[1],
      status: 'visited' as const,
      transport: 'car' as const,
      travelMinutes: 18,
      distanceMeters: 14000,
      scheduledTime: '10:30',
    },
    {
      id: 's3',
      order: 3,
      place: DUMMY_PLACES[3],
      status: 'visited' as const,
      transport: 'car' as const,
      travelMinutes: 35,
      distanceMeters: 28000,
      scheduledTime: '12:00',
    },
    {
      id: 's4',
      order: 4,
      place: DUMMY_PLACES[2],
      status: 'current' as const,
      transport: 'car' as const,
      travelMinutes: 12,
      distanceMeters: 850,
      scheduledTime: '13:00',
    },
    {
      id: 's5',
      order: 5,
      place: DUMMY_PLACES[4],
      status: 'upcoming' as const,
      transport: 'car' as const,
      travelMinutes: 55,
      distanceMeters: 38000,
      scheduledTime: '15:30',
    },
    {
      id: 's6',
      order: 6,
      place: DUMMY_PLACES[5],
      status: 'upcoming' as const,
      transport: 'walk' as const,
      travelMinutes: 15,
      distanceMeters: 900,
      scheduledTime: '17:30',
    },
  ] satisfies ActiveTripStop[],
  unlockedBadge: {
    id: 'b-master',
    title: '제주 마스터',
    description: '제주에서 5곳 이상 방문 인증',
    collected: 6,
    total: 8,
  } satisfies ActiveTripBadge,
  recentBadges: [
    { id: 'rb1', label: '일출' },
    { id: 'rb2', label: '해변' },
    { id: 'rb3', label: '카페' },
  ],
  extraBadgeCount: 3,
} as const;


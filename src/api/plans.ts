import { apiFetch } from './http';

export type TravelPlanStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED';

/** GET /api/plans 목록 아이템 */
export type TravelPlanSummary = {
  planId: number;
  title: string;
  startDate: string;
  endDate: string;
  status: TravelPlanStatus;
  waypointCount: number;
  nights: number;
  days: number;
  /** 양수 = D-N(미래), 0 = 오늘 출발, 음수 = 지난 여행 */
  dDay: number;
};

export type PlanWaypointDetail = {
  waypointId: number;
  visitDate: string;
  sequenceOrder: number;
  placeId: number;
  placeName: string;
  categoryName: string | null;
  imageUrl: string | null;
  address: string;
  visited: boolean;
  visitedAt: string | null;
  isStart: boolean;
  isDestination: boolean;
  isPreferred: boolean;
};

export type PlanDayDetail = {
  date: string;
  dayNumber: number;
  departurePlaceId: number | null;
  departureLocationName: string | null;
  departureLatitude: number;
  departureLongitude: number;
  waypoints: PlanWaypointDetail[];
};

/** GET /api/plans/{planId} */
export type TravelPlanDetailResponse = {
  planId: number;
  title: string;
  startDate: string;
  endDate: string;
  nights: number;
  days: number;
  status: TravelPlanStatus;
  travelStyle: string | null;
  companion: string | null;
  categories: string[] | null;
  itinerary: PlanDayDetail[];
  budgetTransportation: number | null;
  budgetAccommodation: number | null;
  budgetFood: number | null;
  budgetEtc: number | null;
  totalBudget: number | null;
};

export type PlanRouteStatus =
  | 'CALCULATING'
  | 'READY'
  | 'FAILED'
  | 'UNSUPPORTED'
  | 'NOT_REQUIRED';

export type PlanRouteDto = {
  date: string;
  status: PlanRouteStatus;
  option?: string | null;
  distance?: number | null;
  duration?: number | null;
  calculatedAt?: string | null;
  /** [longitude, latitude][] */
  path?: [number, number][] | null;
  failureCode?: string | null;
};

/** GET /api/plans/{planId}/routes */
export type TravelPlanRoutesResponse = {
  planId: number;
  generation?: { status?: string } | null;
  routes: PlanRouteDto[];
};

/** GET /api/plans — 내 여행 계획 목록 */
export async function fetchPlanSummaries(
  init?: RequestInit,
): Promise<TravelPlanSummary[]> {
  return apiFetch<TravelPlanSummary[]>('/api/plans', init);
}

/** GET /api/plans/{planId} */
export async function fetchPlanById(
  planId: number,
  init?: RequestInit,
): Promise<TravelPlanDetailResponse> {
  return apiFetch<TravelPlanDetailResponse>(`/api/plans/${planId}`, init);
}

/** GET /api/plans/{planId}/routes — 날짜별 저장 경로 */
export async function fetchPlanRoutes(
  planId: number,
  init?: RequestInit & { date?: string },
): Promise<TravelPlanRoutesResponse> {
  const { date, ...rest } = init ?? {};
  const qs = date ? `?date=${encodeURIComponent(date)}` : '';
  return apiFetch<TravelPlanRoutesResponse>(
    `/api/plans/${planId}/routes${qs}`,
    rest,
  );
}

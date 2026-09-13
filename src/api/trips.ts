import { apiFetch } from './http';

/** GET /api/trips/current · POST /api/trips 공통 waypoint */
export type TripWaypointDto = {
  waypointId: number;
  visitDate: string;
  sequenceOrder: number;
  placeId: number;
  placeName: string;
  categoryName?: string | null;
  imageUrl?: string | null;
  address?: string | null;
  visited: boolean;
  visitedAt?: string | null;
  skipped?: boolean;
  skippedAt?: string | null;
  isStart?: boolean;
  isDestination?: boolean;
  isPreferred?: boolean;
};

export type CurrentTripDto = {
  tripId: number;
  title: string;
  status: string;
  actualStartedAt?: string | null;
  waypoints: TripWaypointDto[];
  routes?: TripRouteDto[];
};

export type TripRouteDto = {
  date: string;
  status: 'CALCULATING' | 'READY' | 'FAILED' | 'UNSUPPORTED' | 'NOT_REQUIRED';
  option?: string | null;
  distance?: number | null;
  duration?: number | null;
  calculatedAt?: string | null;
  /** [longitude, latitude][] */
  path?: [number, number][] | null;
  failureCode?: string | null;
};

export type TripEarnedBadgeDto = {
  badgeId: number;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  acquiredAt?: string | null;
};

export type TripCompleteDto = {
  tripId: number;
  title: string;
  status: string;
  startDate?: string;
  endDate?: string;
  durationDays?: number;
  placeCount?: number;
  totalDistanceKm?: number;
  actualStartedAt?: string | null;
  actualCompletedAt?: string | null;
  earnedBadges?: TripEarnedBadgeDto[];
};

export type VisitCheckBody = {
  waypointId: number;
  latitude: number;
  longitude: number;
};

/** GET /api/trips/current — 없으면 ApiError(code PLAN404_6) */
export async function fetchCurrentTrip(
  init?: RequestInit,
): Promise<CurrentTripDto> {
  return apiFetch<CurrentTripDto>('/api/trips/current', init);
}

/** POST /api/trips — DRAFT 계획 시작 */
export async function startTrip(
  planId: number,
  init?: RequestInit,
): Promise<CurrentTripDto> {
  return apiFetch<CurrentTripDto>('/api/trips', {
    method: 'POST',
    body: JSON.stringify({ planId }),
    ...init,
  });
}

export type TripVisitResultDto = {
  waypoints: TripWaypointDto[];
  autoCompleted?: boolean;
  earnedBadges?: TripEarnedBadgeDto[];
};

/** POST /api/trips/{tripId}/visits — GPS 방문 인증 후 waypoints + earnedBadges */
export async function checkTripVisit(
  tripId: number,
  body: VisitCheckBody,
  init?: RequestInit,
): Promise<TripVisitResultDto> {
  return apiFetch<TripVisitResultDto>(`/api/trips/${tripId}/visits`, {
    method: 'POST',
    body: JSON.stringify(body),
    ...init,
  });
}

/** POST /api/trips/{tripId}/complete */
export async function completeTrip(
  tripId: number,
  init?: RequestInit,
): Promise<TripCompleteDto> {
  return apiFetch<TripCompleteDto>(`/api/trips/${tripId}/complete`, {
    method: 'POST',
    ...init,
  });
}

/** POST /api/trips/{tripId}/waypoints/{waypointId}/skip */
export async function skipTripWaypoint(
  tripId: number,
  waypointId: number,
  init?: RequestInit,
): Promise<TripWaypointDto[]> {
  return apiFetch<TripWaypointDto[]>(
    `/api/trips/${tripId}/waypoints/${waypointId}/skip`,
    {
      method: 'POST',
      ...init,
    },
  );
}

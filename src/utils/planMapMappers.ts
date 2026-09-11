import type { PlaceDetailDto } from '../api/places';
import type {
  PlanDayDetail,
  TravelPlanDetailResponse,
} from '../api/plans';
import type { PlanWaypoint } from '../types/map';
import { categoryFromApiName } from './mapMappers';

export type PlaceCoordLookup = {
  latitude: number;
  longitude: number;
  categoryName?: string | null;
  imageUrl?: string | null;
  address?: string | null;
};

function coordsFromDayFallback(
  day: PlanDayDetail,
): { latitude: number; longitude: number } | null {
  if (
    typeof day.departureLatitude === 'number' &&
    typeof day.departureLongitude === 'number' &&
    Number.isFinite(day.departureLatitude) &&
    Number.isFinite(day.departureLongitude)
  ) {
    return {
      latitude: day.departureLatitude,
      longitude: day.departureLongitude,
    };
  }
  return null;
}

/** 상세 일정의 경유지를 지도 마커용 PlanWaypoint[]로 변환 (일차별 order) */
export function mapPlanDetailToWaypoints(
  detail: TravelPlanDetailResponse,
  placeLookup: Map<string, PlaceCoordLookup>,
): PlanWaypoint[] {
  const result: PlanWaypoint[] = [];

  for (const day of detail.itinerary ?? []) {
    const dayFallback = coordsFromDayFallback(day);
    let order = 1;

    for (const wp of day.waypoints ?? []) {
      const key = String(wp.placeId);
      const looked = placeLookup.get(key);
      const latitude = looked?.latitude ?? dayFallback?.latitude;
      const longitude = looked?.longitude ?? dayFallback?.longitude;
      if (latitude == null || longitude == null) {
        continue;
      }

      result.push({
        id: key,
        name: wp.placeName,
        latitude,
        longitude,
        category: categoryFromApiName(
          looked?.categoryName ?? wp.categoryName,
        ),
        address: looked?.address ?? wp.address,
        imageUrl: looked?.imageUrl ?? wp.imageUrl ?? undefined,
        order,
        dayNumber: day.dayNumber,
      });
      order += 1;
    }
  }

  return result;
}

export function placeDetailToLookup(
  dto: PlaceDetailDto,
): PlaceCoordLookup | null {
  if (
    typeof dto.latitude !== 'number' ||
    typeof dto.longitude !== 'number' ||
    !Number.isFinite(dto.latitude) ||
    !Number.isFinite(dto.longitude)
  ) {
    return null;
  }
  return {
    latitude: dto.latitude,
    longitude: dto.longitude,
    categoryName: dto.categoryName,
    imageUrl: dto.imageUrl,
    address: dto.address,
  };
}

export function formatPlanDurationLabel(nights: number, days: number): string {
  return `${nights}박 ${days}일`;
}

export function formatPlanDDay(dDay: number): string {
  if (dDay > 0) return `D-${dDay}`;
  if (dDay === 0) return 'D-Day';
  return `D+${Math.abs(dDay)}`;
}

export function planStatusLabel(
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED',
): string {
  switch (status) {
    case 'IN_PROGRESS':
      return '진행중';
    case 'COMPLETED':
      return '완료';
    default:
      return '임시저장';
  }
}

/** routes API path([lng,lat]) → 네이버맵 polyline coords (전체 병합, 하위 호환) */
export function mapPlanRoutesToPathCoords(
  routes: { status?: string; path?: [number, number][] | null }[],
): { latitude: number; longitude: number }[] {
  const coords: { latitude: number; longitude: number }[] = [];
  for (const route of routes) {
    if (route.status !== 'READY' || !route.path?.length) continue;
    for (const point of route.path) {
      const longitude = point[0];
      const latitude = point[1];
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;
      coords.push({ latitude, longitude });
    }
  }
  return coords;
}

/** 날짜→일차 매핑으로 일차별 경로 분리 */
export function mapPlanRoutesToDayPaths(
  routes: {
    date?: string;
    status?: string;
    path?: [number, number][] | null;
  }[],
  dateToDayNumber: Map<string, number>,
): { dayNumber: number; coords: { latitude: number; longitude: number }[] }[] {
  const byDay = new Map<number, { latitude: number; longitude: number }[]>();

  for (const route of routes) {
    if (route.status !== 'READY' || !route.path?.length || !route.date) continue;
    const dayNumber = dateToDayNumber.get(route.date);
    if (dayNumber == null) continue;
    const coords = byDay.get(dayNumber) ?? [];
    for (const point of route.path) {
      const longitude = point[0];
      const latitude = point[1];
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;
      coords.push({ latitude, longitude });
    }
    if (coords.length >= 2) byDay.set(dayNumber, coords);
  }

  return [...byDay.entries()]
    .sort(([a], [b]) => a - b)
    .map(([dayNumber, coords]) => ({ dayNumber, coords }));
}

/** 도로 path가 없을 때 일차별 경유지를 직선으로 이음 */
export function dayPathsFromWaypoints(
  waypoints: { dayNumber?: number; latitude: number; longitude: number }[],
): { dayNumber: number; coords: { latitude: number; longitude: number }[] }[] {
  const byDay = new Map<number, { latitude: number; longitude: number }[]>();
  for (const wp of waypoints) {
    const day = wp.dayNumber ?? 1;
    const list = byDay.get(day) ?? [];
    list.push({ latitude: wp.latitude, longitude: wp.longitude });
    byDay.set(day, list);
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => a - b)
    .map(([dayNumber, coords]) => ({ dayNumber, coords }));
}

/** READY 경로의 총 거리/시간을 인접 경유지 leg로 균등 분배(패널용 근사) */
export function approximateLegsFromRoutes(
  waypoints: { id: string }[],
  routes: {
    status?: string;
    distance?: number | null;
    duration?: number | null;
  }[],
): { fromId: string; toId: string; durationMinutes: number; distanceKm: number }[] {
  if (waypoints.length < 2) return [];
  const ready = routes.filter((r) => r.status === 'READY');
  const totalMeters = ready.reduce((sum, r) => sum + (r.distance ?? 0), 0);
  const totalMs = ready.reduce((sum, r) => sum + (r.duration ?? 0), 0);
  const segments = waypoints.length - 1;
  if (segments <= 0 || (totalMeters <= 0 && totalMs <= 0)) return [];

  const metersEach = totalMeters / segments;
  const minutesEach = totalMs / segments / 60000;
  const legs = [];
  for (let i = 0; i < segments; i += 1) {
    legs.push({
      fromId: waypoints[i]!.id,
      toId: waypoints[i + 1]!.id,
      durationMinutes: Math.max(1, Math.round(minutesEach)),
      distanceKm: Math.round((metersEach / 1000) * 10) / 10,
    });
  }
  return legs;
}

/** path 시작점이 해당 일차 마지막 경유지에 더 가깝면 좌표열을 뒤집어 진행 방향과 맞춤 */
export function orientPathToWaypoints(
  coords: { latitude: number; longitude: number }[],
  waypoints: { latitude: number; longitude: number }[],
): { latitude: number; longitude: number }[] {
  if (coords.length < 2 || waypoints.length === 0) return coords;
  const firstWp = waypoints[0]!;
  const lastWp = waypoints[waypoints.length - 1]!;
  const start = coords[0]!;
  const dist2 = (
    a: { latitude: number; longitude: number },
    b: { latitude: number; longitude: number },
  ) => {
    const dLat = a.latitude - b.latitude;
    const dLng = a.longitude - b.longitude;
    return dLat * dLat + dLng * dLng;
  };
  // 시작점이 첫 경유지보다 마지막 경유지에 더 가까우면 역방향
  if (dist2(start, lastWp) + 1e-12 < dist2(start, firstWp)) {
    return [...coords].reverse();
  }
  return coords;
}

/** 일차별 경로를 경유지 순서에 맞게 정렬 */
export function orientDayPaths(
  routes: { dayNumber: number; coords: { latitude: number; longitude: number }[] }[],
  waypoints: { dayNumber?: number; latitude: number; longitude: number }[],
): { dayNumber: number; coords: { latitude: number; longitude: number }[] }[] {
  return routes.map((route) => {
    const dayWps = waypoints.filter((wp) => (wp.dayNumber ?? 1) === route.dayNumber);
    return {
      dayNumber: route.dayNumber,
      coords: orientPathToWaypoints(route.coords, dayWps),
    };
  });
}


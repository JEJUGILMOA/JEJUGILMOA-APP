import type { CurrentTripDto, TripWaypointDto } from '../api/trips';
import type { ActiveTripStop } from '../data/mapDummy';
import type { Place } from '../types/map';
import { categoryFromApiName } from './mapMappers';
import type { PlaceCoordLookup } from './planMapMappers';

export type TripMapCoord = { latitude: number; longitude: number };

function haversineMeters(a: TripMapCoord, b: TripMapCoord): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earth = 6371000;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earth * Math.asin(Math.sqrt(h));
}

function sortWaypoints(waypoints: TripWaypointDto[]): TripWaypointDto[] {
  return [...waypoints].sort((a, b) => {
    const dateCmp = a.visitDate.localeCompare(b.visitDate);
    if (dateCmp !== 0) return dateCmp;
    return a.sequenceOrder - b.sequenceOrder;
  });
}

function waypointToPlace(
  wp: TripWaypointDto & { latitude?: number | null; longitude?: number | null },
  lookup: Map<string, PlaceCoordLookup>,
): Place | null {
  const looked = lookup.get(String(wp.placeId));
  const latitude = looked?.latitude ?? wp.latitude ?? null;
  const longitude = looked?.longitude ?? wp.longitude ?? null;
  if (
    latitude == null ||
    longitude == null ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return null;
  }
  return {
    id: String(wp.placeId),
    name: wp.placeName,
    latitude,
    longitude,
    category: categoryFromApiName(
      looked?.categoryName ?? wp.categoryName ?? undefined,
    ),
    address: looked?.address ?? wp.address ?? undefined,
    imageUrl: looked?.imageUrl ?? wp.imageUrl ?? undefined,
  };
}

export function mapTripWaypointsToStops(
  waypoints: Array<
    TripWaypointDto & { latitude?: number | null; longitude?: number | null }
  >,
  lookup: Map<string, PlaceCoordLookup> = new Map(),
): ActiveTripStop[] {
  const sorted = sortWaypoints(waypoints);
  const currentIdx = sorted.findIndex((wp) => !wp.visited && !wp.skipped);

  return sorted.flatMap((wp, index) => {
    const place = waypointToPlace(wp, lookup);
    if (!place) return [];

    let status: ActiveTripStop['status'] = 'upcoming';
    if (wp.visited || wp.skipped) {
      status = 'visited';
    } else if (currentIdx < 0 ? false : index === currentIdx) {
      status = 'current';
    }

    return [
      {
        id: String(wp.waypointId),
        order: index + 1,
        place,
        status,
        transport: 'car' as const,
        travelMinutes: 0,
        distanceMeters: 0,
        scheduledTime: wp.visitDate,
      },
    ];
  });
}

export function deriveTripProgress(stops: ActiveTripStop[]) {
  const currentIndex = Math.max(
    0,
    stops.findIndex((stop) => stop.status === 'current'),
  );
  const visitedCount = stops.filter((stop) => stop.status === 'visited').length;
  const currentStop = stops[currentIndex] ?? null;
  return {
    currentIndex: currentStop ? currentIndex : Math.max(0, stops.length - 1),
    visitedCount,
    totalStops: stops.length,
    currentStop,
    nextPlace: currentStop?.place ?? stops[stops.length - 1]?.place ?? null,
    allVisited: stops.length > 0 && stops.every((s) => s.status === 'visited'),
  };
}

export function formatTripDayLabel(
  trip: CurrentTripDto,
  currentStop: ActiveTripStop | null,
): string {
  const date = currentStop?.scheduledTime ?? trip.waypoints[0]?.visitDate;
  if (!date) return '진행중';
  const uniqueDates = [
    ...new Set(trip.waypoints.map((wp) => wp.visitDate).filter(Boolean)),
  ].sort();
  const dayNumber = Math.max(1, uniqueDates.indexOf(date) + 1);
  return `${dayNumber}일차`;
}

/** 서버 방문 반경(100m)과 맞춘 클라이언트 힌트 */
export function canVerifyAtLocation(
  user: TripMapCoord | null,
  stop: ActiveTripStop | null,
  radiusMeters = 100,
): boolean {
  if (!user || !stop) return false;
  return (
    haversineMeters(user, {
      latitude: stop.place.latitude,
      longitude: stop.place.longitude,
    }) <= radiusMeters
  );
}

export function formatVerifiedAt(iso?: string | null): string {
  if (!iso) {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

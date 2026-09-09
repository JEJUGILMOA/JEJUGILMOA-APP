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

/** 상세 일정의 경유지를 지도 마커용 PlanWaypoint[]로 변환 */
export function mapPlanDetailToWaypoints(
  detail: TravelPlanDetailResponse,
  placeLookup: Map<string, PlaceCoordLookup>,
): PlanWaypoint[] {
  const result: PlanWaypoint[] = [];
  let order = 1;

  for (const day of detail.itinerary ?? []) {
    const dayFallback = coordsFromDayFallback(day);

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

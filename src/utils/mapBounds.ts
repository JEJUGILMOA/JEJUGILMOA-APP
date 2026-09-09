import type { MapBounds } from '../api/map';

/** 제주 전역 대략 영역 — 카메라 idle 전 기본 조회용 */
export const JEJU_DEFAULT_BOUNDS: MapBounds = {
  minLat: 33.2,
  maxLat: 33.56,
  minLng: 126.16,
  maxLng: 126.95,
};

export type MapRegionLike = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

/** Naver Map Region(south-west + delta) → API bounds */
export function boundsFromRegion(region: MapRegionLike): MapBounds {
  return {
    minLat: region.latitude,
    maxLat: region.latitude + region.latitudeDelta,
    minLng: region.longitude,
    maxLng: region.longitude + region.longitudeDelta,
  };
}

export function roundBounds(bounds: MapBounds, digits = 4): MapBounds {
  const factor = 10 ** digits;
  const round = (value: number) => Math.round(value * factor) / factor;
  return {
    minLat: round(bounds.minLat),
    maxLat: round(bounds.maxLat),
    minLng: round(bounds.minLng),
    maxLng: round(bounds.maxLng),
  };
}

export function boundsKey(bounds: MapBounds): string {
  return `${bounds.minLat},${bounds.maxLat},${bounds.minLng},${bounds.maxLng}`;
}

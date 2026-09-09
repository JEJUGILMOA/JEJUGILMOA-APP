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

/**
 * 뷰포트 중심 기준 비율로 검색 영역을 축소한다.
 * @param ratio 0~1 (예: 0.55 → 화면 가운데 약 55% 영역)
 */
export function shrinkBounds(bounds: MapBounds, ratio = 0.55): MapBounds {
  const clamped = Math.min(1, Math.max(0.05, ratio));
  const latSpan = bounds.maxLat - bounds.minLat;
  const lngSpan = bounds.maxLng - bounds.minLng;
  const latPad = (latSpan * (1 - clamped)) / 2;
  const lngPad = (lngSpan * (1 - clamped)) / 2;
  return {
    minLat: bounds.minLat + latPad,
    maxLat: bounds.maxLat - latPad,
    minLng: bounds.minLng + lngPad,
    maxLng: bounds.maxLng - lngPad,
  };
}

export function boundsEqual(a: MapBounds, b: MapBounds): boolean {
  return (
    a.minLat === b.minLat &&
    a.maxLat === b.maxLat &&
    a.minLng === b.minLng &&
    a.maxLng === b.maxLng
  );
}

export function boundsKey(bounds: MapBounds): string {
  return `${bounds.minLat},${bounds.maxLat},${bounds.minLng},${bounds.maxLng}`;
}

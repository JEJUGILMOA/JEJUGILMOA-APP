/** 지도 탭으로 넘길 모드. 지도 화면 포커스 시 take 한다. */
import type { MapMode } from './constants/map';

let pending: MapMode | null = null;

export function setPendingMapMode(mode: MapMode) {
  pending = mode;
}

export function takePendingMapMode(): MapMode | null {
  const next = pending;
  pending = null;
  return next;
}

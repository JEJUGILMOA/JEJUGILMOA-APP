import type { PlaceApiCategory } from '../constants/map';

export type Place = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  category: PlaceApiCategory;
  rating?: number;
  address?: string;
  description?: string;
  isFavorite?: boolean;
  /** 대표 이미지 (없으면 플레이스홀더) */
  imageUrl?: string;
  photoCount?: number;
  /** 예: "영업 중 07:00 - 20:00" */
  hoursLabel?: string;
  phone?: string;
};

export type PlanWaypoint = Place & {
  order: number;
  /** 1일차 = 1. 없으면 단일 일정으로 취급 */
  dayNumber?: number;
  /** 계획 방문 시각 표시용 (더미/스케줄) */
  visitTime?: string;
};

export type PlanTravelLeg = {
  fromId: string;
  toId: string;
  durationMinutes: number;
  distanceKm: number;
  dayNumber?: number;
};

export type HeatZone = {
  id: string;
  latitude: number;
  longitude: number;
  radius: number;
  level: 'high' | 'medium';
};

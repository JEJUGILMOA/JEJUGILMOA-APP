import type { PlaceCategory } from '../constants/map';

export type Place = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  category: Exclude<PlaceCategory, 'all'>;
  rating?: number;
  address?: string;
  description?: string;
  isFavorite?: boolean;
};

export type PlanWaypoint = Place & {
  order: number;
};

export type HeatZone = {
  id: string;
  latitude: number;
  longitude: number;
  radius: number;
  level: 'high' | 'medium';
};

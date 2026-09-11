export type MapPlanDetailFromWeb = {
  planId: number;
  title: string;
  nights: number;
  days: number;
  durationLabel: string;
  waypoints: {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    categoryName?: string;
    imageUrl?: string;
    address?: string;
    order: number;
    dayNumber?: number;
  }[];
  routePath: { latitude: number; longitude: number }[];
  dayRoutes?: {
    dayNumber: number;
    path: { latitude: number; longitude: number }[];
  }[];
  legs: {
    fromId: string;
    toId: string;
    durationMinutes: number;
    distanceKm: number;
    dayNumber?: number;
  }[];
};

export type MapTripWaypointFromWeb = {
  waypointId: number;
  visitDate: string;
  sequenceOrder: number;
  placeId: number;
  placeName: string;
  categoryName?: string;
  imageUrl?: string;
  address?: string;
  visited: boolean;
  visitedAt?: string;
  skipped?: boolean;
  latitude?: number;
  longitude?: number;
};

export type MapTripFromWeb = {
  tripId: number;
  title: string;
  status: string;
  actualStartedAt?: string;
  waypoints: MapTripWaypointFromWeb[];
};

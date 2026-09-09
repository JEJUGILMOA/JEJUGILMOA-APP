import { apiFetch } from './http';

export type MapBounds = {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
};

export type MapPlaceDto = {
  id: string | number;
  name: string;
  categoryName?: string | null;
  imageUrl?: string | null;
  latitude: number;
  longitude: number;
};

export type MapHeatmapLevel = 'CROWDED' | 'MODERATE';

export type MapHeatmapPointDto = {
  latitude: number;
  longitude: number;
  level: MapHeatmapLevel;
  intensity: number;
};

export type FetchMapPlacesParams = MapBounds & {
  category?: string;
  limit?: number;
};

export type FetchMapHeatmapParams = MapBounds & {
  gridSize?: number;
};

function toQuery(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

/** GET /api/map/places — 뷰포트 내 마커용 장소 */
export async function fetchMapPlaces(
  params: FetchMapPlacesParams,
  init?: RequestInit,
): Promise<MapPlaceDto[]> {
  const path =
    `/api/map/places` +
    toQuery({
      minLat: params.minLat,
      maxLat: params.maxLat,
      minLng: params.minLng,
      maxLng: params.maxLng,
      category: params.category,
      limit: params.limit,
    });
  return apiFetch<MapPlaceDto[]>(path, init);
}

/** GET /api/map/heatmap — 인기 지역 혼잡도 */
export async function fetchMapHeatmap(
  params: FetchMapHeatmapParams,
  init?: RequestInit,
): Promise<MapHeatmapPointDto[]> {
  const path =
    `/api/map/heatmap` +
    toQuery({
      minLat: params.minLat,
      maxLat: params.maxLat,
      minLng: params.minLng,
      maxLng: params.maxLng,
      gridSize: params.gridSize,
    });
  return apiFetch<MapHeatmapPointDto[]>(path, init);
}

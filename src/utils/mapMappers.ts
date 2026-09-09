import type { MapHeatmapPointDto, MapPlaceDto } from '../api/map';
import type { PlaceCategory } from '../constants/map';
import type { HeatZone, Place } from '../types/map';

/** 네이티브 칩 → GET /map/places `category` 쿼리 */
export const PLACE_CATEGORY_API_NAME: Partial<
  Record<Exclude<PlaceCategory, 'all' | 'favorite'>, string>
> = {
  food: '음식',
  cafe: '카페',
  spot: '자연',
};

export function categoryFromApiName(
  categoryName?: string | null,
): Exclude<PlaceCategory, 'all'> {
  if (!categoryName) return 'spot';
  if (categoryName.includes('음식') || categoryName.includes('맛집')) return 'food';
  if (categoryName.includes('카페')) return 'cafe';
  return 'spot';
}

export function mapPlaceDtoToPlace(dto: MapPlaceDto): Place {
  return {
    id: String(dto.id),
    name: dto.name,
    latitude: dto.latitude,
    longitude: dto.longitude,
    category: categoryFromApiName(dto.categoryName),
    imageUrl: dto.imageUrl ?? undefined,
  };
}

export function mapHeatmapDtoToZone(
  point: MapHeatmapPointDto,
  index: number,
): HeatZone {
  return {
    id: `heat-${index}-${point.latitude.toFixed(4)}-${point.longitude.toFixed(4)}`,
    latitude: point.latitude,
    longitude: point.longitude,
    radius: Math.round(500 + Math.max(0, Math.min(1, point.intensity)) * 1500),
    level: point.level === 'CROWDED' ? 'high' : 'medium',
  };
}

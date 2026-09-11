import type { MapHeatmapPointDto, MapPlaceDto } from '../api/map';
import type {
  ExploreHeatmapPoint,
  ExploreMapPlace,
} from '../bridge/webviewBridge';
import {
  PLACE_CATEGORY_API_NAME,
  type PlaceApiCategory,
  type PlaceCategory,
} from '../constants/map';
import type { HeatZone, Place } from '../types/map';

export { PLACE_CATEGORY_API_NAME };

export function categoryFromApiName(
  categoryName?: string | null,
): PlaceApiCategory {
  if (!categoryName) return 'nature';
  const exact = (Object.entries(PLACE_CATEGORY_API_NAME) as [PlaceApiCategory, string][])
    .find(([, apiName]) => apiName === categoryName);
  if (exact) return exact[0];

  if (categoryName.includes('음식') || categoryName.includes('맛집')) return 'food';
  if (categoryName.includes('카페')) return 'cafe';
  if (categoryName.includes('체험') || categoryName.includes('액티비티')) return 'activity';
  if (categoryName.includes('역사') || categoryName.includes('문화')) return 'history';
  if (categoryName.includes('쇼핑')) return 'shopping';
  if (categoryName.includes('축제')) return 'festival';
  if (categoryName.includes('숙박') || categoryName.includes('숙소')) return 'stay';
  return 'nature';
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

/** 웹 SET_MAP places → 네이티브 Place */
export function mapExplorePlaceToPlace(pin: ExploreMapPlace): Place {
  return {
    id: pin.id,
    name: pin.title,
    latitude: pin.latitude,
    longitude: pin.longitude,
    category: categoryFromApiName(pin.categoryName),
    imageUrl: pin.imageUrl,
  };
}

/** 웹 SET_MAP heatmap → HeatZone */
export function mapExploreHeatmapToZone(
  point: ExploreHeatmapPoint,
  index: number,
): HeatZone {
  return mapHeatmapDtoToZone(point, index);
}

/** Place.category에 favorite가 올 수 있어 칩 선택용으로 좁힘 */
export function isPlaceApiCategory(
  category: PlaceCategory,
): category is PlaceApiCategory {
  return category !== 'all' && category !== 'favorite';
}

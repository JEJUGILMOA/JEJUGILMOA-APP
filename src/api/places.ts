import { apiFetch } from './http';

/** GET /api/places/{id} — 좌표 보조용 */
export type PlaceDetailDto = {
  id: string | number;
  name: string;
  address?: string | null;
  imageUrl?: string | null;
  categoryName?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export async function fetchPlaceById(
  placeId: string | number,
  init?: RequestInit,
): Promise<PlaceDetailDto> {
  return apiFetch<PlaceDetailDto>(`/api/places/${placeId}`, init);
}

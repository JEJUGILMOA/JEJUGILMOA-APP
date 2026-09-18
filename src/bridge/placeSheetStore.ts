/**
 * 지도 장소 시트·검색용 — 브릿지 응답 구독.
 * (쿠키 세션 API는 숨은 /map WebView에서만 호출)
 */

export type MapPlaceDetailPayload = {
  placeId: string
  name?: string
  address?: string
  description?: string
  imageUrl?: string
  imageUrls?: string[]
  photoCount?: number
  phone?: string
  homepage?: string
  latitude?: number
  longitude?: number
  categoryName?: string
  error?: string
  updatedAt: number
}

export type MapPlaceSearchHit = {
  id: string
  name: string
  address?: string
  imageUrl?: string
  categoryName?: string
}

export type MapPlaceSearchPayload = {
  keyword: string
  places: MapPlaceSearchHit[]
  error?: string
  updatedAt: number
}

export type MapFavoriteIdsPayload = {
  placeIds: string[]
  error?: string
  updatedAt: number
}

export type MapFavoriteTogglePayload = {
  placeId: string
  isFavorite: boolean
  error?: string
  updatedAt: number
}

type DetailListener = (state: MapPlaceDetailPayload | null) => void
type SearchListener = (state: MapPlaceSearchPayload | null) => void
type FavoriteIdsListener = (state: MapFavoriteIdsPayload) => void
type FavoriteToggleListener = (state: MapFavoriteTogglePayload) => void

const detailListeners = new Set<DetailListener>()
const searchListeners = new Set<SearchListener>()
const favoriteIdsListeners = new Set<FavoriteIdsListener>()
const favoriteToggleListeners = new Set<FavoriteToggleListener>()

let detailState: MapPlaceDetailPayload | null = null
let searchState: MapPlaceSearchPayload | null = null
let favoriteIdsState: MapFavoriteIdsPayload = {
  placeIds: [],
  updatedAt: 0,
}
let favoriteToggleState: MapFavoriteTogglePayload | null = null

export function subscribeMapPlaceDetail(listener: DetailListener) {
  detailListeners.add(listener)
  listener(detailState)
  return () => {
    detailListeners.delete(listener)
  }
}

export function subscribeMapPlaceSearch(listener: SearchListener) {
  searchListeners.add(listener)
  listener(searchState)
  return () => {
    searchListeners.delete(listener)
  }
}

export function subscribeMapFavoriteIds(listener: FavoriteIdsListener) {
  favoriteIdsListeners.add(listener)
  listener(favoriteIdsState)
  return () => {
    favoriteIdsListeners.delete(listener)
  }
}

export function subscribeMapFavoriteToggle(listener: FavoriteToggleListener) {
  favoriteToggleListeners.add(listener)
  if (favoriteToggleState) listener(favoriteToggleState)
  return () => {
    favoriteToggleListeners.delete(listener)
  }
}

export function setMapPlaceDetailFromWeb(
  payload: Omit<MapPlaceDetailPayload, 'updatedAt'>,
) {
  detailState = { ...payload, updatedAt: Date.now() }
  detailListeners.forEach((l) => l(detailState))
}

export function setMapPlaceSearchFromWeb(
  payload: Omit<MapPlaceSearchPayload, 'updatedAt'>,
) {
  searchState = { ...payload, updatedAt: Date.now() }
  searchListeners.forEach((l) => l(searchState))
}

export function setMapFavoriteIdsFromWeb(
  placeIds: string[],
  error?: string,
) {
  favoriteIdsState = { placeIds, error, updatedAt: Date.now() }
  favoriteIdsListeners.forEach((l) => l(favoriteIdsState))
}

export function setMapFavoriteToggleFromWeb(
  payload: Omit<MapFavoriteTogglePayload, 'updatedAt'>,
) {
  favoriteToggleState = { ...payload, updatedAt: Date.now() }
  favoriteToggleListeners.forEach((l) => l(favoriteToggleState!))
}

import type { ExploreHeatmapPoint, ExploreMapPlace } from './webviewBridge'
import type { TravelPlanSummary } from '../api/plans'
import type { MapPlanDetailFromWeb, MapTripFromWeb } from './mapBridgeTypes'

export type MapExploreState = {
  places: ExploreMapPlace[]
  heatmap: ExploreHeatmapPoint[]
  updatedAt: number
}

export type MapPlanDetailState = {
  detail: MapPlanDetailFromWeb | null
  loading: boolean
  error: string | null
  updatedAt: number
}

export type MapTripState = {
  trip: MapTripFromWeb | null
  loading: boolean
  error: string | null
  visitError: string | null
  completeResult: {
    tripId: number
    title?: string
    earnedBadges: { badgeId: number; name: string; description?: string; imageUrl?: string }[]
  } | null
  updatedAt: number
}

type ExploreListener = (state: MapExploreState) => void
type PlanDetailListener = (state: MapPlanDetailState) => void
type TripListener = (state: MapTripState) => void

const exploreListeners = new Set<ExploreListener>()
const planDetailListeners = new Set<PlanDetailListener>()
const tripListeners = new Set<TripListener>()

let exploreState: MapExploreState = {
  places: [],
  heatmap: [],
  updatedAt: 0,
}

let planDetailState: MapPlanDetailState = {
  detail: null,
  loading: false,
  error: null,
  updatedAt: 0,
}

let tripState: MapTripState = {
  trip: null,
  loading: false,
  error: null,
  visitError: null,
  completeResult: null,
  updatedAt: 0,
}

function emitExplore() {
  exploreListeners.forEach((l) => l(exploreState))
}
function emitPlanDetail() {
  planDetailListeners.forEach((l) => l(planDetailState))
}
function emitTrip() {
  tripListeners.forEach((l) => l(tripState))
}

export function subscribeMapExplore(listener: ExploreListener) {
  exploreListeners.add(listener)
  listener(exploreState)
  return () => {
    exploreListeners.delete(listener)
  }
}

export function subscribeMapPlanDetail(listener: PlanDetailListener) {
  planDetailListeners.add(listener)
  listener(planDetailState)
  return () => {
    planDetailListeners.delete(listener)
  }
}

export function subscribeMapTrip(listener: TripListener) {
  tripListeners.add(listener)
  listener(tripState)
  return () => {
    tripListeners.delete(listener)
  }
}

export function setMapExploreFromWeb(
  places: ExploreMapPlace[],
  heatmap: ExploreHeatmapPoint[],
) {
  exploreState = { places, heatmap, updatedAt: Date.now() }
  emitExplore()
}

export function markPlanDetailLoading() {
  planDetailState = {
    ...planDetailState,
    loading: true,
    error: null,
  }
  emitPlanDetail()
}

export function setPlanDetailFromWeb(
  detail: MapPlanDetailFromWeb | null,
  error?: string | null,
) {
  planDetailState = {
    detail,
    loading: false,
    error: error ?? null,
    updatedAt: Date.now(),
  }
  emitPlanDetail()
}

export function markTripLoading() {
  tripState = {
    ...tripState,
    loading: true,
    error: null,
    visitError: null,
    completeResult: null,
  }
  emitTrip()
}

export function setCurrentTripFromWeb(
  trip: MapTripFromWeb | null,
  error?: string | null,
) {
  tripState = {
    ...tripState,
    trip,
    loading: false,
    error: error ?? null,
    updatedAt: Date.now(),
  }
  emitTrip()
}

export function setTripVisitResultFromWeb(
  trip: MapTripFromWeb | null,
  error?: string | null,
) {
  const merged =
    error || !trip
      ? tripState.trip
      : {
          ...trip,
          title: trip.title || tripState.trip?.title || '',
          status: trip.status || tripState.trip?.status || 'IN_PROGRESS',
          actualStartedAt:
            trip.actualStartedAt ?? tripState.trip?.actualStartedAt,
        }
  tripState = {
    ...tripState,
    trip: merged,
    visitError: error ?? null,
    updatedAt: Date.now(),
  }
  emitTrip()
}

export function setTripCompleteFromWeb(
  result: MapTripState['completeResult'],
  error?: string | null,
) {
  tripState = {
    ...tripState,
    trip: error ? tripState.trip : null,
    completeResult: error ? null : result,
    error: error ?? null,
    updatedAt: Date.now(),
  }
  emitTrip()
}

export function clearTripCompleteResult() {
  tripState = { ...tripState, completeResult: null }
  emitTrip()
}

export function clearTripVisitError() {
  if (!tripState.visitError) return
  tripState = { ...tripState, visitError: null }
  emitTrip()
}

/** re-export for host typing */
export type { TravelPlanSummary }

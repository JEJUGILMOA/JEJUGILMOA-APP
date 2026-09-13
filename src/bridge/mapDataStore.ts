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

export type MapTripEarnedBadge = {
  badgeId: number
  name: string
  description?: string
  imageUrl?: string
}

export type MapTripState = {
  trip: MapTripFromWeb | null
  loading: boolean
  error: string | null
  visitError: string | null
  /** 방문 인증으로 새로 받은 뱃지 (모달 표시 후 비움) */
  visitEarnedBadges: MapTripEarnedBadge[] | null
  /** 마지막 경유지 인증으로 서버에서 여행 자동 완료 */
  visitAutoCompleted: boolean
  completeResult: {
    tripId: number
    title?: string
    durationDays?: number
    placeCount?: number
    totalDistanceKm?: number
    startDate?: string
    endDate?: string
    earnedBadges: MapTripEarnedBadge[]
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
  visitEarnedBadges: null,
  visitAutoCompleted: false,
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
    visitEarnedBadges: null,
    visitAutoCompleted: false,
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
  extras?: {
    earnedBadges?: MapTripEarnedBadge[]
    autoCompleted?: boolean
  },
) {
  if (error || !trip) {
    tripState = {
      ...tripState,
      visitError: error ?? null,
      visitEarnedBadges: null,
      visitAutoCompleted: false,
      updatedAt: Date.now(),
    }
    emitTrip()
    return
  }

  const previous = tripState.trip
  const mergedWaypoints = mergeTripWaypoints(previous?.waypoints, trip.waypoints)

  tripState = {
    ...tripState,
    trip: {
      tripId: trip.tripId || previous?.tripId || 0,
      title: trip.title || previous?.title || '',
      status: trip.status || previous?.status || 'IN_PROGRESS',
      actualStartedAt: trip.actualStartedAt ?? previous?.actualStartedAt,
      waypoints: mergedWaypoints,
      // 방문/스킵 응답에는 경로가 없으므로 기존 dayRoutes 유지
      dayRoutes: trip.dayRoutes ?? previous?.dayRoutes,
    },
    visitError: null,
    visitEarnedBadges: extras?.earnedBadges?.length ? extras.earnedBadges : null,
    visitAutoCompleted: extras?.autoCompleted === true,
    updatedAt: Date.now(),
  }
  emitTrip()
}

/** 방문/스킵 응답이 전체 목록이 아니라 일부만 와도 기존 목록에 병합 */
function mergeTripWaypoints(
  previous: MapTripFromWeb['waypoints'] | undefined,
  next: MapTripFromWeb['waypoints'],
): MapTripFromWeb['waypoints'] {
  if (!previous?.length) return next
  if (!next.length) return previous

  const byId = new Map(previous.map((wp) => [wp.waypointId, wp]))
  for (const wp of next) {
    byId.set(wp.waypointId, { ...byId.get(wp.waypointId), ...wp })
  }

  const ordered: MapTripFromWeb['waypoints'] = []
  const seen = new Set<number>()
  for (const wp of previous) {
    const updated = byId.get(wp.waypointId)
    if (!updated) continue
    ordered.push(updated)
    seen.add(wp.waypointId)
  }
  for (const wp of next) {
    if (seen.has(wp.waypointId)) continue
    ordered.push(wp)
  }
  return ordered
}

export function setTripCompleteFromWeb(
  result: MapTripState['completeResult'],
  error?: string | null,
) {
  tripState = {
    ...tripState,
    // 완료 모달이 닫힐 때까지 trip을 유지한다 (즉시 null이면 empty 시트로 깜빡이고 구독 레이스가 난다)
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

export function clearTripStoreError() {
  if (!tripState.error) return
  tripState = { ...tripState, error: null }
  emitTrip()
}

export function clearTripVisitError() {
  if (!tripState.visitError) return
  tripState = { ...tripState, visitError: null }
  emitTrip()
}

/** re-export for host typing */
export type { TravelPlanSummary }

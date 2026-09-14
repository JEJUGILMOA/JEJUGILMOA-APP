import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Linking, Platform, Share, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  NaverMapCircleOverlay,
  NaverMapMarkerOverlay,
  NaverMapPathOverlay,
  NaverMapView,
  type NaverMapViewRef,
} from '@mj-studio/react-native-naver-map';
import { router, useFocusEffect } from 'expo-router';

import { fetchMapHeatmap, fetchMapPlaces, type MapBounds } from '../api/map';
import { type TravelPlanSummary } from '../api/plans';
import type { CurrentTripDto } from '../api/trips';
import {
  clearTripCompleteResult,
  clearTripStoreError,
  clearTripVisitError,
  markPlanDetailLoading,
  markTripLoading,
  subscribeMapPlanDetail,
  subscribeMapTrip,
} from '../bridge/mapDataStore';
import type { MapTripFromWeb } from '../bridge/mapBridgeTypes';
import {
  markPlanListLoading,
  subscribePlanList,
} from '../bridge/planListStore';
import { broadcastToWeb } from '../bridge/webviewRegistry';
import ActiveTripEmptySheet from '../components/map/ActiveTripEmptySheet';
import ActiveTripSheet from '../components/map/ActiveTripSheet';
import ActiveTripStatusBanner from '../components/map/ActiveTripStatusBanner';
import BadgeUnlockModal from '../components/map/BadgeUnlockModal';
import TripCompleteModal, {
  type TripCompleteSummary,
} from '../components/map/TripCompleteModal';
import CategoryChips from '../components/map/CategoryChips';
import CategoryMapPin, {
  CATEGORY_PIN_SELECTED_SIZE,
  CATEGORY_PIN_SIZE,
} from '../components/map/CategoryMapPin';
import PlanDayMapPin, {
  PLAN_DAY_PIN_SELECTED_SIZE,
  PLAN_DAY_PIN_SIZE,
} from '../components/map/PlanDayMapPin';
import HeatmapLegend from '../components/map/HeatmapLegend';
import MapLayersButton from '../components/map/MapLayersButton';
import MapTopBar from '../components/map/MapTopBar';
import ModeBottomSheet from '../components/map/ModeBottomSheet';
import MyLocationButton from '../components/map/MyLocationButton';
import PlaceDetailChrome from '../components/map/PlaceDetailChrome';
import PlaceDetailSheet from '../components/map/PlaceDetailSheet';
import PlanListPanel, {
  PLAN_LIST_PANEL_HEIGHT_RATIO,
} from '../components/map/PlanListPanel';
import PlanSummaryPanel, {
  PLAN_PANEL_HEIGHT_RATIO,
} from '../components/map/PlanSummaryPanel';
import SearchHereButton from '../components/map/SearchHereButton';
import SearchModal from '../components/map/SearchModal';
import VisitCompleteModal from '../components/map/VisitCompleteModal';
import {
  JEJU_CENTER,
  MapTokens,
  planDayColor,
  type MapMode,
  type PlaceCategory,
} from '../constants/map';
import { useAuth } from '../context/AuthContext';
import { useTabRepress } from '../hooks/useTabRepress';
import {
  type ActiveTripBadge,
  type ActiveTripStop,
} from '../data/mapDummy';
import { setPendingWebPath } from '../pendingWebPath';
import { takePendingMapMode } from '../pendingMapMode';
import {
  getMapTabRefreshSeq,
  subscribeMapTabRefresh,
} from '../pendingMapRefresh';
import type { HeatZone, Place, PlanTravelLeg, PlanWaypoint } from '../types/map';
import {
  dayPathsFromWaypoints,
  formatPlanDurationLabel,
  orientDayPaths,
} from '../utils/planMapMappers';
import { categoryFromApiName } from '../utils/mapMappers';
import {
  deriveTripProgress,
  formatVerifiedAt,
  mapTripWaypointsToStops,
  type TripMapCoord,
} from '../utils/tripMapMappers';
import { getDeviceCoordinates } from '../utils/deviceLocation';
import { isTripVisitSpoofEnabled, initTripVisitSpoof } from '../utils/tripVisitSpoof';
import {
  boundsEqual,
  boundsFromRegion,
  boundsKey,
  JEJU_DEFAULT_BOUNDS,
  roundBounds,
  shrinkBounds,
} from '../utils/mapBounds';
import { ensureMapLocationPermission } from '../utils/mapLocationPermission';
import {
  mapHeatmapDtoToZone,
  mapPlaceDtoToPlace,
  PLACE_CATEGORY_API_NAME,
} from '../utils/mapMappers';

export type { Place } from '../types/map';

/** PathOverlay direction chevron pattern */
const PATH_ARROW_PATTERN = require('../../assets/map/path_arrow.png');

const TOP_BAR_BLOCK = 56;
const CATEGORY_ROW = 40;
/** 지점 bounds에 여유를 둬 캡션/마커가 잘리지 않게 함 */
const PLAN_BOUNDS_PADDING = 0.28;
const PLAN_BOUNDS_MIN_DELTA = 0.02;
/** 진행중 여행 시트 높이 대략값 — FAB 오프셋용 */
const ACTIVE_TRIP_SHEET_FAB_OFFSET = 300;
const ACTIVE_EMPTY_SHEET_FAB_OFFSET = 260;
const ACTIVE_LOCATION_PULSE = 'rgba(30, 79, 196, 0.18)';
const ACTIVE_LOCATION_DOT = MapTokens.blue;
/** 한 번에 가져올 장소 수 (화면이 과밀해지지 않도록) */
const MAP_PLACES_LIMIT = 25;
/** 지도 화면 가운데 기준으로 검색할 영역 비율 */
const SEARCH_BOUNDS_RATIO = 0.55;
const MAP_HEATMAP_GRID = 10;

function toSearchArea(bounds: MapBounds): MapBounds {
  return roundBounds(shrinkBounds(bounds, SEARCH_BOUNDS_RATIO));
}

export default function MapScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<NaverMapViewRef>(null);
  const skipPlanEnterResetRef = useRef(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (__DEV__) {
      void initTripVisitSpoof();
    }
  }, []);

  const [mode, setMode] = useState<MapMode>('general');
  /** 여행 시작 등으로 같은 모드에서도 진행중 여행 재조회 */
  const [mapRefreshKey, setMapRefreshKey] = useState(0);
  const [category, setCategory] = useState<PlaceCategory>('all');
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [modeSheetOpen, setModeSheetOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // 웹에서 NAVIGATE_TO_MAP(mode)로 넘어온 경우 포커스 시 모드 적용
  useFocusEffect(
    useCallback(() => {
      const pendingMode = takePendingMapMode();
      if (pendingMode) {
        setMode(pendingMode);
        setSelectedPlace(null);
        setModeSheetOpen(false);
        setSearchOpen(false);
      }
      const refresh = getMapTabRefreshSeq();
      if (refresh > 0) {
        setMapRefreshKey(refresh);
      }
    }, []),
  );

  useEffect(() => {
    return subscribeMapTabRefresh((next) => {
      setMapRefreshKey(next);
    });
  }, []);
  const [planView, setPlanView] = useState<'list' | 'detail'>('list');
  const [planSummaries, setPlanSummaries] = useState<TravelPlanSummary[]>([]);
  const [planListLoading, setPlanListLoading] = useState(false);
  const [planDetailLoading, setPlanDetailLoading] = useState(false);
  const [selectedTravelPlan, setSelectedTravelPlan] =
    useState<TravelPlanSummary | null>(null);
  const [planWaypoints, setPlanWaypoints] = useState<PlanWaypoint[]>([]);
  const [planLegs, setPlanLegs] = useState<PlanTravelLeg[]>([]);
  const [planDayRoutes, setPlanDayRoutes] = useState<
    { dayNumber: number; coords: { latitude: number; longitude: number }[] }[]
  >([]);
  const [planDurationLabel, setPlanDurationLabel] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  /** null이면 전체 일차 경로 표시 */
  const [selectedPlanDayNumber, setSelectedPlanDayNumber] = useState<number | null>(
    null,
  );

  const [tripStops, setTripStops] = useState<ActiveTripStop[]>([]);
  const [tripCurrentIndex, setTripCurrentIndex] = useState(0);
  const [tripVisitedCount, setTripVisitedCount] = useState(0);
  const [tripMeta, setTripMeta] = useState<CurrentTripDto | null>(null);
  const [tripLoading, setTripLoading] = useState(false);
  const [tripUserLocation, setTripUserLocation] = useState<TripMapCoord | null>(null);
  const [userLocationVisible, setUserLocationVisible] = useState(false);
  /** null이면 전체 일차 표시 */
  const [selectedTripDayNumber, setSelectedTripDayNumber] = useState<number | null>(null);
  const [selectedTripStopId, setSelectedTripStopId] = useState<string | null>(null);
  /** API READY 도로 경로. 없으면 직선 폴백 */
  const [tripApiDayRoutes, setTripApiDayRoutes] = useState<
    { dayNumber: number; coords: { latitude: number; longitude: number }[] }[]
  >([]);
  const pendingVisitStopRef = useRef<ActiveTripStop | null>(null);
  const pendingVisitBadgesRef = useRef<
    { badgeId: number; name: string; description?: string; imageUrl?: string }[]
  >([]);
  const pendingVisitAutoCompletedRef = useRef(false);
  /** 방문 응답 waypoints 기준 — 모달 닫을 때 React tripStops 지연과 무관하게 완료 판정 */
  const pendingVisitTripDoneRef = useRef(false);
  const pendingExpectingCompleteRef = useRef(false);
  const pendingCompleteBadgesRef = useRef<
    { badgeId: number; name: string; description?: string; imageUrl?: string }[]
  >([]);
  const tripMetaRef = useRef(tripMeta);
  tripMetaRef.current = tripMeta;
  const tripStopsRef = useRef(tripStops);
  tripStopsRef.current = tripStops;
  const [visitModalOpen, setVisitModalOpen] = useState(false);
  const [badgeModalOpen, setBadgeModalOpen] = useState(false);
  const [tripCompleteModalOpen, setTripCompleteModalOpen] = useState(false);
  const [tripCompleteSummary, setTripCompleteSummary] =
    useState<TripCompleteSummary | null>(null);
  const [verifiedStop, setVerifiedStop] = useState<ActiveTripStop | null>(null);
  const [verifiedAtLabel, setVerifiedAtLabel] = useState('');
  const [unlockedBadge, setUnlockedBadge] = useState<ActiveTripBadge | null>(null);

  const openBadgeUnlock = useCallback(
    (
      badges: { badgeId: number; name: string; description?: string; imageUrl?: string }[],
    ) => {
      if (badges.length === 0) return;
      const first = badges[0]!;
      setUnlockedBadge({
        id: String(first.badgeId),
        title: first.name,
        description: first.description ?? '',
        collected: badges.length,
        total: badges.length,
      });
      setBadgeModalOpen(true);
    },
    [],
  );

  const openTripComplete = useCallback(
    (
      summary: TripCompleteSummary,
      badges: { badgeId: number; name: string; description?: string; imageUrl?: string }[] = [],
    ) => {
      pendingCompleteBadgesRef.current = badges;
      setTripCompleteSummary(summary);
      setTripCompleteModalOpen(true);
    },
    [],
  );

  const [viewBounds, setViewBounds] = useState<MapBounds>(JEJU_DEFAULT_BOUNDS);
  const [searchBounds, setSearchBounds] = useState<MapBounds | null>(null);
  const [mapPlaces, setMapPlaces] = useState<Place[]>([]);
  const [heatZones, setHeatZones] = useState<HeatZone[]>([]);
  const placesRequestKeyRef = useRef<string>('');
  const heatmapRequestKeyRef = useRef<string>('');

  const liveSearchArea = useMemo(() => toSearchArea(viewBounds), [viewBounds]);

  // 최초 1회: 현재 영역으로 검색 시작
  useEffect(() => {
    if (searchBounds) return;
    setSearchBounds(liveSearchArea);
  }, [searchBounds, liveSearchArea]);

  const showSearchHere =
    (mode === 'general' || mode === 'heatmap') &&
    !selectedPlace &&
    searchBounds != null &&
    !boundsEqual(searchBounds, liveSearchArea);

  useEffect(() => {
    if (!searchBounds) return;
    if (mode !== 'general' && mode !== 'heatmap') {
      return;
    }

    const apiCategory =
      category === 'all' || category === 'favorite'
        ? undefined
        : PLACE_CATEGORY_API_NAME[category];
    const requestKey = `${boundsKey(searchBounds)}:${apiCategory ?? 'all'}`;
    placesRequestKeyRef.current = requestKey;
    const controller = new AbortController();

    void (async () => {
      try {
        const rows = await fetchMapPlaces(
          {
            ...searchBounds,
            category: apiCategory,
            limit: MAP_PLACES_LIMIT,
          },
          { signal: controller.signal },
        );
        if (placesRequestKeyRef.current !== requestKey) return;
        setMapPlaces((prev) => {
          const favoriteIds = new Set(prev.filter((p) => p.isFavorite).map((p) => p.id));
          return rows.map((row) => {
            const place = mapPlaceDtoToPlace(row);
            return favoriteIds.has(place.id)
              ? { ...place, isFavorite: true }
              : place;
          });
        });
      } catch (error) {
        if (controller.signal.aborted) return;
        // console.warn('[map] places fetch failed', error);
      }
    })();

    return () => controller.abort();
  }, [searchBounds, category, mode]);

  useEffect(() => {
    if (!searchBounds) return;
    if (mode !== 'heatmap') {
      return;
    }

    const requestKey = boundsKey(searchBounds);
    heatmapRequestKeyRef.current = requestKey;
    const controller = new AbortController();

    void (async () => {
      try {
        const rows = await fetchMapHeatmap(
          {
            ...searchBounds,
            gridSize: MAP_HEATMAP_GRID,
          },
          { signal: controller.signal },
        );
        if (heatmapRequestKeyRef.current !== requestKey) return;
        setHeatZones(rows.map(mapHeatmapDtoToZone));
      } catch (error) {
        if (controller.signal.aborted) return;
        // console.warn('[map] heatmap fetch failed', error);
      }
    })();

    return () => controller.abort();
  }, [searchBounds, mode]);

  const filteredPlaces = useMemo(() => {
    if (category === 'favorite') {
      return mapPlaces.filter((p) => p.isFavorite);
    }
    return mapPlaces;
  }, [category, mapPlaces]);

  const searchLabel = '장소, 주소 검색';

  const topChromeHeight = insets.top + 8 + TOP_BAR_BLOCK;
  const categoryTop = topChromeHeight;
  const statusTop = topChromeHeight + (mode === 'general' ? CATEGORY_ROW : 8);
  const isPlanMode = mode === 'plan';
  const isPlanDetail = isPlanMode && planView === 'detail';
  const isActiveTrip = mode === 'activeTrip';
  const showActiveTripEmpty = isActiveTrip && !tripLoading && tripStops.length === 0;
  const showActiveTripLive = isActiveTrip && tripStops.length > 0;

  const planPanelRatio = isPlanMode
    ? planView === 'detail'
      ? PLAN_PANEL_HEIGHT_RATIO
      : PLAN_LIST_PANEL_HEIGHT_RATIO
    : PLAN_PANEL_HEIGHT_RATIO;
  const planMapRatio = 1 - planPanelRatio;

  const tripLocation = useMemo(() => {
    if (tripUserLocation) return tripUserLocation;
    const current = tripStops[tripCurrentIndex]?.place;
    if (current) {
      return { latitude: current.latitude, longitude: current.longitude };
    }
    return null;
  }, [tripUserLocation, tripStops, tripCurrentIndex]);

  /** 일차 내 순번 (핀 숫자) */
  const tripDayOrderById = useMemo(() => {
    const orders = new Map<string, number>();
    const counts = new Map<number, number>();
    for (const stop of tripStops) {
      const day = stop.dayNumber ?? 1;
      const next = (counts.get(day) ?? 0) + 1;
      counts.set(day, next);
      orders.set(stop.id, next);
    }
    return orders;
  }, [tripStops]);

  const tripDayRoutes = useMemo(() => {
    if (tripApiDayRoutes.length > 0) return tripApiDayRoutes;
    // API 경로가 없을 때만 경유지 직선 폴백
    return dayPathsFromWaypoints(
      tripStops.map((stop) => ({
        dayNumber: stop.dayNumber,
        latitude: stop.place.latitude,
        longitude: stop.place.longitude,
      })),
    );
  }, [tripApiDayRoutes, tripStops]);

  const visibleTripDayRoutes = useMemo(() => {
    if (selectedTripDayNumber == null) return tripDayRoutes;
    return tripDayRoutes.filter((route) => route.dayNumber === selectedTripDayNumber);
  }, [tripDayRoutes, selectedTripDayNumber]);

  const visibleTripStops = useMemo(() => {
    if (selectedTripDayNumber == null) return tripStops;
    return tripStops.filter((stop) => stop.dayNumber === selectedTripDayNumber);
  }, [tripStops, selectedTripDayNumber]);

  const fabBottomOffset = isPlanMode
    ? 16
    : showActiveTripLive
      ? ACTIVE_TRIP_SHEET_FAB_OFFSET
      : showActiveTripEmpty
        ? ACTIVE_EMPTY_SHEET_FAB_OFFSET
        : 40;

  const animateTo = useCallback((latitude: number, longitude: number, zoom = 13) => {
    mapRef.current?.animateCameraTo({
      latitude,
      longitude,
      zoom,
      duration: 500,
    });
  }, []);

  useTabRepress(
    'map',
    useCallback(() => {
      setMode('general');
      setCategory('all');
      setSelectedPlace(null);
      setModeSheetOpen(false);
      setSearchOpen(false);
      setPlanView('list');
      setSelectedTravelPlan(null);
      setPlanWaypoints([]);
      setPlanLegs([]);
      setPlanDayRoutes([]);
      setSelectedPlanId(null);
      setSelectedPlanDayNumber(null);
      setSelectedTripDayNumber(null);
      setSelectedTripStopId(null);
      setTripApiDayRoutes([]);
      setVisitModalOpen(false);
      setBadgeModalOpen(false);
      setVerifiedStop(null);
      animateTo(JEJU_CENTER.latitude, JEJU_CENTER.longitude, 10);
    }, [animateTo]),
  );

  /** 계획 모드 진입 시 목록으로 리셋 + 내 계획 조회 */
  useEffect(() => {
    if (mode !== 'plan') {
      return;
    }

    if (skipPlanEnterResetRef.current) {
      skipPlanEnterResetRef.current = false;
      return;
    }

    setPlanView('list');
    setSelectedTravelPlan(null);
    setPlanWaypoints([]);
    setPlanLegs([]);
    setPlanDayRoutes([]);
    setSelectedPlanId(null);
    setSelectedPlanDayNumber(null);
    setSelectedPlace(null);

    markPlanListLoading();
    broadcastToWeb({ type: 'REQUEST_PLAN_SUMMARIES' });
    return subscribePlanList((next) => {
      setPlanSummaries(next.plans);
      setPlanListLoading(next.loading);
      if (next.error) {
        // console.warn('[map] plan list from web failed', next.error);
      }
    });
  }, [mode]);

  /** 계획 경유지 전체가 보이도록 Region 맞춤 (south-west + delta) */
  const fitPlanWaypoints = useCallback((waypoints: PlanWaypoint[]) => {
    if (waypoints.length === 0) {
      return;
    }
    if (waypoints.length === 1) {
      const only = waypoints[0];
      mapRef.current?.animateCameraTo({
        latitude: only.latitude,
        longitude: only.longitude,
        zoom: 13,
        duration: 500,
      });
      return;
    }

    const lats = waypoints.map((w) => w.latitude);
    const lngs = waypoints.map((w) => w.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const rawLatDelta = Math.max(maxLat - minLat, PLAN_BOUNDS_MIN_DELTA);
    const rawLngDelta = Math.max(maxLng - minLng, PLAN_BOUNDS_MIN_DELTA);
    const latitudeDelta = rawLatDelta * (1 + PLAN_BOUNDS_PADDING * 2);
    const longitudeDelta = rawLngDelta * (1 + PLAN_BOUNDS_PADDING * 2);

    mapRef.current?.animateRegionTo({
      latitude: minLat - rawLatDelta * PLAN_BOUNDS_PADDING,
      longitude: minLng - rawLngDelta * PLAN_BOUNDS_PADDING,
      latitudeDelta,
      longitudeDelta,
      duration: 500,
    });
  }, []);

  useEffect(() => {
    if (!isPlanDetail) {
      return;
    }
    // 지도 영역 높이 레이아웃이 잡힌 뒤 bounds를 맞춤
    const timer = setTimeout(() => {
      fitPlanWaypoints(planWaypoints);
    }, 180);
    return () => clearTimeout(timer);
  }, [isPlanDetail, planWaypoints, fitPlanWaypoints]);

  useEffect(() => {
    if (!showActiveTripLive) {
      return;
    }
    const points = tripStops.map((stop) => ({
      id: stop.id,
      name: stop.place.name,
      latitude: stop.place.latitude,
      longitude: stop.place.longitude,
      category: stop.place.category,
      order: stop.order,
    }));
    const timer = setTimeout(() => {
      fitPlanWaypoints(points);
    }, 180);
    return () => clearTimeout(timer);
  }, [showActiveTripLive, tripStops, fitPlanWaypoints]);

  const handleSelectPlace = useCallback(
    (place: Place) => {
      setSelectedPlace(place);
      setSelectedPlanId(place.id);
      animateTo(place.latitude, place.longitude);
    },
    [animateTo],
  );

  const handleSelectPlanWaypoint = useCallback(
    (waypoint: PlanWaypoint) => {
      setSelectedPlanId(waypoint.id);
      setSelectedPlace(null);
      animateTo(waypoint.latitude, waypoint.longitude, 13);
    },
    [animateTo],
  );

  const handlePressPlanDay = useCallback(
    (dayNumber: number) => {
      setSelectedPlanDayNumber((prev) => {
        const next = prev === dayNumber ? null : dayNumber;
        const targets =
          next == null
            ? planWaypoints
            : planWaypoints.filter((wp) => (wp.dayNumber ?? 1) === next);
        requestAnimationFrame(() => fitPlanWaypoints(targets));
        return next;
      });
    },
    [planWaypoints, fitPlanWaypoints],
  );

  const handleBackToPlanList = useCallback(() => {
    setPlanView('list');
    setSelectedTravelPlan(null);
    setPlanWaypoints([]);
    setPlanLegs([]);
    setPlanDayRoutes([]);
    setSelectedPlanId(null);
    setSelectedPlanDayNumber(null);
    setPlanDetailLoading(false);
  }, []);

  const handleSelectTravelPlan = useCallback((plan: TravelPlanSummary) => {
    setSelectedTravelPlan(plan);
    setPlanView('detail');
    setSelectedPlanId(null);
    setSelectedPlanDayNumber(null);
    setPlanDurationLabel(formatPlanDurationLabel(plan.nights, plan.days));
    setPlanDetailLoading(true);
    setPlanDayRoutes([]);
    setPlanWaypoints([]);
    setPlanLegs([]);
    markPlanDetailLoading();
    broadcastToWeb({ type: 'REQUEST_PLAN_DETAIL', planId: plan.planId });
  }, []);

  useEffect(() => {
    if (!isPlanDetail || selectedTravelPlan == null) {
      return;
    }
    const planId = selectedTravelPlan.planId;
    return subscribeMapPlanDetail((next) => {
      if (next.loading) {
        setPlanDetailLoading(true);
        return;
      }
      setPlanDetailLoading(false);
      if (next.error || !next.detail || next.detail.planId !== planId) {
        if (next.error) {
          // console.warn('[map] plan detail from web failed', next.error);
          Alert.alert(
            '계획을 불러오지 못했어요',
            '잠시 후 다시 시도해 주세요.',
          );
          handleBackToPlanList();
        }
        return;
      }
      const detail = next.detail;
      const waypoints = detail.waypoints.map((wp) => ({
        id: wp.id,
        name: wp.name,
        latitude: wp.latitude,
        longitude: wp.longitude,
        category: categoryFromApiName(wp.categoryName),
        imageUrl: wp.imageUrl,
        address: wp.address,
        order: wp.order,
        dayNumber: wp.dayNumber ?? 1,
      }));
      setPlanWaypoints(waypoints);
      setPlanDurationLabel(detail.durationLabel);
      const fromPayload = (detail.dayRoutes ?? [])
        .filter((route) => route.path.length >= 2)
        .map((route) => ({
          dayNumber: route.dayNumber,
          coords: route.path,
        }));
      setPlanDayRoutes(
        fromPayload.length > 0 ? fromPayload : dayPathsFromWaypoints(waypoints),
      );
      setPlanLegs(detail.legs ?? []);
      if (waypoints.length === 0) {
        Alert.alert(
          '표시할 장소가 없어요',
          '이 계획에 좌표가 있는 경유지가 없습니다.',
        );
      }
    });
  }, [isPlanDetail, selectedTravelPlan, handleBackToPlanList]);


  const handleOpenDetailSchedule = useCallback(() => {
    const planId = selectedTravelPlan?.planId;
    if (planId != null && planId > 0) {
      setPendingWebPath('plan', `/plan/${planId}/preview`);
    } else {
      setPendingWebPath('plan', '/plan');
    }
    router.navigate('/(tabs)/plan');
  }, [selectedTravelPlan?.planId]);

  const applyTripFromWeb = useCallback((trip: MapTripFromWeb | null) => {
    if (!trip) {
      setTripMeta(null);
      setTripStops([]);
      setTripCurrentIndex(0);
      setTripVisitedCount(0);
      setSelectedTripDayNumber(null);
      setSelectedTripStopId(null);
      setTripApiDayRoutes([]);
      return;
    }
    const stops = mapTripWaypointsToStops(trip.waypoints ?? []);
    const progress = deriveTripProgress(stops);
    setTripMeta({
      tripId: trip.tripId,
      title: trip.title,
      status: trip.status,
      actualStartedAt: trip.actualStartedAt,
      waypoints: trip.waypoints,
    });
    setTripStops(stops);
    setTripCurrentIndex(progress.currentIndex);
    setTripVisitedCount(progress.visitedCount);
    const current = stops[progress.currentIndex];
    setSelectedTripDayNumber(current?.dayNumber ?? stops[0]?.dayNumber ?? 1);
    setSelectedTripStopId(current?.id ?? stops[0]?.id ?? null);
    const fromApi = (trip.dayRoutes ?? [])
      .filter((route) => route.path.length >= 2)
      .map((route) => ({
        dayNumber: route.dayNumber,
        coords: route.path,
      }));
    setTripApiDayRoutes(fromApi);
  }, []);

  const handleTripCompleteClose = useCallback(() => {
    setTripCompleteModalOpen(false);
    setTripCompleteSummary(null);
    const badges = pendingCompleteBadgesRef.current;
    pendingCompleteBadgesRef.current = [];
    if (badges.length > 0) {
      openBadgeUnlock(badges);
    }
    applyTripFromWeb(null);
  }, [openBadgeUnlock, applyTripFromWeb]);

  useEffect(() => {
    if (mode !== 'activeTrip') {
      setTripLoading(false);
      return;
    }
    if (!isAuthenticated) {
      applyTripFromWeb(null);
      setTripLoading(false);
      return;
    }
    setTripLoading(true);
    markTripLoading();
    broadcastToWeb({ type: 'REQUEST_CURRENT_TRIP' });
    return subscribeMapTrip((next) => {
      setTripLoading(next.loading);
      if (next.visitError) {
        Alert.alert('여행 진행 실패', next.visitError);
        // 긴 raw JSON도 Metro/Logcat에서 볼 수 있게 남긴다
        // console.warn('[map] visit/skip error detail\n', next.visitError);
        clearTripVisitError();
      }
      if (next.completeResult) {
        const result = next.completeResult;
        pendingExpectingCompleteRef.current = false;
        openTripComplete(
          {
            title: result.title ?? tripMetaRef.current?.title ?? '여행',
            durationDays: result.durationDays,
            placeCount: result.placeCount,
            totalDistanceKm: result.totalDistanceKm,
            startDate: result.startDate,
            endDate: result.endDate,
          },
          result.earnedBadges?.length
            ? result.earnedBadges
            : pendingCompleteBadgesRef.current,
        );
        clearTripCompleteResult();
        return;
      }
      if (next.error) {
        // console.warn('[map] current trip / complete failed', next.error);
        if (pendingExpectingCompleteRef.current) {
          pendingExpectingCompleteRef.current = false;
          const message = next.error;
          clearTripStoreError();
          Alert.alert('여행 완료 실패', message);
          openTripComplete(
            {
              title: tripMetaRef.current?.title ?? '여행',
              placeCount: tripStopsRef.current.length,
            },
            pendingCompleteBadgesRef.current,
          );
          return;
        }
        applyTripFromWeb(null);
        return;
      }
      if (next.trip) {
        applyTripFromWeb(next.trip);
        const pending = pendingVisitStopRef.current;
        if (pending && !next.visitError) {
          const updated = (next.trip.waypoints ?? []).find(
            (wp) => String(wp.waypointId) === pending.id,
          );
          if (updated?.visited) {
            const stopsAfterVisit = mapTripWaypointsToStops(next.trip.waypoints ?? []);
            const progressAfterVisit = deriveTripProgress(stopsAfterVisit);
            setVerifiedStop(pending);
            setVerifiedAtLabel(formatVerifiedAt(updated.visitedAt));
            setVisitModalOpen(true);
            pendingVisitBadgesRef.current = next.visitEarnedBadges ?? [];
            pendingVisitAutoCompletedRef.current = next.visitAutoCompleted;
            pendingVisitTripDoneRef.current =
              next.visitAutoCompleted || progressAfterVisit.allVisited;
            pendingVisitStopRef.current = null;
          }
        }
      } else if (!next.loading) {
        applyTripFromWeb(null);
      }
    });
  }, [mode, isAuthenticated, applyTripFromWeb, openTripComplete, mapRefreshKey]);

  /** 여행 시작 후 계획 모드 목록도 최신화 */
  useEffect(() => {
    if (mapRefreshKey === 0 || mode !== 'plan') return;
    markPlanListLoading();
    broadcastToWeb({ type: 'REQUEST_PLAN_SUMMARIES' });
  }, [mapRefreshKey, mode]);

  const handleSelectTripStop = useCallback(
    (stop: ActiveTripStop, _index: number) => {
      setSelectedTripStopId(stop.id);
      setSelectedTripDayNumber(stop.dayNumber);
      animateTo(stop.place.latitude, stop.place.longitude, 13);
    },
    [animateTo],
  );

  const handleSelectTripDay = useCallback(
    (dayNumber: number, dayStops: ActiveTripStop[]) => {
      setSelectedTripDayNumber(dayNumber);
      if (dayStops.length === 0) return;
      fitPlanWaypoints(
        dayStops.map((stop) => ({
          id: stop.id,
          name: stop.place.name,
          latitude: stop.place.latitude,
          longitude: stop.place.longitude,
          category: stop.place.category,
          order: stop.order,
          dayNumber: stop.dayNumber,
        })),
      );
    },
    [fitPlanWaypoints],
  );

  const handleVerifyVisit = useCallback(async () => {
    const stop = tripStops[tripCurrentIndex];
    const tripId = tripMeta?.tripId;
    if (!stop || tripId == null) {
      return;
    }

    let latitude: number;
    let longitude: number;

    if (isTripVisitSpoofEnabled()) {
      latitude = stop.place.latitude;
      longitude = stop.place.longitude;
      // console.info(
      //   `[trip-visit-spoof] waypoint=${stop.id} → ${latitude}, ${longitude}`,
      // );
    } else {
      const deviceCoords = await getDeviceCoordinates();
      if (!deviceCoords) {
        return;
      }
      latitude = deviceCoords.latitude;
      longitude = deviceCoords.longitude;
      setTripUserLocation(deviceCoords);
      setUserLocationVisible(true);
    }

    pendingVisitStopRef.current = stop;
    broadcastToWeb({
      type: 'REQUEST_TRIP_VISIT',
      tripId,
      waypointId: Number(stop.id),
      latitude,
      longitude,
    });
  }, [tripStops, tripCurrentIndex, tripMeta?.tripId]);

  const handleSkipWaypoint = useCallback(() => {
    const stop = tripStops[tripCurrentIndex];
    const tripId = tripMeta?.tripId;
    if (!stop || tripId == null) {
      return;
    }
    // 건너뛰기는 방문 완료 모달을 띄우지 않음
    pendingVisitStopRef.current = null;
    broadcastToWeb({
      type: 'REQUEST_TRIP_SKIP',
      tripId,
      waypointId: Number(stop.id),
    });
  }, [tripStops, tripCurrentIndex, tripMeta?.tripId]);

  const handleVisitNextDestination = useCallback(() => {
    setVisitModalOpen(false);

    const badges = pendingVisitBadgesRef.current;
    pendingVisitBadgesRef.current = [];
    const autoCompleted = pendingVisitAutoCompletedRef.current;
    pendingVisitAutoCompletedRef.current = false;
    const tripDone = pendingVisitTripDoneRef.current;
    pendingVisitTripDoneRef.current = false;

    // 마지막 경유지(자동완료 또는 전 지점 방문) — 뱃지보다 여행 완료를 우선
    if (autoCompleted || tripDone) {
      if (autoCompleted) {
        openTripComplete(
          {
            title: tripMeta?.title ?? '여행',
            placeCount: tripStops.length,
          },
          badges,
        );
        return;
      }

      if (tripMeta?.tripId != null) {
        pendingExpectingCompleteRef.current = true;
        pendingCompleteBadgesRef.current = badges;
        broadcastToWeb({
          type: 'REQUEST_TRIP_COMPLETE',
          tripId: tripMeta.tripId,
        });
        return;
      }

      openTripComplete(
        {
          title: tripMeta?.title ?? '여행',
          placeCount: tripStops.length,
        },
        badges,
      );
      return;
    }

    if (badges.length > 0) {
      openBadgeUnlock(badges);
    }
  }, [
    tripStops,
    tripMeta?.tripId,
    tripMeta?.title,
    openBadgeUnlock,
    openTripComplete,
  ]);

  const handleMyLocation = useCallback(async () => {
    const granted = await ensureMapLocationPermission();
    if (!granted) {
      return;
    }

    setUserLocationVisible(true);
    mapRef.current?.setLocationTrackingMode('Follow');
  }, []);

  const handleToggleMenu = useCallback(() => {
    setModeSheetOpen((open) => {
      if (!open) {
        setSelectedPlace(null);
      }
      return !open;
    });
  }, []);

  const handleMapPress = useCallback(() => {
    setModeSheetOpen(false);
    setSelectedPlace(null);
  }, []);

  const handleAddToCourse = useCallback((place: Place) => {
    setSelectedPlace(null);
    setPendingWebPath('plan', '/plan');
    router.navigate('/(tabs)/plan');
    Alert.alert(
      '계획 탭으로 이동',
      `${place.name}을(를) 일정에 넣으려면 계획 화면에서 추가해 주세요.`,
    );
  }, []);

  const handleSetDestination = useCallback(async (place: Place) => {
    const { latitude, longitude, name } = place;
    const label = encodeURIComponent(name);
    const webUrl = `https://map.naver.com/v5/search/${label}`;
    const appUrl =
      Platform.OS === 'ios'
        ? `maps://?daddr=${latitude},${longitude}&dirflg=d`
        : `geo:${latitude},${longitude}?q=${latitude},${longitude}(${label})`;

    setSelectedPlace(null);
    try {
      const canOpenApp = await Linking.canOpenURL(appUrl);
      await Linking.openURL(canOpenApp ? appUrl : webUrl);
    } catch {
      Alert.alert('목적지로 설정', '지도 앱을 열 수 없어요. 잠시 후 다시 시도해 주세요.');
    }
  }, []);

  const handleSharePlace = useCallback(async (place: Place) => {
    try {
      await Share.share({
        message: `${place.name}${place.address ? ` · ${place.address}` : ''}`,
      });
    } catch {
      // 사용자 취소 등
    }
  }, []);

  const handleToggleFavorite = useCallback(() => {
    if (!selectedPlace) {
      return;
    }
    const nextFavorite = !selectedPlace.isFavorite;
    setSelectedPlace({
      ...selectedPlace,
      isFavorite: nextFavorite,
    });
    setMapPlaces((prev) =>
      prev.map((place) =>
        place.id === selectedPlace.id
          ? { ...place, isFavorite: nextFavorite }
          : place,
      ),
    );
  }, [selectedPlace]);

  const handleCameraIdle = useCallback(
    (params: {
      region: {
        latitude: number;
        longitude: number;
        latitudeDelta: number;
        longitudeDelta: number;
      };
    }) => {
      setViewBounds(boundsFromRegion(params.region));
    },
    [],
  );

  const handleSearchHere = useCallback(() => {
    setSearchBounds(liveSearchArea);
  }, [liveSearchArea]);

  const searchHereTop =
    topChromeHeight + (mode === 'general' ? CATEGORY_ROW : 8) + 8;

  const planDayPolylines = useMemo(() => {
    const routes =
      planDayRoutes.length > 0
        ? planDayRoutes
        : dayPathsFromWaypoints(planWaypoints);
    const oriented = orientDayPaths(routes, planWaypoints);
    if (selectedPlanDayNumber == null) return oriented;
    return oriented.filter((route) => route.dayNumber === selectedPlanDayNumber);
  }, [planDayRoutes, planWaypoints, selectedPlanDayNumber]);

  const visiblePlanWaypoints = useMemo(() => {
    if (selectedPlanDayNumber == null) return planWaypoints;
    return planWaypoints.filter(
      (wp) => (wp.dayNumber ?? 1) === selectedPlanDayNumber,
    );
  }, [planWaypoints, selectedPlanDayNumber]);

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.mapArea,
          isPlanMode
            ? { flex: planMapRatio }
            : styles.mapAreaFull,
        ]}
      >
        <NaverMapView
          ref={mapRef}
          style={styles.map}
          initialCamera={{ ...JEJU_CENTER, zoom: 10 }}
          isShowLocationButton={false}
          isShowZoomControls={false}
          locationOverlay={{
            isVisible: userLocationVisible,
            circleRadius: 60,
            circleColor: ACTIVE_LOCATION_PULSE,
            circleOutlineWidth: 0,
          }}
          onTapMap={handleMapPress}
          onCameraIdle={handleCameraIdle}
        >
          {mode === 'general'
            ? filteredPlaces.map((place) => {
                const selected = selectedPlace?.id === place.id;
                const pinSize = selected
                  ? CATEGORY_PIN_SELECTED_SIZE
                  : CATEGORY_PIN_SIZE;
                return (
                  <NaverMapMarkerOverlay
                    key={place.id}
                    latitude={place.latitude}
                    longitude={place.longitude}
                    width={pinSize}
                    height={pinSize}
                    anchor={{ x: 0.5, y: 0.5 }}
                    zIndex={selected ? 10 : 1}
                    caption={{
                      text: place.name,
                      textSize: selected ? 12 : 11,
                      color: MapTokens.text,
                      haloColor: '#FFFFFF',
                    }}
                    onTap={() => handleSelectPlace(place)}
                  >
                    <CategoryMapPin
                      key={`${place.id}/${place.category}/${place.isFavorite ? 1 : 0}/${selected ? 1 : 0}`}
                      category={place.category}
                      isFavorite={place.isFavorite}
                      size={CATEGORY_PIN_SIZE}
                      selected={selected}
                    />
                  </NaverMapMarkerOverlay>
                );
              })
            : null}

          {isPlanDetail ? (
            <>
              {planDayPolylines.map((route) =>
                route.coords.length >= 2 ? (
                  <NaverMapPathOverlay
                    key={`plan-route-day-${route.dayNumber}`}
                    coords={route.coords}
                    width={8}
                    color={planDayColor(route.dayNumber)}
                    outlineWidth={1}
                    outlineColor="#FFFFFF"
                    patternImage={PATH_ARROW_PATTERN}
                    patternInterval={36}
                    zIndex={route.dayNumber}
                  />
                ) : null,
              )}
              {visiblePlanWaypoints.map((wp) => {
                const selected = selectedPlanId === wp.id;
                const pinSize = selected
                  ? PLAN_DAY_PIN_SELECTED_SIZE
                  : PLAN_DAY_PIN_SIZE;
                const dayNumber = wp.dayNumber ?? 1;
                return (
                  <NaverMapMarkerOverlay
                    key={`plan-${dayNumber}-${wp.order}-${wp.id}`}
                    latitude={wp.latitude}
                    longitude={wp.longitude}
                    width={pinSize}
                    height={pinSize}
                    anchor={{ x: 0.5, y: 0.5 }}
                    zIndex={selected ? 10 : dayNumber}
                    caption={{
                      text: wp.name,
                      textSize: selected ? 12 : 11,
                      color: MapTokens.text,
                      haloColor: '#FFFFFF',
                    }}
                    onTap={() => handleSelectPlanWaypoint(wp)}
                  >
                    <PlanDayMapPin
                      key={`pin-${dayNumber}-${wp.order}-${selected ? 1 : 0}`}
                      order={wp.order}
                      dayNumber={dayNumber}
                      size={PLAN_DAY_PIN_SIZE}
                      selected={selected}
                    />
                  </NaverMapMarkerOverlay>
                );
              })}
            </>
          ) : null}

          {showActiveTripLive ? (
            <>
              {visibleTripDayRoutes.map((route) =>
                route.coords.length >= 2 ? (
                  <NaverMapPathOverlay
                    key={`trip-route-day-${route.dayNumber}`}
                    coords={route.coords}
                    width={8}
                    color={planDayColor(route.dayNumber)}
                    outlineWidth={1}
                    outlineColor="#FFFFFF"
                    patternImage={PATH_ARROW_PATTERN}
                    patternInterval={36}
                    zIndex={route.dayNumber}
                  />
                ) : null,
              )}
              {tripLocation ? (
                <>
                  <NaverMapCircleOverlay
                    latitude={tripLocation.latitude}
                    longitude={tripLocation.longitude}
                    radius={120}
                    color={ACTIVE_LOCATION_PULSE}
                    outlineWidth={0}
                  />
                  <NaverMapCircleOverlay
                    latitude={tripLocation.latitude}
                    longitude={tripLocation.longitude}
                    radius={18}
                    color={ACTIVE_LOCATION_DOT}
                    outlineWidth={3}
                    outlineColor="#FFFFFF"
                  />
                </>
              ) : null}
              {visibleTripStops.map((stop) => {
                const selected =
                  selectedTripStopId === stop.id || stop.status === 'current';
                const pinSize = selected
                  ? PLAN_DAY_PIN_SELECTED_SIZE
                  : PLAN_DAY_PIN_SIZE;
                const dayNumber = stop.dayNumber ?? 1;
                const dayOrder = tripDayOrderById.get(stop.id) ?? stop.order;
                return (
                  <NaverMapMarkerOverlay
                    key={`trip-${dayNumber}-${dayOrder}-${stop.id}`}
                    latitude={stop.place.latitude}
                    longitude={stop.place.longitude}
                    width={pinSize}
                    height={pinSize}
                    anchor={{ x: 0.5, y: 0.5 }}
                    zIndex={selected ? 10 : dayNumber}
                    caption={{
                      text: stop.place.name,
                      textSize: selected ? 12 : 11,
                      color: MapTokens.text,
                      haloColor: '#FFFFFF',
                    }}
                    onTap={() =>
                      handleSelectTripStop(
                        stop,
                        tripStops.findIndex((item) => item.id === stop.id),
                      )
                    }
                  >
                    <PlanDayMapPin
                      key={`trip-pin-${dayNumber}-${dayOrder}-${selected ? 1 : 0}`}
                      order={dayOrder}
                      dayNumber={dayNumber}
                      size={PLAN_DAY_PIN_SIZE}
                      selected={selected}
                    />
                  </NaverMapMarkerOverlay>
                );
              })}
            </>
          ) : null}

          {showActiveTripEmpty ? (
            <NaverMapCircleOverlay
              latitude={JEJU_CENTER.latitude}
              longitude={JEJU_CENTER.longitude}
              radius={16}
              color={MapTokens.blue}
              outlineWidth={2}
              outlineColor="#FFFFFF"
            />
          ) : null}

          {mode === 'heatmap'
            ? heatZones.map((zone) => (
                <NaverMapCircleOverlay
                  key={zone.id}
                  latitude={zone.latitude}
                  longitude={zone.longitude}
                  radius={zone.radius}
                  color={
                    zone.level === 'high' ? 'rgba(232,93,76,0.35)' : 'rgba(245,197,66,0.35)'
                  }
                  outlineWidth={0}
                />
              ))
            : null}

          {mode === 'heatmap'
            ? mapPlaces.map((place) => (
                <NaverMapMarkerOverlay
                  key={`heat-${place.id}`}
                  latitude={place.latitude}
                  longitude={place.longitude}
                  width={24}
                  height={24}
                  anchor={{ x: 0.5, y: 0.5 }}
                  caption={{
                    text: place.name,
                    textSize: 10,
                    color: MapTokens.text,
                    haloColor: '#FFFFFF',
                  }}
                  onTap={() => handleSelectPlace(place)}
                >
                  <CategoryMapPin
                    key={`heat-${place.id}/${place.category}`}
                    category={place.category}
                    size={24}
                  />
                </NaverMapMarkerOverlay>
              ))
            : null}
        </NaverMapView>

        {selectedPlace ? (
          <PlaceDetailChrome
            isFavorite={selectedPlace.isFavorite}
            onBack={() => setSelectedPlace(null)}
            onToggleFavorite={handleToggleFavorite}
            onShare={() => handleSharePlace(selectedPlace)}
          />
        ) : (
          <MapTopBar
            searchLabel={searchLabel}
            onPressSearch={() => setSearchOpen(true)}
            onPressMenu={handleToggleMenu}
          />
        )}

        {mode === 'general' && !selectedPlace ? (
          <CategoryChips
            selected={category}
            onSelect={setCategory}
            topOffset={categoryTop}
          />
        ) : null}

        {showSearchHere ? (
          <SearchHereButton onPress={handleSearchHere} topOffset={searchHereTop} />
        ) : null}

        {showActiveTripLive ? (
          <ActiveTripStatusBanner
            topOffset={statusTop}
            onPressOtherMap={() => setModeSheetOpen(true)}
            onDismiss={() => setMode('general')}
          />
        ) : null}

        {showActiveTripLive ? (
          <MapLayersButton
            bottomOffset={fabBottomOffset + 52}
            onPress={() =>
              Alert.alert('지도 레이어', '레이어 설정은 곧 연결될 예정이에요.')
            }
          />
        ) : null}

        <MyLocationButton onPress={handleMyLocation} bottomOffset={fabBottomOffset} />

        {mode === 'heatmap' ? <HeatmapLegend bottomOffset={24} /> : null}
      </View>

      {isPlanMode ? (
        <View style={[styles.planPanelSlot, { flex: planPanelRatio }]}>
          {planView === 'list' ? (
            <PlanListPanel
              plans={planSummaries}
              loading={planListLoading}
              onSelectPlan={(plan) => {
                void handleSelectTravelPlan(plan);
              }}
            />
          ) : (
            <PlanSummaryPanel
              planTitle={selectedTravelPlan?.title ?? '여행 계획'}
              durationLabel={planDurationLabel}
              waypoints={planWaypoints}
              legs={planLegs}
              selectedId={selectedPlanId}
              selectedDayNumber={selectedPlanDayNumber}
              loading={planDetailLoading}
              onPressBack={handleBackToPlanList}
              onPressWaypoint={handleSelectPlanWaypoint}
              onPressDay={handlePressPlanDay}
              onPressDetailSchedule={handleOpenDetailSchedule}
            />
          )}
        </View>
      ) : null}

      <ActiveTripEmptySheet
        visible={showActiveTripEmpty}
        underOverlay={modeSheetOpen}
        onGoGeneralMap={() => setMode('general')}
      />

      <ActiveTripSheet
        visible={showActiveTripLive}
        tripTitle={tripMeta?.title ?? '진행중 여행'}
        visitedCount={tripVisitedCount}
        totalStops={tripStops.length}
        stops={tripStops}
        currentIndex={tripCurrentIndex}
        underOverlay={modeSheetOpen}
        onSelectStop={handleSelectTripStop}
        onSelectDay={handleSelectTripDay}
        onSkipWaypoint={handleSkipWaypoint}
        onVerifyVisit={() => {
          void handleVerifyVisit();
        }}
      />

      {verifiedStop ? (
        <VisitCompleteModal
          visible={visitModalOpen}
          place={verifiedStop.place}
          verifiedAtLabel={verifiedAtLabel}
          orderLabel={`${verifiedStop.order}번째 목적지`}
          visitedCount={tripVisitedCount}
          totalStops={tripStops.length}
          onClose={handleVisitNextDestination}
        />
      ) : null}

      {tripCompleteSummary ? (
        <TripCompleteModal
          visible={tripCompleteModalOpen}
          summary={tripCompleteSummary}
          onClose={handleTripCompleteClose}
        />
      ) : null}

      {unlockedBadge ? (
        <BadgeUnlockModal
          visible={badgeModalOpen}
          badge={unlockedBadge}
          recentLabels={[]}
          extraCount={0}
          onClose={() => setBadgeModalOpen(false)}
        />
      ) : null}

      <PlaceDetailSheet
        place={selectedPlace}
        onClose={() => setSelectedPlace(null)}
        onAddToCourse={handleAddToCourse}
        onSetDestination={handleSetDestination}
      />

      <SearchModal
        visible={searchOpen}
        places={mapPlaces}
        onClose={() => setSearchOpen(false)}
        onSelectPlace={handleSelectPlace}
      />

      {/* 모드 시트는 항상 최상단 (다른 시트/오버레이 위) */}
      <ModeBottomSheet
        visible={modeSheetOpen}
        currentMode={mode}
        onSelectMode={setMode}
        onClose={() => setModeSheetOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: MapTokens.background },
  mapArea: {
    position: 'relative',
    overflow: 'hidden',
  },
  mapAreaFull: {
    flex: 1,
  },
  map: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  planPanelSlot: {
    minHeight: 0,
  },
});

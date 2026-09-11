import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Linking, Platform, Share, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  NaverMapCircleOverlay,
  NaverMapMarkerOverlay,
  NaverMapPathOverlay,
  NaverMapPolylineOverlay,
  NaverMapView,
  type NaverMapViewRef,
} from '@mj-studio/react-native-naver-map';
import { router } from 'expo-router';

import { fetchMapHeatmap, fetchMapPlaces, type MapBounds } from '../api/map';
import { type TravelPlanSummary } from '../api/plans';
import type { CurrentTripDto } from '../api/trips';
import {
  clearTripCompleteResult,
  clearTripVisitError,
  markPlanDetailLoading,
  markTripLoading,
  subscribeMapPlanDetail,
  subscribeMapTrip,
} from '../bridge/mapDataStore';
import {
  markPlanListLoading,
  subscribePlanList,
} from '../bridge/planListStore';
import { broadcastToWeb } from '../bridge/webviewRegistry';
import ActiveTripEmptySheet from '../components/map/ActiveTripEmptySheet';
import ActiveTripSheet from '../components/map/ActiveTripSheet';
import ActiveTripStatusBanner from '../components/map/ActiveTripStatusBanner';
import BadgeUnlockModal from '../components/map/BadgeUnlockModal';
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
import type { HeatZone, Place, PlanTravelLeg, PlanWaypoint } from '../types/map';
import {
  dayPathsFromWaypoints,
  formatPlanDurationLabel,
  orientDayPaths,
} from '../utils/planMapMappers';
import { categoryFromApiName } from '../utils/mapMappers';
import {
  canVerifyAtLocation,
  deriveTripProgress,
  formatTripDayLabel,
  formatVerifiedAt,
  mapTripWaypointsToStops,
  type TripMapCoord,
} from '../utils/tripMapMappers';
import { getDeviceCoordinates } from '../utils/deviceLocation';
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
const ACTIVE_REMAINING_PATH_COLOR = '#5EC4C8';
const ACTIVE_UPCOMING_PATH_COLOR = '#B0B8C8';
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

function activeTripStopSymbol(
  status: ActiveTripStop['status'],
): 'green' | 'gray' | 'lightblue' {
  switch (status) {
    case 'visited':
      return 'gray';
    case 'current':
      return 'green';
    default:
      return 'lightblue';
  }
}

type MapCoord = { latitude: number; longitude: number };

/** 경유지 순서대로 경로 선분 생성 (지나온/남은/예정) */
function buildActiveTripPaths(
  stops: ActiveTripStop[],
  currentIndex: number,
  currentLocation: MapCoord,
): {
  traveled: MapCoord[];
  remaining: MapCoord[];
  upcoming: MapCoord[];
} {
  const stopCoords = stops.map((s) => ({
    latitude: s.place.latitude,
    longitude: s.place.longitude,
  }));

  const traveled = [
    ...stopCoords.slice(0, currentIndex),
    currentLocation,
  ];

  const remaining = [currentLocation, stopCoords[currentIndex]!];

  const upcoming =
    currentIndex < stopCoords.length - 1
      ? stopCoords.slice(currentIndex)
      : [];

  return { traveled, remaining, upcoming };
}

export default function MapScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<NaverMapViewRef>(null);
  const skipPlanEnterResetRef = useRef(false);
  const { isAuthenticated } = useAuth();

  const [mode, setMode] = useState<MapMode>('general');
  const [category, setCategory] = useState<PlaceCategory>('all');
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [modeSheetOpen, setModeSheetOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
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
  const [canVerifyVisit, setCanVerifyVisit] = useState(false);
  const [tripDayLabel, setTripDayLabel] = useState('');
  const [userLocationVisible, setUserLocationVisible] = useState(false);
  const pendingVisitStopRef = useRef<ActiveTripStop | null>(null);
  const [visitModalOpen, setVisitModalOpen] = useState(false);
  const [badgeModalOpen, setBadgeModalOpen] = useState(false);
  const [verifiedStop, setVerifiedStop] = useState<ActiveTripStop | null>(null);
  const [verifiedAtLabel, setVerifiedAtLabel] = useState('');
  const [unlockedBadge, setUnlockedBadge] = useState<ActiveTripBadge | null>(null);

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
        console.warn('[map] places fetch failed', error);
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
        console.warn('[map] heatmap fetch failed', error);
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

  const activeTripPaths = useMemo(() => {
    if (!tripLocation) {
      return { traveled: [], remaining: [], upcoming: [] };
    }
    return buildActiveTripPaths(tripStops, tripCurrentIndex, tripLocation);
  }, [tripStops, tripCurrentIndex, tripLocation]);

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
        console.warn('[map] plan list from web failed', next.error);
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
          console.warn('[map] plan detail from web failed', next.error);
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

  const applyTripFromWeb = useCallback((trip: CurrentTripDto | null) => {
    if (!trip) {
      setTripMeta(null);
      setTripStops([]);
      setTripCurrentIndex(0);
      setTripVisitedCount(0);
      setTripDayLabel('');
      setCanVerifyVisit(false);
      return;
    }
    const stops = mapTripWaypointsToStops(trip.waypoints ?? []);
    const progress = deriveTripProgress(stops);
    setTripMeta(trip);
    setTripStops(stops);
    setTripCurrentIndex(progress.currentIndex);
    setTripVisitedCount(progress.visitedCount);
    setTripDayLabel(formatTripDayLabel(trip, progress.currentStop));
    setCanVerifyVisit(canVerifyAtLocation(tripUserLocation, progress.currentStop));
  }, [tripUserLocation]);

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
        Alert.alert('방문 인증 실패', next.visitError);
        clearTripVisitError();
      }
      if (next.completeResult) {
        const badges = next.completeResult.earnedBadges ?? [];
        if (badges.length > 0) {
          const first = badges[0]!;
          setUnlockedBadge({
            id: String(first.badgeId),
            title: first.name,
            description: first.description ?? '',
            collected: badges.length,
            total: badges.length,
          });
          setBadgeModalOpen(true);
        }
        clearTripCompleteResult();
        applyTripFromWeb(null);
        return;
      }
      if (next.error) {
        console.warn('[map] current trip failed', next.error);
        applyTripFromWeb(null);
        return;
      }
      if (next.trip) {
        applyTripFromWeb({
          tripId: next.trip.tripId,
          title: next.trip.title,
          status: next.trip.status,
          actualStartedAt: next.trip.actualStartedAt,
          waypoints: next.trip.waypoints,
        });
        const pending = pendingVisitStopRef.current;
        if (pending && !next.visitError) {
          const updated = (next.trip.waypoints ?? []).find(
            (wp) => String(wp.waypointId) === pending.id,
          );
          if (updated?.visited) {
            setVerifiedStop(pending);
            setVerifiedAtLabel(formatVerifiedAt(updated.visitedAt));
            setVisitModalOpen(true);
            pendingVisitStopRef.current = null;
          }
        }
      } else if (!next.loading) {
        applyTripFromWeb(null);
      }
    });
  }, [mode, isAuthenticated, applyTripFromWeb]);

  const handleSelectTripStop = useCallback(
    (stop: ActiveTripStop, _index: number) => {
      animateTo(stop.place.latitude, stop.place.longitude, 13);
    },
    [animateTo],
  );

  const handleVerifyVisit = useCallback(async () => {
    const stop = tripStops[tripCurrentIndex];
    const tripId = tripMeta?.tripId;
    if (!stop || tripId == null) {
      return;
    }
    const coords = await getDeviceCoordinates();
    if (!coords) {
      return;
    }
    setTripUserLocation(coords);
    setUserLocationVisible(true);
    pendingVisitStopRef.current = stop;
    broadcastToWeb({
      type: 'REQUEST_TRIP_VISIT',
      tripId,
      waypointId: Number(stop.id),
      latitude: coords.latitude,
      longitude: coords.longitude,
    });
  }, [tripStops, tripCurrentIndex, tripMeta?.tripId]);

  const handleVisitNextDestination = useCallback(() => {
    setVisitModalOpen(false);
    const progress = deriveTripProgress(tripStops);
    if (!progress.allVisited || tripMeta?.tripId == null) {
      return;
    }
    broadcastToWeb({
      type: 'REQUEST_TRIP_COMPLETE',
      tripId: tripMeta.tripId,
    });
  }, [tripStops, tripMeta?.tripId]);

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
              {/* TODO: Directions API 연동 시 실제 도로 PathOverlay로 교체 */}
              {activeTripPaths.traveled.length >= 2 ? (
                <NaverMapPolylineOverlay
                  coords={activeTripPaths.traveled}
                  width={5}
                  color={MapTokens.blue}
                  capType="Round"
                  joinType="Round"
                />
              ) : null}
              {activeTripPaths.remaining.length >= 2 ? (
                <NaverMapPolylineOverlay
                  coords={activeTripPaths.remaining}
                  width={5}
                  color={ACTIVE_REMAINING_PATH_COLOR}
                  capType="Round"
                  joinType="Round"
                />
              ) : null}
              {activeTripPaths.upcoming.length >= 2 ? (
                <NaverMapPolylineOverlay
                  coords={activeTripPaths.upcoming}
                  width={4}
                  color={ACTIVE_UPCOMING_PATH_COLOR}
                  capType="Round"
                  joinType="Round"
                />
              ) : null}
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
              {tripStops.map((stop, index) => {
                const isCurrent = stop.status === 'current';
                return (
                  <NaverMapMarkerOverlay
                    key={`trip-stop-${stop.id}`}
                    latitude={stop.place.latitude}
                    longitude={stop.place.longitude}
                    image={{ symbol: activeTripStopSymbol(stop.status) }}
                    width={isCurrent ? 32 : 28}
                    height={isCurrent ? 40 : 36}
                    caption={{
                      text: isCurrent
                        ? stop.place.name
                        : `${stop.order}. ${stop.place.name}`,
                      textSize: isCurrent ? 12 : 11,
                      color: MapTokens.text,
                      haloColor: '#FFFFFF',
                    }}
                    onTap={() => handleSelectTripStop(stop, index)}
                  />
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
        dayLabel={tripDayLabel || '진행중'}
        visitedCount={tripVisitedCount}
        totalStops={tripStops.length}
        stops={tripStops}
        currentIndex={tripCurrentIndex}
        canVerifyVisit={canVerifyVisit}
        underOverlay={modeSheetOpen}
        onSelectStop={handleSelectTripStop}
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
          onAddPhoto={() =>
            Alert.alert('사진 추가', '사진 추가는 곧 연결될 예정이에요.')
          }
          onNextDestination={handleVisitNextDestination}
        />
      ) : null}

      {unlockedBadge ? (
        <BadgeUnlockModal
          visible={badgeModalOpen}
          badge={unlockedBadge}
          recentLabels={[]}
          extraCount={0}
          onShare={() => {
            void Share.share({ message: `배지 획득: ${unlockedBadge.title}` });
          }}
          onConfirm={() => setBadgeModalOpen(false)}
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

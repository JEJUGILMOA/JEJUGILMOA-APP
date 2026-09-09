import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Linking, Platform, Share, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  NaverMapCircleOverlay,
  NaverMapMarkerOverlay,
  NaverMapPolylineOverlay,
  NaverMapView,
  type NaverMapViewRef,
} from '@mj-studio/react-native-naver-map';
import { router } from 'expo-router';

import { fetchMapHeatmap, fetchMapPlaces, type MapBounds } from '../api/map';
import { fetchPlaceById } from '../api/places';
import {
  fetchPlanById,
  fetchPlanSummaries,
  type TravelPlanSummary,
} from '../api/plans';
import ActiveTripEmptySheet from '../components/map/ActiveTripEmptySheet';
import ActiveTripSheet from '../components/map/ActiveTripSheet';
import ActiveTripStatusBanner from '../components/map/ActiveTripStatusBanner';
import BadgeUnlockModal from '../components/map/BadgeUnlockModal';
import CategoryChips from '../components/map/CategoryChips';
import CategoryMapPin, {
  CATEGORY_PIN_SELECTED_SIZE,
  CATEGORY_PIN_SIZE,
} from '../components/map/CategoryMapPin';
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
  type MapMode,
  type PlaceCategory,
} from '../constants/map';
import { useAuth } from '../context/AuthContext';
import { useTabRepress } from '../hooks/useTabRepress';
import {
  ACTIVE_TRIP,
  type ActiveTripStop,
  DUMMY_PLAN_LEGS,
  DUMMY_PLAN_LEGS_SHORT,
  DUMMY_PLAN_META,
  DUMMY_PLAN_SUMMARIES,
  DUMMY_PLAN_WAYPOINTS,
  DUMMY_PLAN_WAYPOINTS_SHORT,
} from '../data/mapDummy';
import { setPendingWebPath } from '../pendingWebPath';
import type { HeatZone, Place, PlanTravelLeg, PlanWaypoint } from '../types/map';
import {
  formatPlanDurationLabel,
  mapPlanDetailToWaypoints,
  placeDetailToLookup,
  type PlaceCoordLookup,
} from '../utils/planMapMappers';
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

function buildInitialStops(): ActiveTripStop[] {
  return ACTIVE_TRIP.stops.map((stop) => ({ ...stop, place: { ...stop.place } }));
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
  const [planDurationLabel, setPlanDurationLabel] = useState<string>(
    DUMMY_PLAN_META.totalDurationLabel,
  );
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const [tripStops, setTripStops] = useState<ActiveTripStop[]>(buildInitialStops);
  const [tripCurrentIndex, setTripCurrentIndex] = useState<number>(ACTIVE_TRIP.currentStopIndex);
  const [tripVisitedCount, setTripVisitedCount] = useState<number>(ACTIVE_TRIP.visitedCount);
  const [visitModalOpen, setVisitModalOpen] = useState(false);
  const [badgeModalOpen, setBadgeModalOpen] = useState(false);
  const [verifiedStop, setVerifiedStop] = useState<ActiveTripStop | null>(null);

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
  const showActiveTripEmpty = isActiveTrip && !isAuthenticated;
  const showActiveTripLive = isActiveTrip && isAuthenticated;

  const planPanelRatio = isPlanMode
    ? planView === 'detail'
      ? PLAN_PANEL_HEIGHT_RATIO
      : PLAN_LIST_PANEL_HEIGHT_RATIO
    : PLAN_PANEL_HEIGHT_RATIO;
  const planMapRatio = 1 - planPanelRatio;

  const activeTripPaths = useMemo(
    () =>
      buildActiveTripPaths(
        tripStops,
        tripCurrentIndex,
        ACTIVE_TRIP.currentLocation,
      ),
    [tripStops, tripCurrentIndex],
  );

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
      setSelectedPlanId(null);
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
    setSelectedPlanId(null);
    setSelectedPlace(null);

    const controller = new AbortController();
    setPlanListLoading(true);

    void (async () => {
      try {
        const list = await fetchPlanSummaries({ signal: controller.signal });
        if (controller.signal.aborted) return;
        setPlanSummaries(list);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.warn('[map] plan list fetch failed', error);
        setPlanSummaries(DUMMY_PLAN_SUMMARIES);
      } finally {
        if (!controller.signal.aborted) {
          setPlanListLoading(false);
        }
      }
    })();

    return () => controller.abort();
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

  const handleBackToPlanList = useCallback(() => {
    setPlanView('list');
    setSelectedTravelPlan(null);
    setPlanWaypoints([]);
    setPlanLegs([]);
    setSelectedPlanId(null);
    setPlanDetailLoading(false);
  }, []);

  const handleSelectTravelPlan = useCallback(
    async (plan: TravelPlanSummary) => {
      setSelectedTravelPlan(plan);
      setPlanView('detail');
      setSelectedPlanId(null);
      setPlanDurationLabel(formatPlanDurationLabel(plan.nights, plan.days));
      setPlanDetailLoading(true);

      // 더미(음수 id) — API 없이 즉시 표시
      if (plan.planId < 0) {
        if (plan.planId === -2) {
          setPlanWaypoints(DUMMY_PLAN_WAYPOINTS_SHORT);
          setPlanLegs(DUMMY_PLAN_LEGS_SHORT);
        } else {
          setPlanWaypoints(DUMMY_PLAN_WAYPOINTS);
          setPlanLegs(DUMMY_PLAN_LEGS);
        }
        setPlanDetailLoading(false);
        return;
      }

      try {
        const detail = await fetchPlanById(plan.planId);
        const placeIds = [
          ...new Set(
            (detail.itinerary ?? []).flatMap((day) =>
              (day.waypoints ?? []).map((wp) => wp.placeId),
            ),
          ),
        ];

        const lookup = new Map<string, PlaceCoordLookup>();
        await Promise.all(
          placeIds.map(async (placeId) => {
            try {
              const dto = await fetchPlaceById(placeId);
              const coords = placeDetailToLookup(dto);
              if (coords) lookup.set(String(placeId), coords);
            } catch (error) {
              console.warn('[map] place coord fetch failed', placeId, error);
            }
          }),
        );

        const waypoints = mapPlanDetailToWaypoints(detail, lookup);
        setPlanWaypoints(waypoints);
        setPlanLegs([]);
        setPlanDurationLabel(
          formatPlanDurationLabel(detail.nights, detail.days),
        );
        if (waypoints.length === 0) {
          Alert.alert(
            '표시할 장소가 없어요',
            '이 계획에 좌표가 있는 경유지가 없습니다.',
          );
        }
      } catch (error) {
        console.warn('[map] plan detail fetch failed', error);
        Alert.alert(
          '계획을 불러오지 못했어요',
          '잠시 후 다시 시도해 주세요.',
        );
        handleBackToPlanList();
      } finally {
        setPlanDetailLoading(false);
      }
    },
    [handleBackToPlanList],
  );

  const handleOpenDetailSchedule = useCallback(() => {
    const planId = selectedTravelPlan?.planId;
    if (planId != null && planId > 0) {
      setPendingWebPath('plan', `/plan/${planId}/preview`);
    } else {
      setPendingWebPath('plan', '/plan');
    }
    router.navigate('/(tabs)/plan');
  }, [selectedTravelPlan?.planId]);

  const handleSelectTripStop = useCallback(
    (stop: ActiveTripStop, _index: number) => {
      animateTo(stop.place.latitude, stop.place.longitude, 13);
    },
    [animateTo],
  );

  const handleVerifyVisit = useCallback(() => {
    const stop = tripStops[tripCurrentIndex];
    if (!stop) {
      return;
    }
    setVerifiedStop(stop);
    setVisitModalOpen(true);
  }, [tripCurrentIndex, tripStops]);

  const handleVisitNextDestination = useCallback(() => {
    setVisitModalOpen(false);
    setTripStops((prev) =>
      prev.map((stop, index) => {
        if (index === tripCurrentIndex) {
          return { ...stop, status: 'visited' };
        }
        if (index === tripCurrentIndex + 1) {
          return { ...stop, status: 'current' };
        }
        return stop;
      }),
    );
    setTripVisitedCount((count) => Math.min(count + 1, ACTIVE_TRIP.totalStops));
    setTripCurrentIndex((index) => Math.min(index + 1, tripStops.length - 1));
    setBadgeModalOpen(true);
  }, [tripCurrentIndex, tripStops.length]);

  const [userLocationVisible, setUserLocationVisible] = useState(false);

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
    setPlanWaypoints((prev) => {
      if (prev.some((w) => w.id === place.id)) {
        Alert.alert('이미 코스에 있어요', `${place.name}은(는) 이미 계획에 포함되어 있습니다.`);
        return prev;
      }
      const nextOrder = prev.length + 1;
      return [...prev, { ...place, order: nextOrder }];
    });
    setPlanLegs([]);
    setSelectedTravelPlan({
      planId: -1,
      title: '편집 중 계획',
      startDate: '',
      endDate: '',
      status: 'DRAFT',
      waypointCount: 0,
      nights: 0,
      days: 1,
      dDay: 0,
    });
    setPlanDurationLabel('편집 중');
    setPlanView('detail');
    setSelectedPlace(null);
    skipPlanEnterResetRef.current = true;
    setMode('plan');
    Alert.alert('코스에 추가됨', `${place.name}을(를) 계획에 넣었습니다.`);
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

  const planCoords = useMemo(
    () =>
      planWaypoints.map((w) => ({
        latitude: w.latitude,
        longitude: w.longitude,
      })),
    [planWaypoints],
  );

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
              {/* TODO: 실제 도로 경로(Directions) 연동 시 PathOverlay로 교체 */}
              {planCoords.length >= 2 ? (
                <NaverMapPolylineOverlay
                  coords={planCoords}
                  width={4}
                  color={MapTokens.blue}
                  capType="Round"
                  joinType="Round"
                />
              ) : null}
              {planWaypoints.map((wp) => (
                <NaverMapMarkerOverlay
                  key={`plan-${wp.id}`}
                  latitude={wp.latitude}
                  longitude={wp.longitude}
                  image={{ symbol: 'green' }}
                  width={28}
                  height={36}
                  caption={{
                    text: `${wp.order}. ${wp.name}`,
                    textSize: 12,
                    color: MapTokens.text,
                    haloColor: '#FFFFFF',
                  }}
                  onTap={() => handleSelectPlanWaypoint(wp)}
                />
              ))}
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
              <NaverMapCircleOverlay
                latitude={ACTIVE_TRIP.currentLocation.latitude}
                longitude={ACTIVE_TRIP.currentLocation.longitude}
                radius={120}
                color={ACTIVE_LOCATION_PULSE}
                outlineWidth={0}
              />
              {/* 현위치: 핀 symbol은 정사각형 크기에서 찌그러지므로 원형 오버레이 사용 */}
              <NaverMapCircleOverlay
                latitude={ACTIVE_TRIP.currentLocation.latitude}
                longitude={ACTIVE_TRIP.currentLocation.longitude}
                radius={18}
                color={ACTIVE_LOCATION_DOT}
                outlineWidth={3}
                outlineColor="#FFFFFF"
              />
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
              planTitle={selectedTravelPlan?.title ?? DUMMY_PLAN_META.title}
              durationLabel={planDurationLabel}
              waypoints={planWaypoints}
              legs={planLegs}
              selectedId={selectedPlanId}
              loading={planDetailLoading}
              onPressBack={handleBackToPlanList}
              onPressWaypoint={handleSelectPlanWaypoint}
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
        tripTitle={ACTIVE_TRIP.title}
        dayLabel={ACTIVE_TRIP.dayLabel}
        visitedCount={tripVisitedCount}
        totalStops={ACTIVE_TRIP.totalStops}
        stops={tripStops}
        currentIndex={tripCurrentIndex}
        canVerifyVisit={ACTIVE_TRIP.canVerifyVisit}
        underOverlay={modeSheetOpen}
        onSelectStop={handleSelectTripStop}
        onVerifyVisit={handleVerifyVisit}
      />

      <VisitCompleteModal
        visible={visitModalOpen && verifiedStop != null}
        place={verifiedStop?.place ?? ACTIVE_TRIP.nextPlace}
        verifiedAtLabel="2024.07.21 10:24"
        orderLabel={`${verifiedStop?.order ?? tripCurrentIndex + 1}번째 목적지`}
        visitedCount={Math.min(tripVisitedCount + 1, ACTIVE_TRIP.totalStops)}
        totalStops={ACTIVE_TRIP.totalStops}
        onAddPhoto={() =>
          Alert.alert('사진 추가', '사진 추가는 곧 연결될 예정이에요.')
        }
        onNextDestination={handleVisitNextDestination}
      />

      <BadgeUnlockModal
        visible={badgeModalOpen}
        badge={ACTIVE_TRIP.unlockedBadge}
        recentLabels={ACTIVE_TRIP.recentBadges.map((b) => b.label)}
        extraCount={ACTIVE_TRIP.extraBadgeCount}
        onShare={() => {
          void Share.share({ message: `배지 획득: ${ACTIVE_TRIP.unlockedBadge.title}` });
        }}
        onConfirm={() => setBadgeModalOpen(false)}
      />

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

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

import ActiveTripEmptySheet from '../components/map/ActiveTripEmptySheet';
import ActiveTripSheet from '../components/map/ActiveTripSheet';
import ActiveTripStatusBanner from '../components/map/ActiveTripStatusBanner';
import BadgeUnlockModal from '../components/map/BadgeUnlockModal';
import CategoryChips from '../components/map/CategoryChips';
import HeatmapLegend from '../components/map/HeatmapLegend';
import MapLayersButton from '../components/map/MapLayersButton';
import MapTopBar from '../components/map/MapTopBar';
import ModeBottomSheet from '../components/map/ModeBottomSheet';
import MyLocationButton from '../components/map/MyLocationButton';
import PlaceDetailChrome from '../components/map/PlaceDetailChrome';
import PlaceDetailSheet from '../components/map/PlaceDetailSheet';
import PlanSummaryPanel, {
  PLAN_PANEL_HEIGHT_RATIO,
} from '../components/map/PlanSummaryPanel';
import SearchModal from '../components/map/SearchModal';
import VisitCompleteModal from '../components/map/VisitCompleteModal';
import {
  JEJU_CENTER,
  MapTokens,
  type MapMode,
  type PlaceCategory,
} from '../constants/map';
import { useAuth } from '../context/AuthContext';
import {
  ACTIVE_TRIP,
  type ActiveTripStop,
  DUMMY_HEAT_ZONES,
  DUMMY_PLACES,
  DUMMY_PLAN_LEGS,
  DUMMY_PLAN_META,
  DUMMY_PLAN_WAYPOINTS,
} from '../data/mapDummy';
import type { Place, PlanWaypoint } from '../types/map';
import { ensureMapLocationPermission } from '../utils/mapLocationPermission';

export type { Place } from '../types/map';

const TOP_BAR_BLOCK = 56;
const CATEGORY_ROW = 40;
/** 계획 모드: 지도 영역 비율 (패널과 합쳐 1) */
const PLAN_MAP_HEIGHT_RATIO = 1 - PLAN_PANEL_HEIGHT_RATIO;
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

function markerSymbolFor(place: Place): 'green' | 'blue' | 'yellow' | 'red' | 'gray' {
  if (place.isFavorite) {
    return 'yellow';
  }
  switch (place.category) {
    case 'food':
      return 'red';
    case 'cafe':
      return 'blue';
    case 'spot':
      return 'green';
    default:
      return 'gray';
  }
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
  const { isAuthenticated } = useAuth();

  const [mode, setMode] = useState<MapMode>('general');
  const [category, setCategory] = useState<PlaceCategory>('all');
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [modeSheetOpen, setModeSheetOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [planWaypoints, setPlanWaypoints] = useState<PlanWaypoint[]>(DUMMY_PLAN_WAYPOINTS);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const [tripStops, setTripStops] = useState<ActiveTripStop[]>(buildInitialStops);
  const [tripCurrentIndex, setTripCurrentIndex] = useState<number>(ACTIVE_TRIP.currentStopIndex);
  const [tripVisitedCount, setTripVisitedCount] = useState<number>(ACTIVE_TRIP.visitedCount);
  const [visitModalOpen, setVisitModalOpen] = useState(false);
  const [badgeModalOpen, setBadgeModalOpen] = useState(false);
  const [verifiedStop, setVerifiedStop] = useState<ActiveTripStop | null>(null);

  const filteredPlaces = useMemo(() => {
    if (category === 'all') {
      return DUMMY_PLACES;
    }
    if (category === 'favorite') {
      return DUMMY_PLACES.filter((p) => p.isFavorite);
    }
    return DUMMY_PLACES.filter((p) => p.category === category);
  }, [category]);

  const searchLabel = '장소, 주소 검색';

  const topChromeHeight = insets.top + 8 + TOP_BAR_BLOCK;
  const categoryTop = topChromeHeight;
  const statusTop = topChromeHeight + (mode === 'general' ? CATEGORY_ROW : 8);
  const isPlanMode = mode === 'plan';
  const isActiveTrip = mode === 'activeTrip';
  const showActiveTripEmpty = isActiveTrip && !isAuthenticated;
  const showActiveTripLive = isActiveTrip && isAuthenticated;

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
    if (!isPlanMode) {
      return;
    }
    // 지도 영역 높이(60%) 레이아웃이 잡힌 뒤 bounds를 맞춤
    const timer = setTimeout(() => {
      fitPlanWaypoints(planWaypoints);
    }, 180);
    return () => clearTimeout(timer);
  }, [isPlanMode, planWaypoints, fitPlanWaypoints]);

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
    setSelectedPlace(null);
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
    setSelectedPlace({
      ...selectedPlace,
      isFavorite: !selectedPlace.isFavorite,
    });
  }, [selectedPlace]);

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
            ? { flex: PLAN_MAP_HEIGHT_RATIO }
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
        >
          {mode === 'general'
            ? filteredPlaces.map((place) => (
                <NaverMapMarkerOverlay
                  key={place.id}
                  latitude={place.latitude}
                  longitude={place.longitude}
                  image={{ symbol: markerSymbolFor(place) }}
                  width={28}
                  height={36}
                  caption={{
                    text: place.isFavorite ? `★ ${place.name}` : place.name,
                    textSize: 11,
                    color: MapTokens.text,
                    haloColor: '#FFFFFF',
                  }}
                  onTap={() => handleSelectPlace(place)}
                />
              ))
            : null}

          {isPlanMode ? (
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
            ? DUMMY_HEAT_ZONES.map((zone) => (
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
            ? DUMMY_PLACES.filter((p) => p.category === 'spot').map((place) => (
                <NaverMapMarkerOverlay
                  key={`heat-${place.id}`}
                  latitude={place.latitude}
                  longitude={place.longitude}
                  image={{ symbol: 'green' }}
                  width={22}
                  height={28}
                  onTap={() => handleSelectPlace(place)}
                />
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
        <View style={[styles.planPanelSlot, { flex: PLAN_PANEL_HEIGHT_RATIO }]}>
          <PlanSummaryPanel
            planTitle={DUMMY_PLAN_META.title}
            durationLabel={DUMMY_PLAN_META.totalDurationLabel}
            waypoints={planWaypoints}
            legs={DUMMY_PLAN_LEGS}
            selectedId={selectedPlanId}
            onPressWaypoint={handleSelectPlanWaypoint}
            onPressDetailSchedule={() =>
              Alert.alert('상세 일정', '상세 일정 화면은 곧 연결될 예정이에요.')
            }
          />
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
        places={DUMMY_PLACES}
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

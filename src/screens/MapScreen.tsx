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

import CategoryChips from '../components/map/CategoryChips';
import HeatmapLegend from '../components/map/HeatmapLegend';
import MapLayersButton from '../components/map/MapLayersButton';
import MapTopBar from '../components/map/MapTopBar';
import ModeBottomSheet from '../components/map/ModeBottomSheet';
import MyLocationButton from '../components/map/MyLocationButton';
import NextStopSheet from '../components/map/NextStopSheet';
import PathInfoPill from '../components/map/PathInfoPill';
import PlaceDetailChrome from '../components/map/PlaceDetailChrome';
import PlaceDetailSheet from '../components/map/PlaceDetailSheet';
import PlanSummaryPanel, {
  PLAN_PANEL_HEIGHT_RATIO,
} from '../components/map/PlanSummaryPanel';
import SearchModal from '../components/map/SearchModal';
import TripProgressBadge from '../components/map/TripProgressBadge';
import {
  JEJU_CENTER,
  MapTokens,
  type MapMode,
  type PlaceCategory,
} from '../constants/map';
import {
  ACTIVE_TRIP,
  DUMMY_HEAT_ZONES,
  DUMMY_PLACES,
  DUMMY_PLAN_LEGS,
  DUMMY_PLAN_META,
  DUMMY_PLAN_WAYPOINTS,
} from '../data/mapDummy';
import type { Place, PlanWaypoint } from '../types/map';

export type { Place } from '../types/map';

const TOP_BAR_BLOCK = 56;
const CATEGORY_ROW = 40;
/** 계획 모드: 지도 영역 비율 (패널과 합쳐 1) */
const PLAN_MAP_HEIGHT_RATIO = 1 - PLAN_PANEL_HEIGHT_RATIO;
/** 지점 bounds에 여유를 둬 캡션/마커가 잘리지 않게 함 */
const PLAN_BOUNDS_PADDING = 0.28;
const PLAN_BOUNDS_MIN_DELTA = 0.02;
/** 진행중 여행 다음장소 시트 높이 대략값 — FAB 오프셋용 */
const ACTIVE_TRIP_SHEET_FAB_OFFSET = 280;
const ACTIVE_REMAINING_PATH_COLOR = '#5EC4C8';
const ACTIVE_LOCATION_PULSE = 'rgba(30, 79, 196, 0.18)';

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

export default function MapScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<NaverMapViewRef>(null);

  const [mode, setMode] = useState<MapMode>('general');
  const [category, setCategory] = useState<PlaceCategory>('all');
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [modeSheetOpen, setModeSheetOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [planWaypoints, setPlanWaypoints] = useState<PlanWaypoint[]>(DUMMY_PLAN_WAYPOINTS);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

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
  /** 현위치 FAB — 모드별 하단 크롬 기준 */
  const fabBottomOffset = isPlanMode
    ? 16
    : isActiveTrip
      ? ACTIVE_TRIP_SHEET_FAB_OFFSET
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
    if (!isActiveTrip) {
      return;
    }
    const points = [
      ...ACTIVE_TRIP.traveledPath,
      ...ACTIVE_TRIP.remainingPath,
    ];
    const timer = setTimeout(() => {
      fitPlanWaypoints(
        points.map((p, index) => ({
          id: `active-${index}`,
          name: '',
          latitude: p.latitude,
          longitude: p.longitude,
          category: 'spot' as const,
          order: index + 1,
        })),
      );
    }, 180);
    return () => clearTimeout(timer);
  }, [isActiveTrip, fitPlanWaypoints]);

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

  const handleMyLocation = useCallback(() => {
    mapRef.current?.setLocationTrackingMode('Follow');
    // 위치 권한/GPS 미확보 환경에서도 제주 중심으로 폴백
    animateTo(JEJU_CENTER.latitude, JEJU_CENTER.longitude, 12);
  }, [animateTo]);

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

          {isActiveTrip ? (
            <>
              {/* TODO: Directions API 연동 시 실제 도로 PathOverlay로 교체 */}
              <NaverMapPolylineOverlay
                coords={[...ACTIVE_TRIP.traveledPath]}
                width={5}
                color={MapTokens.blue}
                capType="Round"
                joinType="Round"
              />
              <NaverMapPolylineOverlay
                coords={[...ACTIVE_TRIP.remainingPath]}
                width={5}
                color={ACTIVE_REMAINING_PATH_COLOR}
                capType="Round"
                joinType="Round"
              />
              <NaverMapCircleOverlay
                latitude={ACTIVE_TRIP.currentLocation.latitude}
                longitude={ACTIVE_TRIP.currentLocation.longitude}
                radius={120}
                color={ACTIVE_LOCATION_PULSE}
                outlineWidth={0}
              />
              <NaverMapMarkerOverlay
                latitude={ACTIVE_TRIP.currentLocation.latitude}
                longitude={ACTIVE_TRIP.currentLocation.longitude}
                image={{ symbol: 'blue' }}
                width={22}
                height={22}
              />
              <NaverMapMarkerOverlay
                latitude={ACTIVE_TRIP.nextPlace.latitude}
                longitude={ACTIVE_TRIP.nextPlace.longitude}
                image={{ symbol: 'green' }}
                width={28}
                height={36}
                caption={{
                  text: ACTIVE_TRIP.nextPlace.name,
                  textSize: 12,
                  color: MapTokens.text,
                  haloColor: '#FFFFFF',
                }}
                onTap={() => handleSelectPlace(ACTIVE_TRIP.nextPlace)}
              />
            </>
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

        {isActiveTrip ? (
          <TripProgressBadge
            tripTitle={ACTIVE_TRIP.title}
            currentStop={ACTIVE_TRIP.currentStop}
            totalStops={ACTIVE_TRIP.totalStops}
            topOffset={statusTop}
            onPress={() => setModeSheetOpen(true)}
          />
        ) : null}

        {isActiveTrip ? (
          <PathInfoPill
            walkMinutes={ACTIVE_TRIP.walkMinutes}
            distanceMeters={ACTIVE_TRIP.distanceMeters}
          />
        ) : null}

        {isActiveTrip ? (
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

      <NextStopSheet
        visible={isActiveTrip}
        place={ACTIVE_TRIP.nextPlace}
        walkMinutes={ACTIVE_TRIP.walkMinutes}
        distanceMeters={ACTIVE_TRIP.distanceMeters}
        arrivalTimeLabel={ACTIVE_TRIP.arrivalTimeLabel}
        underOverlay={modeSheetOpen}
        onPressPlace={() =>
          animateTo(ACTIVE_TRIP.nextPlace.latitude, ACTIVE_TRIP.nextPlace.longitude, 14)
        }
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

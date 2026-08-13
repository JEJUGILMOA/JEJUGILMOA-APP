import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
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
import MapTopBar from '../components/map/MapTopBar';
import ModeBottomSheet from '../components/map/ModeBottomSheet';
import MyLocationButton from '../components/map/MyLocationButton';
import NextStopCard from '../components/map/NextStopCard';
import PlaceDetailSheet from '../components/map/PlaceDetailSheet';
import PlanSummarySheet from '../components/map/PlanSummarySheet';
import SearchModal from '../components/map/SearchModal';
import StatusBanner from '../components/map/StatusBanner';
import {
  JEJU_CENTER,
  MapTokens,
  type MapMode,
  type PlaceCategory,
} from '../constants/map';
import {
  ACTIVE_TRIP_NEXT,
  DUMMY_HEAT_ZONES,
  DUMMY_PLACES,
  DUMMY_PLAN_WAYPOINTS,
} from '../data/mapDummy';
import type { Place, PlanWaypoint } from '../types/map';

export type { Place } from '../types/map';

const TOP_BAR_BLOCK = 56;
const CATEGORY_ROW = 40;

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

  const filteredPlaces = useMemo(() => {
    if (category === 'all') {
      return DUMMY_PLACES;
    }
    if (category === 'favorite') {
      return DUMMY_PLACES.filter((p) => p.isFavorite);
    }
    return DUMMY_PLACES.filter((p) => p.category === category);
  }, [category]);

  const searchLabel =
    mode === 'plan' ? '제주도 3박4일' : '장소, 주소 검색';

  const topChromeHeight = insets.top + 8 + TOP_BAR_BLOCK;
  const categoryTop = topChromeHeight;
  const statusTop = topChromeHeight + (mode === 'general' ? CATEGORY_ROW : 8);
  const bottomChrome =
    mode === 'plan' || mode === 'activeTrip' ? 88 : 24;

  const animateTo = useCallback((latitude: number, longitude: number, zoom = 13) => {
    mapRef.current?.animateCameraTo({
      latitude,
      longitude,
      zoom,
      duration: 500,
    });
  }, []);

  const handleSelectPlace = useCallback(
    (place: Place) => {
      setSelectedPlace(place);
      animateTo(place.latitude, place.longitude);
    },
    [animateTo],
  );

  const handleMyLocation = useCallback(() => {
    mapRef.current?.setLocationTrackingMode('Follow');
    // 위치 권한/GPS 미확보 환경에서도 제주 중심으로 폴백
    animateTo(JEJU_CENTER.latitude, JEJU_CENTER.longitude, 12);
  }, [animateTo]);

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

  const planCoords = useMemo(
    () =>
      planWaypoints.map((w) => ({
        latitude: w.latitude,
        longitude: w.longitude,
      })),
    [planWaypoints],
  );

  const remainingPathCoords = useMemo(
    () => [
      { latitude: 33.4996, longitude: 126.5312 },
      {
        latitude: ACTIVE_TRIP_NEXT.place.latitude,
        longitude: ACTIVE_TRIP_NEXT.place.longitude,
      },
    ],
    [],
  );

  const upcomingPathCoords = useMemo(
    () => [
      {
        latitude: ACTIVE_TRIP_NEXT.place.latitude,
        longitude: ACTIVE_TRIP_NEXT.place.longitude,
      },
      { latitude: 33.3940, longitude: 126.2394 },
    ],
    [],
  );

  return (
    <View style={styles.container}>
      <NaverMapView
        ref={mapRef}
        style={styles.map}
        initialCamera={{ ...JEJU_CENTER, zoom: 10 }}
        isShowLocationButton={false}
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

        {mode === 'plan' ? (
          <>
            {/* TODO: 점선 동선 — Polyline `pattern` prop이 현재 SDK에서 네이티브로 전달되지 않음.
                공식 문서/릴리즈에서 지원되면 pattern 또는 PathOverlay 패턴으로 교체. */}
            {planCoords.length >= 2 ? (
              <NaverMapPolylineOverlay
                coords={planCoords}
                width={3}
                color={MapTokens.green}
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
                width={26}
                height={34}
                caption={{
                  text: String(wp.order),
                  textSize: 12,
                  color: MapTokens.green,
                  haloColor: '#FFFFFF',
                }}
                onTap={() => handleSelectPlace(wp)}
              />
            ))}
          </>
        ) : null}

        {mode === 'activeTrip' ? (
          <>
            <NaverMapPolylineOverlay
              coords={remainingPathCoords}
              width={5}
              color={MapTokens.blue}
              capType="Round"
              joinType="Round"
            />
            {/* TODO: 예정 경로 점선 — 현재는 연한 실선으로 구분 */}
            <NaverMapPolylineOverlay
              coords={upcomingPathCoords}
              width={3}
              color="#8FA8E8"
              capType="Round"
              joinType="Round"
            />
            <NaverMapMarkerOverlay
              latitude={remainingPathCoords[0].latitude}
              longitude={remainingPathCoords[0].longitude}
              image={{ symbol: 'blue' }}
              width={24}
              height={24}
              caption={{ text: '현위치', textSize: 11, color: MapTokens.blue }}
            />
            <NaverMapMarkerOverlay
              latitude={ACTIVE_TRIP_NEXT.place.latitude}
              longitude={ACTIVE_TRIP_NEXT.place.longitude}
              image={{ symbol: 'green' }}
              width={28}
              height={36}
              caption={{
                text: `${ACTIVE_TRIP_NEXT.distanceMeters}m · ${ACTIVE_TRIP_NEXT.walkMinutes}분`,
                textSize: 11,
                color: MapTokens.text,
                haloColor: '#FFFFFF',
              }}
              onTap={() => handleSelectPlace(ACTIVE_TRIP_NEXT.place)}
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

      <MapTopBar
        searchLabel={searchLabel}
        onPressSearch={() => setSearchOpen(true)}
        onPressMode={() => setModeSheetOpen(true)}
      />

      {mode === 'general' ? (
        <CategoryChips
          selected={category}
          onSelect={setCategory}
          topOffset={categoryTop}
        />
      ) : null}

      {mode === 'activeTrip' ? (
        <StatusBanner
          topOffset={statusTop}
          onPressOtherMap={() => setModeSheetOpen(true)}
          onDismiss={() => setMode('general')}
        />
      ) : null}

      <MyLocationButton onPress={handleMyLocation} bottomOffset={bottomChrome + 16} />

      {mode === 'plan' ? (
        <PlanSummarySheet
          planTitle="제주 3박4일 계획"
          waypoints={planWaypoints}
          onPressWaypoint={(wp) => handleSelectPlace(wp)}
          bottomOffset={0}
        />
      ) : null}

      {mode === 'activeTrip' ? (
        <NextStopCard
          place={ACTIVE_TRIP_NEXT.place}
          distanceMeters={ACTIVE_TRIP_NEXT.distanceMeters}
          walkMinutes={ACTIVE_TRIP_NEXT.walkMinutes}
          onPress={() => handleSelectPlace(ACTIVE_TRIP_NEXT.place)}
          bottomOffset={0}
        />
      ) : null}

      {mode === 'heatmap' ? <HeatmapLegend bottomOffset={24} /> : null}

      <PlaceDetailSheet
        place={selectedPlace}
        onClose={() => setSelectedPlace(null)}
        onAddToCourse={handleAddToCourse}
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
  map: { flex: 1 },
});

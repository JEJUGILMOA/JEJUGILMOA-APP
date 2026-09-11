import React, { useCallback, useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import {
  NaverMapCircleOverlay,
  NaverMapMarkerOverlay,
  NaverMapView,
  type NaverMapViewRef,
} from '@mj-studio/react-native-naver-map';

import type { MapBounds } from '../../api/map';
import type { PlanMapState } from '../../bridge/webviewBridge';
import { JEJU_CENTER, MapTokens } from '../../constants/map';
import { boundsFromRegion } from '../../utils/mapBounds';
import CategoryMapPin, { CATEGORY_PIN_SIZE } from './CategoryMapPin';
import PlanDayMapPin, {
  PLAN_DAY_PIN_SIZE,
  PLAN_DAY_PIN_SELECTED_SIZE,
} from './PlanDayMapPin';
import { categoryFromApiName } from '../../utils/mapMappers';

type Props = {
  map: PlanMapState;
  zoomPulse?: { seq: number; delta: number };
  controlsTop?: number;
  onAssignPlace?: (id: string) => void;
  onTapMap?: () => void;
  onRegionChanged?: (bounds: MapBounds) => void;
};

/** 일정 편집용 — 흰 바탕 · 검정 보더 · 검정 숫자/아이콘 */
const ITINERARY_PIN_BG = '#FFFFFF';
const ITINERARY_PIN_FG = '#25252D';

/** 출발지용 작은 원형 핀 */
function DepartureMapPin({ size = 24 }: { size?: number }): React.JSX.Element {
  return (
    <View
      collapsable={false}
      style={[
        styles.departurePin,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      <View style={styles.departureDot} />
    </View>
  );
}

export default function PlanItineraryMap({
  map,
  zoomPulse,
  controlsTop = 8,
  onAssignPlace,
  onTapMap,
  onRegionChanged,
}: Props): React.JSX.Element {
  const zoomRef = useRef(10);
  const centerRef = useRef<{ latitude: number; longitude: number }>({
    latitude: JEJU_CENTER.latitude,
    longitude: JEJU_CENTER.longitude,
  });
  const mapRef = useRef<NaverMapViewRef>(null);
  const fittedKeyRef = useRef<string | null>(null);

  const bumpZoom = useCallback((delta: number) => {
    const next = Math.min(16, Math.max(6, zoomRef.current + delta));
    zoomRef.current = next;
    mapRef.current?.animateCameraTo({
      latitude: centerRef.current.latitude,
      longitude: centerRef.current.longitude,
      zoom: next,
      duration: 200,
    });
  }, []);

  const showExploreOverlays = map.places.length > 0 || map.heatmap.length > 0;

  useEffect(() => {
    if (!map.visible) {
      fittedKeyRef.current = null;
      return;
    }
    const key = map.cameraFitKey ?? 'default';
    if (fittedKeyRef.current === key) return;
    fittedKeyRef.current = key;

    const pins = [
      ...(map.departure ? [map.departure] : []),
      ...map.stops,
      ...map.unassigned,
      ...map.places,
    ];
    if (pins.length === 0) {
      zoomRef.current = 10;
      centerRef.current = { ...JEJU_CENTER };
      mapRef.current?.animateCameraTo({ ...JEJU_CENTER, zoom: 10, duration: 400 });
      return;
    }
    if (pins.length === 1) {
      zoomRef.current = 12;
      centerRef.current = { latitude: pins[0].latitude, longitude: pins[0].longitude };
      mapRef.current?.animateCameraTo({
        latitude: pins[0].latitude,
        longitude: pins[0].longitude,
        zoom: 12,
        duration: 400,
      });
      return;
    }
    const lats = pins.map((p) => p.latitude);
    const lngs = pins.map((p) => p.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const latDelta = Math.max(maxLat - minLat, 0.02) * 1.5;
    const lngDelta = Math.max(maxLng - minLng, 0.02) * 1.5;
    centerRef.current = {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
    };
    mapRef.current?.animateRegionTo({
      latitude: minLat - (maxLat - minLat) * 0.2,
      longitude: minLng - (maxLng - minLng) * 0.2,
      latitudeDelta: latDelta,
      longitudeDelta: lngDelta,
      duration: 400,
    });
  }, [
    map.visible,
    map.cameraFitKey,
    map.departure,
    map.stops,
    map.unassigned,
    map.places,
  ]);

  useEffect(() => {
    if (!zoomPulse || zoomPulse.seq === 0) return;
    bumpZoom(zoomPulse.delta);
  }, [zoomPulse, bumpZoom]);

  return (
    <View style={styles.wrap}>
      <NaverMapView
        ref={mapRef}
        style={styles.map}
        initialCamera={{ ...JEJU_CENTER, zoom: 10 }}
        isShowLocationButton={false}
        isShowZoomControls={false}
        isUseTextureViewAndroid
        onTapMap={() => onTapMap?.()}
        onCameraIdle={(params) => {
          onRegionChanged?.(boundsFromRegion(params.region));
        }}
      >
        {showExploreOverlays
          ? map.heatmap.map((point, index) => (
              <NaverMapCircleOverlay
                key={`heat-${index}-${point.latitude}-${point.longitude}`}
                latitude={point.latitude}
                longitude={point.longitude}
                radius={Math.round(500 + Math.max(0, Math.min(1, point.intensity)) * 1500)}
                color={
                  point.level === 'CROWDED'
                    ? 'rgba(232,93,76,0.35)'
                    : 'rgba(245,197,66,0.35)'
                }
                outlineWidth={0}
              />
            ))
          : null}

        {showExploreOverlays
          ? map.places.map((place) => {
              const category = categoryFromApiName(place.categoryName);
              return (
              <NaverMapMarkerOverlay
                key={`p-${place.id}`}
                latitude={place.latitude}
                longitude={place.longitude}
                width={CATEGORY_PIN_SIZE}
                height={CATEGORY_PIN_SIZE}
                anchor={{ x: 0.5, y: 0.5 }}
                caption={{
                  text: place.title,
                  textSize: 11,
                  color: MapTokens.text,
                  haloColor: '#FFFFFF',
                }}
                onTap={() => onAssignPlace?.(place.id)}
              >
                <CategoryMapPin
                  key={`${place.id}/${category}`}
                  category={category}
                  size={CATEGORY_PIN_SIZE}
                />
              </NaverMapMarkerOverlay>
              );
            })
          : null}

        {map.unassigned.map((place) => {
          const category = categoryFromApiName(place.categoryName);
          return (
          <NaverMapMarkerOverlay
            key={`u-${place.id}`}
            latitude={place.latitude}
            longitude={place.longitude}
            width={CATEGORY_PIN_SIZE}
            height={CATEGORY_PIN_SIZE}
            anchor={{ x: 0.5, y: 0.5 }}
            zIndex={1}
            caption={{
              text: place.title,
              textSize: 11,
              color: MapTokens.textMuted,
              haloColor: '#FFFFFF',
            }}
            onTap={() => onAssignPlace?.(place.id)}
          >
            <CategoryMapPin
              key={`${place.id}/${category}`}
              category={category}
              size={CATEGORY_PIN_SIZE}
            />
          </NaverMapMarkerOverlay>
          );
        })}

        {map.departure ? (
          <NaverMapMarkerOverlay
            key={`d-${map.departure.id}`}
            latitude={map.departure.latitude}
            longitude={map.departure.longitude}
            width={PLAN_DAY_PIN_SIZE}
            height={PLAN_DAY_PIN_SIZE}
            anchor={{ x: 0.5, y: 0.5 }}
            zIndex={5}
            caption={{
              text: `출발 ${map.departure.title}`,
              textSize: 11,
              color: MapTokens.text,
              haloColor: '#FFFFFF',
            }}
          >
            <DepartureMapPin size={PLAN_DAY_PIN_SIZE} />
          </NaverMapMarkerOverlay>
        ) : null}

        {map.stops.map((stop) => {
          const pinSize = stop.mustVisit ? PLAN_DAY_PIN_SELECTED_SIZE : PLAN_DAY_PIN_SIZE;
          return (
            <NaverMapMarkerOverlay
              key={`s-${stop.id}-o${stop.order}-${stop.mustVisit ? 1 : 0}`}
              latitude={stop.latitude}
              longitude={stop.longitude}
              width={pinSize}
              height={pinSize}
              anchor={{ x: 0.5, y: 0.5 }}
              zIndex={stop.mustVisit ? 8 : 3}
              caption={{
                text: stop.title,
                textSize: 11,
                color: MapTokens.text,
                haloColor: '#FFFFFF',
              }}
            >
              <PlanDayMapPin
                key={`pin-${stop.id}-${stop.order}-${stop.mustVisit ? 1 : 0}`}
                order={stop.order}
                color={ITINERARY_PIN_BG}
                textColor={ITINERARY_PIN_FG}
                borderColor={ITINERARY_PIN_FG}
                size={PLAN_DAY_PIN_SIZE}
                selected={Boolean(stop.mustVisit)}
              />
            </NaverMapMarkerOverlay>
          );
        })}
      </NaverMapView>
      {map.webOnTop ? null : (
        <View style={[styles.zoomControls, { top: controlsTop }]} pointerEvents="box-none">
          <Pressable
            style={styles.zoomButton}
            onPress={() => bumpZoom(1)}
            accessibilityRole="button"
            accessibilityLabel="지도 확대"
          >
            <ZoomInIcon />
          </Pressable>
          <Pressable
            style={[styles.zoomButton, styles.zoomButtonLast]}
            onPress={() => bumpZoom(-1)}
            accessibilityRole="button"
            accessibilityLabel="지도 축소"
          >
            <ZoomOutIcon />
          </Pressable>
        </View>
      )}
    </View>
  );
}

function ZoomInIcon(): React.JSX.Element {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="8" stroke={MapTokens.text} strokeWidth={2} />
      <Path d="M21 21l-4.35-4.35" stroke={MapTokens.text} strokeWidth={2} strokeLinecap="round" />
      <Path d="M11 8v6M8 11h6" stroke={MapTokens.text} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function ZoomOutIcon(): React.JSX.Element {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="8" stroke={MapTokens.text} strokeWidth={2} />
      <Path d="M21 21l-4.35-4.35" stroke={MapTokens.text} strokeWidth={2} strokeLinecap="round" />
      <Path d="M8 11h6" stroke={MapTokens.text} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: MapTokens.background,
  },
  map: {
    flex: 1,
  },
  departurePin: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ITINERARY_PIN_BG,
    borderWidth: 1.5,
    borderColor: ITINERARY_PIN_FG,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 2.5,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  departureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ITINERARY_PIN_FG,
  },
  zoomControls: {
    position: 'absolute',
    top: 8,
    right: 12,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: MapTokens.surface,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  zoomButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: MapTokens.border,
  },
  zoomButtonLast: {
    borderBottomWidth: 0,
  },
});

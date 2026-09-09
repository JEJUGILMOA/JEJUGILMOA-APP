import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import {
  NaverMapCircleOverlay,
  NaverMapMarkerOverlay,
  NaverMapPolylineOverlay,
  NaverMapView,
  type NaverMapViewRef,
} from '@mj-studio/react-native-naver-map';

import type { MapBounds } from '../../api/map';
import type { PlanMapState } from '../../bridge/webviewBridge';
import { JEJU_CENTER, MapTokens } from '../../constants/map';
import { boundsFromRegion } from '../../utils/mapBounds';

type Props = {
  map: PlanMapState;
  zoomPulse?: { seq: number; delta: number };
  controlsTop?: number;
  onAssignPlace?: (id: string) => void;
  onTapMap?: () => void;
  onRegionChanged?: (bounds: MapBounds) => void;
};

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

  const routeCoords = useMemo(() => {
    const points = [
      ...(map.departure
        ? [{ latitude: map.departure.latitude, longitude: map.departure.longitude }]
        : []),
      ...map.stops.map((stop) => ({
        latitude: stop.latitude,
        longitude: stop.longitude,
      })),
    ];
    return points;
  }, [map.departure, map.stops]);

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
        {routeCoords.length >= 2 ? (
          <NaverMapPolylineOverlay
            coords={routeCoords}
            width={4}
            color={MapTokens.green}
            capType="Round"
            joinType="Round"
          />
        ) : null}

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
          ? map.places.map((place) => (
              <NaverMapMarkerOverlay
                key={`p-${place.id}`}
                latitude={place.latitude}
                longitude={place.longitude}
                image={{ symbol: 'green' }}
                width={28}
                height={36}
                caption={{
                  text: place.title,
                  textSize: 11,
                  color: MapTokens.text,
                  haloColor: '#FFFFFF',
                }}
                onTap={() => onAssignPlace?.(place.id)}
              />
            ))
          : null}

        {map.unassigned.map((place) => (
          <NaverMapMarkerOverlay
            key={`u-${place.id}`}
            latitude={place.latitude}
            longitude={place.longitude}
            image={{ symbol: 'gray' }}
            width={24}
            height={32}
            caption={{
              text: place.title,
              textSize: 11,
              color: MapTokens.textMuted,
              haloColor: '#FFFFFF',
            }}
            onTap={() => onAssignPlace?.(place.id)}
          />
        ))}

        {map.departure ? (
          <NaverMapMarkerOverlay
            key={`d-${map.departure.id}`}
            latitude={map.departure.latitude}
            longitude={map.departure.longitude}
            image={{ symbol: 'blue' }}
            width={28}
            height={36}
            caption={{
              text: `출발 ${map.departure.title}`,
              textSize: 12,
              color: MapTokens.text,
              haloColor: '#FFFFFF',
            }}
          />
        ) : null}

        {map.stops.map((stop) => (
          <NaverMapMarkerOverlay
            key={`s-${stop.id}`}
            latitude={stop.latitude}
            longitude={stop.longitude}
            image={{ symbol: stop.mustVisit ? 'yellow' : 'green' }}
            width={28}
            height={36}
            caption={{
              text: `${stop.order}. ${stop.title}`,
              textSize: 12,
              color: MapTokens.text,
              haloColor: '#FFFFFF',
            }}
          />
        ))}
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

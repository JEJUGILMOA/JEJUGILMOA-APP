import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
// ⚠️ 아래 컴포넌트/props 이름은 패키지 버전에 따라 달라질 수 있습니다.
// 실제 작업 전 https://rnnavermap.mjstudio.net 최신 문서로 정확한 API를 확인하세요.
import { NaverMapView, NaverMapMarkerOverlay } from '@mj-studio/react-native-naver-map';

import MapBottomSheet from '../components/MapBottomSheet';

// 제주도 대략 중심 좌표 (지도 초기 카메라 위치)
const JEJU_CENTER = { latitude: 33.3846, longitude: 126.5535 };

export type Place = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
};

export default function MapScreen() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  const handleMarkerPress = useCallback((place: Place) => {
    setSelectedPlace(place);
  }, []);

  const handleMapReady = useCallback(() => {
    // TODO: 백엔드 API에서 제주 장소/코스 목록을 불러와 setPlaces(...)
    // 예: fetchPlaces().then(setPlaces)
  }, []);

  return (
    <View style={styles.container}>
      <NaverMapView
        style={styles.map}
        initialCamera={{ ...JEJU_CENTER, zoom: 10 }}
        onInitialized={handleMapReady}
      >
        {places.map((place) => (
          <NaverMapMarkerOverlay
            key={place.id}
            latitude={place.latitude}
            longitude={place.longitude}
            onTap={() => handleMarkerPress(place)}
          />
        ))}
      </NaverMapView>

      {/* 지도 위에 떠 있는 바텀시트: 장소 리스트 / 선택된 장소 상세 */}
      <MapBottomSheet
        places={places}
        selectedPlace={selectedPlace}
        onSelectPlace={setSelectedPlace}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
});

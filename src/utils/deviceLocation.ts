import * as Location from 'expo-location';
import { Alert } from 'react-native';

import { ensureMapLocationPermission } from './mapLocationPermission';

export type DeviceCoords = {
  latitude: number;
  longitude: number;
};

/** 방문 인증용 현재 좌표. 권한 없으면 null */
export async function getDeviceCoordinates(): Promise<DeviceCoords | null> {
  const granted = await ensureMapLocationPermission({
    deniedMessage:
      '방문 인증을 위해 현재 위치가 필요해요. 설정에서 위치 권한을 허용해 주세요.',
  });
  if (!granted) return null;

  try {
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
  } catch {
    // console.warn('[location] getCurrentPosition failed', error);
    Alert.alert('위치를 가져오지 못했어요', '잠시 후 다시 시도해 주세요.');
    return null;
  }
}

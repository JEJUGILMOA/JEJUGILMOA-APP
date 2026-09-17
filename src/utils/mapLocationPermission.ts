import * as Location from 'expo-location';
import { Alert, Linking } from 'react-native';

const DEFAULT_DENIED_MESSAGE =
  '현재 위치를 표시하려면 설정에서 위치 권한을 허용해 주세요.';

type EnsureOptions = {
  /** 거부·미허용 시 Alert 본문 */
  deniedMessage?: string;
};

/**
 * 지도 내 위치 / 방문 인증 공통 권한 요청.
 * Android·iOS 모두 expo-location 런타임 팝업을 띄운다.
 */
export async function ensureMapLocationPermission(
  options?: EnsureOptions,
): Promise<boolean> {
  const { status: existing } = await Location.getForegroundPermissionsAsync();
  if (existing === 'granted') {
    return true;
  }

  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status === 'granted') {
    return true;
  }

  Alert.alert(
    '위치 권한 필요',
    options?.deniedMessage ?? DEFAULT_DENIED_MESSAGE,
    [
      { text: '취소', style: 'cancel' },
      { text: '설정 열기', onPress: () => Linking.openSettings() },
    ],
  );
  return false;
}

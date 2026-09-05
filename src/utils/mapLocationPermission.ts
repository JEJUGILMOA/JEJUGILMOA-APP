import { Alert, Linking, PermissionsAndroid, Platform } from 'react-native';

const LOCATION_RATIONALE = '주변 장소와 경로 안내를 위해 현재 위치를 사용합니다.';

/** Android는 런타임 권한 요청, iOS는 네이버맵 SDK가 위치 접근 시 시스템 팝업을 띄움 */
export async function ensureMapLocationPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }

  const alreadyGranted = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  );
  if (alreadyGranted) {
    return true;
  }

  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    {
      title: '위치 권한',
      message: LOCATION_RATIONALE,
      buttonNeutral: '나중에',
      buttonNegative: '취소',
      buttonPositive: '허용',
    },
  );

  if (result === PermissionsAndroid.RESULTS.GRANTED) {
    return true;
  }

  Alert.alert(
    '위치 권한 필요',
    '현재 위치를 표시하려면 설정에서 위치 권한을 허용해 주세요.',
    [
      { text: '취소', style: 'cancel' },
      { text: '설정 열기', onPress: () => Linking.openSettings() },
    ],
  );
  return false;
}

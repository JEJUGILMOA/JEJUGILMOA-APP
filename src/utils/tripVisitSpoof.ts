import AsyncStorage from '@react-native-async-storage/async-storage';
import { TRIP_VISIT_SPOOF_DEFAULT } from '../constants/config';

const STORAGE_KEY = 'gilmoa:tripVisitSpoof';

let cached: boolean | null = null;
const listeners = new Set<(enabled: boolean) => void>();

function notify(enabled: boolean) {
  listeners.forEach((listener) => listener(enabled));
}

/**
 * 방문 인증 시뮬레이션 ON 여부.
 * 설정 > 위치 섹션 7회 탭으로 토글. AsyncStorage에 유지.
 */
export function isTripVisitSpoofEnabled(): boolean {
  if (cached != null) return cached;
  // 미초기화 시 DEV만 env 기본값, 그 외 false
  if (__DEV__) return TRIP_VISIT_SPOOF_DEFAULT;
  return false;
}

export async function initTripVisitSpoof(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw === 'true' || raw === 'false') {
      cached = raw === 'true';
    } else {
      cached = __DEV__ ? TRIP_VISIT_SPOOF_DEFAULT : false;
    }
  } catch {
    cached = __DEV__ ? TRIP_VISIT_SPOOF_DEFAULT : false;
  }
  notify(cached);
  return cached;
}

export async function setTripVisitSpoof(enabled: boolean): Promise<void> {
  cached = enabled;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
  } catch {
    // 저장 실패해도 런타임 값은 유지
  }
  notify(enabled);
}

export async function toggleTripVisitSpoof(): Promise<boolean> {
  await initTripVisitSpoof();
  const next = !isTripVisitSpoofEnabled();
  await setTripVisitSpoof(next);
  return next;
}

export function subscribeTripVisitSpoof(listener: (enabled: boolean) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

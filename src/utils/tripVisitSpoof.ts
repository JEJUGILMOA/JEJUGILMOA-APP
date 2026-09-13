import AsyncStorage from '@react-native-async-storage/async-storage';
import { TRIP_VISIT_SPOOF_DEFAULT } from '../constants/config';

const STORAGE_KEY = 'gilmoa:tripVisitSpoof';

let cached: boolean | null = null;
const listeners = new Set<(enabled: boolean) => void>();

function notify(enabled: boolean) {
  listeners.forEach((listener) => listener(enabled));
}

/** 프로덕션에서는 항상 false. DEV는 캐시 → env 기본값 순 */
export function isTripVisitSpoofEnabled(): boolean {
  if (!__DEV__) return false;
  if (cached != null) return cached;
  return TRIP_VISIT_SPOOF_DEFAULT;
}

export async function initTripVisitSpoof(): Promise<boolean> {
  if (!__DEV__) {
    cached = false;
    return false;
  }
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw === 'true' || raw === 'false') {
      cached = raw === 'true';
    } else {
      cached = TRIP_VISIT_SPOOF_DEFAULT;
    }
  } catch {
    cached = TRIP_VISIT_SPOOF_DEFAULT;
  }
  notify(cached);
  return cached;
}

export async function setTripVisitSpoof(enabled: boolean): Promise<void> {
  if (!__DEV__) return;
  cached = enabled;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
  } catch {
    // 저장 실패해도 런타임 값은 유지
  }
  notify(enabled);
}

export function subscribeTripVisitSpoof(listener: (enabled: boolean) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

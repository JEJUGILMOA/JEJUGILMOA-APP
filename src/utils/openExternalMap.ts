import { Linking, Platform } from 'react-native';

export type ExternalMapPlace = {
  name: string;
  latitude: number;
  longitude: number;
};

type ExternalMapUrls = {
  appUrl: string;
  webUrl: string;
};

/** iOS: Apple Maps, Android: geo / Google Maps (App Store Guideline 4) */
export function buildExternalMapUrls(place: ExternalMapPlace): ExternalMapUrls {
  const label = encodeURIComponent(place.name);
  const { latitude, longitude } = place;

  if (Platform.OS === 'ios') {
    return {
      appUrl: `maps://?ll=${latitude},${longitude}&q=${label}`,
      webUrl: `https://maps.apple.com/?ll=${latitude},${longitude}&q=${label}`,
    };
  }

  return {
    appUrl: `geo:${latitude},${longitude}?q=${latitude},${longitude}(${label})`,
    webUrl: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
  };
}

/** 길찾기용 (목적지 설정) */
export function buildExternalDirectionsUrls(
  place: ExternalMapPlace,
): ExternalMapUrls {
  const label = encodeURIComponent(place.name);
  const { latitude, longitude } = place;

  if (Platform.OS === 'ios') {
    return {
      appUrl: `maps://?daddr=${latitude},${longitude}&dirflg=d&q=${label}`,
      webUrl: `https://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=d&q=${label}`,
    };
  }

  return {
    appUrl: `geo:${latitude},${longitude}?q=${latitude},${longitude}(${label})`,
    webUrl: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
  };
}

export async function openExternalMapUrls(urls: ExternalMapUrls): Promise<boolean> {
  // canOpenURL이 false여도 maps:// 시도 후, 실패 시 Apple/Google 웹으로 fallback
  try {
    await Linking.openURL(urls.appUrl);
    return true;
  } catch {
    // fall through
  }
  try {
    await Linking.openURL(urls.webUrl);
    return true;
  } catch {
    return false;
  }
}

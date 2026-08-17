import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Alert, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MapTokens } from '../../constants/map';
import type { Place } from '../../types/map';
import {
  ClockIcon,
  MountainIcon,
  NavigationIcon,
  StarIcon,
  WalkIcon,
} from './MapIcons';

type Props = {
  visible: boolean;
  place: Place;
  walkMinutes: number;
  distanceMeters: number;
  arrivalTimeLabel: string;
  /** 모드 시트 등이 열렸을 때 백드롭 아래로 */
  underOverlay?: boolean;
  onPressPlace: () => void;
};

/** MAP-03: 다음 장소 바텀시트 + 길안내 CTA */
export default function NextStopSheet({
  visible,
  place,
  walkMinutes,
  distanceMeters,
  arrivalTimeLabel,
  underOverlay = false,
  onPressPlace,
}: Props): React.JSX.Element | null {
  const sheetRef = useRef<BottomSheet>(null);
  const insets = useSafeAreaInsets();
  const snapPoints = useMemo(() => ['34%'], []);

  useEffect(() => {
    if (visible) {
      sheetRef.current?.expand();
    } else {
      sheetRef.current?.close();
    }
  }, [visible]);

  const handleStartNavigation = useCallback(async () => {
    const { latitude, longitude, name } = place;
    const label = encodeURIComponent(name);
    const webUrl = `https://map.naver.com/v5/search/${label}`;
    const appUrl =
      Platform.OS === 'ios'
        ? `maps://?daddr=${latitude},${longitude}&dirflg=w`
        : `geo:${latitude},${longitude}?q=${latitude},${longitude}(${label})`;

    try {
      const canOpenApp = await Linking.canOpenURL(appUrl);
      await Linking.openURL(canOpenApp ? appUrl : webUrl);
    } catch {
      Alert.alert('길안내', '지도 앱을 열 수 없어요. 잠시 후 다시 시도해 주세요.');
    }
  }, [place]);

  if (!visible) {
    return null;
  }

  return (
    <BottomSheet
      ref={sheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose={false}
      backgroundStyle={styles.sheetBg}
      handleIndicatorStyle={styles.handle}
      style={[styles.sheet, underOverlay && styles.underOverlay]}
      containerStyle={[styles.container, underOverlay && styles.underOverlay]}
    >
      <BottomSheetView style={[styles.content, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Pressable onPress={onPressPlace}>
          <Text style={styles.eyebrow}>다음 장소</Text>
          <View style={styles.headerRow}>
            <View style={styles.headerTexts}>
              <View style={styles.titleRow}>
                <Text style={styles.title} numberOfLines={1}>
                  {place.name}
                </Text>
                {place.isFavorite ? <StarIcon color={MapTokens.amber} size={16} /> : null}
              </View>
              <View style={styles.metaRow}>
                <WalkIcon color={MapTokens.textMuted} size={14} />
                <Text style={styles.meta}>
                  도보 {walkMinutes}분 · {distanceMeters}m
                </Text>
              </View>
              <View style={styles.metaRow}>
                <ClockIcon color={MapTokens.textMuted} size={14} />
                <Text style={styles.meta}>{arrivalTimeLabel} 도착 예정</Text>
              </View>
            </View>
            <View style={styles.thumb}>
              <MountainIcon color={MapTokens.green} size={28} />
            </View>
          </View>
        </Pressable>

        <Pressable
          style={styles.cta}
          onPress={handleStartNavigation}
          accessibilityRole="button"
          accessibilityLabel="길안내 시작"
        >
          <NavigationIcon color="#FFFFFF" size={18} />
          <Text style={styles.ctaText}>길안내 시작</Text>
        </Pressable>
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 40,
    elevation: 40,
  },
  sheet: {
    zIndex: 40,
    elevation: 40,
  },
  underOverlay: {
    zIndex: 1,
    elevation: 1,
  },
  sheetBg: {
    backgroundColor: MapTokens.surface,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  handle: {
    backgroundColor: '#D1D5DB',
    width: 36,
  },
  content: {
    paddingHorizontal: 18,
    gap: 14,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    color: MapTokens.green,
    marginBottom: 6,
  },
  headerRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  headerTexts: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    flexShrink: 1,
    fontSize: 20,
    fontWeight: '800',
    color: MapTokens.text,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  meta: {
    fontSize: 13,
    color: MapTokens.textMuted,
    fontWeight: '500',
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: MapTokens.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cta: {
    height: 48,
    borderRadius: 12,
    backgroundColor: MapTokens.green,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

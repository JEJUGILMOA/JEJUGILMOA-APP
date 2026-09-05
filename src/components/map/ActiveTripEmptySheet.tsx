import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { MapTokens } from '../../constants/map';
import { MapPinIcon } from './MapIcons';

type Props = {
  visible: boolean;
  underOverlay?: boolean;
  onGoGeneralMap: () => void;
};

/** MAP-03a: 진행중 여행 없음 (비로그인 등) */
export default function ActiveTripEmptySheet({
  visible,
  underOverlay = false,
  onGoGeneralMap,
}: Props): React.JSX.Element | null {
  const sheetRef = useRef<BottomSheet>(null);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const snapPoints = useMemo(() => ['38%'], []);

  useEffect(() => {
    if (visible) {
      sheetRef.current?.expand();
    } else {
      sheetRef.current?.close();
    }
  }, [visible]);

  const handleStartTrip = useCallback(() => {
    router.push('/login');
  }, [router]);

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
      <BottomSheetView style={[styles.content, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.iconBubble}>
          <MapPinIcon color={MapTokens.textMuted} size={28} />
        </View>
        <Text style={styles.title}>진행중인 여행이 없어요</Text>
        <Text style={styles.desc}>
          여행을 시작하면 이동 경로와 목적지를{'\n'}지도에서 바로 확인할 수 있어요
        </Text>
        <View style={styles.actions}>
          <Pressable
            style={styles.secondaryBtn}
            onPress={onGoGeneralMap}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryText}>일반 지도로</Text>
          </Pressable>
          <Pressable
            style={styles.primaryBtn}
            onPress={handleStartTrip}
            accessibilityRole="button"
          >
            <Text style={styles.primaryText}>여행 시작하기</Text>
          </Pressable>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: { zIndex: 40, elevation: 40 },
  sheet: { zIndex: 40, elevation: 40 },
  underOverlay: { zIndex: 1, elevation: 1 },
  sheetBg: {
    backgroundColor: MapTokens.surface,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  handle: { backgroundColor: '#D1D5DB', width: 36 },
  content: {
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 10,
  },
  iconBubble: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: MapTokens.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: MapTokens.text,
    textAlign: 'center',
  },
  desc: {
    fontSize: 13,
    lineHeight: 20,
    color: MapTokens.textMuted,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 8,
  },
  secondaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: MapTokens.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: MapTokens.text,
  },
  primaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: MapTokens.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import MapText from './MapText';
import BottomSheet, { BottomSheetView, type BottomSheetHandleProps } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { SharedValue } from 'react-native-reanimated';

import { MapTokens } from '../../constants/map';
import { TabBarTokens } from '../../constants/tabs';

/** 핸들 실제 높이: paddingTop(8) + indicator(4) + paddingBottom(4) */
export const ITINERARY_SHEET_HANDLE_HEIGHT = 16;

/** 접힘(펼치기 칩) → 기본 → 중간 → 최대 */
const SNAP_POINTS = [64, '28%', '58%', '88%'] as const;
/** 지도 진입 시 열리는 높이 (88% — 최대) */
export const DEFAULT_OPEN_SNAP_INDEX = 3;
/** 접힌 상태 인덱스 */
const COLLAPSED_SNAP_INDEX = 0;

type Props = {
  visible: boolean;
  expandToMid?: boolean;
  animatedPosition: SharedValue<number>;
  onCollapsedChange: (collapsed: boolean) => void;
};

export type ItinerarySheetRef = {
  snapToIndex: (index: number) => void;
};

const ItineraryNativeSheet = forwardRef<ItinerarySheetRef, Props>(function ItineraryNativeSheet(
  { visible, animatedPosition, onCollapsedChange },
  ref,
) {
  const sheetRef = useRef<BottomSheet>(null);
  const insets = useSafeAreaInsets();
  const snapPoints = useMemo(() => [...SNAP_POINTS], []);
  const onCollapsedChangeRef = useRef(onCollapsedChange);
  onCollapsedChangeRef.current = onCollapsedChange;

  useImperativeHandle(ref, () => ({
    snapToIndex: (index: number) => {
      sheetRef.current?.snapToIndex(index);
    },
  }));

  const renderHandle = useCallback(
    (_props: BottomSheetHandleProps) => (
      <View style={styles.handleWrap}>
        <View style={styles.indicator} />
      </View>
    ),
    [],
  );

  // 일정 지도 진입 시 시트를 최대(88%)로 연다
  useEffect(() => {
    if (!visible) {
      onCollapsedChangeRef.current(false);
      return;
    }
    const timer = setTimeout(() => {
      sheetRef.current?.snapToIndex(DEFAULT_OPEN_SNAP_INDEX);
      onCollapsedChangeRef.current(false);
    }, 60);
    return () => clearTimeout(timer);
  }, [visible]);

  if (!visible) return null;

  return (
    <BottomSheet
      ref={sheetRef}
      index={DEFAULT_OPEN_SNAP_INDEX}
      snapPoints={snapPoints}
      topInset={insets.top + 108}
      enablePanDownToClose={false}
      enableOverDrag={false}
      enableContentPanningGesture={false}
      enableHandlePanningGesture
      animatedPosition={animatedPosition}
      handleComponent={renderHandle}
      onChange={(index) => {
        onCollapsedChange(index === COLLAPSED_SNAP_INDEX);
      }}
      backgroundStyle={styles.sheetBg}
      style={styles.sheet}
      containerStyle={styles.container}
    >
      <BottomSheetView style={styles.body} pointerEvents="none">
        <View />
      </BottomSheetView>
    </BottomSheet>
  );
});

export default ItineraryNativeSheet;

export function ItinerarySheetExpandChip({
  visible,
  onPress,
}: {
  visible: boolean;
  onPress: () => void;
}): React.JSX.Element | null {
  const insets = useSafeAreaInsets();
  if (!visible) return null;

  // 탭바 위에 떠야 보임 — safe area만 쓰면 탭바에 가려짐
  const bottom = TabBarTokens.height + Math.max(insets.bottom, 0) + 12;

  return (
    <View pointerEvents="box-none" style={[styles.expandWrap, { bottom }]}>
      <Pressable style={styles.expand} onPress={onPress} accessibilityLabel="일정 펼치기">
        <MapText style={styles.expandLabel}>▲  펼치기</MapText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 10,
    elevation: 10,
  },
  sheet: {
    zIndex: 10,
    elevation: 10,
  },
  sheetBg: {
    backgroundColor: MapTokens.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -8 },
  },
  handleWrap: {
    paddingTop: 8,
    paddingBottom: 4,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  indicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
  },
  body: {
    flex: 1,
  },
  expandWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 50,
    elevation: 50,
    alignItems: 'center',
  },
  expand: {
    height: 44,
    paddingHorizontal: 20,
    borderRadius: 22,
    backgroundColor: MapTokens.surface,
    borderWidth: 1,
    borderColor: MapTokens.border,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  expandLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: MapTokens.green,
  },
});

import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import BottomSheet, { BottomSheetView, type BottomSheetHandleProps } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { SharedValue } from 'react-native-reanimated';

import { MapTokens } from '../../constants/map';

export const ITINERARY_SHEET_HANDLE_HEIGHT = 56;

type Props = {
  visible: boolean;
  title: string;
  expandToMid: boolean;
  animatedPosition: SharedValue<number>;
  onCollapsedChange: (collapsed: boolean) => void;
};

export type ItinerarySheetRef = {
  snapToIndex: (index: number) => void;
};

const ItineraryNativeSheet = forwardRef<ItinerarySheetRef, Props>(function ItineraryNativeSheet(
  { visible, title, expandToMid, animatedPosition, onCollapsedChange },
  ref,
) {
  const sheetRef = useRef<BottomSheet>(null);
  const insets = useSafeAreaInsets();
  const snapPoints = useMemo(() => [64, '28%', '58%', '88%'], []);

  useImperativeHandle(ref, () => ({
    snapToIndex: (index: number) => {
      sheetRef.current?.snapToIndex(index);
    },
  }));

  const renderHandle = useCallback(
    (_props: BottomSheetHandleProps) => (
      <View style={styles.handleWrap}>
        <View style={styles.indicator} />
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>
    ),
    [title],
  );

  useEffect(() => {
    if (!visible || !expandToMid) return;
    sheetRef.current?.snapToIndex(2);
  }, [visible, expandToMid]);

  if (!visible) return null;

  return (
    <BottomSheet
      ref={sheetRef}
      index={1}
      snapPoints={snapPoints}
      topInset={insets.top + 108}
      enablePanDownToClose={false}
      enableOverDrag={false}
      enableContentPanningGesture={false}
      enableHandlePanningGesture
      animatedPosition={animatedPosition}
      handleComponent={renderHandle}
      onChange={(index) => onCollapsedChange(index === 0)}
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
  label,
  onPress,
}: {
  visible: boolean;
  label: string;
  onPress: () => void;
}): React.JSX.Element | null {
  const insets = useSafeAreaInsets();
  if (!visible) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.expandWrap, { bottom: Math.max(insets.bottom, 16) + 8 }]}
    >
      <Pressable style={styles.expand} onPress={onPress}>
        <Text style={styles.expandLabel}>▲  {label}</Text>
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
    paddingBottom: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
  },
  indicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
  },
  title: {
    alignSelf: 'flex-start',
    fontSize: 16,
    fontWeight: '700',
    color: MapTokens.text,
  },
  body: {
    flex: 1,
  },
  expandWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 20,
    elevation: 20,
    alignItems: 'center',
  },
  expand: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: MapTokens.surface,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  expandLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: MapTokens.text,
  },
});

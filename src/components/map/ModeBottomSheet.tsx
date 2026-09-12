import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import MapText from './MapText';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';

import { MAP_MODE_OPTIONS, MapTokens, type MapMode } from '../../constants/map';
import { ModeOptionIcon } from './MapIcons';

type Props = {
  visible: boolean;
  currentMode: MapMode;
  onSelectMode: (mode: MapMode) => void;
  onClose: () => void;
};

export default function ModeBottomSheet({
  visible,
  currentMode,
  onSelectMode,
  onClose,
}: Props): React.JSX.Element | null {
  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['46%'], []);

  useEffect(() => {
    if (visible) {
      sheetRef.current?.expand();
    } else {
      sheetRef.current?.close();
    }
  }, [visible]);

  const handleChange = useCallback(
    (index: number) => {
      if (index === -1) {
        onClose();
      }
    },
    [onClose],
  );

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        pressBehavior="close"
        opacity={0.45}
        style={[props.style, styles.backdrop]}
      />
    ),
    [],
  );

  if (!visible) {
    return null;
  }

  return (
    <BottomSheet
      ref={sheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      onChange={handleChange}
      onClose={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheetBg}
      handleIndicatorStyle={styles.handle}
      style={styles.sheet}
      containerStyle={styles.container}
    >
      <BottomSheetView style={styles.content}>
        <MapText style={styles.title}>지도 모드 선택</MapText>
        {MAP_MODE_OPTIONS.map((option) => {
          const active = option.id === currentMode;
          return (
            <Pressable
              key={option.id}
              style={[styles.row, active && styles.rowActive]}
              onPress={() => {
                onSelectMode(option.id);
                onClose();
              }}
            >
              <View style={[styles.iconBubble, active && styles.iconBubbleActive]}>
                <ModeOptionIcon
                  mode={option.id}
                  color={active ? MapTokens.green : MapTokens.textMuted}
                  size={20}
                />
              </View>
              <View style={styles.texts}>
                <MapText style={styles.rowTitle}>{option.title}</MapText>
                <MapText style={styles.rowDesc}>{option.description}</MapText>
              </View>
            </Pressable>
          );
        })}
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 1000,
    elevation: 1000,
  },
  sheet: {
    zIndex: 1001,
    elevation: 1001,
  },
  backdrop: {
    zIndex: 999,
    elevation: 999,
  },
  sheetBg: {
    backgroundColor: MapTokens.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  handle: {
    backgroundColor: '#D1D5DB',
    width: 34,
  },
  content: {
    paddingHorizontal: 18,
    paddingBottom: 24,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: MapTokens.text,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 6,
  },
  rowActive: {
    backgroundColor: MapTokens.modeActiveBg,
  },
  iconBubble: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: MapTokens.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBubbleActive: {
    backgroundColor: MapTokens.greenSoft,
  },
  texts: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: MapTokens.text,
  },
  rowDesc: {
    marginTop: 2,
    fontSize: 12,
    color: MapTokens.textMuted,
  },
});

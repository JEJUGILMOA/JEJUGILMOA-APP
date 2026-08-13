import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';

import { MapTokens } from '../../constants/map';
import type { Place } from '../../types/map';
import { CategoryIcon, StarIcon } from './MapIcons';

type Props = {
  place: Place | null;
  onClose: () => void;
  onAddToCourse: (place: Place) => void;
};

export default function PlaceDetailSheet({
  place,
  onClose,
  onAddToCourse,
}: Props): React.JSX.Element | null {
  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['42%'], []);

  useEffect(() => {
    if (place) {
      sheetRef.current?.expand();
    } else {
      sheetRef.current?.close();
    }
  }, [place]);

  const handleChange = useCallback(
    (index: number) => {
      if (index === -1) {
        onClose();
      }
    },
    [onClose],
  );

  if (!place) {
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
      backgroundStyle={styles.sheetBg}
      handleIndicatorStyle={styles.handle}
    >
      <BottomSheetView style={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.thumb}>
            <CategoryIcon
              category={place.isFavorite ? 'favorite' : place.category}
              color={MapTokens.green}
              size={28}
            />
          </View>
          <View style={styles.headerTexts}>
            <Text style={styles.name}>{place.name}</Text>
            {place.rating != null ? (
              <View style={styles.ratingRow}>
                <StarIcon color={MapTokens.amber} size={14} />
                <Text style={styles.rating}>{place.rating.toFixed(1)}</Text>
              </View>
            ) : null}
            {place.address ? <Text style={styles.address}>{place.address}</Text> : null}
          </View>
        </View>
        {place.description ? <Text style={styles.desc}>{place.description}</Text> : null}
        <Pressable
          style={styles.cta}
          onPress={() => onAddToCourse(place)}
          accessibilityRole="button"
        >
          <Text style={styles.ctaText}>코스에 추가</Text>
        </Pressable>
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
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
    paddingBottom: 28,
  },
  headerRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: MapTokens.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTexts: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: MapTokens.text,
  },
  ratingRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 13,
    color: MapTokens.amber,
    fontWeight: '600',
  },
  address: {
    marginTop: 4,
    fontSize: 12,
    color: MapTokens.textMuted,
  },
  desc: {
    fontSize: 13,
    lineHeight: 19,
    color: MapTokens.textMuted,
    marginBottom: 16,
  },
  cta: {
    height: 48,
    borderRadius: 12,
    backgroundColor: MapTokens.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

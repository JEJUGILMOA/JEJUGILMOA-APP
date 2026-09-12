import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Alert, Image, Linking, Pressable, StyleSheet, View } from 'react-native';
import MapText from './MapText';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CATEGORY_LABELS, MapTokens } from '../../constants/map';
import type { Place } from '../../types/map';
import {
  CategoryIcon,
  ChevronDownIcon,
  ClockIcon,
  PhoneIcon,
  StarIcon,
} from './MapIcons';

type Props = {
  place: Place | null;
  onClose: () => void;
  onAddToCourse: (place: Place) => void;
  onSetDestination: (place: Place) => void;
};

/** MAP-06: 장소 상세 시트 — 검은 배경(scrim) 없음 */
export default function PlaceDetailSheet({
  place,
  onClose,
  onAddToCourse,
  onSetDestination,
}: Props): React.JSX.Element | null {
  const sheetRef = useRef<BottomSheet>(null);
  const insets = useSafeAreaInsets();
  const snapPoints = useMemo(() => ['56%'], []);

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

  const handleCall = useCallback(async () => {
    if (!place?.phone) {
      return;
    }
    const url = `tel:${place.phone.replace(/[^0-9+]/g, '')}`;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('전화', '전화 앱을 열 수 없어요.');
    }
  }, [place]);

  if (!place) {
    return null;
  }

  const categoryLabel = CATEGORY_LABELS[place.category];
  const photoLabel = `1/${place.photoCount ?? 1}`;

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
      style={styles.sheet}
      containerStyle={styles.container}
    >
      <BottomSheetScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 12) + 8 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. 제목 */}
        <View style={styles.titleRow}>
          <MapText style={styles.name} numberOfLines={1}>
            {place.name}
          </MapText>
          {place.rating != null ? (
            <View style={styles.ratingRow}>
              <StarIcon color={MapTokens.amber} size={14} />
              <MapText style={styles.rating}>{place.rating.toFixed(1)}</MapText>
            </View>
          ) : null}
        </View>

        {/* 2. 카테고리 */}
        <MapText style={styles.category}>{categoryLabel}</MapText>

        {/* 3. 버튼 */}
        <View style={styles.actions}>
          <Pressable
            style={styles.secondaryBtn}
            onPress={() => onSetDestination(place)}
            accessibilityRole="button"
            accessibilityLabel="목적지로 설정"
          >
            <MapText style={styles.secondaryBtnText}>목적지로 설정</MapText>
          </Pressable>
          <Pressable
            style={styles.primaryBtn}
            onPress={() => onAddToCourse(place)}
            accessibilityRole="button"
            accessibilityLabel="코스에 추가"
          >
            <MapText style={styles.primaryBtnText}>+ 코스에 추가</MapText>
          </Pressable>
        </View>

        {/* 4. 상세 정보 */}
        <View style={styles.detailSection}>
          <View style={styles.hero}>
            {place.imageUrl ? (
              <Image source={{ uri: place.imageUrl }} style={styles.heroImage} />
            ) : (
              <View style={styles.heroPlaceholder}>
                <CategoryIcon
                  category={place.isFavorite ? 'favorite' : place.category}
                  color={MapTokens.green}
                  size={40}
                />
              </View>
            )}
            <View style={styles.photoBadge}>
              <MapText style={styles.photoBadgeText}>{photoLabel}</MapText>
            </View>
          </View>

          {place.address ? (
            <MapText style={styles.address} numberOfLines={2}>
              {place.address}
            </MapText>
          ) : null}

          <View style={styles.infoBlock}>
            {place.hoursLabel ? (
              <View style={styles.infoRow}>
                <ClockIcon color={MapTokens.textMuted} size={15} />
                <MapText style={styles.infoText}>{place.hoursLabel}</MapText>
              </View>
            ) : null}
            {place.phone ? (
              <Pressable style={styles.infoRow} onPress={handleCall}>
                <PhoneIcon color={MapTokens.textMuted} size={15} />
                <MapText style={[styles.infoText, styles.phoneText]}>{place.phone}</MapText>
              </Pressable>
            ) : null}
            <View style={styles.expandHint}>
              <ChevronDownIcon color={MapTokens.textMuted} size={16} />
            </View>
          </View>

          {place.description ? (
            <View style={styles.descBox}>
              <MapText style={styles.desc} numberOfLines={3}>
                {place.description}
              </MapText>
              <ChevronDownIcon color={MapTokens.textMuted} size={16} />
            </View>
          ) : null}
        </View>
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 50,
    elevation: 50,
  },
  sheet: {
    zIndex: 50,
    elevation: 50,
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
    paddingHorizontal: 16,
    gap: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  name: {
    flexShrink: 1,
    fontSize: 22,
    fontWeight: '800',
    color: MapTokens.text,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  rating: {
    fontSize: 14,
    fontWeight: '700',
    color: MapTokens.amber,
  },
  category: {
    fontSize: 13,
    fontWeight: '600',
    color: MapTokens.textMuted,
    marginTop: -4,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
    marginBottom: 4,
  },
  secondaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: MapTokens.border,
    backgroundColor: MapTokens.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: MapTokens.text,
  },
  primaryBtn: {
    flex: 1.15,
    height: 48,
    borderRadius: 12,
    backgroundColor: MapTokens.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  detailSection: {
    gap: 10,
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: MapTokens.border,
  },
  hero: {
    height: 148,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: MapTokens.greenSoft,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoBadge: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  photoBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  address: {
    fontSize: 13,
    color: MapTokens.textMuted,
  },
  infoBlock: {
    marginTop: 2,
    gap: 8,
    position: 'relative',
    paddingRight: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    color: MapTokens.text,
    fontWeight: '500',
  },
  phoneText: {
    color: MapTokens.blue,
  },
  expandHint: {
    position: 'absolute',
    right: 0,
    top: 4,
  },
  descBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: MapTokens.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  desc: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: MapTokens.textMuted,
  },
});

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import MapText from './MapText';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CATEGORY_LABELS, MapTokens } from '../../constants/map';
import type { Place } from '../../types/map';
import {
  ClockIcon,
  PhoneIcon,
  StarIcon,
} from './MapIcons';
import NativePhotoViewer from './NativePhotoViewer';

type Props = {
  place: Place | null;
  /** 상세 API 응답 대기 중 — 스켈레톤 표시 */
  loading?: boolean;
  onClose: () => void;
  onToggleFavorite: (place: Place) => void;
  onSetDestination: (place: Place) => void;
};

const PHOTO_WIDTH = Math.min(Dimensions.get('window').width * 0.72, 260);

function resolvePhotoUrls(place: Place): string[] {
  if (place.imageUrls && place.imageUrls.length > 0) return place.imageUrls;
  if (place.imageUrl) return [place.imageUrl];
  return [];
}

function SkeletonBone({
  width,
  height,
  radius = 8,
  style,
  pulse,
}: {
  width: number | `${number}%`;
  height: number;
  radius?: number;
  style?: object;
  pulse: Animated.Value;
}) {
  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: '#E8EBF0',
          opacity: pulse,
        },
        style,
      ]}
    />
  );
}

function PlaceDetailSkeleton({ pulse }: { pulse: Animated.Value }) {
  return (
    <View style={styles.skeletonRoot} accessibilityLabel="장소 정보 불러오는 중">
      <SkeletonBone width="62%" height={26} radius={8} pulse={pulse} />
      <SkeletonBone width="28%" height={14} radius={6} pulse={pulse} style={{ marginTop: 2 }} />

      <View style={styles.actions}>
        <View style={styles.skeletonActionSlot}>
          <SkeletonBone width="100%" height={48} radius={12} pulse={pulse} />
        </View>
        <View style={styles.skeletonActionSlot}>
          <SkeletonBone width="100%" height={48} radius={12} pulse={pulse} />
        </View>
      </View>

      <View style={styles.detailSection}>
        <SkeletonBone width="100%" height={148} radius={14} pulse={pulse} />
        <SkeletonBone width="88%" height={14} radius={6} pulse={pulse} />
        <SkeletonBone width="55%" height={14} radius={6} pulse={pulse} />
        <SkeletonBone width="100%" height={72} radius={12} pulse={pulse} style={{ marginTop: 4 }} />
      </View>
    </View>
  );
}

/** MAP-06: 장소 상세 시트 — 검은 배경(scrim) 없음 */
export default function PlaceDetailSheet({
  place,
  loading = false,
  onClose,
  onToggleFavorite,
  onSetDestination,
}: Props): React.JSX.Element | null {
  const sheetRef = useRef<BottomSheet>(null);
  const insets = useSafeAreaInsets();
  const snapPoints = useMemo(() => ['56%'], []);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const pulse = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    if (!loading) {
      pulse.setValue(0.45);
      return;
    }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.45,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [loading, pulse]);

  useEffect(() => {
    if (place) {
      sheetRef.current?.expand();
      setViewerIndex(null);
    } else {
      sheetRef.current?.close();
      setViewerIndex(null);
    }
    // place 객체(즐겨찾기 등) 갱신 시 expand를 다시 호출하면 시트가 위로 점프함 → id만 추적
  }, [place?.id]);

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
  const photoUrls = resolvePhotoUrls(place);
  const hasPhotos = photoUrls.length > 0;

  return (
    <>
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
          {loading ? (
            <PlaceDetailSkeleton pulse={pulse} />
          ) : (
            <>
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

              <MapText style={styles.category}>{categoryLabel}</MapText>

              <View style={styles.actions}>
                <Pressable
                  style={styles.secondaryBtn}
                  onPress={() => onSetDestination(place)}
                  accessibilityRole="button"
                  accessibilityLabel="길찾기"
                >
                  <MapText style={styles.secondaryBtnText}>길찾기</MapText>
                </Pressable>
                <Pressable
                  style={[
                    styles.favoriteBtn,
                    place.isFavorite ? styles.favoriteBtnActive : null,
                  ]}
                  onPress={() => onToggleFavorite(place)}
                  accessibilityRole="button"
                  accessibilityLabel={place.isFavorite ? '즐겨찾기 해제' : '즐겨찾기'}
                >
                  <StarIcon
                    color={place.isFavorite ? MapTokens.amber : MapTokens.text}
                    filled={Boolean(place.isFavorite)}
                    size={16}
                  />
                  <MapText style={styles.favoriteBtnText}>
                    {place.isFavorite ? '즐겨찾기 해제' : '즐겨찾기'}
                  </MapText>
                </Pressable>
              </View>

              <View style={styles.detailSection}>
                {hasPhotos ? (
                  <ScrollView
                    key={place.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.photoRow}
                  >
                    {photoUrls.map((url, index) => (
                      <Pressable
                        key={`${place.id}-${url}-${index}`}
                        style={styles.photoCard}
                        onPress={() => setViewerIndex(index)}
                        accessibilityRole="button"
                        accessibilityLabel={`${place.name} 사진 ${index + 1} 크게 보기`}
                      >
                        <Image source={{ uri: url }} style={styles.photoImage} />
                        <View style={styles.photoBadge}>
                          <MapText style={styles.photoBadgeText}>
                            {index + 1}/{photoUrls.length}
                          </MapText>
                        </View>
                      </Pressable>
                    ))}
                  </ScrollView>
                ) : (
                  <View style={styles.heroPlaceholder}>
                    <MapText style={styles.heroPlaceholderText}>이미지가 없어요</MapText>
                  </View>
                )}

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
                </View>

                {place.description ? (
                  <View style={styles.descBox}>
                    <MapText style={styles.desc}>{place.description}</MapText>
                  </View>
                ) : null}
              </View>
            </>
          )}
        </BottomSheetScrollView>
      </BottomSheet>

      <NativePhotoViewer
        visible={viewerIndex != null}
        photoUrls={photoUrls}
        initialIndex={viewerIndex ?? 0}
        onClose={() => setViewerIndex(null)}
      />
    </>
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
  skeletonRoot: {
    gap: 10,
    marginTop: 2,
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
  skeletonActionSlot: {
    flex: 1,
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
  favoriteBtn: {
    flex: 1.15,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: MapTokens.border,
    backgroundColor: MapTokens.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  favoriteBtnActive: {
    borderColor: MapTokens.amber,
    backgroundColor: MapTokens.amberSoft,
  },
  favoriteBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: MapTokens.text,
  },
  detailSection: {
    gap: 10,
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: MapTokens.border,
  },
  photoRow: {
    gap: 10,
    paddingVertical: 2,
  },
  photoCard: {
    width: PHOTO_WIDTH,
    height: 148,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: MapTokens.greenSoft,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  heroPlaceholder: {
    height: 148,
    borderRadius: 14,
    backgroundColor: MapTokens.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroPlaceholderText: {
    fontSize: 14,
    fontWeight: '600',
    color: MapTokens.textMuted,
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
  descBox: {
    backgroundColor: MapTokens.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  desc: {
    fontSize: 13,
    lineHeight: 19,
    color: MapTokens.textMuted,
  },
});

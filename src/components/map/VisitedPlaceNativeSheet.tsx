import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MapTokens } from '../../constants/map';
import MapText from './MapText';
import NativePhotoViewer from './NativePhotoViewer';

export type VisitedPlaceSheetPlace = {
  placeId: string;
  placeName: string;
  address: string;
  visitDate: string;
  note: string;
  photoUrls: string[];
};

type Props = {
  place: VisitedPlaceSheetPlace | null;
  onClose: () => void;
};

const PHOTO_WIDTH = Math.min(Dimensions.get('window').width * 0.62, 240);

function formatVisitDate(visitDate: string) {
  return visitDate.replaceAll('-', '.');
}

/** 기록 상세 — 방문 장소 네이티브 바텀시트 (+ 사진 전체보기) */
export default function VisitedPlaceNativeSheet({
  place,
  onClose,
}: Props): React.JSX.Element | null {
  const sheetRef = useRef<BottomSheet>(null);
  const openPlaceIdRef = useRef<string | null>(null);
  const insets = useSafeAreaInsets();
  const snapPoints = useMemo(() => ['72%'], []);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const hasPhotos = Boolean(place && place.photoUrls.length > 0);
  const hasNote = Boolean(place?.note.trim());

  useEffect(() => {
    if (!place) {
      sheetRef.current?.close();
      setViewerIndex(null);
      openPlaceIdRef.current = null;
      return;
    }

    // 이미 열린 시트에서 다른 카드로 바꿀 때는 expand를 다시 부르지 않음
    if (openPlaceIdRef.current == null) {
      sheetRef.current?.expand();
    } else {
      setViewerIndex(null);
    }
    openPlaceIdRef.current = place.placeId;
  }, [place?.placeId]);

  const handleChange = useCallback(
    (index: number) => {
      if (index === -1) onClose();
    },
    [onClose],
  );

  if (!place) return null;

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
            { paddingBottom: Math.max(insets.bottom, 16) + 8 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {hasPhotos ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.photoRow}
              style={styles.photoScroll}
            >
              {place.photoUrls.map((url, index) => (
                <Pressable
                  key={`${url}-${index}`}
                  style={styles.photoCard}
                  onPress={() => setViewerIndex(index)}
                  accessibilityRole="button"
                  accessibilityLabel={`${place.placeName} 사진 ${index + 1} 크게 보기`}
                >
                  <Image source={{ uri: url }} style={styles.photoImage} />
                </Pressable>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.photoEmpty}>
              <MapText style={styles.photoEmptyText}>사진 없음</MapText>
            </View>
          )}

          <View style={styles.infoBlock}>
            <MapText style={styles.placeName}>{place.placeName}</MapText>
            {place.visitDate ? (
              <MapText style={styles.date}>{formatVisitDate(place.visitDate)}</MapText>
            ) : null}
            {place.address ? (
              <View style={styles.addressRow}>
                <MapText style={styles.pin}>📍</MapText>
                <MapText style={styles.address}>{place.address}</MapText>
              </View>
            ) : null}

            {hasNote ? (
              <>
                <View style={styles.divider} />
                <MapText style={styles.memoLabel}>메모</MapText>
                <MapText style={styles.memoText}>{place.note}</MapText>
              </>
            ) : null}
          </View>
        </BottomSheetScrollView>
      </BottomSheet>

      <NativePhotoViewer
        visible={viewerIndex != null}
        photoUrls={place.photoUrls}
        initialIndex={viewerIndex ?? 0}
        onClose={() => setViewerIndex(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 80,
    elevation: 80,
  },
  sheet: {
    zIndex: 80,
    elevation: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
  },
  sheetBg: {
    backgroundColor: MapTokens.surface,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: MapTokens.border,
  },
  handle: {
    backgroundColor: '#D1D5DB',
    width: 36,
  },
  content: {
    gap: 12,
  },
  photoScroll: {
    marginTop: 4,
  },
  photoRow: {
    paddingHorizontal: 20,
    gap: 10,
  },
  photoCard: {
    width: PHOTO_WIDTH,
    aspectRatio: 16 / 10,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#F3F4F8',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoEmpty: {
    marginHorizontal: 20,
    aspectRatio: 16 / 10,
    borderRadius: 14,
    backgroundColor: '#F3F4F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoEmptyText: {
    fontSize: 14,
    color: MapTokens.textMuted,
  },
  infoBlock: {
    paddingHorizontal: 20,
    gap: 6,
  },
  placeName: {
    fontSize: 24,
    fontWeight: '800',
    color: MapTokens.text,
    letterSpacing: -0.4,
  },
  date: {
    fontSize: 14,
    color: MapTokens.textMuted,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    marginTop: 2,
  },
  pin: {
    fontSize: 13,
    marginTop: 1,
  },
  address: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: MapTokens.border,
    marginVertical: 10,
  },
  memoLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#24B95C',
  },
  memoText: {
    fontSize: 17,
    color: '#374151',
    lineHeight: 26,
  },
});

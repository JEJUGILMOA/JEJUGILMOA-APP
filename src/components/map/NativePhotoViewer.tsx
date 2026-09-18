import React, { useCallback, useEffect, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  View,
  type ListRenderItemInfo,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import MapText from './MapText';

type Props = {
  visible: boolean;
  photoUrls: string[];
  initialIndex?: number;
  onClose: () => void;
};

const SCREEN_WIDTH = Dimensions.get('window').width;

/** 전체화면 네이티브 사진 캐러셀 (가로 스와이프) */
export default function NativePhotoViewer({
  visible,
  photoUrls,
  initialIndex = 0,
  onClose,
}: Props): React.JSX.Element | null {
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(initialIndex);
  const hasPhotos = photoUrls.length > 0;

  useEffect(() => {
    if (visible) setIndex(initialIndex);
  }, [visible, initialIndex]);

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = event.nativeEvent.contentOffset.x;
    setIndex(Math.round(x / SCREEN_WIDTH));
  }, []);

  const renderItem = useCallback(({ item }: ListRenderItemInfo<string>) => {
    return (
      <View style={styles.slide}>
        <Image source={{ uri: item }} style={styles.image} resizeMode="contain" />
      </View>
    );
  }, []);

  if (!visible) return null;

  const safeIndex = hasPhotos
    ? Math.min(Math.max(initialIndex, 0), photoUrls.length - 1)
    : 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable
          style={[styles.close, { top: insets.top + 12 }]}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="닫기"
        >
          <MapText style={styles.closeText}>닫기</MapText>
        </Pressable>

        {hasPhotos ? (
          <>
            <FlatList
              data={photoUrls}
              keyExtractor={(url, i) => `${url}-${i}`}
              horizontal
              pagingEnabled
              initialScrollIndex={safeIndex}
              getItemLayout={(_, i) => ({
                length: SCREEN_WIDTH,
                offset: SCREEN_WIDTH * i,
                index: i,
              })}
              onMomentumScrollEnd={onScroll}
              showsHorizontalScrollIndicator={false}
              renderItem={renderItem}
            />

            <MapText style={[styles.counter, { bottom: insets.bottom + 24 }]}>
              {index + 1} / {photoUrls.length}
            </MapText>
          </>
        ) : (
          <View style={styles.empty}>
            <MapText style={styles.emptyText}>이미지가 없어요</MapText>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 15, 20, 0.94)',
    justifyContent: 'center',
  },
  close: {
    position: 'absolute',
    right: 16,
    zIndex: 2,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(37, 37, 45, 0.6)',
  },
  closeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  slide: {
    width: SCREEN_WIDTH,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: SCREEN_WIDTH,
    height: '80%',
  },
  counter: {
    position: 'absolute',
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(37, 37, 45, 0.6)',
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 16,
    fontWeight: '600',
  },
});

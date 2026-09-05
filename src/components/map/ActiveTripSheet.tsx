import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MapTokens } from '../../constants/map';
import type { ActiveTripStop } from '../../data/mapDummy';
import { CarIcon, CategoryIcon, CheckIcon, WalkIcon } from './MapIcons';

type Props = {
  visible: boolean;
  tripTitle: string;
  dayLabel: string;
  visitedCount: number;
  totalStops: number;
  stops: ActiveTripStop[];
  currentIndex: number;
  canVerifyVisit: boolean;
  underOverlay?: boolean;
  onSelectStop: (stop: ActiveTripStop, index: number) => void;
  onVerifyVisit: () => void;
};

const CARD_GAP = 12;
const SIDE_PAD = 16;

/** MAP-03: 진행중 여행 하단 시트 (캐러셀 + 길찾기/방문인증) */
export default function ActiveTripSheet({
  visible,
  tripTitle,
  dayLabel,
  visitedCount,
  totalStops,
  stops,
  currentIndex,
  canVerifyVisit,
  underOverlay = false,
  onSelectStop,
  onVerifyVisit,
}: Props): React.JSX.Element | null {
  const sheetRef = useRef<BottomSheet>(null);
  const scrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const snapPoints = useMemo(() => ['36%'], []);
  const cardWidth = Dimensions.get('window').width - SIDE_PAD * 2;
  const [pageIndex, setPageIndex] = useState(currentIndex);

  useEffect(() => {
    if (visible) {
      sheetRef.current?.expand();
    } else {
      sheetRef.current?.close();
    }
  }, [visible]);

  useEffect(() => {
    setPageIndex(currentIndex);
    if (visible) {
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({
          x: currentIndex * (cardWidth + CARD_GAP),
          animated: false,
        });
      });
    }
  }, [currentIndex, visible, cardWidth]);

  const handleMomentumEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = event.nativeEvent.contentOffset.x;
      const index = Math.round(x / (cardWidth + CARD_GAP));
      const clamped = Math.max(0, Math.min(index, stops.length - 1));
      setPageIndex(clamped);
      const stop = stops[clamped];
      if (stop) {
        onSelectStop(stop, clamped);
      }
    },
    [cardWidth, onSelectStop, stops],
  );

  const activeStop = stops[pageIndex] ?? stops[currentIndex];

  const handleDirections = useCallback(async () => {
    if (!activeStop) {
      return;
    }
    const { latitude, longitude, name } = activeStop.place;
    const label = encodeURIComponent(name);
    const webUrl = `https://map.naver.com/v5/search/${label}`;
    const appUrl =
      Platform.OS === 'ios'
        ? `maps://?daddr=${latitude},${longitude}&dirflg=d`
        : `geo:${latitude},${longitude}?q=${latitude},${longitude}(${label})`;
    try {
      const canOpenApp = await Linking.canOpenURL(appUrl);
      await Linking.openURL(canOpenApp ? appUrl : webUrl);
    } catch {
      Alert.alert('길찾기', '지도 앱을 열 수 없어요.');
    }
  }, [activeStop]);

  const handleVerifyPress = useCallback(() => {
    if (!canVerifyVisit || pageIndex !== currentIndex) {
      Alert.alert('방문 인증', '장소에 도달하면 인증할 수 있어요');
      return;
    }
    onVerifyVisit();
  }, [canVerifyVisit, currentIndex, onVerifyVisit, pageIndex]);

  if (!visible) {
    return null;
  }

  const verifyEnabled = canVerifyVisit && pageIndex === currentIndex;

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
        <View style={styles.headerRow}>
          <Text style={styles.tripMeta} numberOfLines={1}>
            {tripTitle} · {dayLabel}
          </Text>
          <Text style={styles.visitCount}>
            {visitedCount} / {totalStops} 방문
          </Text>
        </View>

        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled={false}
          decelerationRate="fast"
          snapToInterval={cardWidth + CARD_GAP}
          snapToAlignment="start"
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carouselContent}
          onMomentumScrollEnd={handleMomentumEnd}
        >
          {stops.map((stop) => {
            const transportLabel = stop.transport === 'walk' ? '도보' : '차량';
            return (
              <View key={stop.id} style={[styles.card, { width: cardWidth }]}>
                <View style={styles.thumb}>
                  <CategoryIcon
                    category={stop.place.category}
                    color={MapTokens.green}
                    size={28}
                  />
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.orderLabel}>{stop.order}번째 목적지</Text>
                  <Text style={styles.placeName} numberOfLines={1}>
                    {stop.place.name}
                  </Text>
                  <View style={styles.metaRow}>
                    {stop.transport === 'walk' ? (
                      <WalkIcon color={MapTokens.textMuted} size={12} />
                    ) : (
                      <CarIcon color={MapTokens.textMuted} size={12} />
                    )}
                    <Text style={styles.metaText}>
                      {transportLabel} {stop.travelMinutes}분 · {stop.distanceMeters}m ·{' '}
                      {stop.scheduledTime} 예정
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>

        <View style={styles.dots}>
          {stops.map((stop, index) => (
            <View
              key={stop.id}
              style={[
                styles.dot,
                stop.status === 'visited' && styles.dotVisited,
                index === pageIndex && styles.dotCurrent,
              ]}
            />
          ))}
        </View>

        <View style={styles.actions}>
          <Pressable
            style={styles.secondaryBtn}
            onPress={handleDirections}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryText}>길찾기</Text>
          </Pressable>
          <Pressable
            style={[styles.primaryBtn, !verifyEnabled && styles.primaryBtnDisabled]}
            onPress={handleVerifyPress}
            accessibilityRole="button"
          >
            <CheckIcon color="#FFFFFF" size={16} />
            <Text style={styles.primaryText}>방문 인증하기</Text>
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
    paddingHorizontal: SIDE_PAD,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  tripMeta: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: MapTokens.textMuted,
  },
  visitCount: {
    fontSize: 13,
    fontWeight: '700',
    color: MapTokens.green,
  },
  carouselContent: {
    gap: CARD_GAP,
    paddingRight: SIDE_PAD,
  },
  card: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: MapTokens.background,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: MapTokens.border,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: MapTokens.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    gap: 3,
  },
  orderLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: MapTokens.green,
  },
  placeName: {
    fontSize: 17,
    fontWeight: '800',
    color: MapTokens.text,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    flexShrink: 1,
    fontSize: 12,
    color: MapTokens.textMuted,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: MapTokens.border,
  },
  dotVisited: {
    backgroundColor: MapTokens.green,
  },
  dotCurrent: {
    backgroundColor: MapTokens.blue,
    width: 8,
    height: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryBtn: {
    width: 88,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  primaryBtnDisabled: {
    backgroundColor: '#9CA3AF',
  },
  primaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import MapText from './MapText';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MapTokens, planDayColor } from '../../constants/map';
import type { ActiveTripStop } from '../../data/mapDummy';
import {
  buildExternalDirectionsUrls,
  openExternalMapUrls,
} from '../../utils/openExternalMap';
import { CategoryIcon, CheckIcon } from './MapIcons';

type Props = {
  visible: boolean;
  tripTitle: string;
  visitedCount: number;
  totalStops: number;
  stops: ActiveTripStop[];
  currentIndex: number;
  underOverlay?: boolean;
  onSelectStop: (stop: ActiveTripStop, index: number) => void;
  onSelectDay?: (dayNumber: number, dayStops: ActiveTripStop[]) => void;
  onSkipWaypoint: () => void;
  onVerifyVisit: () => void;
};

const CARD_GAP = 12;
const SIDE_PAD = 16;

/** MAP-03: 진행중 여행 하단 시트 (일차 칩 + 캐러셀 + 길찾기/방문인증) */
export default function ActiveTripSheet({
  visible,
  tripTitle,
  visitedCount,
  totalStops,
  stops,
  currentIndex,
  underOverlay = false,
  onSelectStop,
  onSelectDay,
  onSkipWaypoint,
  onVerifyVisit,
}: Props): React.JSX.Element | null {
  const sheetRef = useRef<BottomSheet>(null);
  const scrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const dayNumbers = useMemo(
    () => [...new Set(stops.map((stop) => stop.dayNumber))].sort((a, b) => a - b),
    [stops],
  );
  const multiDay = dayNumbers.length > 1;
  const snapPoints = useMemo(() => [multiDay ? '42%' : '36%'], [multiDay]);
  const cardWidth = Dimensions.get('window').width - SIDE_PAD * 2;

  const initialDay = stops[currentIndex]?.dayNumber ?? dayNumbers[0] ?? 1;
  const [selectedDay, setSelectedDay] = useState(initialDay);
  const [pageIndex, setPageIndex] = useState(0);

  const visibleStops = useMemo(
    () => stops.filter((stop) => stop.dayNumber === selectedDay),
    [stops, selectedDay],
  );

  const toGlobalIndex = useCallback(
    (localIndex: number) => {
      const stop = visibleStops[localIndex];
      if (!stop) return -1;
      return stops.findIndex((item) => item.id === stop.id);
    },
    [stops, visibleStops],
  );

  // 현재 목적지가 바뀌면 그 일차로 맞추고, 해당 카드로 스크롤
  useEffect(() => {
    const current = stops[currentIndex];
    if (!current) return;
    setSelectedDay(current.dayNumber);
  }, [currentIndex, stops]);

  useEffect(() => {
    const localCurrent = visibleStops.findIndex(
      (stop) => stop.id === stops[currentIndex]?.id,
    );
    const nextPage = localCurrent >= 0 ? localCurrent : 0;
    setPageIndex(nextPage);
    if (!visible) return;
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        x: nextPage * (cardWidth + CARD_GAP),
        animated: false,
      });
    });
  }, [selectedDay, visibleStops, currentIndex, stops, visible, cardWidth]);

  const handleSelectDay = useCallback(
    (dayNumber: number) => {
      setSelectedDay(dayNumber);
      const dayStops = stops.filter((stop) => stop.dayNumber === dayNumber);
      onSelectDay?.(dayNumber, dayStops);
      const preferred =
        dayStops.find((stop) => stop.status === 'current') ?? dayStops[0];
      if (preferred) {
        const globalIndex = stops.findIndex((stop) => stop.id === preferred.id);
        if (globalIndex >= 0) {
          onSelectStop(preferred, globalIndex);
        }
      }
    },
    [onSelectDay, onSelectStop, stops],
  );

  const handleMomentumEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = event.nativeEvent.contentOffset.x;
      const index = Math.round(x / (cardWidth + CARD_GAP));
      const clamped = Math.max(0, Math.min(index, visibleStops.length - 1));
      setPageIndex(clamped);
      const stop = visibleStops[clamped];
      const globalIndex = toGlobalIndex(clamped);
      if (stop && globalIndex >= 0) {
        onSelectStop(stop, globalIndex);
      }
    },
    [cardWidth, onSelectStop, toGlobalIndex, visibleStops],
  );

  const activeStop = visibleStops[pageIndex] ?? visibleStops[0];
  // 순서상 다음 인증 대상(status=current) 카드를 보고 있을 때만 활성
  const isCurrentDestination = activeStop?.status === 'current';
  const currentStop = stops.find((stop) => stop.status === 'current') ?? null;

  const handleDirections = useCallback(async () => {
    if (!activeStop) {
      return;
    }
    const { latitude, longitude, name } = activeStop.place;
    const opened = await openExternalMapUrls(
      buildExternalDirectionsUrls({ latitude, longitude, name }),
    );
    if (!opened) {
      Alert.alert('길찾기', '지도 앱을 열 수 없어요.');
    }
  }, [activeStop]);

  const handleSkipPress = useCallback(() => {
    if (!isCurrentDestination) {
      if (currentStop && selectedDay !== currentStop.dayNumber) {
        Alert.alert(
          '건너뛰기',
          `${currentStop.dayNumber}일차의 현재 목적지로 이동한 뒤 건너뛸 수 있어요`,
        );
        return;
      }
      Alert.alert('건너뛰기', '현재 목적지 카드에서만 건너뛸 수 있어요');
      return;
    }
    Alert.alert('이 장소를 건너뛸까요?', '방문 인증 없이 다음 목적지로 넘어가요.', [
      { text: '취소', style: 'cancel' },
      { text: '건너뛰기', style: 'destructive', onPress: onSkipWaypoint },
    ]);
  }, [currentStop, isCurrentDestination, onSkipWaypoint, selectedDay]);

  const handleVerifyPress = useCallback(() => {
    if (!isCurrentDestination) {
      if (currentStop && selectedDay !== currentStop.dayNumber) {
        Alert.alert(
          '방문 인증',
          `${currentStop.dayNumber}일차의 현재 목적지로 이동한 뒤 인증할 수 있어요`,
        );
        return;
      }
      Alert.alert('방문 인증', '현재 목적지 카드에서만 인증할 수 있어요');
      return;
    }
    onVerifyVisit();
  }, [currentStop, isCurrentDestination, onVerifyVisit, selectedDay]);

  if (!visible) {
    return null;
  }

  const dayLabel = `${selectedDay}일차`;

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
      <BottomSheetView style={styles.content}>
        <View style={styles.body}>
          <View style={styles.headerRow}>
            <MapText style={styles.tripMeta} numberOfLines={1}>
              {tripTitle} · {dayLabel}
            </MapText>
            <MapText style={styles.visitCount}>
              {visitedCount} / {totalStops} 방문
            </MapText>
          </View>

          {multiDay ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dayChipRow}
            >
              {dayNumbers.map((dayNumber) => {
                const selected = dayNumber === selectedDay;
                const color = planDayColor(dayNumber);
                return (
                  <Pressable
                    key={dayNumber}
                    onPress={() => handleSelectDay(dayNumber)}
                    style={[
                      styles.dayChip,
                      {
                        borderColor: selected ? color : MapTokens.border,
                        backgroundColor: selected ? `${color}1F` : MapTokens.surface,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`${dayNumber}일차 일정 보기`}
                  >
                    <MapText style={[styles.dayChipText, { color: selected ? color : MapTokens.textMuted }]}>
                      {dayNumber}일차
                    </MapText>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : null}

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
            {visibleStops.map((stop) => {
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
                    <MapText style={styles.orderLabel}>{stop.order}번째 목적지</MapText>
                    <MapText style={styles.placeName} numberOfLines={1}>
                      {stop.place.name}
                    </MapText>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.dots}>
            {visibleStops.map((stop, index) => (
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
        </View>

        <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <Pressable
            style={styles.secondaryBtn}
            onPress={handleDirections}
            accessibilityRole="button"
          >
            <MapText style={styles.secondaryText}>길찾기</MapText>
          </Pressable>
          <Pressable
            style={[styles.secondaryBtn, !isCurrentDestination && styles.secondaryBtnDisabled]}
            onPress={handleSkipPress}
            accessibilityRole="button"
            disabled={!isCurrentDestination}
          >
            <MapText
              style={[
                styles.secondaryText,
                !isCurrentDestination && styles.secondaryTextDisabled,
              ]}
            >
              건너뛰기
            </MapText>
          </Pressable>
          <Pressable
            style={[styles.primaryBtn, !isCurrentDestination && styles.primaryBtnDisabled]}
            onPress={handleVerifyPress}
            accessibilityRole="button"
            disabled={!isCurrentDestination}
          >
            <CheckIcon color="#FFFFFF" size={16} />
            <MapText style={styles.primaryText}>방문 인증하기</MapText>
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
    flex: 1,
    paddingHorizontal: SIDE_PAD,
  },
  body: {
    flex: 1,
    gap: 10,
    paddingBottom: 10,
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
  dayChipRow: {
    gap: 8,
    paddingBottom: 2,
  },
  dayChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  dayChipText: {
    fontSize: 13,
    fontWeight: '700',
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
    paddingTop: 4,
  },
  secondaryBtn: {
    width: 76,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: MapTokens.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnDisabled: {
    opacity: 0.45,
  },
  secondaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: MapTokens.text,
  },
  secondaryTextDisabled: {
    color: MapTokens.textMuted,
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
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

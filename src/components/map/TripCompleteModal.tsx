import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import MapText from './MapText';

import { MapTokens } from '../../constants/map';
import { CheckIcon } from './MapIcons';
import SafeConfettiBurst from './SafeConfettiBurst';

export type TripCompleteSummary = {
  title: string;
  durationDays?: number;
  placeCount?: number;
  totalDistanceKm?: number;
  startDate?: string;
  endDate?: string;
};

type Props = {
  visible: boolean;
  summary: TripCompleteSummary;
  onClose: () => void;
};

function formatDateRange(startDate?: string, endDate?: string) {
  if (!startDate) return null;
  const start = startDate.replaceAll('-', '.');
  if (!endDate) return start;
  return `${start} – ${endDate.replaceAll('-', '.')}`;
}

/**
 * 여행 완료 요약 오버레이
 * RN Modal 사용 시 닫을 때 @gorhom/bottom-sheet가 접히는 문제 방지
 * BadgeUnlockModal과 동일하게 등장 애니메이션 + 컨페티(팡파레)
 */
export default function TripCompleteModal({
  visible,
  summary,
  onClose,
}: Props): React.JSX.Element | null {
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.88)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0.55)).current;
  const checkRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      backdropOpacity.setValue(0);
      cardScale.setValue(0.88);
      cardOpacity.setValue(0);
      checkScale.setValue(0.55);
      checkRotate.setValue(0);
      return;
    }

    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        friction: 7,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(60),
        Animated.spring(checkScale, {
          toValue: 1,
          friction: 5,
          tension: 130,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.delay(60),
        Animated.timing(checkRotate, {
          toValue: 1,
          duration: 480,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [visible, backdropOpacity, cardOpacity, cardScale, checkScale, checkRotate]);

  if (!visible) {
    return null;
  }

  const dateRange = formatDateRange(summary.startDate, summary.endDate);
  const stats: { label: string; value: string }[] = [];

  if (summary.durationDays != null) {
    stats.push({ label: '여행 일수', value: `${summary.durationDays}일` });
  }
  if (summary.placeCount != null) {
    stats.push({ label: '방문 장소', value: `${summary.placeCount}곳` });
  }
  if (summary.totalDistanceKm != null) {
    stats.push({
      label: '이동 거리',
      value: `${Math.round(summary.totalDistanceKm)}km`,
    });
  }

  const checkSpin = checkRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-14deg', '0deg'],
  });

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <Pressable style={styles.backdropHit} onPress={onClose}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
      </Pressable>

      <SafeConfettiBurst active={visible} />

      <Animated.View
        style={[
          styles.cardWrap,
          {
            opacity: cardOpacity,
            transform: [{ scale: cardScale }],
          },
        ]}
        pointerEvents="box-none"
      >
        <Pressable style={styles.card} onPress={() => undefined}>
          <Animated.View
            style={[
              styles.checkBubble,
              {
                transform: [{ scale: checkScale }, { rotate: checkSpin }],
              },
            ]}
          >
            <CheckIcon color={MapTokens.green} size={28} />
          </Animated.View>
          <MapText style={styles.title}>여행을 완료했어요</MapText>
          <MapText style={styles.tripTitle}>{summary.title}</MapText>
          {dateRange ? <MapText style={styles.dateRange}>{dateRange}</MapText> : null}

          {stats.length > 0 ? (
            <View style={styles.statsRow}>
              {stats.map((stat) => (
                <View key={stat.label} style={styles.statItem}>
                  <MapText style={styles.statValue}>{stat.value}</MapText>
                  <MapText style={styles.statLabel}>{stat.label}</MapText>
                </View>
              ))}
            </View>
          ) : null}

          <Pressable style={styles.confirmButton} onPress={onClose}>
            <MapText style={styles.confirmLabel}>확인</MapText>
          </Pressable>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 950,
    elevation: 950,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  backdropHit: {
    ...StyleSheet.absoluteFill,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  cardWrap: {
    width: '100%',
  },
  card: {
    width: '100%',
    borderRadius: 20,
    backgroundColor: MapTokens.surface,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: 'center',
    gap: 10,
  },
  checkBubble: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: MapTokens.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: MapTokens.text,
    textAlign: 'center',
  },
  tripTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: MapTokens.text,
    textAlign: 'center',
  },
  dateRange: {
    fontSize: 12,
    fontWeight: '600',
    color: MapTokens.textMuted,
    textAlign: 'center',
    marginTop: -4,
  },
  statsRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: MapTokens.background,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: MapTokens.green,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: MapTokens.textMuted,
  },
  confirmButton: {
    width: '100%',
    marginTop: 6,
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: MapTokens.green,
  },
  confirmLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
  },
});

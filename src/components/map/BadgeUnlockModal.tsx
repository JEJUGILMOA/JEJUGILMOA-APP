import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import MapText from './MapText';

import { MapTokens } from '../../constants/map';
import type { ActiveTripBadge } from '../../data/mapDummy';
import { StarIcon } from './MapIcons';
import SafeConfettiBurst from './SafeConfettiBurst';

type Props = {
  visible: boolean;
  badge: ActiveTripBadge;
  recentLabels?: readonly string[];
  extraCount?: number;
  onClose: () => void;
};

/**
 * MAP-03c: 배지 획득 오버레이
 * 컨페티는 Reanimated 패키지 대신 SafeConfettiBurst(RN Animated) 사용.
 */
export default function BadgeUnlockModal({
  visible,
  badge,
  recentLabels = [],
  extraCount = 0,
  onClose,
}: Props): React.JSX.Element | null {
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.88)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const medalScale = useRef(new Animated.Value(0.6)).current;
  const medalRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      backdropOpacity.setValue(0);
      cardScale.setValue(0.88);
      cardOpacity.setValue(0);
      medalScale.setValue(0.6);
      medalRotate.setValue(0);
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
        Animated.delay(80),
        Animated.spring(medalScale, {
          toValue: 1,
          friction: 5,
          tension: 120,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.delay(80),
        Animated.timing(medalRotate, {
          toValue: 1,
          duration: 520,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [visible, backdropOpacity, cardOpacity, cardScale, medalScale, medalRotate]);

  if (!visible) {
    return null;
  }

  const progress = badge.total > 0 ? badge.collected / badge.total : 0;
  const medalSpin = medalRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-12deg', '0deg'],
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
          <View style={styles.hero}>
            <MapText style={styles.heroLabel}>NEW BADGE</MapText>
            <Animated.View
              style={[
                styles.medal,
                {
                  transform: [{ scale: medalScale }, { rotate: medalSpin }],
                },
              ]}
            >
              <StarIcon color="#FFFFFF" size={36} />
            </Animated.View>
          </View>

          <View style={styles.body}>
            <MapText style={styles.title}>{badge.title}</MapText>
            {badge.description ? (
              <MapText style={styles.desc}>{badge.description}</MapText>
            ) : null}

            <View style={styles.progressHeader}>
              <MapText style={styles.progressLabel}>배지 수집 현황</MapText>
              <MapText style={styles.progressValue}>
                {badge.collected} / {badge.total}
              </MapText>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.min(progress, 1) * 100}%` }]} />
            </View>

            {recentLabels.length > 0 || extraCount > 0 ? (
              <View style={styles.badgeRow}>
                {recentLabels.map((label) => (
                  <View key={label} style={styles.badgeChip}>
                    <MapText style={styles.badgeChipText}>{label}</MapText>
                  </View>
                ))}
                {extraCount > 0 ? (
                  <View style={styles.moreChip}>
                    <MapText style={styles.moreText}>+{extraCount}</MapText>
                  </View>
                ) : null}
              </View>
            ) : null}

            <Pressable style={styles.confirmButton} onPress={onClose}>
              <MapText style={styles.confirmLabel}>확인</MapText>
            </Pressable>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 1000,
    elevation: 1000,
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
    overflow: 'hidden',
    backgroundColor: MapTokens.surface,
  },
  hero: {
    backgroundColor: MapTokens.amber,
    paddingTop: 22,
    paddingBottom: 28,
    alignItems: 'center',
    gap: 12,
  },
  heroLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  medal: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 18,
    gap: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: MapTokens.text,
    textAlign: 'center',
  },
  desc: {
    fontSize: 13,
    color: MapTokens.textMuted,
    textAlign: 'center',
    marginTop: -4,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  progressLabel: { fontSize: 12, fontWeight: '600', color: MapTokens.textMuted },
  progressValue: { fontSize: 12, fontWeight: '700', color: MapTokens.green },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: MapTokens.border,
    overflow: 'hidden',
    marginTop: -2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: MapTokens.green,
    borderRadius: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  badgeChip: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: MapTokens.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeChipText: { fontSize: 10, fontWeight: '700', color: MapTokens.green },
  moreChip: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: MapTokens.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreText: { fontSize: 12, fontWeight: '700', color: MapTokens.textMuted },
  confirmButton: {
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
    color: '#FFFFFF',
  },
});

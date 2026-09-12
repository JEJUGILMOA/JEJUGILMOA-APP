import React, { useEffect, useRef } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import MapText from './MapText';
import {
  ConfettiCanvas,
  presets,
  useConfetti,
} from 'react-native-confetti-reanimated';

import { MapTokens } from '../../constants/map';
import type { ActiveTripBadge } from '../../data/mapDummy';
import { StarIcon } from './MapIcons';

const BADGE_CONFETTI_COLORS = [
  MapTokens.green,
  MapTokens.amber,
  MapTokens.yellow,
  '#FFFFFF',
  MapTokens.greenSoft,
] as const;

type Props = {
  visible: boolean;
  badge: ActiveTripBadge;
  recentLabels: readonly string[];
  extraCount: number;
  onShare: () => void;
  onConfirm: () => void;
};

/** MAP-03c: 배지 획득 모달 + 축하 컨페티 */
export default function BadgeUnlockModal({
  visible,
  badge,
  recentLabels,
  extraCount,
  onShare,
  onConfirm,
}: Props): React.JSX.Element {
  const { confettiRef, fire, reset } = useConfetti();
  const firedForSession = useRef(false);
  const progress = badge.total > 0 ? badge.collected / badge.total : 0;

  useEffect(() => {
    if (!visible) {
      firedForSession.current = false;
      reset();
      return;
    }

    if (firedForSession.current) {
      return;
    }

    const launchTimer = setTimeout(() => {
      firedForSession.current = true;
      void fire({
        ...presets.fireworks,
        colors: [...BADGE_CONFETTI_COLORS],
        origin: { x: 0.5, y: 0.34 },
      });
      setTimeout(() => {
        void fire({
          ...presets.stars,
          particleCount: 36,
          colors: [...BADGE_CONFETTI_COLORS],
          origin: { x: 0.5, y: 0.36 },
          spread: 100,
        });
      }, 220);
    }, 280);

    return () => clearTimeout(launchTimer);
  }, [visible, fire, reset]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onConfirm}>
      <View style={styles.backdrop}>
        <ConfettiCanvas
          ref={confettiRef}
          fullScreen
          zIndex={20}
          containerStyle={styles.confettiLayer}
        />
        <View style={styles.card}>
          <View style={styles.hero}>
            <MapText style={styles.heroLabel}>NEW BADGE</MapText>
            <View style={styles.medal}>
              <StarIcon color="#FFFFFF" size={36} />
            </View>
          </View>

          <View style={styles.body}>
            <MapText style={styles.title}>{badge.title}</MapText>
            <MapText style={styles.desc}>{badge.description}</MapText>

            <View style={styles.progressHeader}>
              <MapText style={styles.progressLabel}>배지 수집 현황</MapText>
              <MapText style={styles.progressValue}>
                {badge.collected} / {badge.total}
              </MapText>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.min(progress, 1) * 100}%` }]} />
            </View>

            <View style={styles.badgeRow}>
              {recentLabels.map((label) => (
                <View key={label} style={styles.badgeChip}>
                  <MapText style={styles.badgeChipText}>{label}</MapText>
                </View>
              ))}
              <View style={styles.moreChip}>
                <MapText style={styles.moreText}>+{extraCount}</MapText>
              </View>
            </View>

            <View style={styles.actions}>
              <Pressable style={styles.secondaryBtn} onPress={onShare}>
                <MapText style={styles.secondaryText}>자랑하기</MapText>
              </Pressable>
              <Pressable style={styles.primaryBtn} onPress={onConfirm}>
                <MapText style={styles.primaryText}>확인</MapText>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  confettiLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    pointerEvents: 'none',
  },
  card: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: MapTokens.surface,
    zIndex: 10,
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
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  secondaryBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: MapTokens.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: { fontSize: 14, fontWeight: '700', color: MapTokens.textMuted },
  primaryBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: MapTokens.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});

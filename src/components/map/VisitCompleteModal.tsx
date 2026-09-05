import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { MapTokens } from '../../constants/map';
import type { Place } from '../../types/map';
import { CategoryIcon, CheckIcon } from './MapIcons';

type Props = {
  visible: boolean;
  place: Place;
  verifiedAtLabel: string;
  orderLabel: string;
  visitedCount: number;
  totalStops: number;
  onAddPhoto: () => void;
  onNextDestination: () => void;
};

/** MAP-03b: 방문 인증 완료 모달 */
export default function VisitCompleteModal({
  visible,
  place,
  verifiedAtLabel,
  orderLabel,
  visitedCount,
  totalStops,
  onAddPhoto,
  onNextDestination,
}: Props): React.JSX.Element {
  const progress = totalStops > 0 ? visitedCount / totalStops : 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onNextDestination}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.checkBubble}>
            <CheckIcon color={MapTokens.green} size={28} />
          </View>
          <Text style={styles.title}>방문 인증이 완료되었어요</Text>

          <View style={styles.placeCard}>
            <View style={styles.thumb}>
              <CategoryIcon category={place.category} color={MapTokens.amber} size={22} />
            </View>
            <View style={styles.placeTexts}>
              <Text style={styles.placeName}>{place.name}</Text>
              <Text style={styles.placeMeta}>
                {verifiedAtLabel} · {orderLabel}
              </Text>
            </View>
          </View>

          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>여행 진행률</Text>
            <Text style={styles.progressValue}>
              {visitedCount} / {totalStops} 방문
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.min(progress, 1) * 100}%` }]} />
          </View>

          <View style={styles.actions}>
            <Pressable style={styles.secondaryBtn} onPress={onAddPhoto}>
              <Text style={styles.secondaryText}>사진 추가</Text>
            </Pressable>
            <Pressable style={styles.primaryBtn} onPress={onNextDestination}>
              <Text style={styles.primaryText}>다음 목적지</Text>
            </Pressable>
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
  card: {
    width: '100%',
    borderRadius: 20,
    backgroundColor: MapTokens.surface,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 18,
    alignItems: 'center',
    gap: 12,
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
  placeCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: MapTokens.background,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: MapTokens.amberSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeTexts: { flex: 1, minWidth: 0, gap: 2 },
  placeName: { fontSize: 15, fontWeight: '700', color: MapTokens.text },
  placeMeta: { fontSize: 12, color: MapTokens.textMuted },
  progressHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: { fontSize: 12, fontWeight: '600', color: MapTokens.textMuted },
  progressValue: { fontSize: 12, fontWeight: '700', color: MapTokens.green },
  progressTrack: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: MapTokens.border,
    overflow: 'hidden',
    marginTop: -4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: MapTokens.green,
    borderRadius: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 4,
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

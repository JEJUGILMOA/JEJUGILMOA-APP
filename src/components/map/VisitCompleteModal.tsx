import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import MapText from './MapText';

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
  onClose: () => void;
};

/** MAP-03b: 방문 인증 완료 모달 */
export default function VisitCompleteModal({
  visible,
  place,
  verifiedAtLabel,
  orderLabel,
  visitedCount,
  totalStops,
  onClose,
}: Props): React.JSX.Element {
  const progress = totalStops > 0 ? visitedCount / totalStops : 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        {/* 카드 영역 탭이 backdrop onPress로 전파되지 않도록 흡수 */}
        <Pressable style={styles.card} onPress={() => undefined}>
          <View style={styles.checkBubble}>
            <CheckIcon color={MapTokens.green} size={28} />
          </View>
          <MapText style={styles.title}>방문 인증이 완료되었어요</MapText>

          <View style={styles.placeCard}>
            <View style={styles.thumb}>
              <CategoryIcon category={place.category} color={MapTokens.amber} size={22} />
            </View>
            <View style={styles.placeTexts}>
              <MapText style={styles.placeName}>{place.name}</MapText>
              <MapText style={styles.placeMeta}>
                {verifiedAtLabel} · {orderLabel}
              </MapText>
            </View>
          </View>

          <View style={styles.progressHeader}>
            <MapText style={styles.progressLabel}>여행 진행률</MapText>
            <MapText style={styles.progressValue}>
              {visitedCount} / {totalStops} 방문
            </MapText>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.min(progress, 1) * 100}%` }]} />
          </View>
        </Pressable>
      </Pressable>
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
    paddingBottom: 22,
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
});

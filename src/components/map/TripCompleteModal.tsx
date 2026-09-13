import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import MapText from './MapText';

import { MapTokens } from '../../constants/map';
import { CheckIcon } from './MapIcons';

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

/** 여행 완료(POST /trips/{id}/complete) 요약 모달 */
export default function TripCompleteModal({
  visible,
  summary,
  onClose,
}: Props): React.JSX.Element {
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

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => undefined}>
          <View style={styles.checkBubble}>
            <CheckIcon color={MapTokens.green} size={28} />
          </View>
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

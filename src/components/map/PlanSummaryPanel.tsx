import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CATEGORY_LABELS, MapTokens } from '../../constants/map';
import type { PlanTravelLeg, PlanWaypoint } from '../../types/map';
import { CarIcon, ChevronLeftIcon } from './MapIcons';

/** 계획 지도에서 하단 패널이 차지하는 화면 높이 비율 */
export const PLAN_PANEL_HEIGHT_RATIO = 0.4;

type Props = {
  planTitle: string;
  durationLabel: string;
  waypoints: PlanWaypoint[];
  legs: PlanTravelLeg[];
  selectedId: string | null;
  loading?: boolean;
  onPressBack?: () => void;
  onPressWaypoint: (waypoint: PlanWaypoint) => void;
  onPressDetailSchedule: () => void;
};

function legBetween(
  legs: PlanTravelLeg[] | undefined,
  fromId: string,
  toId: string,
): PlanTravelLeg | undefined {
  return (legs ?? []).find((leg) => leg.fromId === fromId && leg.toId === toId);
}

export default function PlanSummaryPanel({
  planTitle,
  durationLabel,
  waypoints,
  legs = [],
  selectedId,
  loading = false,
  onPressBack,
  onPressWaypoint,
  onPressDetailSchedule,
}: Props): React.JSX.Element {
  return (
    <View style={styles.panel}>
      <View style={styles.header}>
        <View style={styles.headerTexts}>
          <View style={styles.titleRow}>
            {onPressBack ? (
              <Pressable
                onPress={onPressBack}
                hitSlop={8}
                style={styles.backButton}
                accessibilityRole="button"
                accessibilityLabel="계획 목록으로"
              >
                <ChevronLeftIcon color={MapTokens.text} size={22} />
              </Pressable>
            ) : null}
            <Text style={styles.title} numberOfLines={1}>
              {planTitle}
            </Text>
          </View>
          <Text style={styles.summary}>
            {waypoints.length}개 장소 · {durationLabel}
          </Text>
        </View>
        <Pressable onPress={onPressDetailSchedule} hitSlop={6}>
          <Text style={styles.detailLink}>상세 일정 보기 ›</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={MapTokens.green} />
        </View>
      ) : null}

      {!loading ? (
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
      >
        {waypoints.map((wp, index) => {
          const next = waypoints[index + 1];
          const leg = next ? legBetween(legs, wp.id, next.id) : undefined;
          const selected = selectedId === wp.id;

          return (
            <View key={wp.id}>
              <Pressable
                style={[styles.row, selected && styles.rowSelected]}
                onPress={() => onPressWaypoint(wp)}
              >
                <View style={styles.orderBadge}>
                  <Text style={styles.orderText}>{wp.order}</Text>
                </View>
                <View style={styles.rowBody}>
                  <View style={styles.nameRow}>
                    <Text style={styles.placeName} numberOfLines={1}>
                      {wp.name}
                    </Text>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryText}>
                        {CATEGORY_LABELS[wp.category]}
                      </Text>
                    </View>
                  </View>
                </View>
                {wp.visitTime ? <Text style={styles.time}>{wp.visitTime}</Text> : null}
              </Pressable>

              {leg ? (
                <View style={styles.legRow}>
                  <View style={styles.legLine} />
                  <View style={styles.legChip}>
                    <CarIcon color={MapTokens.textMuted} size={12} />
                    <Text style={styles.legText}>
                      {leg.durationMinutes}분 ({leg.distanceKm}km)
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>
          );
        })}
      </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    backgroundColor: MapTokens.surface,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: MapTokens.border,
    // 탭바가 이미 safe-area(insets.bottom)를 포함하므로 여기선 최소 여백만
    paddingBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  headerTexts: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minWidth: 0,
  },
  backButton: {
    marginLeft: -4,
    marginRight: 2,
    paddingVertical: 2,
  },
  title: {
    flexShrink: 1,
    fontSize: 17,
    fontWeight: '700',
    color: MapTokens.text,
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summary: {
    fontSize: 13,
    color: MapTokens.textMuted,
  },
  detailLink: {
    fontSize: 13,
    fontWeight: '600',
    color: MapTokens.green,
    marginTop: 2,
  },
  list: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  rowSelected: {
    backgroundColor: MapTokens.greenSoft,
  },
  orderBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: MapTokens.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  placeName: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '700',
    color: MapTokens.text,
  },
  categoryBadge: {
    backgroundColor: MapTokens.greenSoft,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  categoryText: {
    fontSize: 11,
    color: MapTokens.green,
    fontWeight: '600',
  },
  time: {
    fontSize: 13,
    color: MapTokens.textMuted,
    fontWeight: '500',
  },
  legRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 20,
    gap: 8,
    marginVertical: 2,
  },
  legLine: {
    width: 2,
    height: 18,
    borderRadius: 1,
    backgroundColor: MapTokens.border,
    marginLeft: 11,
  },
  legChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legText: {
    fontSize: 12,
    color: MapTokens.textMuted,
  },
});

import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import MapText from './MapText';

import type { TravelPlanSummary } from '../../api/plans';
import { MapTokens } from '../../constants/map';
import {
  formatPlanDDay,
  formatPlanDurationLabel,
  planStatusLabel,
} from '../../utils/planMapMappers';

/** 계획 목록 패널 — 바텀시트와 동일 높이 비율 사용 */
export const PLAN_LIST_PANEL_HEIGHT_RATIO = 0.4;

type Props = {
  plans: TravelPlanSummary[];
  loading?: boolean;
  onSelectPlan: (plan: TravelPlanSummary) => void;
};

export default function PlanListPanel({
  plans,
  loading = false,
  onSelectPlan,
}: Props): React.JSX.Element {
  return (
    <View style={styles.panel}>
      <View style={styles.header}>
        <MapText style={styles.title}>내 계획</MapText>
        <MapText style={styles.subtitle}>지도에 표시할 여행을 선택하세요</MapText>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={MapTokens.green} />
          <MapText style={styles.hint}>계획을 불러오는 중…</MapText>
        </View>
      ) : plans.length === 0 ? (
        <View style={styles.centered}>
          <MapText style={styles.emptyTitle}>아직 계획이 없어요</MapText>
          <MapText style={styles.hint}>계획 탭에서 여행을 만들어 보세요</MapText>
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator
          keyboardShouldPersistTaps="handled"
        >
          {plans.map((plan) => (
            <Pressable
              key={plan.planId}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              onPress={() => onSelectPlan(plan)}
            >
              <View style={styles.rowBody}>
                <View style={styles.titleRow}>
                  <MapText style={styles.planTitle} numberOfLines={1}>
                    {plan.title}
                  </MapText>
                  <View style={styles.statusBadge}>
                    <MapText style={styles.statusText}>
                      {planStatusLabel(plan.status)}
                    </MapText>
                  </View>
                </View>
                <MapText style={styles.meta} numberOfLines={1}>
                  {formatPlanDurationLabel(plan.nights, plan.days)} · 장소{' '}
                  {plan.waypointCount}곳 · {formatPlanDDay(plan.dDay)}
                </MapText>
                <MapText style={styles.dates} numberOfLines={1}>
                  {plan.startDate} ~ {plan.endDate}
                </MapText>
              </View>
              <MapText style={styles.chevron}>›</MapText>
            </Pressable>
          ))}
        </ScrollView>
      )}
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
    paddingBottom: 8,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    gap: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: MapTokens.text,
  },
  subtitle: {
    fontSize: 13,
    color: MapTokens.textMuted,
  },
  list: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: MapTokens.background,
  },
  rowPressed: {
    backgroundColor: MapTokens.greenSoft,
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planTitle: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '700',
    color: MapTokens.text,
  },
  statusBadge: {
    backgroundColor: MapTokens.greenSoft,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: MapTokens.green,
  },
  meta: {
    fontSize: 13,
    color: MapTokens.textMuted,
  },
  dates: {
    fontSize: 12,
    color: MapTokens.textMuted,
  },
  chevron: {
    fontSize: 22,
    fontWeight: '600',
    color: MapTokens.textMuted,
    paddingHorizontal: 4,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: MapTokens.text,
  },
  hint: {
    fontSize: 13,
    color: MapTokens.textMuted,
    textAlign: 'center',
  },
});

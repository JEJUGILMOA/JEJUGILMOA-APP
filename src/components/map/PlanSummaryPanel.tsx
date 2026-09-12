import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import MapText from './MapText';

import { CATEGORY_LABELS, MapTokens, planDayColor } from '../../constants/map';
import type { PlanTravelLeg, PlanWaypoint } from '../../types/map';
import { CarIcon, ChevronLeftIcon, LocateIcon } from './MapIcons';

/** 계획 지도에서 하단 패널이 차지하는 화면 높이 비율 */
export const PLAN_PANEL_HEIGHT_RATIO = 0.4;

type Props = {
  planTitle: string;
  durationLabel: string;
  waypoints: PlanWaypoint[];
  legs: PlanTravelLeg[];
  selectedId: string | null;
  /** null이면 전체 일차 표시 */
  selectedDayNumber?: number | null;
  loading?: boolean;
  onPressBack?: () => void;
  onPressWaypoint: (waypoint: PlanWaypoint) => void;
  onPressDay?: (dayNumber: number) => void;
  onPressDetailSchedule: () => void;
};

function legBetween(
  legs: PlanTravelLeg[] | undefined,
  fromId: string,
  toId: string,
  dayNumber?: number,
): PlanTravelLeg | undefined {
  return (legs ?? []).find((leg) => {
    if (leg.fromId !== fromId || leg.toId !== toId) return false;
    if (dayNumber != null && leg.dayNumber != null) {
      return leg.dayNumber === dayNumber;
    }
    return true;
  });
}

export default function PlanSummaryPanel({
  planTitle,
  durationLabel,
  waypoints,
  legs = [],
  selectedId,
  selectedDayNumber = null,
  loading = false,
  onPressBack,
  onPressWaypoint,
  onPressDay,
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
            <MapText style={styles.title} numberOfLines={1}>
              {planTitle}
            </MapText>
          </View>
          <MapText style={styles.summary}>
            {waypoints.length}개 장소 · {durationLabel}
          </MapText>
        </View>
        <Pressable onPress={onPressDetailSchedule} hitSlop={6}>
          <MapText style={styles.detailLink}>상세 일정 보기 ›</MapText>
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
            const dayNumber = wp.dayNumber ?? 1;
            const nextSameDay = next != null && (next.dayNumber ?? 1) === dayNumber;
            const leg =
              next && nextSameDay
                ? legBetween(legs, wp.id, next.id, dayNumber)
                : undefined;
            const selected = selectedId === wp.id;
            const showDayHeader =
              index === 0 || (waypoints[index - 1]?.dayNumber ?? 1) !== dayNumber;
            const badgeColor = planDayColor(dayNumber);
            const daySelected = selectedDayNumber === dayNumber;

            return (
              <View key={`${dayNumber}-${wp.order}-${wp.id}`}>
                {showDayHeader ? (
                  <Pressable
                    onPress={() => onPressDay?.(dayNumber)}
                    style={[
                      styles.dayHeaderButton,
                      {
                        borderColor: daySelected ? badgeColor : MapTokens.border,
                        backgroundColor: daySelected
                          ? `${badgeColor}1F`
                          : MapTokens.surface,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: daySelected }}
                    accessibilityLabel={`${dayNumber}일차만 지도에 보기`}
                  >
                    <LocateIcon color={badgeColor} size={16} />
                    <MapText style={[styles.dayHeader, { color: badgeColor }]}>
                      {dayNumber}일차
                    </MapText>
                  </Pressable>
                ) : null}
                <Pressable
                  style={[styles.row, selected && styles.rowSelected]}
                  onPress={() => onPressWaypoint(wp)}
                >
                  <View style={[styles.orderBadge, { backgroundColor: badgeColor }]}>
                    <MapText style={styles.orderText}>{wp.order}</MapText>
                  </View>
                  <View style={styles.rowBody}>
                    <View style={styles.nameRow}>
                      <MapText style={styles.placeName} numberOfLines={1}>
                        {wp.name}
                      </MapText>
                      <View style={styles.categoryBadge}>
                        <MapText style={styles.categoryText}>
                          {CATEGORY_LABELS[wp.category]}
                        </MapText>
                      </View>
                    </View>
                  </View>
                  {wp.visitTime ? <MapText style={styles.time}>{wp.visitTime}</MapText> : null}
                </Pressable>

                {leg ? (
                  <View style={styles.legRow}>
                    <View style={[styles.legLine, { backgroundColor: badgeColor }]} />
                    <View style={styles.legChip}>
                      <CarIcon color={MapTokens.textMuted} size={12} />
                      <MapText style={styles.legText}>
                        {leg.durationMinutes}분 ({leg.distanceKm}km)
                      </MapText>
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
  dayHeaderButton: {
    alignSelf: 'flex-start',
    marginTop: 12,
    marginBottom: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dayHeader: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
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

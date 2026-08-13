import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MapTokens } from '../../constants/map';
import type { PlanWaypoint } from '../../types/map';

type Props = {
  planTitle: string;
  waypoints: PlanWaypoint[];
  onPressWaypoint: (waypoint: PlanWaypoint) => void;
  bottomOffset: number;
};

export default function PlanSummarySheet({
  planTitle,
  waypoints,
  onPressWaypoint,
  bottomOffset,
}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.wrap,
        {
          bottom: bottomOffset,
          paddingBottom: Math.max(insets.bottom, 12) + 12,
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{planTitle}</Text>
        <Text style={styles.count}>경유지 {waypoints.length}곳 ▾</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {waypoints.map((wp) => (
          <Pressable key={wp.id} style={styles.chip} onPress={() => onPressWaypoint(wp)}>
            <Text style={styles.chipText}>
              {wp.order} {wp.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 16,
    backgroundColor: MapTokens.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: MapTokens.border,
    paddingTop: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: MapTokens.text,
  },
  count: {
    fontSize: 12,
    color: MapTokens.textMuted,
  },
  chips: {
    gap: 10,
    paddingRight: 4,
  },
  chip: {
    borderWidth: 1,
    borderColor: MapTokens.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: MapTokens.background,
  },
  chipText: {
    fontSize: 12,
    color: MapTokens.text,
    fontWeight: '500',
  },
});

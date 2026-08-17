import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MapTokens } from '../../constants/map';

type Props = {
  tripTitle: string;
  currentStop: number;
  totalStops: number;
  topOffset: number;
  onPress: () => void;
};

/** MAP-03: 상단 여행 진행 뱃지 — "제주 동부 여행 · 2/5 ›" */
export default function TripProgressBadge({
  tripTitle,
  currentStop,
  totalStops,
  topOffset,
  onPress,
}: Props): React.JSX.Element {
  return (
    <Pressable
      style={[styles.wrap, { top: topOffset }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${tripTitle}, ${currentStop} of ${totalStops}`}
    >
      <View style={styles.dot} />
      <Text style={styles.text} numberOfLines={1}>
        {tripTitle}
        <Text style={styles.muted}> · </Text>
        {currentStop}/{totalStops}
      </Text>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 14,
    zIndex: 17,
    maxWidth: '78%',
    height: 36,
    borderRadius: 18,
    backgroundColor: MapTokens.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: MapTokens.green,
  },
  text: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '700',
    color: MapTokens.text,
  },
  muted: {
    fontWeight: '500',
    color: MapTokens.textMuted,
  },
  chevron: {
    fontSize: 16,
    fontWeight: '600',
    color: MapTokens.textMuted,
    marginTop: -1,
  },
});

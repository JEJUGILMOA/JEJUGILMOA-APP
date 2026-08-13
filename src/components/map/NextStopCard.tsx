import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MapTokens } from '../../constants/map';
import type { Place } from '../../types/map';
import { ArrowUpRightIcon, PlayIcon } from './MapIcons';

type Props = {
  place: Place;
  distanceMeters: number;
  walkMinutes: number;
  onPress: () => void;
  bottomOffset: number;
};

export default function NextStopCard({
  place,
  distanceMeters,
  walkMinutes,
  onPress,
  bottomOffset,
}: Props): React.JSX.Element {
  return (
    <Pressable style={[styles.wrap, { bottom: bottomOffset }]} onPress={onPress}>
      <View style={styles.play}>
        <PlayIcon color="#FFFFFF" size={16} />
      </View>
      <View style={styles.texts}>
        <Text style={styles.label}>다음 장소: {place.name}</Text>
        <Text style={styles.meta}>
          도보 {walkMinutes}분 · {distanceMeters}m
        </Text>
      </View>
      <View style={styles.nav}>
        <ArrowUpRightIcon color={MapTokens.blue} size={16} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 16,
    minHeight: 56,
    backgroundColor: MapTokens.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: MapTokens.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  play: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: MapTokens.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: MapTokens.text,
  },
  meta: {
    marginTop: 2,
    fontSize: 12,
    color: MapTokens.textMuted,
  },
  nav: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: MapTokens.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { MapTokens } from '../../constants/map';
import { WalkIcon } from './MapIcons';

type Props = {
  walkMinutes: number;
  distanceMeters: number;
  /** 지도 영역 기준 상단 비율 위치 (바텀시트에 가리지 않도록) */
  topRatio?: number;
};

/** MAP-03: 경로 위 도보 시간·거리 pill */
export default function PathInfoPill({
  walkMinutes,
  distanceMeters,
  topRatio = 0.42,
}: Props): React.JSX.Element {
  return (
    <View
      pointerEvents="none"
      style={[styles.anchor, { top: `${topRatio * 100}%` }]}
    >
      <View style={styles.pill}>
        <WalkIcon color={MapTokens.blue} size={14} />
        <Text style={styles.text}>
          도보 {walkMinutes}분 · {distanceMeters}m
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 12,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: MapTokens.surface,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    color: MapTokens.text,
  },
});

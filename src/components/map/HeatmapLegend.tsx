import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapText from './MapText';

import { MapTokens } from '../../constants/map';

type Props = {
  bottomOffset: number;
};

export default function HeatmapLegend({ bottomOffset }: Props): React.JSX.Element {
  return (
    <View style={[styles.wrap, { bottom: bottomOffset }]}>
      <View style={styles.row}>
        <View style={[styles.swatch, { backgroundColor: MapTokens.coral }]} />
        <MapText style={styles.label}>매우 혼잡</MapText>
      </View>
      <View style={styles.row}>
        <View style={[styles.swatch, { backgroundColor: MapTokens.yellow }]} />
        <MapText style={styles.label}>보통</MapText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 14,
    zIndex: 16,
    backgroundColor: MapTokens.surface,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  label: {
    fontSize: 12,
    color: MapTokens.text,
  },
});

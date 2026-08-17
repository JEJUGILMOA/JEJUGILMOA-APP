import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { MapTokens } from '../../constants/map';
import { LayersIcon } from './MapIcons';

type Props = {
  onPress: () => void;
  bottomOffset: number;
};

/** MAP-03: 지도 레이어 FAB (현위치 버튼 위) */
export default function MapLayersButton({
  onPress,
  bottomOffset,
}: Props): React.JSX.Element {
  return (
    <Pressable
      style={[styles.fab, { bottom: bottomOffset }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="지도 레이어"
    >
      <LayersIcon color={MapTokens.text} size={20} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 16,
    zIndex: 5,
    elevation: 2,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: MapTokens.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
});

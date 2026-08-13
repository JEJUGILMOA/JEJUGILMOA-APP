import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { MapTokens } from '../../constants/map';
import { LocateIcon } from './MapIcons';

type Props = {
  onPress: () => void;
  bottomOffset: number;
};

export default function MyLocationButton({
  onPress,
  bottomOffset,
}: Props): React.JSX.Element {
  return (
    <Pressable
      style={[styles.fab, { bottom: bottomOffset }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="현재 위치로 이동"
    >
      <LocateIcon color={MapTokens.blue} size={22} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 16,
    zIndex: 18,
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
    elevation: 4,
  },
});

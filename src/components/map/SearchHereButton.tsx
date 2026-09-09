import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MapTokens } from '../../constants/map';

type Props = {
  onPress: () => void;
  topOffset: number;
};

/** 지도 이동 후 현재 화면 기준으로 장소를 다시 검색 */
export default function SearchHereButton({
  onPress,
  topOffset,
}: Props): React.JSX.Element {
  return (
    <View style={[styles.wrap, { top: topOffset }]} pointerEvents="box-none">
      <Pressable
        style={styles.button}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="현 위치에서 검색"
      >
        <Text style={styles.label}>현 위치에서 검색</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 12,
    elevation: 6,
    alignItems: 'center',
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: MapTokens.surface,
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
  },
  label: {
    color: MapTokens.text,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});

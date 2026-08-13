import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MapTokens } from '../../constants/map';
import { LayersIcon, SearchIcon } from './MapIcons';

type Props = {
  searchLabel: string;
  onPressSearch: () => void;
  onPressMode: () => void;
};

export default function MapTopBar({
  searchLabel,
  onPressSearch,
  onPressMode,
}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
      <Pressable style={styles.search} onPress={onPressSearch} accessibilityRole="button">
        <SearchIcon color={MapTokens.textMuted} size={18} />
        <Text style={styles.searchText} numberOfLines={1}>
          {searchLabel}
        </Text>
      </Pressable>
      <Pressable style={styles.mode} onPress={onPressMode} accessibilityRole="button">
        <LayersIcon color={MapTokens.green} size={16} />
        <Text style={styles.modeText}>모드</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 8,
  },
  search: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: MapTokens.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  searchText: {
    flex: 1,
    fontSize: 14,
    color: MapTokens.textMuted,
  },
  mode: {
    height: 44,
    minWidth: 72,
    borderRadius: 12,
    backgroundColor: MapTokens.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  modeText: {
    fontSize: 13,
    fontWeight: '600',
    color: MapTokens.text,
  },
});

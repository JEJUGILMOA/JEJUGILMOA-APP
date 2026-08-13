import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CATEGORY_CHIPS, MapTokens, type PlaceCategory } from '../../constants/map';
import { CategoryIcon } from './MapIcons';

type Props = {
  selected: PlaceCategory;
  onSelect: (category: PlaceCategory) => void;
  topOffset: number;
};

export default function CategoryChips({
  selected,
  onSelect,
  topOffset,
}: Props): React.JSX.Element {
  return (
    <View style={[styles.wrap, { top: topOffset }]} pointerEvents="box-none">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {CATEGORY_CHIPS.map((chip) => {
          const active = chip.id === selected;
          const iconColor = active ? '#FFFFFF' : MapTokens.text;
          return (
            <Pressable
              key={chip.id}
              style={[styles.chip, active ? styles.chipActive : styles.chipIdle]}
              onPress={() => onSelect(chip.id)}
            >
              <CategoryIcon category={chip.id} color={iconColor} size={14} />
              <Text style={[styles.label, active && styles.labelActive]}>{chip.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 19,
  },
  row: {
    paddingHorizontal: 14,
    gap: 8,
  },
  chip: {
    height: 32,
    borderRadius: 16,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
  },
  chipActive: {
    backgroundColor: MapTokens.green,
    borderColor: MapTokens.green,
  },
  chipIdle: {
    backgroundColor: MapTokens.surface,
    borderColor: MapTokens.border,
  },
  label: {
    fontSize: 13,
    color: MapTokens.text,
    fontWeight: '500',
  },
  labelActive: {
    color: '#FFFFFF',
  },
});

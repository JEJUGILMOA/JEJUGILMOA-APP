import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MapTokens } from '../../constants/map';
import { ChevronLeftIcon, StarIcon } from './MapIcons';

type Props = {
  isFavorite?: boolean;
  onBack: () => void;
  onToggleFavorite: () => void;
};

/** MAP-06: 장소 상세 시 상단 플로팅 컨트롤 (검색바 대체) */
export default function PlaceDetailChrome({
  isFavorite,
  onBack,
  onToggleFavorite,
}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.wrap, { paddingTop: insets.top + 8 }]}
      pointerEvents="box-none"
    >
      <Pressable
        style={styles.btn}
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="뒤로"
      >
        <ChevronLeftIcon color={MapTokens.text} size={22} />
      </Pressable>
      <Pressable
        style={styles.btn}
        onPress={onToggleFavorite}
        accessibilityRole="button"
        accessibilityLabel={isFavorite ? '즐겨찾기 해제' : '즐겨찾기'}
      >
        <StarIcon
          color={isFavorite ? MapTokens.amber : MapTokens.text}
          filled={Boolean(isFavorite)}
          size={20}
        />
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
    zIndex: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  btn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: MapTokens.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
});

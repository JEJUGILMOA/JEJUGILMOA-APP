import React from 'react';
import { StyleSheet, View } from 'react-native';

import { MapTokens, type PlaceApiCategory, type PlaceCategory } from '../../constants/map';
import { CategoryIcon } from './MapIcons';

type PinCategory = PlaceApiCategory | 'favorite';

const PIN_COLORS: Record<PinCategory, string> = {
  nature: MapTokens.green,
  food: MapTokens.coral,
  cafe: MapTokens.blue,
  activity: '#C2410C',
  history: '#854F0B',
  shopping: '#993556',
  festival: MapTokens.purple,
  stay: '#3B4F7A',
  favorite: MapTokens.amber,
};

export type CategoryMapPinProps = {
  category: PlaceApiCategory;
  isFavorite?: boolean;
  /** 기본 28 */
  size?: number;
  selected?: boolean;
};

/**
 * 카테고리별 원형 맵 핀 (아이콘).
 * NaverMapMarkerOverlay children으로 사용 (collapsable={false} 필수).
 * 장소명은 Marker의 caption으로 표시한다.
 */
export default function CategoryMapPin({
  category,
  isFavorite = false,
  size = 28,
  selected = false,
}: CategoryMapPinProps): React.JSX.Element {
  const dim = selected ? size + 6 : size;
  const tone: PinCategory = isFavorite ? 'favorite' : category;
  const iconSize = Math.round(dim * 0.5);

  return (
    <View
      collapsable={false}
      style={[
        styles.pin,
        {
          width: dim,
          height: dim,
          borderRadius: dim / 2,
          backgroundColor: PIN_COLORS[tone],
        },
        selected ? styles.pinSelected : null,
      ]}
    >
      <CategoryIcon category={tone as PlaceCategory} color="#FFFFFF" size={iconSize} />
    </View>
  );
}

export const CATEGORY_PIN_SIZE = 28;
export const CATEGORY_PIN_SELECTED_SIZE = 34;

const styles = StyleSheet.create({
  pin: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  pinSelected: {
    shadowOpacity: 0.28,
    shadowRadius: 5,
    elevation: 5,
  },
});

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text as SvgText, Svg } from 'react-native-svg';

import { planDayColor } from '../../constants/map';

export type PlanDayMapPinProps = {
  /** 해당 일차 내 순서 (1부터) */
  order: number;
  /** 1일차 = 1 */
  dayNumber?: number;
  /** 지정 시 dayNumber 색 대신 사용 */
  color?: string;
  textColor?: string;
  borderColor?: string;
  size?: number;
  selected?: boolean;
};

/**
 * 계획 지도용 작은 원형 핀 — 일차 색 배경 + 순서 숫자(SVG).
 * RN Text는 네이버 마커 스냅샷에 안 잡히는 경우가 있어 SvgText 사용.
 * 장소명은 Marker caption으로 핀 아래에 표시한다.
 */
export default function PlanDayMapPin({
  order,
  dayNumber = 1,
  color,
  textColor = '#FFFFFF',
  borderColor = '#FFFFFF',
  size = 24,
  selected = false,
}: PlanDayMapPinProps): React.JSX.Element {
  const dim = selected ? size + 4 : size;
  const backgroundColor = color ?? planDayColor(dayNumber);
  const fontSize = order >= 10 ? Math.round(dim * 0.42) : Math.round(dim * 0.5);

  return (
    <View
      collapsable={false}
      style={[
        styles.pin,
        {
          width: dim,
          height: dim,
          borderRadius: dim / 2,
          backgroundColor,
          borderColor,
        },
        selected ? styles.pinSelected : null,
      ]}
    >
      <Svg width={dim} height={dim}>
        <SvgText
          x={dim / 2}
          y={dim / 2 + fontSize * 0.35}
          textAnchor="middle"
          fontSize={fontSize}
          fontWeight="700"
          fill={textColor}
        >
          {String(order)}
        </SvgText>
      </Svg>
    </View>
  );
}

export const PLAN_DAY_PIN_SIZE = 24;
export const PLAN_DAY_PIN_SELECTED_SIZE = 28;

const styles = StyleSheet.create({
  pin: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 2.5,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  pinSelected: {
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});

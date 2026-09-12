import React from 'react';
import { Text, type TextProps } from 'react-native';

/**
 * 지도 오버레이용 텍스트.
 * 길게 누르거나 밀어서 선택(selection)되는 것을 기본으로 막는다.
 */
export default function MapText({
  selectable = false,
  ...props
}: TextProps): React.JSX.Element {
  return <Text selectable={selectable} {...props} />;
}

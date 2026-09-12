import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import MapText from './MapText';

import { MapTokens } from '../../constants/map';
import { CloseIcon, FlagIcon } from './MapIcons';

type Props = {
  topOffset: number;
  onPressOtherMap: () => void;
  onDismiss: () => void;
};

/** MAP-03: 진행중 여행 상태 배너 */
export default function ActiveTripStatusBanner({
  topOffset,
  onPressOtherMap,
  onDismiss,
}: Props): React.JSX.Element {
  return (
    <View style={[styles.wrap, { top: topOffset }]}>
      <FlagIcon color={MapTokens.coral} size={16} />
      <MapText style={styles.text} numberOfLines={1}>
        진행중 여행 지도 표시 중
      </MapText>
      <Pressable onPress={onPressOtherMap} hitSlop={6}>
        <MapText style={styles.link}>다른 지도</MapText>
      </Pressable>
      <Pressable onPress={onDismiss} hitSlop={8} style={styles.closeBtn}>
        <CloseIcon color={MapTokens.textMuted} size={16} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 14,
    right: 14,
    zIndex: 17,
    height: 40,
    borderRadius: 10,
    backgroundColor: MapTokens.blueSoft,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  text: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: MapTokens.text,
  },
  link: {
    fontSize: 12,
    color: MapTokens.blue,
    fontWeight: '700',
  },
  closeBtn: {
    paddingLeft: 2,
  },
});

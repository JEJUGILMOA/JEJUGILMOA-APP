import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import MapText from './MapText';
import { Path, Svg } from 'react-native-svg';

import type { PlanItineraryChromeState } from '../../bridge/webviewBridge';
import { MapTokens } from '../../constants/map';

type Props = {
  chrome: PlanItineraryChromeState;
  insetTop: number;
  onBack: () => void;
  onNext: () => void;
  onDayChange: (day: number) => void;
  onSearchChange: (query: string) => void;
  onSearchClear: () => void;
  onDepartureCancel: () => void;
};

/** 검색은 WebView 바텀시트(장소 추가 탭)로 옮겼다 — 상단에는 Day 페이저만 둔다. */
export default function ItineraryChrome({
  chrome,
  insetTop,
  onBack,
  onNext,
  onDayChange,
}: Props): React.JSX.Element | null {
  if (!chrome.visible) return null;

  return (
    <View style={[styles.wrap, { paddingTop: insetTop + 8 }]} pointerEvents="box-none">
      <View style={styles.row} pointerEvents="box-none">
        <Pressable style={styles.circle} onPress={onBack} accessibilityLabel="뒤로 가기">
          <ChevronIcon direction="left" />
        </Pressable>
        <View style={styles.pager}>
          <Pressable
            style={styles.pagerArrow}
            onPress={() => onDayChange(Math.max(chrome.day - 1, 1))}
            disabled={chrome.day <= 1}
            accessibilityLabel="이전 Day"
          >
            <ChevronIcon direction="left" size={18} muted={chrome.day <= 1} />
          </Pressable>
          <MapText style={styles.pagerLabel} numberOfLines={1}>
            Day {chrome.day} · {chrome.dateLabel}
          </MapText>
          <Pressable
            style={styles.pagerArrow}
            onPress={() => onDayChange(Math.min(chrome.day + 1, chrome.totalDays))}
            disabled={chrome.day >= chrome.totalDays}
            accessibilityLabel="다음 Day"
          >
            <ChevronIcon direction="right" size={18} muted={chrome.day >= chrome.totalDays} />
          </Pressable>
        </View>
        {chrome.nextLabel ? (
          <Pressable style={styles.next} onPress={onNext}>
            <MapText style={styles.nextLabel}>{chrome.nextLabel}</MapText>
          </Pressable>
        ) : (
          <View style={styles.circleSpacer} />
        )}
      </View>
    </View>
  );
}

function ChevronIcon({
  direction,
  size = 22,
  muted = false,
}: {
  direction: 'left' | 'right';
  size?: number;
  muted?: boolean;
}): React.JSX.Element {
  const d = direction === 'left' ? 'M15 18 9 12l6-6' : 'M9 18l6-6-6-6';
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d={d}
        stroke={muted ? '#C4C4C0' : MapTokens.text}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    paddingHorizontal: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  circleSpacer: {
    width: 40,
    height: 40,
  },
  pager: {
    flex: 1,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  pagerArrow: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pagerLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    color: MapTokens.text,
  },
  next: {
    height: 37,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  nextLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#17783C',
  },
});

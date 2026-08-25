import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
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

export default function ItineraryChrome({
  chrome,
  insetTop,
  onBack,
  onNext,
  onDayChange,
  onSearchChange,
  onSearchClear,
  onDepartureCancel,
}: Props): React.JSX.Element | null {
  const inputRef = useRef<TextInput>(null);
  const focusedRef = useRef(false);
  const [query, setQuery] = useState(chrome.searchQuery);

  useEffect(() => {
    if (!focusedRef.current) setQuery(chrome.searchQuery);
  }, [chrome.searchQuery]);

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
          <Text style={styles.pagerLabel} numberOfLines={1}>
            Day {chrome.day} · {chrome.dateLabel}
          </Text>
          <Pressable
            style={styles.pagerArrow}
            onPress={() => onDayChange(Math.min(chrome.day + 1, chrome.totalDays))}
            disabled={chrome.day >= chrome.totalDays}
            accessibilityLabel="다음 Day"
          >
            <ChevronIcon direction="right" size={18} muted={chrome.day >= chrome.totalDays} />
          </Pressable>
        </View>
        <Pressable style={styles.next} onPress={onNext}>
          <Text style={styles.nextLabel}>{chrome.nextLabel}</Text>
        </Pressable>
      </View>
      <View style={[styles.search, chrome.isSelectingDeparture && styles.searchActive]}>
        {chrome.isSelectingDeparture ? (
          <Text style={styles.modeLabel}>🚩 출발지</Text>
        ) : (
          <SearchIcon />
        )}
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={query}
          onChangeText={(value) => {
            setQuery(value);
            onSearchChange(value);
          }}
          onFocus={() => {
            focusedRef.current = true;
          }}
          onBlur={() => {
            focusedRef.current = false;
          }}
          placeholder={chrome.searchPlaceholder}
          placeholderTextColor="#9C9C97"
          returnKeyType="search"
        />
        {chrome.isSelectingDeparture ? (
          <Pressable onPress={onDepartureCancel} hitSlop={8}>
            <Text style={styles.cancel}>취소</Text>
          </Pressable>
        ) : query ? (
          <Pressable
            onPress={() => {
              setQuery('');
              onSearchClear();
            }}
            accessibilityLabel="검색어 지우기"
            hitSlop={8}
          >
            <Text style={styles.clear}>×</Text>
          </Pressable>
        ) : null}
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
        stroke={muted ? '#C8C8C4' : MapTokens.text}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SearchIcon(): React.JSX.Element {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.35-4.35"
        stroke="#9C9C97"
        strokeWidth={2}
        strokeLinecap="round"
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
    gap: 10,
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
  search: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.95)',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  searchActive: {
    borderWidth: 1,
    borderColor: '#17783C',
  },
  modeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: MapTokens.text,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: MapTokens.text,
    padding: 0,
  },
  cancel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#17783C',
  },
  clear: {
    fontSize: 22,
    lineHeight: 22,
    color: '#9C9C97',
  },
});

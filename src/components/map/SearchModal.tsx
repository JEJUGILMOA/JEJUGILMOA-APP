import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import MapText from './MapText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MapTokens } from '../../constants/map';
import type { Place } from '../../types/map';
import {
  loadRecentMapSearches,
  prependRecentSearch,
  saveRecentMapSearches,
} from '../../utils/recentMapSearches';
import { ClockIcon, CloseIcon, SearchIcon } from './MapIcons';

type Props = {
  visible: boolean;
  places: Place[];
  onClose: () => void;
  onSelectPlace: (place: Place) => void;
};

function HighlightName({
  name,
  query,
}: {
  name: string;
  query: string;
}): React.JSX.Element {
  if (!query.trim()) {
    return <MapText style={styles.resultName}>{name}</MapText>;
  }
  const lower = name.toLowerCase();
  const q = query.trim().toLowerCase();
  const idx = lower.indexOf(q);
  if (idx < 0) {
    return <MapText style={styles.resultName}>{name}</MapText>;
  }
  const before = name.slice(0, idx);
  const match = name.slice(idx, idx + q.length);
  const after = name.slice(idx + q.length);
  return (
    <MapText style={styles.resultName}>
      {before}
      <MapText style={styles.highlight}>{match}</MapText>
      {after}
    </MapText>
  );
}

export default function SearchModal({
  visible,
  places,
  onClose,
  onSelectPlace,
}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  /** 검색 버튼/최근 검색으로 확정된 키워드 — 이 값으로만 결과 필터 */
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    if (!visible) return;
    void loadRecentMapSearches().then(setRecentSearches);
  }, [visible]);

  const persistRecent = useCallback((next: string[]) => {
    setRecentSearches(next);
    void saveRecentMapSearches(next);
  }, []);

  const pushRecent = useCallback(
    (term: string) => {
      persistRecent(prependRecentSearch(recentSearches, term));
    },
    [persistRecent, recentSearches],
  );

  const removeRecent = useCallback(
    (term: string) => {
      persistRecent(recentSearches.filter((item) => item !== term));
    },
    [persistRecent, recentSearches],
  );

  const results = useMemo(() => {
    const q = submittedQuery.trim().toLowerCase();
    if (!q) {
      return [];
    }
    return places.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.address?.toLowerCase().includes(q) ?? false),
    );
  }, [places, submittedQuery]);

  const showResults = submittedQuery.trim().length > 0;

  const resetSearch = (): void => {
    setQuery('');
    setSubmittedQuery('');
  };

  const handleClose = (): void => {
    resetSearch();
    onClose();
  };

  const handleSearch = (): void => {
    const term = query.trim();
    if (!term) {
      setSubmittedQuery('');
      return;
    }
    setSubmittedQuery(term);
    pushRecent(term);
  };

  const handleSelectPlace = (place: Place): void => {
    pushRecent(place.name);
    onSelectPlace(place);
    resetSearch();
    onClose();
  };

  const handleSelectRecent = (term: string): void => {
    setQuery(term);
    setSubmittedQuery(term);
    pushRecent(term);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
        <View style={styles.topRow}>
          <View style={styles.inputWrap}>
            <SearchIcon color={MapTokens.textMuted} size={18} />
            <TextInput
              style={styles.input}
              value={query}
              onChangeText={setQuery}
              placeholder="장소, 주소 검색"
              placeholderTextColor={MapTokens.textMuted}
              autoFocus
              returnKeyType="search"
              onSubmitEditing={handleSearch}
              blurOnSubmit={false}
            />
            {query.length > 0 ? (
              <Pressable
                onPress={resetSearch}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="검색어 지우기"
              >
                <CloseIcon color={MapTokens.textMuted} size={16} />
              </Pressable>
            ) : null}
          </View>
          <Pressable onPress={handleClose} hitSlop={8}>
            <MapText style={styles.cancel}>취소</MapText>
          </Pressable>
        </View>

        {!showResults ? (
          <View style={styles.section}>
            <MapText style={styles.sectionTitle}>최근 검색</MapText>
            {recentSearches.length === 0 ? (
              <MapText style={styles.empty}>최근 검색 기록이 없어요.</MapText>
            ) : (
              recentSearches.map((term) => (
                <View key={term} style={styles.recentRow}>
                  <Pressable
                    style={styles.recentMain}
                    onPress={() => handleSelectRecent(term)}
                  >
                    <ClockIcon color={MapTokens.textMuted} size={16} />
                    <MapText style={styles.recentText} numberOfLines={1}>
                      {term}
                    </MapText>
                  </Pressable>
                  <Pressable
                    style={styles.recentRemove}
                    onPress={() => removeRecent(term)}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel={`${term} 삭제`}
                  >
                    <CloseIcon color={MapTokens.textMuted} size={16} />
                  </Pressable>
                </View>
              ))
            )}
          </View>
        ) : (
          <View style={styles.section}>
            <MapText style={styles.sectionTitle}>검색 결과</MapText>
            <FlatList
              data={results}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <MapText style={styles.empty}>일치하는 장소가 없어요.</MapText>
              }
              renderItem={({ item }) => (
                <Pressable
                  style={styles.resultRow}
                  onPress={() => handleSelectPlace(item)}
                >
                  <View
                    style={[
                      styles.catDot,
                      {
                        backgroundColor:
                          item.category === 'nature'
                            ? MapTokens.green
                            : item.category === 'food'
                              ? MapTokens.coral
                              : MapTokens.blue,
                      },
                    ]}
                  />
                  <View style={styles.resultTexts}>
                    <HighlightName name={item.name} query={submittedQuery} />
                    {item.address ? (
                      <MapText style={styles.resultAddr}>{item.address}</MapText>
                    ) : null}
                  </View>
                </Pressable>
              )}
            />
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MapTokens.surface,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
    marginBottom: 8,
  },
  inputWrap: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: MapTokens.background,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: MapTokens.text,
    paddingVertical: 0,
  },
  cancel: {
    fontSize: 15,
    color: MapTokens.green,
    fontWeight: '600',
  },
  section: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: MapTokens.textMuted,
    marginBottom: 8,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: MapTokens.border,
  },
  recentMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    minWidth: 0,
  },
  recentText: {
    flex: 1,
    fontSize: 15,
    color: MapTokens.text,
  },
  recentRemove: {
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 4,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: MapTokens.border,
  },
  catDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  resultTexts: {
    flex: 1,
  },
  resultName: {
    fontSize: 15,
    color: MapTokens.text,
    fontWeight: '500',
  },
  highlight: {
    color: MapTokens.green,
    fontWeight: '700',
  },
  resultAddr: {
    marginTop: 2,
    fontSize: 12,
    color: MapTokens.textMuted,
  },
  empty: {
    marginTop: 24,
    textAlign: 'center',
    color: MapTokens.textMuted,
  },
});

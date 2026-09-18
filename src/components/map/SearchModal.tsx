import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import MapText from './MapText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MapTokens } from '../../constants/map';
import type { MapPlaceSearchHit } from '../../bridge/placeSheetStore';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import {
  loadRecentMapSearches,
  prependRecentSearch,
  saveRecentMapSearches,
} from '../../utils/recentMapSearches';
import { ClockIcon, CloseIcon, SearchIcon } from './MapIcons';

const SEARCH_DEBOUNCE_MS = 350;
/** 타이핑 검색 최소 글자 수 */
const SEARCH_MIN_CHARS = 2;

type Props = {
  visible: boolean;
  results: MapPlaceSearchHit[];
  searching: boolean;
  searchError?: string | null;
  onClose: () => void;
  onSearch: (keyword: string) => void;
  onSelectPlace: (place: MapPlaceSearchHit) => void;
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
  results,
  searching,
  searchError,
  onClose,
  onSearch,
  onSelectPlace,
}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    if (!visible) return;
    void loadRecentMapSearches().then(setRecentSearches);
  }, [visible]);

  // 타이핑 debounce → API 검색 (최근 검색 기록은 선택/엔터 시에만)
  useEffect(() => {
    if (!visible) return;
    const term = debouncedQuery.trim();
    if (term.length === 0) {
      setSubmittedQuery('');
      onSearch('');
      return;
    }
    if (term.length < SEARCH_MIN_CHARS) {
      setSubmittedQuery('');
      onSearch('');
      return;
    }
    setSubmittedQuery(term);
    onSearch(term);
  }, [debouncedQuery, visible, onSearch]);

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
      onSearch('');
      return;
    }
    setSubmittedQuery(term);
    pushRecent(term);
    onSearch(term);
  };

  const handleSelectPlace = (place: MapPlaceSearchHit): void => {
    pushRecent(place.name);
    onSelectPlace(place);
    resetSearch();
    onClose();
  };

  const handleSelectRecent = (term: string): void => {
    setQuery(term);
    setSubmittedQuery(term);
    pushRecent(term);
    onSearch(term);
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
            {searching ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator color={MapTokens.green} />
                <MapText style={styles.empty}>검색 중…</MapText>
              </View>
            ) : searchError ? (
              <MapText style={styles.empty}>{searchError}</MapText>
            ) : (
              <FlatList
                data={results}
                keyExtractor={(item) => item.id}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={
                  <MapText style={styles.empty}>검색 결과가 없어요.</MapText>
                }
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.resultRow}
                    onPress={() => handleSelectPlace(item)}
                  >
                    <HighlightName name={item.name} query={submittedQuery} />
                    {item.address ? (
                      <MapText style={styles.resultAddress} numberOfLines={1}>
                        {item.address}
                      </MapText>
                    ) : null}
                  </Pressable>
                )}
              />
            )}
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
    paddingHorizontal: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: MapTokens.background,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: MapTokens.text,
    paddingVertical: 0,
  },
  cancel: {
    fontSize: 15,
    fontWeight: '600',
    color: MapTokens.text,
  },
  section: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: MapTokens.textMuted,
    marginBottom: 10,
  },
  empty: {
    fontSize: 14,
    color: MapTokens.textMuted,
    marginTop: 8,
  },
  loadingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  recentMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  recentText: {
    flex: 1,
    fontSize: 15,
    color: MapTokens.text,
  },
  recentRemove: {
    padding: 8,
  },
  resultRow: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: MapTokens.border,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    color: MapTokens.text,
  },
  highlight: {
    fontSize: 16,
    fontWeight: '800',
    color: MapTokens.green,
  },
  resultAddress: {
    marginTop: 4,
    fontSize: 13,
    color: MapTokens.textMuted,
  },
});

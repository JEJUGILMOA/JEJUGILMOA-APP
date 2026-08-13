import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MapTokens } from '../../constants/map';
import { DUMMY_RECENT_SEARCHES } from '../../data/mapDummy';
import type { Place } from '../../types/map';
import { ClockIcon, SearchIcon } from './MapIcons';

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
    return <Text style={styles.resultName}>{name}</Text>;
  }
  const lower = name.toLowerCase();
  const q = query.trim().toLowerCase();
  const idx = lower.indexOf(q);
  if (idx < 0) {
    return <Text style={styles.resultName}>{name}</Text>;
  }
  const before = name.slice(0, idx);
  const match = name.slice(idx, idx + q.length);
  const after = name.slice(idx + q.length);
  return (
    <Text style={styles.resultName}>
      {before}
      <Text style={styles.highlight}>{match}</Text>
      {after}
    </Text>
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

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return [];
    }
    return places.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.address?.toLowerCase().includes(q) ?? false),
    );
  }, [places, query]);

  const handleClose = (): void => {
    setQuery('');
    onClose();
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
            />
          </View>
          <Pressable onPress={handleClose} hitSlop={8}>
            <Text style={styles.cancel}>취소</Text>
          </Pressable>
        </View>

        {query.trim().length === 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>최근 검색</Text>
            {DUMMY_RECENT_SEARCHES.map((term) => (
              <Pressable key={term} style={styles.recentRow} onPress={() => setQuery(term)}>
                <ClockIcon color={MapTokens.textMuted} size={16} />
                <Text style={styles.recentText}>{term}</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>검색 결과</Text>
            <FlatList
              data={results}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <Text style={styles.empty}>일치하는 장소가 없어요.</Text>
              }
              renderItem={({ item }) => (
                <Pressable
                  style={styles.resultRow}
                  onPress={() => {
                    onSelectPlace(item);
                    setQuery('');
                    onClose();
                  }}
                >
                  <View
                    style={[
                      styles.catDot,
                      {
                        backgroundColor:
                          item.category === 'spot' ? MapTokens.green : MapTokens.blue,
                      },
                    ]}
                  />
                  <View style={styles.resultTexts}>
                    <HighlightName name={item.name} query={query} />
                    {item.address ? (
                      <Text style={styles.resultAddr}>{item.address}</Text>
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
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: MapTokens.border,
  },
  recentText: {
    fontSize: 15,
    color: MapTokens.text,
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

import React, { useMemo, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';

import type { Place } from '../screens/MapScreen';

type Props = {
  places: Place[];
  selectedPlace: Place | null;
  onSelectPlace: (place: Place) => void;
};

export default function MapBottomSheet({ places, selectedPlace, onSelectPlace }: Props) {
  const sheetRef = useRef<BottomSheet>(null);
  // 접힘 / 중간 / 펼침 3단계 스냅포인트. 카카오맵/네이버맵 앱과 비슷한 느낌으로 조정하세요.
  const snapPoints = useMemo(() => ['12%', '45%', '90%'], []);

  return (
    <BottomSheet ref={sheetRef} index={1} snapPoints={snapPoints} enablePanDownToClose={false}>
      {selectedPlace ? (
        <View style={styles.detail}>
          <TouchableOpacity onPress={() => onSelectPlace(selectedPlace)}>
            <Text style={styles.backLabel}>← 목록으로</Text>
          </TouchableOpacity>
          <Text style={styles.detailTitle}>{selectedPlace.name}</Text>
          {/* TODO: 사진, 설명, 리뷰, 길찾기 버튼 등 상세 정보 */}
        </View>
      ) : (
        <BottomSheetFlatList
          data={places}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.row} onPress={() => onSelectPlace(item)}>
              <Text style={styles.rowTitle}>{item.name}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>표시할 장소가 아직 없어요.</Text>
          }
        />
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  detail: { padding: 16 },
  backLabel: { color: '#0BA360', marginBottom: 8 },
  detailTitle: { fontSize: 18, fontWeight: '700' },
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  row: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  rowTitle: { fontSize: 15, fontWeight: '600' },
  emptyText: { textAlign: 'center', color: '#9CA3AF', marginTop: 24 },
});

import React, { useCallback, useRef } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { WEB_BASE_URL } from '../constants/config';
import { handleBridgeMessage } from '../bridge/webviewBridge';

type Props = {
  /** 웹앱 내 경로. 예: '/', '/saved', '/my' */
  path: string;
};

export default function WebViewScreen({ path }: Props) {
  const insets = useSafeAreaInsets();
  const webviewRef = useRef<WebView>(null);

  const onMessage = useCallback((event: WebViewMessageEvent) => {
    // 웹 -> 네이티브 메시지 수신 (예: 지도 탭 전환, 공유하기, 위치 요청 등)
    handleBridgeMessage(event.nativeEvent.data, webviewRef.current);
  }, []);

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <WebView
        ref={webviewRef}
        source={{ uri: `${WEB_BASE_URL}${path}` }}
        onMessage={onMessage}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#0BA360" />
          </View>
        )}
        // 하단 네이티브 탭바 높이만큼 웹 콘텐츠가 가려지지 않게 하려면,
        // 웹 쪽 CSS에 safe-area 여백을 injectedJavaScript로 전달하는 방법도 고려하세요.
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loading: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

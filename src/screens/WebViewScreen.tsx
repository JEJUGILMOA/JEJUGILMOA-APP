import React, { useCallback, useMemo, useRef } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

import { handleBridgeMessage } from '../bridge/webviewBridge';
import { WEB_BASE_URL } from '../constants/config';
import { TabBarTokens } from '../constants/tabs';

type Props = {
  /** 웹앱 내 경로. 예: '/', '/plan', '/record', '/my' */
  path: string;
};

/** 네이티브 탭바가 있으므로 웹 하단 내비는 숨김 (FE aria-label 기준) */
const HIDE_WEB_BOTTOM_NAV = `
(function() {
  var style = document.createElement('style');
  style.setAttribute('data-gilmoa-native', '1');
  style.textContent = [
    'nav[aria-label="하단 내비게이션"]{display:none!important;}',
    'main{padding-bottom:16px!important;}'
  ].join('');
  document.documentElement.appendChild(style);
  true;
})();
`;

export default function WebViewScreen({ path }: Props) {
  const webviewRef = useRef<WebView>(null);
  const uri = useMemo(() => `${WEB_BASE_URL}${path}`, [path]);

  const onMessage = useCallback((event: WebViewMessageEvent) => {
    handleBridgeMessage(event.nativeEvent.data, webviewRef.current);
  }, []);

  return (
    <View style={styles.container}>
      <WebView
        ref={webviewRef}
        source={{ uri }}
        onMessage={onMessage}
        startInLoadingState
        injectedJavaScriptBeforeContentLoaded={HIDE_WEB_BOTTOM_NAV}
        injectedJavaScript={HIDE_WEB_BOTTOM_NAV}
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={TabBarTokens.active} />
          </View>
        )}
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

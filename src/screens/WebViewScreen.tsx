import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

import PageHeader from '../components/PageHeader';
import { handleBridgeMessage, sendToWeb, type HeaderState } from '../bridge/webviewBridge';
import { WEB_BASE_URL } from '../constants/config';
import { TabBarTokens } from '../constants/tabs';

type Props = {
  /** 웹앱 내 경로. 예: '/', '/plan', '/record', '/my' */
  path: string;
};

/** 네이티브 탭바·페이지 헤더가 있으므로 웹 대응 UI는 숨김 */
const HIDE_WEB_CHROME = `
(function() {
  var style = document.createElement('style');
  style.setAttribute('data-gilmoa-native', '1');
  style.textContent = [
    'nav[aria-label="하단 내비게이션"]{display:none!important;}',
    'header[data-gilmoa-page-header]{display:none!important;}',
    'main{padding-bottom:16px!important;}'
  ].join('');
  document.documentElement.appendChild(style);
  true;
})();
`;

const HIDDEN_HEADER: HeaderState = {
  visible: false,
  title: '',
  showBack: false,
  actions: [],
};

export default function WebViewScreen({ path }: Props) {
  const insets = useSafeAreaInsets();
  const webviewRef = useRef<WebView>(null);
  const uri = useMemo(() => `${WEB_BASE_URL}${path}`, [path]);
  const [header, setHeader] = useState<HeaderState>(HIDDEN_HEADER);

  const onMessage = useCallback((event: WebViewMessageEvent) => {
    handleBridgeMessage(event.nativeEvent.data, webviewRef.current, {
      onSetHeader: setHeader,
    });
  }, []);

  const onLoadEnd = useCallback(() => {
    sendToWeb(webviewRef.current, {
      type: 'NATIVE_READY',
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
    });
  }, []);

  const onBack = useCallback(() => {
    sendToWeb(webviewRef.current, { type: 'HEADER_BACK' });
  }, []);

  const onAction = useCallback((id: string) => {
    sendToWeb(webviewRef.current, { type: 'HEADER_ACTION', id });
  }, []);

  return (
    <View
      style={[
        styles.container,
        { paddingTop: header.visible ? 0 : insets.top },
      ]}
    >
      {header.visible ? (
        <PageHeader
          title={header.title}
          showBack={header.showBack}
          insetTop={insets.top}
          rightText={header.rightText}
          actions={header.actions}
          onBack={onBack}
          onAction={onAction}
        />
      ) : null}
      <WebView
        ref={webviewRef}
        source={{ uri }}
        onMessage={onMessage}
        onLoadEnd={onLoadEnd}
        startInLoadingState
        injectedJavaScriptBeforeContentLoaded={HIDE_WEB_CHROME}
        injectedJavaScript={HIDE_WEB_CHROME}
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

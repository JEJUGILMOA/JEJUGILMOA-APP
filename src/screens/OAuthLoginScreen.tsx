import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { handleBridgeMessage, sendToWeb } from '@/bridge/webviewBridge';
import PageHeader from '@/components/PageHeader';
import { TabBarTokens } from '@/constants/tabs';
import { takePendingOAuthLaunch } from '@/auth/oauthLaunch';
import { useAuth, type AuthProvider } from '@/context/AuthContext';

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

/** 소셜 OAuth 전용 스택 화면 — 로그인 WebView와 분리해 “새 창”처럼 밀어 올린다 */
export default function OAuthLoginScreen() {
  const { signIn } = useAuth();
  const insets = useSafeAreaInsets();
  const webviewRef = useRef<WebView>(null);
  const params = useLocalSearchParams<{ title?: string }>();

  const launch = useMemo(() => takePendingOAuthLaunch(), []);
  const oauthUrl = launch && isHttpUrl(launch.url) ? launch.url : null;
  const title =
    launch?.title ||
    (typeof params.title === 'string' && params.title.trim()) ||
    '로그인';

  const [loading, setLoading] = useState(true);

  const closeScreen = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/login');
  }, []);

  const finishLogin = useCallback(
    async (provider?: AuthProvider) => {
      await signIn(provider ?? 'kakao');
      if (router.canDismiss()) {
        router.dismissAll();
      }
      router.replace('/(tabs)');
    },
    [signIn],
  );

  const onMessage = useCallback(
    (event: WebViewMessageEvent) => {
      handleBridgeMessage(event.nativeEvent.data, webviewRef.current, {
        onLoginSuccess: (payload) => {
          void finishLogin(payload?.provider);
        },
      });
    },
    [finishLogin],
  );

  const onLoadEnd = useCallback(() => {
    setLoading(false);
    sendToWeb(webviewRef.current, {
      type: 'NATIVE_READY',
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
    });
  }, []);

  if (!oauthUrl) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <PageHeader title={title} showBack insetTop={0} onBack={closeScreen} />
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={TabBarTokens.active} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PageHeader title={title} showBack insetTop={insets.top} onBack={closeScreen} />
      <View style={styles.webviewHost}>
        <WebView
          ref={webviewRef}
          style={styles.webview}
          source={{ uri: oauthUrl }}
          onMessage={onMessage}
          onLoadEnd={onLoadEnd}
          onLoadStart={() => setLoading(true)}
          startInLoadingState
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          setSupportMultipleWindows={false}
          renderLoading={() => (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color={TabBarTokens.active} />
            </View>
          )}
        />
        {loading ? (
          <View style={styles.loadingOverlay} pointerEvents="none">
            <ActivityIndicator size="large" color={TabBarTokens.active} />
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webviewHost: {
    flex: 1,
  },
  webview: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
});

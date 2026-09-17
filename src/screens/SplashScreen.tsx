import { router } from 'expo-router';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppLogo } from '@/components/AppLogo';
import { LoginColors } from '@/constants/login';
import { useAuth, waitForAuthBootstrap } from '@/context/AuthContext';

// 네이티브 스플래시가 JS 준비 전까지 유지되도록 설정
ExpoSplashScreen.preventAutoHideAsync().catch(() => {
  // 이미 숨겨진 경우 무시
});

export default function SplashScreen() {
  const { markReady } = useAuth();

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        // TODO: SecureStore 등으로 저장된 토큰 복원
        await waitForAuthBootstrap();
        if (cancelled) return;

        markReady();
        await ExpoSplashScreen.hideAsync();

        // 게스트도 홈 탭부터 진입. 로그인은 FE/탭에서 유도.
        router.replace('/(tabs)');
      } catch {
        await ExpoSplashScreen.hideAsync();
        if (!cancelled) {
          router.replace('/(tabs)');
        }
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [markReady]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <AppLogo size={80} />
        <Text style={styles.title}>제주 길모아</Text>
        <ActivityIndicator
          size="small"
          color={LoginColors.brandGreen}
          style={styles.loader}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LoginColors.white,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: LoginColors.black,
  },
  loader: {
    marginTop: 8,
  },
});

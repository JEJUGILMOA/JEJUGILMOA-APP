import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppLogo } from '@/components/AppLogo';
import { SocialLoginButton } from '@/components/SocialLoginButton';
import { LoginColors } from '@/constants/login';
import { AuthProvider, useAuth } from '@/context/AuthContext';

function ProviderIcon({ backgroundColor }: { backgroundColor: string }) {
  return <View style={[styles.providerIcon, { backgroundColor }]} />;
}

function GoogleIcon() {
  return <Text style={styles.googleIcon}>G</Text>;
}

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [loadingProvider, setLoadingProvider] = useState<AuthProvider | null>(
    null,
  );

  const handleSignIn = useCallback(
    async (provider: AuthProvider) => {
      setLoadingProvider(provider);
      try {
        await signIn(provider);
        router.replace('/(tabs)');
      } finally {
        setLoadingProvider(null);
      }
    },
    [signIn],
  );

  const isLoading = loadingProvider !== null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <AppLogo />
          </View>
          <Text style={styles.title}>제주 길모아</Text>
          <Text style={styles.subtitle}>우리의 모든 길이 모이는 곳</Text>
        </View>

        <View style={styles.buttons}>
          <SocialLoginButton
            label="카카오로 시작하기"
            backgroundColor={LoginColors.kakaoYellow}
            textColor={LoginColors.kakaoText}
            icon={
              <ProviderIcon backgroundColor={LoginColors.kakaoText} />
            }
            onPress={() => handleSignIn('kakao')}
            loading={loadingProvider === 'kakao'}
            disabled={isLoading}
          />
          <SocialLoginButton
            label="네이버로 시작하기"
            backgroundColor={LoginColors.naverGreen}
            textColor={LoginColors.white}
            icon={<ProviderIcon backgroundColor={LoginColors.white} />}
            onPress={() => handleSignIn('naver')}
            loading={loadingProvider === 'naver'}
            disabled={isLoading}
          />
          <SocialLoginButton
            label="Google로 시작하기"
            backgroundColor={LoginColors.white}
            textColor={LoginColors.black}
            borderColor={LoginColors.googleBorder}
            icon={<GoogleIcon />}
            onPress={() => handleSignIn('google')}
            loading={loadingProvider === 'google'}
            disabled={isLoading}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LoginColors.white,
  },
  logoContainer: {
    paddingBottom: 12,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingBottom: 48,
  },
  header: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: LoginColors.black,
  },
  subtitle: {
    fontSize: 15,
    color: LoginColors.subtitle,
    textAlign: 'center',
  },
  buttons: {
    gap: 12,
    paddingBottom: 32,
  },
  providerIcon: {
    width: 14,
    height: 14,
    borderRadius: 3,
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4285F4',
  },
});

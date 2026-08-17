import { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: '제주 길모아',
  slug: 'jeju-gilmoa',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/appicon.png',
  scheme: 'jejugilmoa',
  userInterfaceStyle: 'automatic',
  ios: {
    ...config.ios,
    bundleIdentifier: 'com.gilmoa.jejugilmoa',
  },
  android: {
    ...config.android,
    package: 'com.gilmoa.jejugilmoa',
    adaptiveIcon: {
      backgroundColor: '#4BA3E8',
      foregroundImage: './assets/images/appicon.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: 'static',
    favicon: './assets/images/appicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#24B95C',
        image: './assets/images/splash-icon2.png',
        imageWidth: 76,
      },
    ],
    // 네이버맵 Expo config plugin
    // ⚠️ 정확한 옵션 키(client_id 등)는 패키지 버전에 따라 다를 수 있으니
    // https://rnnavermap.mjstudio.net 공식 문서에서 최신 옵션명을 꼭 확인하세요.
    [
      '@mj-studio/react-native-naver-map',
      {
        client_id: process.env.NAVER_MAP_CLIENT_ID ?? 'YOUR_NAVER_MAP_CLIENT_ID',
      },
    ],
    // 네이버맵 SDK Maven (JitPack 401 방지)
    // https://rnnavermap.mjstudio.net/docs/installation/expo
    [
      'expo-build-properties',
      {
        android: {
          extraMavenRepos: ['https://repository.map.naver.com/archive/maven'],
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
});

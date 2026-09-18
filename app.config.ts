import { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: '제주 길모아',
  slug: 'jejugilmoa-app',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/appicon.png',
  scheme: 'jejugilmoa',
  userInterfaceStyle: 'automatic',
  ios: {
    ...config.ios,
    bundleIdentifier: 'com.gilmoa.jejugilmoa',
    /** false → iPad에서 iPhone 호환 모드(하단 1x/2x). 네이티브 재빌드 필요 */
    supportsTablet: false,
    usesAppleSignIn: true,
    infoPlist: {
      ...config.ios?.infoPlist,
      ITSAppUsesNonExemptEncryption: false,
      // foreground(When In Use)만 사용. Always 키는 선언만 하면 심사 리스크 → 넣지 않음.
      NSLocationWhenInUseUsageDescription:
        '지도에서 내 위치 표시와 방문 인증을 위해 현재 위치를 사용합니다.',
      // WebView <input type="file" accept="image/*"> 에서 "사진 찍기" 선택 시 필수.
      // 없으면 iOS가 권한 안내 대신 프로세스를 바로 종료한다.
      NSCameraUsageDescription:
        '여행 기록에 사진을 첨부하기 위해 카메라에 접근합니다.',
      NSPhotoLibraryUsageDescription:
        '여행 기록에 사진을 첨부하기 위해 사진 보관함에 접근합니다.',
      LSApplicationQueriesSchemes: ['maps'],
    },
  },
  android: {
    ...config.android,
    package: 'com.gilmoa.jejugilmoa',
    adaptiveIcon: {
      backgroundColor: '#4BA3E8',
      foregroundImage: './assets/images/appicon.png',
    },
    predictiveBackGestureEnabled: false,
    permissions: [
      'ACCESS_COARSE_LOCATION',
      'ACCESS_FINE_LOCATION',
      'CAMERA',
      'READ_MEDIA_IMAGES',
      'READ_EXTERNAL_STORAGE',
    ],
  },
  web: {
    output: 'static',
    favicon: './assets/images/appicon.png',
  },
  extra: {
    eas: {
      projectId: 'eb44153c-2840-49df-b4c4-d4b7e9a9441d',
    },
  },
  owner: 'gilmoa',
  plugins: [
    'expo-router',
    'expo-apple-authentication',
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          '지도에서 내 위치 표시와 방문 인증을 위해 현재 위치를 사용합니다.',
      },
    ],
    [
      'expo-splash-screen',
      {
        // JS SplashScreen(LoginColors.white)과 동일 — 전환 시 색 깜빡임 방지
        backgroundColor: '#FFFFFF',
        image: './assets/images/appicon.png',
        imageWidth: 200,
      },
    ],
    // 네이버맵 Expo config plugin
    // ⚠️ 정확한 옵션 키(client_id 등)는 패키지 버전에 따라 다를 수 있으니
    // https://rnnavermap.mjstudio.net 공식 문서에서 최신 옵션명을 꼭 확인하세요.
    [
      '@mj-studio/react-native-naver-map',
      {
        client_id: process.env.NAVER_MAP_CLIENT_ID ?? 'YOUR_NAVER_MAP_CLIENT_ID',
        android: {
          ACCESS_FINE_LOCATION: true,
          ACCESS_COARSE_LOCATION: true,
        },
        ios: {
          // When In Use만 — Always는 백그라운드 추적용. 미사용이므로 넣지 않음(심사 5.1.1).
          NSLocationWhenInUseUsageDescription:
            '지도에서 내 위치 표시와 방문 인증을 위해 현재 위치를 사용합니다.',
        },
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

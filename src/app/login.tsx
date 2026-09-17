import { useLocalSearchParams } from 'expo-router';

import WebViewScreen from '@/screens/WebViewScreen';

/** FE `/login` WebView. 탭과 분리된 스택 화면. */
export default function LoginRoute() {
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const path =
    typeof returnTo === 'string' && returnTo.trim()
      ? `/login?returnTo=${encodeURIComponent(returnTo)}`
      : '/login';

  return <WebViewScreen path={path} />;
}

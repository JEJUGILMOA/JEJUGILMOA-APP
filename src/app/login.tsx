import WebViewScreen from '@/screens/WebViewScreen';

/** FE `/login` WebView. Apple은 브릿지로 네이티브 Sign in with Apple 연결. */
export default function LoginRoute() {
  return <WebViewScreen path="/login" />;
}

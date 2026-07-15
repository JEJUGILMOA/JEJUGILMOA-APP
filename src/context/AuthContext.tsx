import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

export type AuthProvider = 'kakao' | 'naver' | 'google' | 'guest';

export type AuthUser = {
  provider: AuthProvider;
};

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isReady: boolean;
  signIn: (provider: AuthProvider) => Promise<void>;
  signOut: () => void;
  markReady: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/** 앱 초기화(세션 복원 등) 시뮬레이션 지연 */
const INIT_DELAY_MS = 1200;

/** 소셜 로그인 API 연동 전 목(mock) 지연 */
const SIGN_IN_DELAY_MS = 600;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  const signIn = useCallback(async (provider: AuthProvider) => {
    // TODO: 카카오/네이버/Google OAuth SDK 연동
    await new Promise((resolve) => setTimeout(resolve, SIGN_IN_DELAY_MS));
    setUser({ provider });
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
  }, []);

  const markReady = useCallback(() => {
    setIsReady(true);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isReady,
      signIn,
      signOut,
      markReady,
    }),
    [user, isReady, signIn, signOut, markReady],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** 스플래시에서 초기화 완료까지 대기 */
export async function waitForAuthBootstrap(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, INIT_DELAY_MS));
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

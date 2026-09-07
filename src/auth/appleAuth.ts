import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

export type AppleCredentialPayload = {
  identityToken: string;
  rawNonce: string;
  authorizationCode?: string;
  email?: string;
  fullName?: {
    givenName?: string | null;
    familyName?: string | null;
  };
};

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Apple에 넘길 SHA256(rawNonce) — 소문자 hex (BE 명세) */
export async function hashNonce(rawNonce: string): Promise<string> {
  const digest = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
  return digest.toLowerCase();
}

/** 암호학적으로 안전한 rawNonce 생성 */
export async function createRawNonce(byteLength = 32): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(byteLength);
  return bytesToHex(bytes);
}

export function isAppleAuthAvailable(): boolean {
  return Platform.OS === 'ios';
}

/**
 * Native Apple Sign In.
 * - Apple 요청: SHA256(rawNonce)
 * - BE 전달용: 원본 rawNonce 를 credential과 함께 반환
 */
export async function signInWithAppleNative(): Promise<AppleCredentialPayload> {
  if (Platform.OS !== 'ios') {
    throw new Error('Apple 로그인은 iOS에서만 사용할 수 있습니다.');
  }

  const available = await AppleAuthentication.isAvailableAsync();
  if (!available) {
    throw new Error('이 기기에서는 Apple 로그인을 사용할 수 없습니다.');
  }

  const rawNonce = await createRawNonce();
  const nonce = await hashNonce(rawNonce);

  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
    nonce,
  });

  if (!credential.identityToken) {
    throw new Error('Apple identityToken을 받지 못했습니다.');
  }

  return {
    identityToken: credential.identityToken,
    rawNonce,
    authorizationCode: credential.authorizationCode ?? undefined,
    email: credential.email ?? undefined,
    fullName: credential.fullName
      ? {
          givenName: credential.fullName.givenName,
          familyName: credential.fullName.familyName,
        }
      : undefined,
  };
}

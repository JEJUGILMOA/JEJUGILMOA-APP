# 소셜 로그인 · 네트워크 연동

참고: [스웨거](https://gilmoa-dev.gyeonseo.com/swagger-ui/index.html). 소셜 콘솔(dev)은 **§7**. 키/시크릿은 `.env`만. Prod는 노션 TODO.

---

## 1. 한 줄 결론

**백엔드 API·세션(쿠키)은 웹(WebView)에서만 쓴다.**  
카카오/네이버/구글은 **웹 OAuth**. Apple만 iOS 스토어 규칙 때문에 **네이티브 Sign in with Apple** → 웹이 BE에 `identityToken` + `rawNonce`를 넘긴다.

---

## 2. 질문에 대한 답

### “웹으로만 로그인하면 API를 못 쓰나?”

**아니다. 쓸 수 있다.**  
백엔드가 쿠키로 세션을 주면, 웹 axios가 `withCredentials: true`로 치면 된다. 앱이 별도 토큰을 받을 필요 없다.

### “로그인 SDK가 왜 필요해?”

**카카오/네이버/구글: 필수는 아니다** (웹 OAuth).  
**Apple: iOS에서는 네이티브 SDK가 필요**하다. WebView만으로는 Sign in with Apple UX·심사를 만족하기 어렵다.

### “그냥 웹 로그인 만들듯이 하면 되나?”

**카카오/네이버/구글은 된다.** Apple은 아래 §5-B 브릿지 흐름을 탄다.

---

## 3. 백엔드 계약 (스웨거)

`POST /api/auth/oauth/{provider}/login`  
- provider: `kakao` | `google` | `naver`  
- body: `authorizationCode` 필수, `redirectUri`/`state` 선택  

`POST /api/auth/apple/login` ([appleLogin](https://gilmoa-dev.gyeonseo.com/swagger-ui/index.html#/%EC%9D%B8%EC%A6%9D/appleLogin))  
- body: `identityToken`, `rawNonce`(min 32) 필수  
- Apple 요청 nonce = SHA-256(rawNonce) 소문자 hex  

공통 응답 `result`: `userId`, `nickname`, `profileImageUrl`, `role`, `newUser` (본문에 accessToken 없음)  
`POST /api/auth/reissue` · `POST /api/auth/logout` → 쿠키 기준.

공통 스키마에 JWT Bearer가 있어도, 소셜 로그인은 쿠키 세션이 본체다. 웹은 `withCredentials: true`.

---

## 4. 역할

| 구분 | 역할 |
| --- | --- |
| 웹 | 로그인 화면, OAuth 콜백, 로그인/재발급/로그아웃, 장소·일정·기록 등 **모든** API |
| 앱 | WebView 셸, 네이티브 지도, **Apple Sign In만** 네이티브 처리 후 웹에 credential 전달 |
| 백엔드 | 인가 코드 / Apple identityToken → 쿠키 세션. 앱 전용 토큰 본문 없음 |

앱이 백엔드에 로그인 POST를 직접 치지 않는다. 치면 쿠키가 웹과 갈라진다.

---

## 5. 흐름

### A. 카카오 / 네이버 / 구글 (웹 OAuth)

```
사용자 → FE /login → 웹 로그인 → /oauth/.../callback
       → POST /api/auth/oauth/{provider}/login → Set-Cookie
       → (앱 WebView면) LOGIN_SUCCESS → 네이티브 tabs 진입
       → 이후 API는 전부 웹 axios (쿠키)
```

### B. Apple (네이티브 → 웹 → BE)

```
FE /login (WebView) → REQUEST_APPLE_LOGIN
  → Native: rawNonce 생성, Apple에 SHA256(rawNonce) 소문자 hex 전달
  → APPLE_CREDENTIAL { identityToken, rawNonce } → WebView
  → FE: POST /api/auth/apple/login { identityToken, rawNonce }
  → Set-Cookie → LOGIN_SUCCESS → 네이티브 tabs
```

참고: [스웨거 appleLogin](https://gilmoa-dev.gyeonseo.com/swagger-ui/index.html#/%EC%9D%B8%EC%A6%9D/appleLogin)
(카카오/네이버/구글은 `POST /api/auth/oauth/{provider}/login` — Apple과 경로가 다름)
---

## 5-1. Nonce 처리 방식 (요청사항 체크)

| 단계 | 담당 | 값 |
| --- | --- | --- |
| 1 | Native (`src/auth/appleAuth.ts`) | `rawNonce` 생성 (랜덤 hex) |
| 2 | Native → Apple | `nonce = SHA256(rawNonce)` (hex digest) |
| 3 | Native → Web → BE | **원본 `rawNonce`** + `identityToken` |

**위 방식으로 진행 가능 여부: 가능**  
BE `POST /api/auth/apple/login`이 JWT `nonce`와 `SHA256(rawNonce)`(소문자 hex)를 비교한다.
---

## 5-2. identityToken 샘플 (개발 로그인 후)

⚠️ 토큰 원문·이메일·`sub` 등 개인식별 값은 넣지 않는다.  
실기기 Sign in with Apple 성공 후 로컬에서 JWT를 decode해 Header/Payload만 아래 양식에 채운다.

### decoded Header (예상 형태 · 실샘플 대기)

```json
{
  "kid": "<Apple 키 ID>",
  "alg": "RS256"
}
```

### decoded Payload (예상 형태 · 실샘플 대기)

```json
{
  "iss": "https://appleid.apple.com",
  "aud": "com.gilmoa.jejugilmoa",
  "exp": 0,
  "iat": 0,
  "sub": "<Apple user id — 기록 시 마스킹>",
  "nonce": "<SHA256(rawNonce) hex>",
  "email": "<마스킹 또는 생략>",
  "email_verified": "true",
  "auth_time": 0,
  "nonce_supported": true
}
```

**상태: 확인 필요** — iOS 실기기/시뮬에서 한 번 로그인해야 실제 Header/Payload를 채울 수 있다.

---

## 6. 구현 시 챙길 것

1. 소셜 **웹** 콘솔 콜백에 쓸 URL (카카오/네이버/구글)  
2. CORS + credentials (웹 origin ↔ API origin).  
3. 쿠키 `SameSite` / `Secure` / `Domain`이 WebView에서도 붙는지.  
4. 구글: 인앱 WebView에서 막히면 시스템 브라우저 등 대응.  
5. Apple: BE `oauth/apple` + Apple Developer Services ID / Bundle ID 정합.  
6. iOS 스토어: 다른 소셜만 넣고 애플을 안 넣으면 심사에서 걸릴 수 있음.

네이티브 카카오/네이버/구글 SDK, `AUTH_TOKEN`으로 access 주입, 앱 SecureStore 세션은 **이 방향에서 쓰지 않는다.**  
Apple credential은 브릿지로 웹에만 넘기고, 세션은 웹 쿠키로 유지한다.

---

## 7. 콘솔 설정 (dev, 노션)

패키지/번들: `com.gilmoa.jejugilmoa`. 앱 scheme: `jejugilmoa`.

| 제공자 | 웹/앱 로그인에 쓰는 것 |
| --- | --- |
| 네이버 | 웹 콜백. Client ID는 콘솔에서 env |
| 카카오 | REST API 키 + 웹 콜백. Secret은 백엔드만 |
| 구글 | Web Client ID + 웹 콜백. Secret은 백엔드만 |
| 애플 | Bundle ID + Sign in with Apple capability. Secret/키는 백엔드만 |

Secret은 FE/APP에 넣지 않는다.

---

## 8. 지금 코드 상태

| 위치 | 상태 |
| --- | --- |
| FE `src/api` | axios + `withCredentials`, `loginWithOAuth` + `loginWithApple` (`POST /auth/apple/login`) |
| 앱 `login` 라우트 | FE `/login` WebView |
| FE `/login` | 카카오/네이버/구글 + (네이티브일 때) Apple 버튼 |
| 앱 브릿지 | `REQUEST_APPLE_LOGIN` ↔ `APPLE_CREDENTIAL` / cancel / error + `LOGIN_SUCCESS` |
| BE apple | [appleLogin](https://gilmoa-dev.gyeonseo.com/swagger-ui/index.html#/%EC%9D%B8%EC%A6%9D/appleLogin) 연결됨 |

---

## 9. 구현 순서

1. ~~FE API 기초 (axios, unwrap, auth API)~~  
2. ~~FE `/login` + `/oauth/{provider}/callback` + `loginWithOAuth`~~  
3. 콘솔에 배포/앱 FE 콜백 등록  
4. ~~앱 로그인 진입을 FE `/login` WebView로 연결~~  
5. ~~Apple 네이티브 ↔ 웹 브릿지 + nonce 파이프~~  
6. ~~BE `POST /api/auth/apple/login` 연결~~  
7. 카카오(또는 네이버) E2E → API 호출 확인  
8. 구글은 WebView에서 막히면 그때 대응  
9. iOS Apple E2E (실기기)
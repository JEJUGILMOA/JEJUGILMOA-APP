# 소셜 로그인 · 네트워크 연동

참고: [스웨거](https://gilmoa-dev.gyeonseo.com/swagger-ui/index.html). 소셜 콘솔(dev)은 **§7**. 키/시크릿은 `.env`만. Prod는 노션 TODO.

---

## 1. 한 줄 결론

**백엔드 API는 웹에서만 쓴다. 로그인도 웹 페이지로 한다. 네이티브 소셜 SDK는 필수가 아니다.**

브라우저에서 쓰던 것과 같은 `/login` → 카카오/네이버/구글 웹 로그인 → 콜백 → `POST /api/auth/oauth/{provider}/login` → 쿠키.  
앱에서는 그 `/login`을 WebView로 열면 된다. 로그인 후 API도 같은 WebView의 axios가 쿠키로 호출한다.

---

## 2. 질문에 대한 답

### “웹으로만 로그인하면 API를 못 쓰나?”

**아니다. 쓸 수 있다.**  
백엔드가 쿠키로 세션을 주면, 웹 axios가 `withCredentials: true`로 치면 된다. 앱이 별도 토큰을 받을 필요 없다.

### “로그인 SDK가 왜 필요해?”

**필수는 아니다.**  
일반 웹사이트처럼 웹 OAuth(리다이렉트)로 인가 코드를 받고, 그 코드를 우리 백엔드에내면 된다. 네이티브 카카오/네이버/구글 SDK는 “앱 안에서 카톡·네이버앱으로 원탭 로그인”을 원할 때 쓰는 선택지다. 지금 구조(API·세션 = 웹)에서는 없어도 된다.

### “그냥 웹 로그인 만들듯이 하면 되나?”

**된다. 그게 기본 방향이다.**

1. FE에 `/login`과 `/oauth/{kakao|naver|google}/callback`을 만든다.  
2. 카카오/네이버/구글 **웹** 콘솔에 등록된 Client ID·콜백 URL을 쓴다.  
3. 콜백에서 `code`로 `POST /api/auth/oauth/{provider}/login`을 친다.  
4. 쿠키가 심기면 이후 API는 웹만 호출한다.  
5. 앱은 로그인 전 `/login` WebView, 로그인 후 기존 탭 WebView를 연다.

---

## 3. 백엔드 계약 (스웨거)

`POST /api/auth/oauth/{provider}/login`  
- body: `authorizationCode` 필수, `redirectUri`/`state` 선택  
- provider: `kakao` | `google` | `naver` (애플은 명세 없음)  
- 응답 `result`: `userId`, `nickname`, `profileImageUrl`, `role`, `newUser` (본문에 accessToken 없음)

`POST /api/auth/reissue` · `POST /api/auth/logout` → 쿠키 기준.

공통 스키마에 JWT Bearer가 있어도, 소셜 로그인은 쿠키 세션이 본체다. 웹은 `withCredentials: true`.

---

## 4. 역할

| 구분 | 역할 |
| --- | --- |
| 웹 | 로그인 화면, OAuth 콜백, 로그인/재발급/로그아웃, 장소·일정·기록 등 **모든** API |
| 앱 | WebView 셸, 네이티브 지도 **화면**, (나중에) 푸시 등 |
| 백엔드 | 인가 코드 → 쿠키 세션. 앱 전용 토큰 본문 없음 (변경 안 함) |

앱이 백엔드에 로그인 POST를 직접 치지 않는다. 치면 쿠키가 웹과 갈라진다.

---

## 5. 흐름

```
사용자 → FE /login → 카카오/네이버/구글 웹 로그인 → /oauth/.../callback
       → POST /api/auth/oauth/{provider}/login → Set-Cookie
       → 이후 API는 전부 웹 axios (쿠키)
```

앱: 위 FE를 WebView로 연다. 브라우저: 같은 FE를 주소창으로 연다. **로그인·API 코드는 하나다.**

---

## 6. 구현 시 챙길 것 (SDK가 아님)

1. 소셜 **웹** 콘솔 콜백에 쓸 URL  
   - 지금: `http://localhost:3000|3001/oauth/{provider}/callback`  
   - 앱/배포 FE origin도 콜백에 넣어야 한다. localhost만 있으면 실기기·배포에서 실패한다.  
2. CORS + credentials (웹 origin ↔ API origin).  
3. 쿠키 `SameSite` / `Secure` / `Domain`이 WebView에서도 붙는지.  
4. 구글: **인앱 WebView**에서 구글 로그인 페이지가 막히는 경우가 있다. 그때만 시스템 브라우저를 쓰거나, 구글을 잠시 빼는 식으로 대응한다. **카카오·네이버 웹 로그인이 막혀서 API를 못 쓰는 구조는 아니다.**  
5. iOS 스토어에 다른 소셜만 넣고 애플을 안 넣으면 심사에서 걸릴 수 있다. 이건 API와 무관한 스토어 규칙이다.

네이티브 소셜 SDK, `AUTH_TOKEN`으로 access 주입, 앱 SecureStore 세션은 **이 방향에서 쓰지 않는다.**

---

## 7. 콘솔 설정 (dev, 노션)

패키지/번들: `com.gilmoa.jejugilmoa`. 앱 scheme: `jejugilmoa` (웹 로그인만 쓰면 OAuth용으로는 안 써도 됨).

| 제공자 | 웹 로그인에 쓰는 것 |
| --- | --- |
| 네이버 | 웹 콜백 3000/3001. Client ID는 콘솔에서 env |
| 카카오 | REST API 키 + 웹 콜백. Secret은 백엔드만 |
| 구글 | Web Client ID + 웹 콜백. Secret은 백엔드만 |

앱용 키 해시·구글 SHA·네이티브 앱 키는 **웹 로그인만 할 때는 당장 필요 없다.**  
Secret은 FE/APP에 넣지 않는다.

---

## 8. 지금 코드 상태

| 위치 | 상태 |
| --- | --- |
| FE `src/api` | axios + `withCredentials`, `apiGet/Post/...` unwrap, auth API 골격 |
| 앱 `LoginScreen` | 네이티브 버튼 mock. **웹 `/login`으로 바꾸는 쪽이 이 문서와 맞다** |
| 웹 로그인 페이지 | 없음. `VITE_DEV_AUTH`로 mock 로그인 |

---

## 9. 구현 순서

1. ~~FE API 기초 (axios, unwrap, auth API)~~  
2. ~~FE `/login` + `/oauth/{provider}/callback` + `loginWithOAuth`~~  
3. 콘솔에 배포/앱 FE 콜백 등록 (로컬은 `http://localhost:3000/oauth/...`)  
4. 앱 로그인 진입을 FE `/login` WebView로 연결  
5. 카카오(또는 네이버) E2E → API 호출 확인  
6. 구글은 WebView에서 막히면 그때 대응  

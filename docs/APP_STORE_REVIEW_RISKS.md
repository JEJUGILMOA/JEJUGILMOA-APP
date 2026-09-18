# App Store 심사 리젝 리스크 분석

> 작성일: 2026-09-18  
> 대상: `JEJUGILMOA-APP` + `JEJUGILMOA-FE` (하이브리드)  
> 근거: [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)  
> 최근 반려: Guideline **4 Design** — 외부 지도가 Apple Maps가 아닌 타사(네이버)로만 연결됨 (**코드 수정 완료 · 네이티브 재빌드 후 재제출**)

이 문서는 **Safety(1)** 를 중심으로 하되, Performance / Business / Design / Legal 중 우리 앱에 해당할 수 있는 항목을 함께 정리한다.

---

## 0. 한눈에 보기

| 우선순위 | 이슈 | 가이드 | 상태 |
|---------|------|--------|------|
| ✅ 완료 | 외부 지도 → Apple Maps (반려 사유) | 4 | 코드 반영 · **네이티브 재빌드·재제출 필요** |
| ✅ 완료 | `OPEN_EXTERNAL_URL` 지도/일반 링크 Alert 분기 | 2.1 / 4 | `webviewBridge.ts` 반영 |
| ✅ 완료 | Always 위치 키 제거 · When In Use만 유지 | 5.1.1 | `infoPlist` + 네이버맵 플러그인 모두 제거 · **재빌드 필요** |
| ✅ 완료 | 로그인 화면에 이용약관·개인정보처리방침 링크 | 5.1.1 | FE `LoginPage` |
| ✅ 완료 | 게스트도 마이에서 약관·고객센터 접근 | 5.1.1 | 탈퇴는 로그인 후만 (의도) |
| 🟢 OK | 방문 인증 spoof — **심사용으로 production에 유지** | 2.1 | Review Notes에 켜는 법 명시 |
| 🟠 Med | API 기본값이 `gilmoa-dev` (env 누락 시) | 2.1 | 확인 필요 |
| ✅ 완료 | 마이크 권한 문구 제거 (미사용) | 5.1.1 | `app.config.ts` · **재빌드 필요** |
| 🟢 Low/OK | Sign in with Apple 네이티브 | 4.8 | 양호 |
| 🟢 Low/OK | 기록 신고·사용자 차단 (FE) | 1.2 | 양호 |
| 🟢 Low/OK | 회원 탈퇴 (로그인 후 설정) | 5.1.1(v) | 양호(경로 접근성만 이슈) |
| 🟢 Low/OK | IAP/결제 없음 | 3.1 | 해당 없음 |
| 🟢 Low/OK | ATT/광고 SDK 없음 | 5.1.2 | 양호 |

---

## 1. Safety (안전)

### 1.1 Objectionable Content
- **리스크: 낮음**  
- 여행·지도·기록 앱. 앱 자체에 폭력·성인·혐오 콘텐츠 생성 기능 없음.  
- **주의:** 사용자 공개 기록(UGC)에 부적절한 내용이 올라올 수 있음 → **1.2**로 대응.

### 1.2 User-Generated Content (UGC)
공개 여행 기록·사진·닉네임 등이 있으므로 UGC에 해당한다.

가이드 요구:
1. 불쾌한 콘텐츠 필터  
2. **신고** + 신속 대응  
3. **차단**  
4. 연락처(퍼블리시 연락처)

| 항목 | FE | APP | 평가 |
|------|----|-----|------|
| 신고 | `ReportRecordModal` 등 | 웹 UI | ✅ |
| 차단 | `BlocksPage`, block API | 웹 UI | ✅ |
| 연락처 | 설정 → 고객센터 `EXTERNAL_SUPPORT_URL` | 브릿지 오픈 | ⚠️ Alert 버그(아래) |
| 필터(사전) | 서버/운영 정책에 의존 | — | 심사 노트에 운영 방식 명시 권장 |
| 커뮤니티 가이드 링크 | 없음 | — | 있으면 가점 |

**권장:** 신고/차단이 심사 계정으로 재현 가능한지 확인. App Review Notes에 경로 적기.

### 1.3 / 1.4 Kids, Physical harm
- Kids 카테고리·건강 의료 진단 기능 없음 → **해당 낮음**.  
- 위치 기반 야외 이동 안내는 일반적인 지도 앱 수준.

### 1.5 / 1.6 Developer information, Data security
- 개발자 연락처는 App Store Connect + 앱 내 고객센터.  
- 소셜 로그인은 쿠키 세션(웹). OAuth secret 앱 하드코딩 없음(`docs/AUTH.md`).

---

## 2. Performance (성능·완성도)

### 2.1 App Completeness
| 리스크 | 증거 | 조치 |
|--------|------|------|
| 🟠 개발용 API 기본값 | `APP/src/constants/config.ts` — `API_BASE_URL` fallback `https://gilmoa-dev.gyeonseo.com` | production EAS에 `EXPO_PUBLIC_API_BASE_URL` 강제. fallback을 prod로 바꾸거나 미설정 시 빌드 실패 |
| 🟢 방문 인증 spoof | 설정 7탭 → `TOGGLE_TRIP_VISIT_SPOOF` | **유지(의도적).** 심사관은 제주 현장이 없어 방문 인증 검증 불가. production(스토어) 빌드에 포함. Preview만 켜고 따로 제출하는 구조가 아님 |
| 🟡 temp/dev 로그인 | FE `loginWithDevAuth` — production UI에서는 숨김 주석 | 스토어 빌드에서 버튼 미노출 재확인 |
| 🟡 미완 태스크 | `docs/TASKS.md` 실기기·E2E·심사 체크리스트 미체크 | 제출 전 크리티컬 플로우 QA |

**심사 계정 / Review Notes:** 소셜만 있으면 데모·게스트 범위 명시. spoof 경로도 Notes에 적어 2.3.1(숨은 기능) 오해를 막는다.

### 2.3 Accurate Metadata
- spoof는 **제거하지 않음**. App Review Notes에 「마이 → 설정 → (위치) 7회 탭 → 방문 인증 시뮬레이션」을 안내하면 됨. 켜진 뒤 UI에 테스트/시뮬레이션 표시가 있으면 더 안전.

### 2.5 Software Requirements
- 네이버맵·위치·카메라 등은 실제 기능과 맞는 권한 문구 필요 (Legal 5.1과 겹침).

---

## 3. Business (비즈니스)

### 3.1 Payments
- IAP/구독/디지털 상품 결제 코드 **없음** → **해당 없음**.  
- 향후 유료 플랜을 웹에서만 팔면 3.1.1 검토 필요.

### 3.1.3 / Reader 등
- 해당 없음.

---

## 4. Design (디자인) — **최근 반려 영역**

### 4.0 / 위치·지도와 시스템 연동
**반려 문구 요약:** 위치 기능이 기기에 내장된 지도(Apple Maps)와 연동되지 않고 타사 지도만 연다.

| 경로 | 이전 | 현재 | 상태 |
|------|------|------|------|
| 지도 「목적지로 설정」 | fallback `map.naver.com` | Apple Maps (`openExternalMap.ts`) | ✅ 코드 |
| 진행중 여행 「길찾기」 | 동일 | Apple Maps | ✅ 코드 |
| FE 장소 상세 「지도에서 보기」 | 네이버 | `openExternalMap` (Apple) | ✅ 코드 |
| `LSApplicationQueriesSchemes` | `nmap` | `maps` | ✅ 코드 |

**필수:** `app.config` / 네이티브 연동 변경이므로 **iOS production EAS 재빌드 후 재제출**. JS만 OTA로는 반영 안 됨.

### 4.2 Minimum Functionality
- 홈/계획/기록/마이 = WebView, **지도·방문인증·SIWA = 네이티브** → 순수 웹 래퍼보다 방어력 있음.  
- Review Notes에 네이티브 기능을 짧게 설명하면 좋음.

### 4.8 Sign in with Apple
| 항목 | 상태 |
|------|------|
| 카카오/네이버/구글 소셜 로그인 | 있음 → SIWA 필수 |
| 네이티브 Apple | `expo-apple-authentication` + 브릿지 | ✅ |
| FE 로그인 버튼 | 네이티브 WebView에서 Apple 노출 | ✅ (실기기 동등성 확인) |

---

## 5. Legal (법적·개인정보)

### 5.1.1 Privacy — Data Collection & Permission purpose
| 이슈 | 심각도 | 조치 |
|------|--------|------|
| Always 위치 키 vs foreground만 사용 | ✅ | `infoPlist`·네이버맵 플러그인에서 Always **삭제**. When In Use만 유지 |
| `NSMicrophoneUsageDescription` | ✅ | **삭제 완료** (녹음·영상 오디오 미사용) |
| Camera / Photo Library | 🟢 | 기록 첨부용으로 타당 |
| ATT / `NSUserTrackingUsageDescription` | 🟢 | 트래킹·광고 SDK 없으면 OK |

### 5.1.1 Privacy Policy & Account Deletion
| 이슈 | 심각도 | 상태 |
|------|--------|------|
| 로그인 화면 약관/개인정보 링크 | ✅ | `LoginPage` 하단 이용약관·개인정보처리방침 |
| 게스트 약관·고객센터 | ✅ | `MyPage` 게스트 메뉴. **탈퇴는 로그인 후만** |
| 로그인 후 탈퇴 | 🟢 | `SettingsPage` + `DELETE /users/me` |
| 이용약관 URL | 🟢 | `EXTERNAL_TERMS_URL` (`/terms`) 분리 |

### 5.1.1 / 2.1 — `OPEN_EXTERNAL_URL` Alert
✅ **수정 완료.** 지도 URL(`maps://`, `maps.apple.com`, `geo:`, Google Maps)만 「지도에서 볼까요?」, 약관·고객센터 등 https는 「외부 링크로 이동할까요?」.

---

## 6. 권장 수정 순서 (재제출 전)

1. **iOS production 빌드**에 Apple Maps + Always/마이크 키 제거 + `OPEN_EXTERNAL_URL` Alert 분기 반영 후 재빌드·재제출  
2. production EAS env에 prod API·웹 URL·네이버맵 키 검증  
3. FE 배포(로그인·게스트 약관 링크) 후 앱에서 확인  
4. App Review Notes 작성:
   - 데모/게스트로 볼 수 있는 범위  
   - 네이티브: 지도, 방문 인증, Sign in with Apple  
   - 외부 지도는 Apple Maps  
   - **방문 인증 spoof:** 마이 → 설정 → (위치) 7회 탭  
   - 탈퇴: 로그인 → 마이 → 설정 → 회원 탈퇴  
   - 신고/차단 경로  

**빌드 참고:** 심사용 = `eas build --profile production` (store). preview는 내부 테스트용. spoof는 심사 검증용으로 production에 유지.

---

## 7. 양호한 점 (유지)

- Sign in with Apple 네이티브 브릿지 (4.8)  
- UGC 신고·차단 (1.2)  
- 로그인 후 회원 탈퇴 API/UI (5.1.1v)  
- IAP 없음 (3.1)  
- ATT/광고 트래킹 없음 (5.1.2)  
- iPhone 전용(`supportsTablet: false`) 의도 명확  
- FE 장소 상세 외부 지도는 이미 Apple Maps 경로  

---

## 8. 참고 링크

- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)  
- Safety: `#safety`  
- Design / maps: Guideline 4  
- Sign in with Apple: 4.8  
- Privacy / account deletion: 5.1.1  
- 내부: `docs/AUTH.md`, `docs/TASKS.md` Phase 7  

---

## 9. 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-09-18 | 초안. Guideline 4 지도 반려 반영. FE/APP 교차 점검. |
| 2026-09-18 | Always 위치 키 삭제. spoof는 심사용으로 production 유지로 정정. |
| 2026-09-18 | Apple Maps 코드 완료로 상태 갱신. `OPEN_EXTERNAL_URL` Alert는 미수정 유지. |
| 2026-09-18 | `OPEN_EXTERNAL_URL` 지도/일반 Alert 분기 완료. |
| 2026-09-18 | 로그인·게스트 약관/개인정보 링크 FE 반영. |
| 2026-09-18 | `NSMicrophoneUsageDescription` 삭제. |
| 2026-09-19 | 네이버맵 플러그인 `NSLocationAlwaysAndWhenInUseUsageDescription` 제거 (When In Use만). |

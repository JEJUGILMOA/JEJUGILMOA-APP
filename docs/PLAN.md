# 제주 길모아 개발 계획

## 확정 아키텍처
```
app/_layout.tsx (Stack, GestureHandlerRootView)
└── app/(tabs)/_layout.tsx (하단 네이티브 탭바, expo-router Tabs, 항상 고정)
    ├── index.tsx (홈)  : WebViewScreen (React 웹앱 "/")
    ├── map.tsx (지도)  : MapScreen (네이버맵 SDK) + MapBottomSheet 오버레이
    ├── saved.tsx (저장): WebViewScreen (React 웹앱 "/saved")
    └── my.tsx (마이)   : WebViewScreen (React 웹앱 "/my")
```
- 라우팅: expo-router (파일 기반). `app/`은 얇은 라우트 파일만, 실제 화면 로직은 `src/screens`, `src/components`
- 웹 ↔ 네이티브 통신은 `postMessage` 기반 브릿지(`src/bridge/webviewBridge.ts`), 네이티브 쪽 이동은 `expo-router`의 `router.push()`
- 지도 SDK: `@mj-studio/react-native-naver-map` (Expo config plugin 지원)
- 지도 위 오버레이 UI: `@gorhom/bottom-sheet`

각 결정의 배경은 이전 대화/커밋 로그를 참고. 새로운 아키텍처 결정이 생기면 이 문서에 추가한다.

## 결정 기록
- **2026-07 — Expo SDK 57 채택.** 지도(네이버맵 2.x)가 New Architecture를 요구하는데 Expo가 SDK 52부터 New Arch를 기본값으로 쓰므로 궁합이 좋음. 단, SDK 57은 릴리즈 직후라 `@gorhom/bottom-sheet`, `react-native-reanimated`, `react-native-gesture-handler` 등 서드파티 패키지의 호환성 검증 기간이 짧았을 수 있음. 원인 불명의 네이티브 빌드/렌더링 에러가 발생하면 `npx expo install expo@56 --fix`로 한 단계 내리는 것을 우선 시도해본다.
- **2026-07 — expo-router(파일 기반 라우팅) 채택.** `create-expo-app` 기본 템플릿이 이미 expo-router로 생성되어, 수동 React Navigation(`createBottomTabNavigator`) 대신 `app/` 폴더 기반 라우팅으로 전환. 화면 컴포넌트 자체(`WebViewScreen`, `MapScreen`, `MapBottomSheet`)는 `src/screens`, `src/components`에 그대로 두고, `app/(tabs)/*.tsx`는 그 컴포넌트를 렌더링만 하는 얇은 라우트 파일로 구성한다. 브릿지의 `NAVIGATE_TO_MAP` 처리는 `navigationRef` 패턴 대신 `expo-router`의 `router.push()`를 사용한다 (Phase 5에서 구현).

---

## Phase 0 — 프로젝트 초기화
**목표**: Expo 프로젝트 생성, 필수 패키지 설치, 폴더 구조 세팅
**산출물**: package.json 의존성 확정, `src/` 폴더 구조, `app.config.ts` 초안

## Phase 1 — 네비게이션 셸
**목표**: 하단 탭바 골격 완성 (각 화면은 아직 placeholder)
**산출물**: 탭 4개가 실제로 전환되는지 확인

## Phase 2 — 웹뷰 화면 연동
**목표**: 홈/저장/마이 탭에서 실제(또는 로컬 dev) 웹앱 URL 로딩
**산출물**: `WebViewScreen` 완성, 로딩/에러 상태 처리

## Phase 3 — 지도 화면 스켈레톤
**목표**: 네이버맵 SDK 연동, 제주 중심 좌표로 지도만 렌더링 (마커 없이)
**산출물**: NCP Client ID 발급 + `.env` 연결, 지도가 실제로 뜨는지 확인

## Phase 4 — 지도 위 바텀시트
**목표**: 드래그 가능한 오버레이 UI, 더미 장소 리스트 표시
**산출물**: `MapBottomSheet` 3단계 스냅포인트 동작

## Phase 5 — 웹 ↔ 네이티브 브릿지
**목표**: 웹 화면의 "지도에서 보기" 클릭 → 지도 탭 전환 + 해당 장소로 카메라 이동
**산출물**: `navigationRef` 패턴 구현, `NAVIGATE_TO_MAP` 메시지 실동작

## Phase 6 — 실 데이터 연동
**목표**: 장소/트레일 데이터를 백엔드 API 또는 공공데이터(제주올레·공공데이터포털)에서 연동
**산출물**: API 클라이언트, 로딩/에러/빈 상태 UI

## Phase 7 — 배포 준비
**목표**: EAS Build 설정, 아이콘/스플래시, 스토어 심사 체크리스트

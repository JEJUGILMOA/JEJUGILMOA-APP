# 태스크 체크리스트

> 에이전트는 작업 시작 전 이 파일에서 현재 미완료 항목을 확인하고, 완료 즉시 체크한다.
> 사람도 진행 상황을 여기서 한눈에 확인할 수 있다.

## Phase 0 — 프로젝트 초기화
- [x] `npx create-expo-app` 로 프로젝트 생성 (expo-router 기본 템플릿으로 생성됨 — 계속 사용)
- [x] `app.json` 내용을 `app.config.ts`로 병합 후 `app.json` 삭제
- [x] 웹뷰/지도/바텀시트 패키지 설치 (`react-native-webview`, `@mj-studio/react-native-naver-map`, `@gorhom/bottom-sheet`, `react-native-reanimated`, `react-native-gesture-handler`)
- [x] `src/` 폴더 구조 세팅 (screens, components, bridge, constants) — 라우트는 `src/app/` (expo-router 지원)
- [x] `.env`에 `NAVER_MAP_CLIENT_ID` 등록, `.gitignore`에 `.env` 포함 확인

## Phase 1 — 네비게이션 셸 (expo-router)
- [ ] `app/_layout.tsx`에서 `GestureHandlerRootView`/`SafeAreaProvider` 세팅 확인
- [ ] `app/(tabs)/_layout.tsx`의 탭 4개(홈/지도/저장/마이) 아이콘·라벨 확인
- [ ] 각 탭 라우트(`index.tsx`, `map.tsx`, `saved.tsx`, `my.tsx`)가 대응하는 화면 컴포넌트를 정상 렌더링하는지 확인
- [ ] 시뮬레이터/디바이스에서 탭 전환 확인

## Phase 2 — 웹뷰 화면
- [ ] `WebViewScreen` 컴포넌트 작성
- [ ] 로딩 인디케이터 확인
- [ ] 웹앱 dev 서버 URL로 실제 로딩 테스트
- [ ] 로딩 실패 시 에러 화면(재시도 버튼) 추가

## Phase 3 — 지도 화면
- [ ] NCP Maps 키 발급
- [ ] `.env`에 `NAVER_MAP_CLIENT_ID` 등록
- [ ] `MapScreen`에서 지도 렌더링 확인 (제주 중심)

## Phase 4 — 바텀시트
- [ ] `MapBottomSheet` 스냅포인트 동작 확인
- [ ] 더미 장소 리스트 → 상세 전환 확인

## Phase 5 — 브릿지
- [ ] `navigationRef` 유틸 작성
- [ ] `NAVIGATE_TO_MAP` 처리 구현
- [ ] 웹 쪽 테스트 버튼으로 왕복 확인

## Phase 6 — 실 데이터
- [ ] API 클라이언트 작성
- [ ] 로딩/에러/빈 상태 UI
- [ ] 트레일 경로(폴리라인) 데이터 소스 확정

## Phase 7 — 배포 준비
- [ ] EAS 프로젝트 연결
- [ ] 아이콘/스플래시 적용
- [ ] 스토어 심사 체크리스트 검토

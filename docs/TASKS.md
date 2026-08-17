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
- [x] `app/(tabs)/_layout.tsx`의 탭 5개(홈/지도/계획/기록/마이) 아이콘·라벨을 FE와 동기화
- [x] 각 탭 라우트(`index.tsx`, `map.tsx`, `plan.tsx`, `record.tsx`, `my.tsx`)가 대응하는 화면 컴포넌트를 정상 렌더링하는지 확인
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
- [x] Native 지도 UI 방향 확정 (WebView 오버레이 비사용) — PLAN 결정 기록
- [x] MAP-01 상단 검색바·모드 칩·카테고리 칩·현위치 FAB
- [x] 지도 팔레트/모드 토큰 (`src/constants/map.ts`)

## Phase 4 — 지도 모드·시트·검색 (MAP-02~07)
- [x] MAP-04 모드 바텀시트 + 모드 state (`general|plan|activeTrip|heatmap`)
- [x] MAP-06 장소 상세 시트
- [x] MAP-06 UI 고도화(이미지·영업정보·목적지/코스 버튼, scrim 제거)
- [x] MAP-07 전체화면 검색 모달
- [x] MAP-02 계획 지도(순번·점선·요약 시트) 더미
- [x] MAP-03 진행중 여행(배너·경로·다음장소) 더미
- [x] MAP-03 UI 고도화(진행 뱃지·경로 pill·다음장소 시트·길안내 CTA)
- [x] MAP-05 히트맵 + 범례 더미
- [ ] 실기기에서 시트 스냅/제스처 확인

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

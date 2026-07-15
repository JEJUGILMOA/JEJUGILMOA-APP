# Cursor 에이전트 프롬프트 모음

## 공통 원칙
1. 매 프롬프트 시작 부분에 `docs/PLAN.md`의 어떤 Phase인지 명시한다 — 에이전트가 매번 전체 맥락을 다시 추측하지 않게 한다.
2. **한 번에 하나의 Phase만** 시킨다. 여러 Phase를 한 프롬프트에 몰아넣지 않는다.
3. 끝에 "`npx tsc --noEmit` 결과와 변경 파일 목록을 요약해줘"를 붙여 자기검증을 강제한다 (이미 `afterFileEdit` 훅이 자동으로도 해주지만, 명시적으로 다시 요청하면 에이전트가 결과를 놓치지 않고 보고한다).
4. 지도 SDK처럼 불확실성이 큰 구간은 "확신 없으면 추측하지 말고 먼저 물어봐"를 프롬프트에 직접 넣는다 — `.cursor/rules/naver-map.mdc`가 이미 이 지침을 갖고 있지만 중요한 구간은 이중으로 강조하는 게 안전하다.

---

## Phase 0 — 프로젝트 초기화 (최초 킥오프 프롬프트)
> Expo 프로젝트(`npx create-expo-app`)는 이미 로컬에서 생성해서 이 폴더 구조 위에 올려둔 상태라고 가정한다.
> 이 프로젝트는 **expo-router(파일 기반 라우팅) 템플릿**으로 생성되었다 — `docs/PLAN.md`의 "결정 기록" 참고.
> 아래 프롬프트를 Cursor Agent 채팅창에 그대로 붙여넣으면 된다.
```
이 프로젝트는 제주 길모아라는 RN(Expo, expo-router) + WebView 하이브리드 앱이야.

먼저 아래 파일들을 순서대로 읽고 전체 맥락을 파악해줘:
1. AGENTS.md
2. docs/PLAN.md (특히 "결정 기록" 섹션 — expo-router를 쓰는 이유가 적혀 있어)
3. docs/TASKS.md
4. README.md
5. .cursor/rules/ 안의 규칙들

다 읽었으면 docs/PLAN.md의 Phase 0(프로젝트 초기화)를 진행해줘.
- Expo 프로젝트 자체는 이미 생성돼 있어. package.json을 확인해서 뭐가 이미 설치돼 있고 뭐가 빠졌는지 먼저 파악해줘.
- README.md의 "설치 순서" 섹션에 나온 패키지 중 아직 없는 것만 골라서 설치 목록을 나한테 먼저 보여주고, 확인받은 다음 설치해줘.
- src/, app/ 폴더 구조가 README.md의 "폴더 구조" 섹션과 일치하는지 확인하고, 이미 있는 스켈레톤 코드(app/_layout.tsx, app/(tabs)/*, WebViewScreen, MapScreen 등)는 그대로 유지해줘 (덮어쓰지 마).
- 끝나면 docs/TASKS.md의 Phase 0 체크박스를 갱신하고, npx tsc --noEmit 결과를 알려준 다음, 다음 Phase에서 뭘 할지 1~2문장으로 요약해줘.
```

## Phase 1 — 네비게이션 셸 (expo-router)
```
docs/PLAN.md의 Phase 1(네비게이션 셸)을 진행해줘. 지금 목표는 실제 콘텐츠가 아니라
"탭 4개가 전환되는지"만 확인하는 거야.

- app/_layout.tsx, app/(tabs)/_layout.tsx, app/(tabs)/index.tsx·map.tsx·saved.tsx·my.tsx를
  이 저장소의 스켈레톤을 참고해서 완성해줘. 이미 각 라우트가 src/screens의 컴포넌트를
  렌더링하도록 연결돼 있을 텐데, 그 구조(라우트 파일은 얇게, 로직은 src/에)는 유지해줘.
- 이 단계에서는 WebView/지도 실제 연동은 다음 Phase에서 할 거니까, 지금은 탭 전환만 되면 돼.
- 타입 에러 없는지 npx tsc --noEmit으로 스스로 확인하고 결과를 알려줘.
- docs/TASKS.md Phase 1 체크박스 갱신해줘.
```

## Phase 2 — 웹뷰 화면 연동
```
docs/PLAN.md의 Phase 2(웹뷰 화면 연동)를 진행해줘.

- WEB_BASE_URL을 [로컬 dev 서버 주소로 교체, 예: http://192.168.x.x:5173]로 바꿔서
  실제 웹뷰 로딩을 확인해줘.
- 로딩 실패 시 보여줄 간단한 에러 화면도 추가해줘 (재시도 버튼 포함).
- 이 단계에서는 웹 ↔ 네이티브 브릿지는 아직 구현하지 마 (Phase 5에서 진행).
- 확인 후 docs/TASKS.md 갱신.
```

## Phase 3 — 지도 화면 스켈레톤 (불확실성이 큰 구간)
```
docs/PLAN.md의 Phase 3(지도 화면 스켈레톤)을 진행해줘.

- 먼저 @mj-studio/react-native-naver-map 공식 문서(https://rnnavermap.mjstudio.net)에서
  현재 버전 기준 NaverMapView의 정확한 props와 초기 카메라 설정 방법을 확인해줘.
  이 저장소의 MapScreen.tsx는 API 형태를 보여주는 스켈레톤일 뿐이라 실제 prop명과 다를 수 있어.
- 확인한 내용과 실제 코드가 다르면, 왜 다른지 나에게 알려주고 코드를 맞게 고쳐줘.
- NCP Client ID는 .env의 NAVER_MAP_CLIENT_ID로만 참조하고 코드에 하드코딩하지 마.
- 지도가 제주 중심 좌표로 뜨는지만 확인하면 돼 (마커는 다음 Phase).
- 확실하지 않은 부분은 추측하지 말고 나한테 먼저 물어봐.
```

## Phase 4 — 지도 위 바텀시트
```
docs/PLAN.md의 Phase 4(지도 위 바텀시트)를 진행해줘.

- MapBottomSheet.tsx를 완성해서 더미 장소 리스트(5개 정도 하드코딩)가 보이게 해줘.
- 스냅포인트 3단계(접힘/중간/펼침)가 실제로 드래그되는지 확인해줘.
- 리스트 항목 클릭 시 상세 뷰로 전환되는 것도 확인해줘.
- docs/TASKS.md 갱신.
```

## Phase 5 — 웹 ↔ 네이티브 브릿지
```
docs/PLAN.md의 Phase 5(웹 ↔ 네이티브 브릿지)를 진행해줘.

- .cursor/rules/webview-bridge.mdc 규칙을 반드시 따라줘.
- React Navigation의 "navigating without navigation prop" 패턴으로 navigationRef를 만들고,
  webviewBridge.ts의 NAVIGATE_TO_MAP 처리를 실제로 구현해줘.
- 홈 웹뷰 화면에 테스트용 버튼(예: "지도에서 이 장소 보기")을 하나 임시로 추가해서
  실제로 지도 탭 전환 + 카메라 이동이 되는지 확인해줘. 이 테스트 버튼은 확인 후 제거해도 좋다고
  나에게 알려줘 (직접 지우지는 말고).
- docs/TASKS.md 갱신.
```

## 이후 Phase(6, 7)용 재사용 템플릿
```
docs/PLAN.md의 Phase [N]([Phase명])을 진행해줘.
- 이번 Phase의 산출물: [docs/PLAN.md에서 해당 Phase의 "산출물" 붙여넣기]
- 범위 밖의 파일/기능은 건드리지 마. 범위를 벗어나야 할 것 같으면 먼저 이유를 설명해.
- 새 패키지 설치가 필요하면 먼저 물어봐.
- 끝나면 npx tsc --noEmit 결과 요약 + docs/TASKS.md 체크박스 갱신.
```

---

## 막혔을 때 쓰는 프롬프트
```
방금 작업이 계획과 다르게 흘러간 것 같아. docs/TASKS.md 기준으로 지금까지 뭘 했고
뭐가 남았는지 정리해서 보여줘. 그리고 다음 스텝을 다시 제안해줘. 코드는 아직 건드리지 마.
```

## 리뷰용 프롬프트 (다른 관점으로 재검토)
```
방금 구현한 [기능명]을 다시 한번 검토해줘. 이번엔 "이게 왜 잘못될 수 있는가"
관점으로만 봐줘 — 엣지 케이스, 타입 안전성, 웹뷰 메시지 위조 가능성 위주로.
문제가 없으면 없다고 말해줘, 억지로 문제를 만들어내지 말고.
```

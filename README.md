# 제주 길모아

제주 올레길·관광 장소를 위한 React Native(Expo) + WebView 하이브리드 앱입니다.

홈 / 계획 / 기록 / 마이 탭은 WebView로 웹앱을 로드하고, 지도 탭만 네이티브 네이버맵 SDK로 렌더링합니다.

## 아키텍처

```
스플래시 → 로그인 → 하단 탭
                      ├── 홈   : WebView (/)
                      ├── 지도 : 네이버맵 + 바텀시트
                      ├── 계획 : WebView (/plan)
                      ├── 기록 : WebView (/record)
                      └── 마이 : WebView (/my)
```

| 영역 | 기술 |
|---|---|
| 프레임워크 | Expo SDK 57, React Native 0.86, TypeScript |
| 라우팅 | expo-router (파일 기반, `src/app/`) |
| 웹뷰 | `react-native-webview` |
| 지도 | `@mj-studio/react-native-naver-map` |
| 지도 오버레이 | `@gorhom/bottom-sheet` |
| 웹 ↔ 네이티브 | `postMessage` 브릿지 (`src/bridge/`) |

> Expo Go로는 실행할 수 없습니다. 네이버맵 등 커스텀 네이티브 모듈이 있어 **Development Build**가 필요합니다.

## 폴더 구조

```
src/
├── app/                    # expo-router 라우트 (얇은 파일)
│   ├── index.tsx           # 스플래시
│   ├── login.tsx           # 로그인
│   ├── _layout.tsx         # 루트 레이아웃
│   └── (tabs)/             # 하단 탭 (홈/지도/계획/기록/마이)
├── screens/                # 실제 화면 로직
├── components/
├── bridge/                 # WebView postMessage 프로토콜
├── constants/
└── context/                # Auth 등 전역 상태
app.config.ts               # Expo 설정 + 네이티브 플러그인
docs/
├── PLAN.md                 # 아키텍처·단계별 계획
└── TASKS.md                # 진행 체크리스트
AGENTS.md                   # Cursor/에이전트 작업 지침
```

## 사전 준비

### 1. 필수 도구

- Node.js 20+
- pnpm 10+ (`npm i -g pnpm` 또는 [설치 가이드](https://pnpm.io/installation))
- Android Studio (Android SDK, NDK)
- USB 디버깅이 가능한 Android 기기 또는 에뮬레이터
- (iOS 빌드는 Mac + Xcode 필요)

### 2. 환경 변수 (Windows 권장)

| 변수 | 예시 값 |
|---|---|
| `ANDROID_HOME` | `C:\Users\<유저>\AppData\Local\Android\Sdk` |
| `JAVA_HOME` | `C:\Program Files\Android\Android Studio\jbr` (JDK 21) |
| Path에 추가 | `%ANDROID_HOME%\platform-tools` |

> **JDK 25는 사용하지 마세요.** CMake 네이티브 빌드가 실패합니다. Android Studio에 포함된 **JDK 21(JBR)** 을 사용하세요.

### 3. `.env`

프로젝트 루트에 `.env` 파일을 만듭니다.

```env
NAVER_MAP_CLIENT_ID=발급받은_클라이언트_ID
```

- [네이버클라우드플랫폼](https://www.ncloud.com) → Maps 상품에서 Client ID 발급
- 등록 시 Android 패키지명 / iOS Bundle ID는 `app.config.ts` 값과 동일해야 합니다 (`com.yourcompany.jejugilmoa`)
- `.env`는 git에 올리지 않습니다

### 4. 의존성 설치

```bash
pnpm install
```

## 앱 빌드 & 실행

### Android (실기기 / 에뮬레이터)

```bash
# 1) 네이티브 프로젝트 생성 (최초 1회, 또는 app.config.ts / 네이티브 패키지 변경 시)
pnpm exec expo prebuild -p android

# 2) SDK 경로 파일이 없으면 생성 (prebuild --clean 후 자주 필요)
#    android/local.properties
#    sdk.dir=C:/Users/<유저>/AppData/Local/Android/Sdk

# 3) 빌드 & 기기에 설치
pnpm exec expo run:android
# 또는
pnpm android
```

USB로 공기계를 연결했을 때:

```bash
adb devices   # device 로 보이는지 확인
pnpm exec expo run:android
```

### iOS (Mac only)

```bash
pnpm exec expo prebuild -p ios
pnpm exec expo run:ios
```

### 평소 개발 (JS/TS만 수정할 때)

앱이 기기에 한 번 설치된 뒤에는 **다시 네이티브 빌드할 필요 없습니다.**

```bash
pnpm exec expo start --dev-client
```

기기의 제주 길모아 앱을 열고 Metro에 연결하면 Hot Reload로 반영됩니다.

| 상황 | 명령 |
|---|---|
| 일상 개발 (화면/로직 수정) | `pnpm exec expo start --dev-client` |
| 네이티브 모듈·`app.config.ts` 변경 후 | `pnpm exec expo prebuild` → `pnpm exec expo run:android` |
| 앱 삭제 / 첫 설치 | `pnpm exec expo run:android` |

### Web

지도·네이티브 모듈 때문에 **웹으로는 정상 동작하지 않습니다.** 탭 UI만 빠르게 보고 싶을 때 참고용으로만 사용하세요.

```bash
pnpm exec expo start --web
```

## 자주 겪는 빌드 이슈

### `SDK location not found`

`expo prebuild --clean`이 `android/local.properties`를 지운 경우입니다.

```properties
# android/local.properties
sdk.dir=C:/Users/<유저>/AppData/Local/Android/Sdk
```

### `codegenNativeComponent` / Expo Go로 실행

이 프로젝트는 Expo Go 미지원입니다. Dev Client로 빌드한 앱을 사용하세요.

### `configureCMakeDebug` + `restricted method in java.lang.System`

JDK 25 때문입니다. `JAVA_HOME`을 Android Studio JBR(JDK 21)로 맞추세요.

```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:Path = "$env:JAVA_HOME\bin;" + $env:Path
java -version   # 21.x 여야 함
```

### `ninja: error: manifest 'build.ninja' still dirty` (Windows + Reanimated)

경로가 길거나 Ninja가 오래되면 CMake가 무한 재설정됩니다. 다음을 확인하세요.

1. **Windows 긴 경로 허용** (관리자 PowerShell 한 번):
   ```powershell
   New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
   ```
2. **Ninja 1.12+** — Android SDK의 `cmake\<버전>\bin\ninja.exe`가 1.10.x면 [Ninja 1.12.1](https://github.com/ninja-build/ninja/releases/tag/v1.12.1)로 교체
3. 그래도 안 되면 프로젝트를 `C:\dev\gilmoa`처럼 **짧은 경로**로 옮기기

### 네이버맵 Maven `401 Unauthorized` (JitPack)

`app.config.ts`의 `expo-build-properties`에 네이버 Maven이 들어 있어야 합니다.

```
https://repository.map.naver.com/archive/maven
```

## 커밋 컨벤션

이 프로젝트는 [Conventional Commits](https://www.conventionalcommits.org/)을 기반으로 한 커밋 규칙을 따릅니다.

### 커밋 메시지 구조

```
<type>(<scope>): <제목>

<본문 (선택)>
```

### Type

| Type | 설명 |
|---|---|
| `feat` | 새로운 기능 추가 |
| `fix` | 버그 수정 |
| `docs` | 문서 수정 (README 등) |
| `style` | 코드 포맷팅, 세미콜론 등 (로직 변경 없음) |
| `refactor` | 기능 변화 없이 코드 구조 개선 |
| `test` | 테스트 추가/수정 |
| `chore` | 빌드, 설정, 패키지 매니저 등 기타 작업 |

### 작성 규칙

- 제목은 **50자 이내**로 간결하게 작성합니다.
- 제목은 마침표로 끝내지 않습니다.
- 하나의 커밋에는 하나의 논리적 변경만 담습니다.
- 본문에는 **"무엇을 했는지"보다 "왜 했는지"**를 적습니다.
- 관련 이슈가 있다면 제목 끝에 이슈 번호를 붙입니다. (예: `(#123)`)

### 예시

```
feat(auth): 카카오 로그인 연동

fix(map): 제주 초기 좌표 카메라 초기 오류 수정

docs: Android 빌드 가이드에 JDK 21 안내 추가 (#42)

refactor(bridge): NAVIGATE_TO_MAP 처리 분리
```

## 참고 문서

| 문서 | 내용 |
|---|---|
| [`docs/PLAN.md`](docs/PLAN.md) | 아키텍처·Phase별 계획·결정 기록 |
| [`docs/TASKS.md`](docs/TASKS.md) | 진행 체크리스트 |
| [`AGENTS.md`](AGENTS.md) | Cursor 에이전트 작업 지침 |
| [`.cursor/rules/`](.cursor/rules/) | 네이버맵·WebView 브릿지·RN/TS 규칙 |

## 라이선스

이 저장소의 라이선스는 [`LICENSE`](LICENSE)를 참고하세요.

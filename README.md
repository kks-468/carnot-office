# Carnot office · 연구행정 그룹웨어 (로컬 개발판)

연구과제 행정(제안·예산·집행·증빙·연구단)과 회사 업무(전자결재·업무보고·회사일정·직원·급여)를 한곳에서 다루는 그룹웨어 프로토타입이에요.
VS Code에서 고치고 돌려 볼 수 있게 프론트와 백엔드로 나눠 두었어요.

**주요 메뉴**: 홈 · 업무지원(전자결재, 업무보고, 회사일정) · 연구단 과제 · 연구 관리(연구제안, 연구행정, 전문가, 자료실) · 기관설정(양식, 직원·급여, 설정)

> 시연 로그인: 회사 아이디 `admin` / 아이디 `admin` / 비밀번호 `admin` (시연용이에요. 실서비스 전에 반드시 없애야 해요)

- **프론트엔드** (`client/`): 화면 전체. 순수 HTML·CSS·JavaScript라서 빌드 과정이 없어요.
- **백엔드** (`server/`): Node.js(Express) 서버. 화면을 띄우고, 데이터를 저장하고, AI(Anthropic API)를 대신 호출해요.

> 지금 백엔드는 **저장과 AI 연결만** 맡아요. 계산·권한·화면 로직은 아직 프론트(`app.js`)에 있어요.
> 실제 서비스로 가려면 DB·로그인·기관별 권한을 서버로 옮겨야 해요. 순서는 아래 "다음 단계"와 `docs/데이터모델.md`에 정리해 뒀어요.

---

## 1. 준비물

| 준비물 | 설명 |
|---|---|
| Node.js 20 이상 (LTS) | https://nodejs.org 에서 LTS 버전 설치. 터미널에서 `node -v`로 확인 |
| VS Code | https://code.visualstudio.com |
| Anthropic API 키 (선택) | AI 회의록·영수증 읽기·추진 일정 불러오기를 켜려면 필요. https://platform.claude.com 에서 발급 |

## 2. 처음 실행하기

1. 압축을 풀고 VS Code에서 **파일 → 폴더 열기**로 `carnot` 폴더를 열어요.
2. **터미널 → 새 터미널**을 열고 아래를 차례로 입력해요.

```bash
npm install            # 필요한 라이브러리 설치 (처음 한 번)
cp .env.example .env   # 설정 파일 만들기 (Windows PowerShell: copy .env.example .env)
npm run dev            # 서버 실행 (server/ 코드를 고치면 자동 재시작, client/ 는 브라우저 새로고침)
```

3. 브라우저에서 **http://localhost:3000** 을 열어요.

AI 없이도 모든 화면이 돌아가요. AI 자리에는 근거 자료로 조립한 "예시 초안"이 들어가요.

## 3. AI 켜기

`.env` 파일에 키를 넣고 서버를 다시 시작하면 돼요.

```
ANTHROPIC_API_KEY=sk-ant-...
AI_MODEL=claude-sonnet-5-5        # 회의록·자문의견서·추진 일정
AI_MODEL_QUICK=claude-haiku-5-5   # 영수증 사진 읽기
```

키는 서버에만 있고 브라우저로는 보내지 않아요. `.env`는 `.gitignore`에 들어 있어서 git에도 올라가지 않아요.

## 4. 데이터 저장

- 화면에서 바꾼 내용은 0.8초 뒤 자동으로 `data/state.json`에 저장되고, 새로고침해도 남아요.
- 시연 데이터로 되돌리려면 서버를 끈 뒤 `npm run reset`을 실행하고 다시 켜요.
- 아직 저장하지 않는 것: 업로드한 파일 원본(PDF·한글·엑셀), 모달에 입력 중인 값. 제안서 PDF는 읽어 낸 **글자**만 저장돼요.

## 5. 폴더 구조

```
carnot/
├─ client/                 프론트엔드 (서버가 그대로 보여 줘요)
│  ├─ index.html
│  ├─ css/app.css          디자인 (색 토큰은 맨 위 :root)
│  ├─ js/claude-shim.js    AI·내려받기를 로컬 서버/브라우저로 연결
│  ├─ js/app.js            화면 전체 로직
│  └─ assets/logo.webp
├─ server/                 백엔드
│  ├─ index.js             서버 시작, 라우트 연결, 라이브러리 제공
│  ├─ store.js             파일 저장소 (data/state.json)
│  └─ routes/
│     ├─ state.js          GET/PUT/DELETE /api/state
│     └─ ai.js             /api/ai/status, /api/ai/stream, /api/ai/json
├─ docs/데이터모델.md      실제 DB로 옮길 때의 테이블·API 설계
├─ .vscode/                디버그 실행 설정
├─ .env.example
└─ package.json
```

## 6. app.js 읽는 법

한 파일이지만 구역별로 `/* ===== 이름 ===== */` 주석이 붙어 있어요. VS Code에서 `Ctrl+Shift+O`(Mac은 `Cmd+Shift+O`)를 누르면 함수 목록으로 바로 이동할 수 있어요.

| 구역 | 내용 |
|---|---|
| 증빙 기준 `CAT` | 별표 7 기준 비목·세부유형·증빙서류 |
| 샘플 데이터 `S` | 화면 상태 전체. 기관·사람·과제·집행·회의·결재 등 |
| 계산 | 예산·집행·참여율·인건비 기준액·연차·현금/현물 |
| 화면 함수 `xxxPage()` | `cardsPage`, `evidPage`, `proposalPage`, `teamPage`, `staffPage` … |
| `modalHtml()` | 모든 팝업 |
| `render()` | 상태 `S`를 화면으로 다시 그림 |
| `A` | 버튼 동작. HTML의 `data-a="이름"`과 연결 |
| `CHANGE` | 파일 선택 등 change 동작. `data-a-change="이름"`과 연결 |
| 맨 아래 | 서버 저장·불러오기 (`boot`, `scheduleSave`) |

**예시: 버튼 하나 추가하기**

```js
// 1) 화면 어딘가에
`<button class="btn" data-a="hello" data-x="${p.id}">인사</button>`
// 2) const A={ ... } 안에
hello(x){ toast(`${proj(x).name} 안녕하세요`) },
```

## 7. 디버그 (VS Code)

왼쪽 **실행 및 디버그**에서 고를 수 있어요.

- **서버 실행 (디버그)**: `server/` 코드에 중단점을 걸 수 있어요.
- **브라우저로 화면 열기 (디버그)**: `client/js/app.js`에 중단점을 걸 수 있어요. 서버가 먼저 떠 있어야 해요.

## 8. 다음 단계 (실서비스로 가는 순서)

1. **DB 도입**: `data/state.json` 하나에 다 넣는 방식을 PostgreSQL 테이블로 나눠요 (`docs/데이터모델.md`).
2. **로그인과 계정**: 회사 아이디 + 직원 아이디 로그인. 비밀번호 해시와 세션 또는 JWT를 써요. 지금 화면의 "보는 기관/보는 사람" 전환은 시연용이에요.
3. **기관별 권한을 서버에서 확인**: 연구단 과제에서 다른 기관의 세부 집행이 안 보이는 규칙을 지금은 화면이 걸러요. 서버 API가 걸러야 안전해요.
4. **파일 저장소**: 증빙·제안서 원본을 S3 호환 저장소 등에 보관해요.
5. **프론트 나누기**: 화면이 커지면 React + Vite 같은 구조로 옮겨요. 지금의 `xxxPage()` 함수가 그대로 컴포넌트 단위가 돼요.
6. **모바일 앱**: 영수증 촬영 화면은 `/api/ai/json`을 그대로 쓰는 앱으로 분리할 수 있어요.

## 9. 자주 막히는 곳

| 증상 | 해결 |
|---|---|
| `npm`을 찾을 수 없음 | Node.js 설치 후 VS Code를 다시 열어요 |
| 3000번 포트 사용 중 | `.env`의 `PORT=3001`로 바꿔요 |
| AI가 "예시 초안"만 나옴 | `.env`의 키 확인 → 서버 재시작 → 브라우저 새로고침 |
| 화면이 이상하게 꼬임 | 서버 끄고 `npm run reset` → 다시 실행 |

# Carnot office

대학 산학협력단과 연구비 행정 기관을 위한 연구행정 그룹웨어예요.
연구제안·연구행정(집행·증빙)·연구단(여러 기관 공동 과제)·전자결재·업무보고·회사일정·직원 급여를 한곳에서 다뤄요.

| 폴더 | 내용 |
| --- | --- |
| `frontend/` | 화면 — React 18 + TypeScript + Vite |
| `backend/` | 서버 — Java 21 + Spring Boot 3.5 + PostgreSQL 16 (Flyway) |
| `prototype/` | 예전 단일 HTML 프로토타입 (기능 비교용 원본, 수정하지 않아요) |

## 빠르게 실행하기

### 1) 시연 모드 (서버 없이 화면만)

```bash
cd frontend
npm install
npm run dev            # http://localhost:5173
```

백엔드가 없으면 브라우저 안의 시연 데이터로 동작해요. 위쪽 시연 막대에서 기관·사람을 바꿔 볼 수 있고, 새로고침하면 처음 상태로 돌아가요.

### 2) 개발 (서버 + 화면)

```bash
# PostgreSQL 준비 (한 번)
createuser -P carnot          # 비밀번호: carnot
createdb -O carnot carnot

# 서버 (http://localhost:8080) — DEMO_SEED=true면 빈 DB에 시연 데이터를 넣어요
cd backend
DEMO_SEED=true ./gradlew bootRun

# 화면 (http://localhost:5173, /api는 8080으로 넘어가요)
cd frontend
npm run dev
```

시연 데이터 계정 (비밀번호는 모두 `demo1234`):

회사마다 로그인 주소가 따로 있어요: `서비스 주소/회사 아이디` (예: `http://localhost:5173/saesol`). 그 주소에서 아이디·비밀번호로 로그인하고, 관리자가 만든 직원 계정은 받은 임시 비밀번호로 처음 로그인할 때 새 비밀번호를 정해요.

| 회사 아이디 | 아이디 | 사람 |
| --- | --- | --- |
| `saesol` | `seoyun.kim` | 새솔대 연구책임자 |
| `saesol` | `admin` | 새솔대 기관 관리자 |
| `gaon` | `wooseok.jung` | 가온소재 (연구단 참여기관) |
| `nuritech` | `taeo.kang` | 누리테크 |

### 3) 시연 화면만 무료로 올리기 (서버·DB 없음)

Render → New → **Static Site** → 이 저장소 선택 후
- Root Directory: `frontend` · Build Command: `npm ci && npm run build:demo` · Publish Directory: `dist`
- Redirects/Rewrites: Source `/*` → Destination `/index.html` · Action **Rewrite**

(또는 New → Blueprint에서 Blueprint Path를 `render-demo.yaml`로.) 시연 데이터로 동작하고 저장되지 않아요. 회사 주소는 `…onrender.com/saesol`.

### 4) 임시 서버에 올리기 (Render + Neon)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/kks-468/carnot-office)

1. [Neon](https://console.neon.tech/signup)에서 DB를 만들고(지역: Singapore) 접속 정보를 받아요.
2. 위 버튼(또는 [Render 대시보드 → New → Blueprint](https://dashboard.render.com/blueprints))에서 이 저장소를 고르고 `DB_URL`·`DB_USER`·`DB_PASSWORD`를 넣어요. 설정은 `render.yaml`에 있어요.
3. 빌드가 끝나면 `https://carnot-office.onrender.com` 같은 주소로 열려요.

### 5) 배포 (Docker)

```bash
cp .env.example .env          # DB_PASSWORD 등 값 채우기
docker compose up -d --build  # http://서버:8080
```

이미지 하나에 화면과 서버가 같이 들어가요(Spring Boot가 화면 파일도 내보내요). 기관 내부 서버 설치도 같은 방법이에요.
클라우드에 올린다면 CSAP 인증을 받은 국내 클라우드를 권장하고, 앞단에 HTTPS(로드밸런서·nginx)를 두고 `COOKIE_SECURE=true`로 켜 주세요.

## 구조

### 화면 (`frontend/src`)

```
core/        프로토타입의 업무 로직 (예산·인건비·증빙·결재선·성과 계산, 동작 A, 시연 데이터)
  state.ts   화면 상태 S 하나와 render() — S를 바꾸고 render()를 부르면 다시 그려요
ui/          여러 화면이 함께 쓰는 부품 (In, Field, Btn, Nav, MonthGrid, Picker …)
layout/      틀 (Shell, TopBar, MainBody, DemoBar)
pages/       메뉴별 화면 (admin, approval, team, proposal, perf, staff, settings …)
modals/      팝업 36종 (ModalHost)
platform/    바깥과 연결 (api, 서버 저장 sync, 서버용 동작 serverActions, AI, PDF)
```

- 버튼은 `data-a="동작"` `data-x="값"`, 입력은 `data-b="이름"`으로 `core/actions`의 `A`와 연결돼요 (`core/events`가 한곳에서 받아요).
- 입력칸은 `ui/primitives`의 `In`(비제어 입력)을 써요. 타자 치는 중에 다시 그려도 커서가 튀지 않아요.
- 인쇄용 A4 문서·도장 그림은 `core/print`가 HTML 글로 만들어요 (PDF로 바꾸기 쉬워서).

### 서버 (`backend/src/main/java/kr/carnot/office`)

```
account/   로그인·첫 로그인 비밀번호 정하기·직원 계정 관리 (bcrypt, 5번 틀리면 10분 잠금)
signup/    기관 가입 (사업자번호 확인 · 회사 아이디 중복 확인 · 이메일 인증)
web/       회사 주소(/회사아이디)로 화면 열기, 로그인 전 회사 이름·로고
state/     불러오기(StateService)와 저장(SyncService) — 기관별 권한을 여기서 지켜요
project/   연구단 참여 신청 · 1회용 초대번호 · 초대할 기관 찾기
ai/        Anthropic API 프록시 (API 키는 서버에만)
store/     records · org_docs · project_orgs 표
security/  세션 쿠키 + CSRF + CSP, 계정이 멈추면 바로 로그아웃
demo/      시연 데이터 넣기 (DEMO_SEED=true일 때만)
```

### 데이터와 권한

화면 데이터는 종류(`kind`)별 JSON 문서로 `records` 표에 저장하고, 권한 확인에 필요한 값(소유 기관·과제)만 열로 뽑아 둬요.
화면은 `/api/state`로 한 번에 불러오고, 바뀐 문서만 `/api/sync`로 보내요 (0.6초씩 모아서).

| 종류 | 누가 보나 | 누가 고치나 |
| --- | --- | --- |
| 집행·증빙·회의·결재·영수증·공지·업무보고·회사일정·문서 | 우리 기관 | 우리 기관 |
| 연구단 과제 | 참여(수락) 기관 모두 | 총괄기관은 전부, 참여기관은 **자기 기관 몫만** (예산 항목·인력·성과 목표 칸·과업·공정·월별 계획) |
| 다른 참여기관의 집행 | 월별 **합계만** | — |
| 다른 참여기관의 회의 | 날짜·주제만 (비용·참석자는 숨김) | — |
| 제안서 취합 제출본 | 총괄기관 + 제출한 기관 | 제출한 기관 |
| 신청·초대 중인 과제 | 과제 이름과 참여 상태만 | 초대 수락만 |
| 전문가 | 공유 범위(기관·팀·나만)에 따라 | 등록한 사람·관리자 |
| 구성원·기관 정보 | 우리 기관 (다른 기관 사람은 이름·소속만) | 기관 관리자 |
| 계정·비밀번호 | — | 계정 API로만 (화면 데이터에 비밀번호가 없어요) |

### 열람 권한 (기관 관리자가 정해요)

왼쪽 메뉴 **기관설정 → 열람 권한**(기관 관리자에게만 보여요)에서 정해요. 기관 관리자는 언제나 볼 수 있고, 권한이 없는 사람에게는 메뉴와 과제가 아예 보이지 않아요 (서버도 그 데이터를 보내지 않아요).

| 범위 | 대상 | 처음 값 |
| --- | --- | --- |
| 급여 정보 | 직원·급여 메뉴(급여·인상·휴가)와 구성원별 급여 | 관리자만 |
| 연구비 · 기관 기본 | 연구제안·연구행정·연구단 과제 | 과제 참여 인력·관리팀 |
| 연구비 · 과제별 | 따로 정한 과제만 기본값 대신 적용 | — |

대상은 **기관 전체 · 과제 참여 인력·관리팀(연구비만) · 직위 이상 · 부서(하위 부서 포함) · 직접 지정한 사람**을 섞어 고를 수 있고, 하나라도 맞으면 볼 수 있어요.
급여 범위에는 '연구비 열람자에게 인건비 계산용 급여 보이기'(처음엔 켬)가 있어요. 끄면 급여 권한이 없는 사람은 다른 사람의 급여·기준 인건비를 볼 수 없고 인건비가 0원으로 계산돼요.

권한이 없는 저장은 서버가 거절하거나(`rejected`), 허용된 부분만 반영해 고친 문서를 돌려줘요(`corrected`). 모든 삭제·계정 작업은 `audit_log`에 남아요.

## 확인 방법

```bash
cd frontend && npm run build              # 타입 검사 + 빌드
cd backend && ./gradlew test              # 권한 규칙·흐름 테스트 (PostgreSQL carnot_test 필요)
```

`backend` 테스트 DB 주소는 `CARNOT_TEST_DB_URL`로 바꿀 수 있어요 (기본 `jdbc:postgresql://localhost:5432/carnot_test`).

## 보안 메모

- 시연 계정(`DEMO_SEED`)은 개발·시연에만 켜세요. 운영 DB에는 넣지 마세요.
- `.env`(DB 비밀번호, `ANTHROPIC_API_KEY`)는 절대 git에 올리지 마세요. `.gitignore`에 들어 있어요.
- 메일 서버를 설정하지 않으면 가입 인증번호·임시 비밀번호가 서버 로그에만 남아요. 운영 전에 `MAIL_*`을 꼭 설정하세요.

## 다음 단계 (아직 안 한 것)

- 결재·양식 관리 같은 다른 메뉴의 권한 세분화 (지금은 급여·연구비만 열람 권한으로 나눠요)
- 첨부 파일을 DB 대신 S3 호환 저장소로 (지금은 문서 안에 들어가요)
- 같은 문서를 두 사람이 동시에 고칠 때 충돌 알림 (지금은 나중에 저장한 쪽이 남아요. `records.version`을 쓰면 돼요)
- 대학 통합인증(SSO: OIDC·SAML) 연결
- 메일 (추가 개발): ① 기관이 쓰는 메일(IMAP·SMTP) 연결 → ③ 자체 메일 서버 + 도메인 연결(`아이디@회사도메인` 자동 생성). 화면·발송 기능은 공통으로 만들어 둘 다 쓰게
- `core/*.js`를 TypeScript로 차례로 옮기며 타입 붙이기

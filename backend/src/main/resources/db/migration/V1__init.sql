-- Carnot office 기본 스키마
-- 화면 데이터는 종류(kind)별 JSON 문서(records)로 두고, 접근 권한에 필요한 값(기관·과제)만 열로 뽑아 둬요.

-- 기관 (회사 아이디·사업자번호 중복 확인과 로그인에 써요. 상세 정보는 records(kind='org')에 있어요)
CREATE TABLE organizations (
    id          TEXT PRIMARY KEY,
    code        TEXT NOT NULL UNIQUE,          -- 회사 아이디 (로그인할 때 입력)
    number      TEXT,                          -- 사업자등록번호 등
    name        TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX organizations_number_uq ON organizations (number) WHERE number IS NOT NULL AND number <> '';

-- 로그인 계정 (구성원 한 명 = records(kind='person') 하나와 연결돼요)
CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    person_id       TEXT NOT NULL UNIQUE,
    org_id          TEXT NOT NULL REFERENCES organizations (id),
    login           TEXT NOT NULL,
    email           TEXT,
    password_hash   TEXT,                      -- bcrypt. 활성화 전에는 비어 있어요
    temp_hash       TEXT,                      -- 초대·초기화용 임시 비밀번호 (bcrypt)
    temp_expires_at TIMESTAMPTZ,
    status          TEXT NOT NULL,             -- 초대됨 · 활성 · 중지 · 가입 신청
    admin           BOOLEAN NOT NULL DEFAULT FALSE,
    failed_count    INT NOT NULL DEFAULT 0,
    locked_until    TIMESTAMPTZ,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (org_id, login)
);

-- 화면 데이터 문서
CREATE TABLE records (
    seq         BIGSERIAL,                     -- 만든 순서 (화면 목록 순서를 지켜요)
    kind        TEXT NOT NULL,                 -- project, entry, meeting, appr ...
    id          TEXT NOT NULL,
    org_id      TEXT,                          -- 소유 기관 (공유 문서는 만든 기관)
    project_id  TEXT,
    data        JSONB NOT NULL,
    version     BIGINT NOT NULL DEFAULT 1,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by  TEXT,
    PRIMARY KEY (kind, id)
);
CREATE INDEX records_org_kind_idx ON records (org_id, kind);
CREATE INDEX records_project_idx ON records (project_id) WHERE project_id IS NOT NULL;

-- 과제 참여 기관 (records(kind='project').data.parts에서 서버가 뽑아 둬요)
CREATE TABLE project_orgs (
    project_id  TEXT NOT NULL,
    org_id      TEXT NOT NULL,
    status      TEXT NOT NULL,                 -- 수락 · 신청 중 · 초대 중
    role        TEXT,                          -- 주관 · 세부주관 · 참여
    PRIMARY KEY (project_id, org_id)
);
CREATE INDEX project_orgs_org_idx ON project_orgs (org_id);

-- 기관별 설정 묶음 (급여표, 증빙 서식, 문서 공통 설정 등)
CREATE TABLE org_docs (
    org_id      TEXT NOT NULL REFERENCES organizations (id),
    key         TEXT NOT NULL,
    data        JSONB NOT NULL,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (org_id, key)
);

-- 이메일 인증번호 (가입할 때)
CREATE TABLE email_codes (
    email       TEXT PRIMARY KEY,
    code_hash   TEXT NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    tries       INT NOT NULL DEFAULT 0,
    verified_at TIMESTAMPTZ
);

-- 감사 기록 (누가 언제 무엇을 바꿨는지)
CREATE TABLE audit_log (
    id          BIGSERIAL PRIMARY KEY,
    at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    person_id   TEXT,
    org_id      TEXT,
    action      TEXT NOT NULL,
    kind        TEXT,
    record_id   TEXT,
    detail      JSONB
);
CREATE INDEX audit_log_org_at_idx ON audit_log (org_id, at DESC);

// 로그인: ① 회사 주소 → ② 아이디·비밀번호 → (관리자가 만든 계정이면) ③ 새 비밀번호 정하기
import { S, useS } from '../../core/state';
import { person } from '../../core/org';
import { Btn, Check, Field, In, LinkBtn } from '../../ui/primitives';
import { codeFromUrl, tenantHref } from '../../platform/tenant';
import { AuthBox, Err, PwField, PwRule } from './AuthParts';

const DEMO: [string, string, string][] = [
  ['p0', '관리자', 'saesol · admin'],
  ['p1', '김서윤', '새솔대 · 연구책임자'],
  ['p4', '최민재', '새솔대 · 행정 담당'],
  ['p5', '정우석', '가온소재 · 책임연구원'],
  ['p7', '강태오', '누리테크'],
];
const DEMO_ORGS: [string, string][] = [
  ['saesol', '새솔대학교 산학협력단'],
  ['gaon', '가온소재'],
  ['nuritech', '누리테크'],
];

/** 서비스 주소 + / (회사 아이디가 붙는 자리) */
const prefix = () => tenantHref('').replace(/\/$/, '/').replace(/#$/, '#');

function DemoAccounts() {
  if (!S.demo) return null;
  const org = S.tenant && Object.keys(S.orgs).find((k) => S.orgs[k].code === S.tenant.code);
  const list = DEMO.filter(([id]) => person(id) && (!org || person(id).org === org));
  return (
    <div className="demoacct">
      <span className="small">
        <b>시연 계정</b> · 비밀번호는 모두 <b className="num">demo1234</b>
        {!S.tenant || S.tenant.code === 'saesol' ? (
          <>
            {' '}
            · 첫 로그인 체험: <b>taeho.yoon</b> / <b className="num">temp1234</b>
          </>
        ) : null}
      </span>
      <div className="row">
        {list.map(([id, n, d]) => (
          <Btn key={id} a="demoLogin" x={id} className="btn sm">
            {n} <span className="muted small">{d}</span>
          </Btn>
        ))}
      </div>
    </div>
  );
}

export function LoginPage() {
  const S = useS();
  const f = S.f;
  const t = S.tenant;

  // ① 회사 주소
  if (!t)
    return (
      <AuthBox>
        <h1>회사 주소로 로그인</h1>
        <p className="muted" style={{ margin: '-8px 0 0' }}>
          회사마다 로그인 주소가 따로 있어요. 관리자에게 받은 회사 주소의 끝부분(회사 아이디)을 입력해 주세요.
        </p>
        <div className="field">
          <label htmlFor="f-l_tcode">회사 주소</label>
          <div className="tenantaddr">
            <span className="pre" title={prefix()}>
              {prefix().replace(/^https?:\/\//, '')}
            </span>
            <In id="f-l_tcode" data-b="l_tcode" value={f.l_tcode || codeFromUrl() || ''} placeholder="예: saesol" autoComplete="organization" autoCapitalize="none" spellCheck={false} />
          </div>
        </div>
        <Err msg={f.l_err} />
        <Btn a="tenantGo" className="btn primary full">
          다음
        </Btn>
        <div className="authlinks">
          <span className="muted">처음이세요?</span>
          <LinkBtn a="goSignup">기관 회원가입</LinkBtn>
        </div>
        {S.demo ? (
          <div className="demoacct">
            <span className="small">
              <b>시연 회사 주소</b>
            </span>
            <div className="row">
              {DEMO_ORGS.map(([c, n]) => (
                <Btn key={c} a="tenantPick" x={c} className="btn sm">
                  {c} <span className="muted small">{n}</span>
                </Btn>
              ))}
            </div>
          </div>
        ) : null}
      </AuthBox>
    );

  // ③ 첫 로그인: 새 비밀번호 정하기
  if (f.l_step === 'newpw')
    return (
      <AuthBox org={t}>
        <h1>새 비밀번호 정하기</h1>
        <p className="muted" style={{ margin: '-8px 0 0' }}>
          <b>{f.l_id}</b> 계정으로 처음 로그인했어요. 관리자에게 받은 임시 비밀번호 대신 앞으로 쓸 비밀번호를 정해 주세요.
        </p>
        <PwField label="새 비밀번호" name="l_new" />
        <PwField label="새 비밀번호 확인" name="l_new2" />
        <PwRule v={f.l_new} />
        <Err msg={f.l_err} />
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <Btn a="loginBack">이전</Btn>
          <Btn a="loginNewPw" className="btn primary">
            정하고 로그인
          </Btn>
        </div>
      </AuthBox>
    );

  // ② 아이디 · 비밀번호
  return (
    <AuthBox org={t}>
      <h1>로그인</h1>
      <p className="muted small" style={{ margin: '-8px 0 0' }}>
        회사 주소 <b className="num">{tenantHref(t.code).replace(/^https?:\/\//, '')}</b>
      </p>
      <Field label="아이디" name="l_id" ph="예: seoyun.kim" />
      <PwField label="비밀번호" name="l_pw" ph="비밀번호" />
      <label className="check" htmlFor="f-l_keep">
        <Check id="f-l_keep" data-b="l_keep" checked={!!f.l_keep} />
        <span>로그인 상태 유지</span>
      </label>
      <Err msg={f.l_err} />
      <Btn a="login" className="btn primary full">
        로그인
      </Btn>
      <div className="authlinks">
        <LinkBtn a="goFindPw">비밀번호 찾기</LinkBtn>
        <span className="muted">·</span>
        <LinkBtn a="tenantClear">다른 회사 주소로</LinkBtn>
      </div>
      <DemoAccounts />
    </AuthBox>
  );
}

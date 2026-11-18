// 로그인: ① 회사 주소 → ② 아이디·비밀번호 → (관리자가 만든 계정이면) ③ 새 비밀번호 정하기
import { S, useS } from '../../core/state';
import { person } from '../../core/org';
import { Btn, Check, Field, LinkBtn } from '../../ui/primitives';
import { tenantHref } from '../../platform/tenant';
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

  // 서비스 주소로 들어왔을 때: 회사 아이디 · 아이디 · 비밀번호 (로그인하면 주소가 회사 주소로 바뀌어요)
  if (!t)
    return (
      <AuthBox>
        <h1>로그인</h1>
        <p className="muted" style={{ margin: '-8px 0 0' }}>
          회사 아이디와 내 아이디로 로그인해요. 회사 주소(예: {prefix().replace(/^https?:\/\//, '')}saesol)로 들어오면 아이디와 비밀번호만 입력해요.
        </p>
        <Field label="회사 아이디" name="l_org" ph="예: saesol" />
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
          <LinkBtn a="goSignup">기관 회원가입</LinkBtn>
          <span className="muted">·</span>
          <LinkBtn a="goFindPw">비밀번호 찾기</LinkBtn>
        </div>
        {S.demo ? (
          <div className="demoacct">
            <span className="small">
              <b>시연 회사 주소</b> · 누르면 그 회사 로그인 화면으로 가요
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
        <DemoAccounts />
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

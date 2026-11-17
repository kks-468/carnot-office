import { useS } from '../../core/state';
import { person } from '../../core/org';
import { Btn, Check, Field, LinkBtn } from '../../ui/primitives';
import { AuthBox, Err, PwField } from './AuthParts';

const DEMO: [string, string, string][] = [
  ['p0', '관리자', 'admin / admin / admin'],
  ['p1', '김서윤', '새솔대 · 연구책임자'],
  ['p4', '최민재', '새솔대 · 행정 담당'],
  ['p5', '정우석', '가온소재 · 책임연구원'],
  ['p7', '강태오', '누리테크'],
];

export function LoginPage() {
  const S = useS();
  const f = S.f;
  const demo = DEMO.filter(([id]) => person(id));
  return (
    <AuthBox>
      <h1>로그인</h1>
      <p className="muted" style={{ margin: '-8px 0 0' }}>
        회사 아이디와 내 아이디로 로그인해요.
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
        <LinkBtn a="goActivate">초대받은 직원 계정 활성화</LinkBtn>
        <span className="muted">·</span>
        <LinkBtn a="goFindPw">비밀번호 찾기</LinkBtn>
      </div>
      {S.demo ? (
        <div className="demoacct">
          <span className="small">
            <b>시연 계정</b> · 비밀번호는 모두 <b className="num">demo1234</b>
          </span>
          <div className="row">
            {demo.map(([id, n, d]) => (
              <Btn key={id} a="demoLogin" x={id} className="btn sm">
                {n} <span className="muted small">{d}</span>
              </Btn>
            ))}
          </div>
        </div>
      ) : null}
    </AuthBox>
  );
}

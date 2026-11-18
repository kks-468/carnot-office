// 기관 회원가입 · 비밀번호 찾기
import type { ReactNode } from 'react';
import { useS } from '../../core/state';
import { orgCfg } from '../../core/org';
import { Btn, Check, Field, Html, In, LinkBtn } from '../../ui/primitives';
import { AuthBox, Err, PwField, PwRule } from './AuthParts';

const STEPS = ['약관 동의', '기관 확인', '정보 입력', '완료'];
const TERMS: [string, string, string][] = [
  ['t_svc', '[필수] 서비스 이용약관', '기관 단위로 가입해 연구과제·집행·증빙·전자결재를 관리하는 서비스예요.\n기관 관리자는 소속 직원 계정과 권한을 관리할 책임이 있어요.'],
  ['t_priv', '[필수] 개인정보 수집·이용 동의', '수집 항목: 이름, 아이디, 이메일, 휴대폰 번호, 소속 부서\n이용 목적: 회원 식별, 결재·알림 발송, 연구비 증빙 서류 작성\n보유 기간: 탈퇴 시까지 (관계 법령에 따라 보관이 필요한 기록은 해당 기간까지)'],
  ['t_mkt', '[선택] 서비스 소식 받기', '새 기능과 연구행정 일정 안내를 이메일로 받아요. 동의하지 않아도 가입할 수 있어요.'],
];

function Bar({ step }: { step: string }) {
  const at = ({ terms: 0, number: 1, new: 2, exists: 2, manual: 2, done: 3 } as Record<string, number>)[step];
  if (at === undefined || ['activate', 'findpw'].includes(step)) return null;
  return (
    <div className="steps-mini">
      {STEPS.map((t, i) => (
        <span key={t} className={i === at ? 'on' : ''}>
          {i + 1}. {t}
        </span>
      ))}
    </div>
  );
}

function Row({ children }: { children: ReactNode }) {
  return <div className="row">{children}</div>;
}

export function SignupPage() {
  const S = useS();
  const s = S.signup;
  const f = S.f;
  let c: ReactNode = null;
  if (s.step === 'terms') {
    const all = TERMS.every(([k]) => f[k]);
    c = (
      <>
        <h1>기관 회원가입</h1>
        <Bar step={s.step} />
        <p className="muted" style={{ margin: '-6px 0 0' }}>
          기관 단위로 가입해요. 가입한 사람이 기관 관리자가 되고, 직원 계정은 가입 후 관리자가 만들어요.
        </p>
        <div className="terms">
          <label className="check all" htmlFor="t-all">
            <Check id="t-all" data-a="termsAll" checked={all} />
            <span>약관에 모두 동의해요</span>
          </label>
          {TERMS.map(([k, l, txt]) => (
            <details key={k}>
              <summary>
                <label className="check" htmlFor={`t-${k}`} style={{ display: 'inline-flex' }}>
                  <Check id={`t-${k}`} data-b={k} data-r="1" checked={!!f[k]} />
                  <span>{l}</span>
                </label>
              </summary>
              <p>{txt}</p>
            </details>
          ))}
        </div>
        <Err msg={s.err} />
        <Row>
          <Btn a="closeSignup">로그인으로</Btn>
          <Btn a="suTerms" className="btn primary" disabled={!(f.t_svc && f.t_priv)}>
            다음
          </Btn>
        </Row>
      </>
    );
  }
  if (s.step === 'number')
    c = (
      <>
        <h1>기관 확인</h1>
        <Bar step={s.step} />
        <p className="muted">사업자등록번호나 고유번호로 기관을 확인해요. 시연에서는 실제 조회를 하지 않아요.</p>
        <div className="field">
          <span>기관 유형</span>
          <div className="seg" role="group">
            {['대학', '기업', '연구기관', '비영리기관'].map((t) => (
              <Btn key={t} a="suType" x={t} className="" aria-pressed={f.s_type === t}>
                {t}
              </Btn>
            ))}
          </div>
        </div>
        <Field label="번호 종류" name="s_numType" options={['사업자등록번호', '고유번호']} hint="대학이나 비영리기관은 고유번호를 쓰는 경우가 많아요." />
        <label className="field" htmlFor="s_no">
          <span>번호 10자리</span>
          <In id="s_no" type="text" inputMode="numeric" data-no="s_no" value={f.s_no || ''} placeholder="000-00-00000" />
        </label>
        <div className="small muted">
          시연 번호: <LinkBtn a="suFill" x="412-82-90123">새 기관</LinkBtn> · <LinkBtn a="suFill" x="123-82-45678">이미 가입한 대학</LinkBtn> · <LinkBtn a="suFill" x="000-00-00000">확인 불가</LinkBtn>
        </div>
        <Err msg={s.err} />
        <Row>
          <Btn a="suToTerms">이전</Btn>
          <Btn a="suCheck" className="btn primary">
            기관 확인
          </Btn>
        </Row>
      </>
    );
  if (s.step === 'new')
    c = (
      <>
        <h1>기관 정보와 관리자 계정</h1>
        <Bar step={s.step} />
        <div className="notice">
          <b>{f.s_no}</b> 확인됨 · {f.s_type}. 가입하면 아래 관리자가 기관 관리자가 돼요.
        </div>
        <h3 className="h3" style={{ margin: '4px 0 0' }}>
          기관 정보
        </h3>
        <div className="grid2">
          <Field label="기관명" name="s_name" ph="예: (주)하늘연구" />
          <Field label="대표자명" name="s_ceo" />
        </div>
        <Field label="주소 (선택)" name="s_addr" ph="예: 대전광역시 유성구 …" />
        <div className="field">
          <span>
            회사 아이디 <small>직원이 로그인할 때 쓰는 기관 주소예요 · 영문 소문자·숫자 3~20자</small>
          </span>
          <div className="row" style={{ flexWrap: 'nowrap' }}>
            <In id="f-s_code" data-b="s_code" type="text" value={f.s_code || ''} placeholder="예: haneul" autoComplete="off" style={{ flex: 1 }} />
            <Btn a="suCode">중복 확인</Btn>
          </div>
          {f.s_codeOk === true ? <small className="pwrule ok">{f.s_code} — 쓸 수 있어요 ✓</small> : f.s_codeOk === false ? <small className="pwrule bad">이미 쓰고 있거나 형식이 맞지 않아요.</small> : null}
        </div>
        <Field label="첫 부서 이름 (선택)" name="s_sub" ph="예: 기업부설연구소" />
        <h3 className="h3" style={{ margin: '4px 0 0' }}>
          관리자 계정
        </h3>
        <div className="grid2">
          <Field label="이름" name="s_person" />
          <Field label="아이디" name="s_admin" ph="예: admin" />
          <Field label="휴대폰" name="s_phone" ph="010-0000-0000" />
        </div>
        <div className="field">
          <span>
            이메일 <small>인증번호를 보내드려요</small>
          </span>
          <div className="row" style={{ flexWrap: 'nowrap' }}>
            <In id="f-s_mail" data-b="s_mail" type="email" value={f.s_mail || ''} placeholder="name@company.com" style={{ flex: 1 }} readOnly={!!f.s_mailOk} />
            {f.s_mailOk ? <span className="chip good">인증됨</span> : <Btn a="suMail">{f.s_mailSent ? '다시 보내기' : '인증번호 받기'}</Btn>}
          </div>
        </div>
        {f.s_mailSent && !f.s_mailOk ? (
          <div className="field">
            <span>
              인증번호 6자리 <small>시연: 123456</small>
            </span>
            <div className="row" style={{ flexWrap: 'nowrap' }}>
              <In id="f-s_mailCode" data-b="s_mailCode" type="text" inputMode="numeric" maxLength={6} value={f.s_mailCode || ''} style={{ flex: 1 }} />
              <Btn a="suMailOk">확인</Btn>
            </div>
          </div>
        ) : null}
        <div className="grid2">
          <PwField label="비밀번호" name="s_pw" />
          <PwField label="비밀번호 확인" name="s_pw2" />
        </div>
        <PwRule v={f.s_pw} />
        <Err msg={s.err} />
        <Row>
          <Btn a="suBack">이전</Btn>
          <Btn a="suCreate" className="btn primary">
            가입 완료
          </Btn>
        </Row>
      </>
    );
  if (s.step === 'exists') {
    const o = S.orgs[s.org];
    const units = (orgCfg(s.org)?.units || []).map((u: { name: string }) => u.name);
    c = (
      <>
        <h1>이미 가입한 기관이에요</h1>
        <Bar step={s.step} />
        <div className="notice">
          <b>{o.name}</b> (회사 아이디 <b className="num">{o.code || ''}</b>)
          <br />
          직원으로 가입을 신청하면 기관 관리자가 승인한 뒤 로그인할 수 있어요.
        </div>
        <div className="grid2">
          <Field label="이름" name="s_person" />
          <Field label="희망 아이디" name="s_admin" ph="예: gildong.hong" />
          <Field label="부서" name="s_unit" options={units} />
          <Field label="이메일" name="s_mail" type="email" />
        </div>
        <div className="grid2">
          <PwField label="비밀번호" name="s_pw" />
          <PwField label="비밀번호 확인" name="s_pw2" />
        </div>
        <PwRule v={f.s_pw} />
        <Err msg={s.err} />
        <Row>
          <Btn a="suBack">이전</Btn>
          <Btn a="suJoin" className="btn primary">
            가입 신청
          </Btn>
        </Row>
      </>
    );
  }
  if (s.step === 'manual')
    c = (
      <>
        <h1>번호를 자동으로 확인하지 못했어요</h1>
        <Bar step={s.step} />
        <p>등록증을 올리면 운영자가 확인한 뒤 가입을 승인해요.</p>
        <Field label="기관명" name="s_name" />
        <Field label="담당자 이메일" name="s_mail" type="email" />
        <label className="field" htmlFor="s_cert">
          <span>사업자등록증 또는 고유번호증</span>
          <input id="s_cert" type="file" accept="image/*,.pdf" />
        </label>
        <Row>
          <Btn a="suBack">이전</Btn>
          <Btn a="suManual" className="btn primary">
            검토 요청
          </Btn>
        </Row>
      </>
    );
  if (s.step === 'findpw')
    c = (
      <>
        <h1>비밀번호 찾기</h1>
        <p className="muted" style={{ margin: '-6px 0 0' }}>
          가입할 때 쓴 이메일로 비밀번호 재설정 링크를 보내드려요.
        </p>
        <Field label="회사 아이디" name="fp_org" />
        <Field label="아이디" name="fp_id" />
        <Field label="이메일" name="fp_mail" type="email" />
        <Err msg={s.err} />
        <Row>
          <Btn a="closeSignup">로그인으로</Btn>
          <Btn a="findPw" className="btn primary">
            재설정 링크 받기
          </Btn>
        </Row>
      </>
    );
  if (s.step === 'done')
    c = (
      <>
        <h1>{s.title}</h1>
        <Bar step={s.step} />
        <p>{s.msg}</p>
        {s.info ? <Html className="notice small" html={s.info} /> : null}
        <Row>
          <Btn a={s.loginPid ? 'suStart' : 'closeSignup'} className="btn primary">
            {s.cta || '로그인으로'}
          </Btn>
        </Row>
      </>
    );
  return <AuthBox wide>{c}</AuthBox>;
}

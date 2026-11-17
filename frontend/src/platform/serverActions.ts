// 서버 모드에서 바꿔 끼우는 동작들.
// 계정·가입·연구단 참여처럼 '다른 기관 데이터나 비밀번호'가 필요한 일은 화면에서 처리하지 않고 서버 API를 불러요.
// 검사 문구와 화면 흐름은 프로토타입(core/actions.js)과 같게 맞췄어요.
import { S, render } from '../core/state';
import { A } from '../core/actions';
import { PW_OK } from '../core/catalog';
import { doLogin, orgCfg, part, person, proj } from '../core/org';
import { ratioBudget, zeroBudget } from '../core/budget';
import { toast } from '../core/runtime';
import { esc, uid } from '../core/util';
import { api, type ApiError } from './api';
import { applyState, clearData, reload } from './sync';

const LOGIN_RE = /^[a-z0-9._-]{3,}$/;
const msg = (e: unknown) => (e as ApiError)?.message || '잠시 뒤 다시 해 주세요.';

async function enter(personId: string): Promise<void> {
  applyState(await api('/api/state'));
  doLogin(personId);
}

export function installServerActions(): void {
  const a = A as Record<string, (...args: any[]) => any>;

  // ---- 로그인 · 로그아웃 · 계정 활성화 ----
  a.login = async () => {
    const f = S.f;
    if (!f.l_org?.trim() || !f.l_id?.trim() || !f.l_pw) {
      f.l_err = '회사 아이디, 아이디, 비밀번호를 모두 입력해 주세요.';
      return render();
    }
    try {
      const me = await api('/api/auth/login', { body: { orgCode: f.l_org, login: f.l_id, password: f.l_pw } });
      await enter(me.personId);
    } catch (e) {
      f.l_err = msg(e);
      render();
    }
  };

  const logout0 = a.logout;
  a.logout = async () => {
    try {
      await api('/api/auth/logout', { method: 'POST' });
    } catch {
      /* 이미 끝난 세션이어도 화면은 로그아웃해요 */
    }
    logout0();
    clearData();
    render();
  };

  a.activate = async () => {
    const f = S.f,
      s = S.signup;
    s.err = !PW_OK(f.a_new) ? '새 비밀번호는 영문과 숫자를 섞어 8자 이상이어야 해요.' : f.a_new !== f.a_new2 ? '새 비밀번호가 서로 달라요.' : '';
    if (s.err) return render();
    try {
      const me = await api('/api/auth/activate', { body: { orgCode: f.a_org, login: f.a_id, tempPassword: f.a_tmp, newPassword: f.a_new } });
      S.signup = null;
      await enter(me.personId);
      toast(`${person(me.personId)?.name || ''}님 계정을 활성화했어요.`);
    } catch (e) {
      s.err = msg(e);
      render();
    }
  };

  // ---- 기관 가입 ----
  a.suCheck = async () => {
    const n = S.f.s_no || '';
    if (n.replace(/\D/g, '').length !== 10) {
      S.signup.err = '번호 10자리를 입력해 주세요.';
      return render();
    }
    if (n === '000-00-00000') {
      S.signup = { step: 'manual' };
      S.f.s_name = '';
      return render();
    }
    try {
      const r = await api('/api/signup/check-number', { body: { number: n } });
      if (r.exists) {
        const { id, ...o } = r.org;
        S.orgs[id] = { ...o, units: o.units || [{ name: o.name, parent: '' }] };
        S.signup = { step: 'exists', org: id };
        S.f.s_sub = '';
        S.f.s_person = '';
        return render();
      }
      S.signup = { step: 'new' };
      S.f.s_name = '';
      S.f.s_person = '';
      S.f.s_sub = '';
      render();
    } catch (e) {
      S.signup.err = msg(e);
      render();
    }
  };

  a.suCode = async () => {
    const c = (S.f.s_code || '').trim().toLowerCase();
    S.f.s_code = c;
    try {
      S.f.s_codeOk = /^[a-z0-9]{3,20}$/.test(c) && (await api('/api/signup/check-code', { body: { code: c } })).ok;
    } catch {
      S.f.s_codeOk = false;
    }
    render();
  };

  a.suMail = async () => {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(S.f.s_mail || '')) {
      S.signup.err = '이메일 주소를 확인해 주세요.';
      return render();
    }
    try {
      const r = await api('/api/signup/mail', { body: { email: S.f.s_mail } });
      S.signup.err = '';
      S.f.s_mailSent = true;
      render();
      toast(r.devCode ? `인증번호를 보냈어요. (메일 서버 미설정 · 개발용 번호 ${r.devCode})` : '인증번호를 보냈어요. 메일을 확인해 주세요.');
    } catch (e) {
      S.signup.err = msg(e);
      render();
    }
  };

  a.suMailOk = async () => {
    try {
      await api('/api/signup/mail/verify', { body: { email: S.f.s_mail, code: (S.f.s_mailCode || '').trim() } });
      S.signup.err = '';
      S.f.s_mailOk = true;
      render();
      toast('이메일을 인증했어요.');
    } catch (e) {
      S.signup.err = msg(e);
      render();
    }
  };

  a.suCreate = async () => {
    const f = S.f,
      sg = S.signup;
    const lg = (f.s_admin || '').trim().toLowerCase();
    sg.err = !f.s_name?.trim()
      ? '기관명을 입력해 주세요.'
      : !f.s_codeOk
        ? '회사 아이디 중복 확인을 해 주세요.'
        : !f.s_person?.trim()
          ? '관리자 이름을 입력해 주세요.'
          : !LOGIN_RE.test(lg)
            ? '아이디는 영문 소문자·숫자·점(.)으로 3자 이상 입력해 주세요.'
            : !f.s_mailOk
              ? '이메일 인증을 해 주세요.'
              : !PW_OK(f.s_pw)
                ? '비밀번호는 영문과 숫자를 섞어 8자 이상이어야 해요.'
                : f.s_pw !== f.s_pw2
                  ? '비밀번호가 서로 달라요.'
                  : '';
    if (sg.err) return render();
    const name = f.s_name.trim();
    const unit = f.s_sub?.trim() || name;
    const org = {
      code: f.s_code,
      name,
      short: name.replace(/\(주\)|㈜/g, '').trim(),
      type: f.s_type,
      size: f.s_type === '기업' ? '중소기업' : undefined,
      numType: f.s_numType,
      number: f.s_no,
      ceo: f.s_ceo || '',
      addr: f.s_addr || '',
      subs: f.s_sub?.trim() ? [{ name: f.s_sub.trim(), status: '승인' }] : [],
      limit: 50000,
      units: [{ name, parent: '' }, ...(unit !== name ? [{ name: unit, parent: name }] : [])],
    };
    const personRec = { name: f.s_person.trim(), role: '기관 관리자', unit, login: lg, email: f.s_mail, phone: f.s_phone || '' };
    try {
      const me = await api('/api/signup/org', { body: { org, person: personRec, password: f.s_pw } });
      applyState(await api('/api/state'));
      S.signup = {
        step: 'done',
        title: `${name} 가입이 끝났어요`,
        msg: `${f.s_person.trim()}님이 기관 관리자가 됐어요.`,
        info: `로그인 정보 · 회사 아이디 <b>${esc(f.s_code)}</b> · 아이디 <b>${esc(lg)}</b><br>직원 계정은 로그인 후 업무 지원 → 직원·급여에서 만들어요.`,
        cta: '바로 시작하기',
        loginPid: me.personId,
      };
      render();
    } catch (e) {
      sg.err = msg(e);
      render();
    }
  };

  a.suJoin = async () => {
    const f = S.f,
      s = S.signup;
    const lg = (f.s_admin || '').trim().toLowerCase();
    s.err = !f.s_person?.trim()
      ? '이름을 입력해 주세요.'
      : !LOGIN_RE.test(lg)
        ? '아이디는 영문 소문자·숫자·점(.)으로 3자 이상 입력해 주세요.'
        : !f.s_mail
          ? '이메일을 입력해 주세요.'
          : !PW_OK(f.s_pw)
            ? '비밀번호는 영문과 숫자를 섞어 8자 이상이어야 해요.'
            : f.s_pw !== f.s_pw2
              ? '비밀번호가 서로 달라요.'
              : '';
    if (s.err) return render();
    const o = S.orgs[s.org];
    try {
      await api('/api/signup/join', {
        body: { orgId: s.org, password: f.s_pw, person: { name: f.s_person.trim(), role: '연구원', unit: f.s_unit || orgCfg(s.org)?.units[0]?.name, login: lg, email: f.s_mail } },
      });
      S.signup = { step: 'done', title: '가입을 신청했어요', msg: `${o.name} 관리자가 승인하면 회사 아이디 ${o.code} · 아이디 ${lg}로 로그인할 수 있어요.`, cta: '로그인으로' };
      render();
    } catch (e) {
      s.err = msg(e);
      render();
    }
  };

  // ---- 직원 계정 (기관 관리자) ----
  a.saveStaff = async () => {
    const f = S.f,
      m = S.modal;
    const lg = (f.s_login || '').trim().toLowerCase();
    m.err = !f.s_name?.trim()
      ? '이름을 입력해 주세요.'
      : !LOGIN_RE.test(lg)
        ? '아이디는 영문 소문자·숫자·점(.)으로 3자 이상 입력해 주세요.'
        : S.people.some((x: any) => x.org === S.view && x.login === lg)
          ? '이미 쓰는 아이디예요.'
          : '';
    if (m.err) return render();
    const st = f.s_student === 'on' || f.s_student === true;
    const rec = { id: 'p' + uid(), name: f.s_name.trim(), org: S.view, role: (f.s_role || '연구원').trim(), unit: f.s_unit, level: f.s_level, login: lg, email: f.s_email || '', noIns: st, noRet: st };
    try {
      const r = await api('/api/accounts', { body: rec });
      S.people.push(r.person);
      (S.pay[S.payYear] = S.pay[S.payYear] || {})[r.person.id] = +f.s_pay || 0;
      S.modal = null;
      render();
      toast(`${rec.name}님 계정(${lg}@${S.orgs[S.view].code})을 만들었어요. 임시 비밀번호 ${r.tempPassword} — 직원에게 전달해 주세요.`);
    } catch (e) {
      m.err = msg(e);
      render();
    }
  };

  const setAcct = async (pid: string, status: string, done: string) => {
    const p = person(pid);
    try {
      await api(`/api/accounts/${encodeURIComponent(pid)}/status`, { body: { status } });
      p.acct = status;
      render();
      toast(done);
    } catch (e) {
      toast(msg(e));
    }
  };
  a.acctSet = (x: string) => {
    const [pid, st] = x.split('|');
    const p = person(pid);
    return setAcct(pid, st, st === '중지' ? `${p.name}님 계정을 사용 중지했어요.` : `${p.name}님 계정을 다시 쓸 수 있어요.`);
  };
  a.acctOk = (x: string) => setAcct(x, '활성', `${person(x).name}님의 가입을 승인했어요.`);

  a.acctReset = async (x: string) => {
    const p = person(x);
    try {
      const r = await api(`/api/accounts/${encodeURIComponent(x)}/reset`, { method: 'POST' });
      p.acct = '초대됨';
      render();
      toast(`${p.name}님 임시 비밀번호 ${r.tempPassword} — 직원에게 전달해 주세요. (‘초대받은 직원 계정 활성화’에서 새 비밀번호를 정해요)`);
    } catch (e) {
      toast(msg(e));
    }
  };

  const acctDel0 = a.acctDel;
  a.acctDel = async (x: string) => {
    const p = person(x);
    if (!p) return;
    try {
      if (p.login) await api(`/api/accounts/${encodeURIComponent(x)}`, { method: 'DELETE' });
      acctDel0(x);
    } catch (e) {
      S.modal = null;
      render();
      toast(msg(e));
    }
  };

  // ---- 연구단 참여 · 초대 ----
  a.saveJoin = async () => {
    const f = S.f,
      m = S.modal;
    if (!String(f.j_code || '').trim()) {
      m.err = '연구단 코드를 확인해 주세요.';
      return render();
    }
    try {
      const r = await api('/api/projects/join', { body: { code: f.j_code, tier: f.j_tier, role: f.j_role, msg: f.j_msg, budget: zeroBudget() } });
      S.modal = null;
      await reload();
      S.menu = r.phase === '제안' ? 'teamProp' : 'team';
      S.teamSel = null;
      render();
      const p = proj(r.projectId);
      if (r.status === '수락') toast(`초대번호로 ${p?.name || '과제'}에 바로 참여했어요.`);
      else {
        const lead = p?.parts?.find((q: any) => q.role === '주관');
        toast(`${(lead && S.orgs[lead.org]?.short) || '총괄기관'}에 참여 신청을 보냈어요.`);
      }
    } catch (e) {
      m.err = msg(e);
      render();
    }
  };

  a.saveInvite = async () => {
    const f = S.f,
      m = S.modal,
      p = proj(m.id || S.tab);
    if ((f.i_no || '').replace(/\D/g, '').length !== 10) {
      m.err = '번호 10자리를 입력해 주세요.';
      return render();
    }
    try {
      const r = await api('/api/orgs/resolve', { body: { number: f.i_no } });
      const org = r.orgId;
      if (part(p, org)) {
        m.err = '이미 이 과제에 포함된 기관이에요.';
        return render();
      }
      S.orgs[org] = { ...(S.orgs[org] || {}), ...r.org };
      p.parts.push({ org, role: f.i_role || '참여', tier: f.i_tier || '1세부', status: '초대 중', budget: p.phase === '제안' ? ratioBudget(0) : ratioBudget(+f.i_amount || 0) });
      S.modal = null;
      render();
      toast(r.hit ? `${S.orgs[org].short}에 초대를 보냈어요.` : '아직 가입하지 않은 기관이에요. 그 기관이 이 번호로 가입하면 초대가 바로 연결돼요.');
    } catch (e) {
      m.err = msg(e);
      render();
    }
  };

  // 시연용 기능은 서버 모드에서 쓰지 않아요
  a.demoLogin = () => toast('시연 계정 바로 들어가기는 시연 모드에서만 돼요.');
  a.setView = () => {};
}

// 회사 주소 로그인 · 첫 로그인 비밀번호 정하기
// 관리자가 만든 계정은 임시 비밀번호로 바로 로그인하고, 그때 새 비밀번호를 정해요.
import { S, render } from '../core/state';
import { A } from '../core/actions';
import { PW_OK } from '../core/catalog';
import { doLogin } from '../core/org';
import { toast } from '../core/runtime';
import { api, type ApiError } from './api';
import { applyState, server } from './sync';
import { findTenant, setUrl, tenantHref } from './tenant';

const msg = (e: unknown) => (e as ApiError)?.message || '잠시 뒤 다시 해 주세요.';

async function enter(personId: string): Promise<void> {
  if (server.on) applyState(await api('/api/state'));
  doLogin(personId);
}

/** 시연 모드: 이 회사·아이디의 사람 */
function demoPerson(code: string, login: string): any {
  const org = code === 'admin' ? 'sa' : Object.keys(S.orgs).find((k) => S.orgs[k].code === code);
  return org && S.people.find((x: any) => x.org === org && x.login === login);
}

export function installTenantActions(): void {
  const a = A as Record<string, (...args: any[]) => any>;
  const demoLogin0 = a.login;
  const suCreate0 = a.suCreate;
  const logout0 = a.logout;

  Object.assign(a, {
    /** 회사 주소 입력 → 그 회사 로그인 화면 */
    async tenantGo() {
      const t = await findTenant(S.f.l_tcode || '');
      if (!t) {
        S.f.l_err = '등록되지 않은 회사 주소예요. 회사 아이디를 확인해 주세요.';
        return render();
      }
      S.tenant = t;
      S.f = { l_org: t.code };
      setUrl(t.code);
      render();
    },
    /** 시연: 회사 주소 바로 고르기 */
    tenantPick(x: string) {
      S.f.l_tcode = x;
      return a.tenantGo();
    },
    /** 다른 회사 주소로 */
    tenantClear() {
      S.tenant = null;
      S.f = {};
      setUrl(null);
      render();
    },

    async login() {
      const f = S.f;
      // 입력칸에서 Enter를 누르면 여기로 와요: 단계에 맞는 동작으로 넘겨요
      if (f.l_step === 'newpw') return a.loginNewPw();
      const code = (S.tenant?.code || f.l_org || '').trim().toLowerCase();
      const id = (f.l_id || '').trim().toLowerCase();
      f.l_err = '';
      if (!code || !id || !f.l_pw) {
        f.l_err = S.tenant ? '아이디와 비밀번호를 입력해 주세요.' : '회사 아이디, 아이디, 비밀번호를 모두 입력해 주세요.';
        return render();
      }
      f.l_org = code;
      if (server.on) {
        try {
          const r = await api('/api/auth/login', { body: { orgCode: code, login: id, password: f.l_pw } });
          if (r.needNewPassword) {
            f.l_step = 'newpw';
            return render();
          }
          await enter(r.personId);
        } catch (e) {
          f.l_err = msg(e);
          render();
        }
        return;
      }
      // 시연 모드: 관리자가 만든(임시 비밀번호) 계정이면 새 비밀번호를 정하는 단계로
      const p = demoPerson(code, id);
      if (p && p.acct === '초대됨') {
        if (S.temp?.[p.id] && S.temp[p.id] === f.l_pw) {
          f.l_step = 'newpw';
          return render();
        }
        f.l_err = '임시 비밀번호가 맞지 않아요. 기관 관리자에게 받은 비밀번호를 입력해 주세요.';
        return render();
      }
      return demoLogin0();
    },

    /** 첫 로그인: 새 비밀번호 정하기 */
    async loginNewPw() {
      const f = S.f;
      f.l_err = !PW_OK(f.l_new) ? '새 비밀번호는 영문과 숫자를 섞어 8자 이상이어야 해요.' : f.l_new !== f.l_new2 ? '새 비밀번호가 서로 달라요.' : f.l_new === f.l_pw ? '임시 비밀번호와 다른 비밀번호로 정해 주세요.' : '';
      if (f.l_err) return render();
      if (server.on) {
        try {
          const me = await api('/api/auth/activate', { body: { orgCode: f.l_org, login: f.l_id, tempPassword: f.l_pw, newPassword: f.l_new } });
          await enter(me.personId);
          toast('새 비밀번호를 정했어요. 다음부터 이 비밀번호로 로그인해요.');
        } catch (e) {
          f.l_err = msg(e);
          render();
        }
        return;
      }
      const p = demoPerson(f.l_org, (f.l_id || '').trim().toLowerCase());
      if (!p) return;
      p.acct = '활성';
      S.creds[p.id] = f.l_new;
      delete S.temp[p.id];
      doLogin(p.id);
      toast('새 비밀번호를 정했어요. 다음부터 이 비밀번호로 로그인해요.');
    },
    loginBack() {
      S.f.l_step = null;
      S.f.l_pw = '';
      S.f.l_err = '';
      render();
    },

    /** 가입이 끝나면 회사 주소를 알려 줘요 */
    async suCreate() {
      const code = (S.f.s_code || '').trim().toLowerCase();
      await suCreate0();
      if (S.signup?.step === 'done' && code) {
        const href = tenantHref(code);
        S.signup.info = `<b>우리 회사 주소</b> · <b>${href}</b><br>직원들은 이 주소에서 아이디와 비밀번호로 로그인해요. 직원 계정은 로그인 후 업무 지원 → 직원·급여에서 만들어요.`;
        S.signup.href = href;
        render();
      }
    },

    async logout() {
      await logout0();
      // 로그아웃해도 그 회사 로그인 화면에 머물러요
      const code = S.tenant?.code;
      if (code) {
        S.f = { l_org: code };
        setUrl(code);
        render();
      }
    },
  });
}

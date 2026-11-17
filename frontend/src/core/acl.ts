// 열람 권한: 기관 관리자가 '설정 → 열람 권한'에서 정해요.
// - 급여 정보(직원·급여 메뉴): 기관 단위 규칙 하나
// - 연구비(연구 관리·연구단 과제): 기관 기본 규칙 + 과제별 규칙(따로 정한 과제만)
// 기관 관리자는 언제나 볼 수 있어요. 권한이 없으면 메뉴·과제가 아예 보이지 않아요.
// 서버(backend state/AccessRules.java)도 같은 규칙으로 데이터를 걸러 보내요.
import { S } from './state';

/** 열람 규칙. 하나라도 맞으면 볼 수 있어요. */
export type Rule = {
  /** 기관 전체 */
  all?: boolean;
  /** 과제 참여 인력과 관리팀 (연구비만) */
  members?: boolean;
  /** 이 직위 이상 (직위 키) */
  level?: string;
  /** 이 부서(하위 부서 포함) */
  units?: string[];
  /** 직접 지정한 사람 */
  people?: string[];
  /** (급여만) 연구비를 볼 수 있는 과제의 참여 인력 급여를 인건비 계산에 보여 줄지. 기본 켬 */
  forResearch?: boolean;
};
export type Acl = { pay?: Rule; research?: Rule; projects?: Record<string, Rule> };

/** 관리자가 아직 정하지 않았을 때 */
export const ACL_DEFAULT: { pay: Rule; research: Rule } = { pay: {}, research: { members: true } };
const LV_DEFAULT = [{ k: 'L1' }, { k: 'L2' }, { k: 'L3' }, { k: 'L4' }];

export const aclOf = (org: string = S.view): Acl => S.orgs?.[org]?.acl || {};

/** 범위 이름: 'pay' · 'research' · 'proj:<과제 아이디>' */
export function ruleOf(scope: string, org: string = S.view): Rule {
  const a = aclOf(org);
  if (scope.startsWith('proj:')) return a.projects?.[scope.slice(5)] || a.research || ACL_DEFAULT.research;
  if (scope === 'pay') return a.pay || ACL_DEFAULT.pay;
  return a.research || ACL_DEFAULT.research;
}

/** 지금 화면을 쓰는 사람 (core/org의 me()와 같아요) */
export function viewer(): any {
  const p = S.me && S.people?.find((x: any) => x.id === S.me);
  return p && p.org === S.view ? p : S.people?.find((x: any) => x.org === S.view);
}

function unitPath(o: any, name: string): string[] {
  const out: string[] = [];
  const units: any[] = o?.units || [];
  let u = units.find((x) => x.name === name);
  while (u && !out.includes(u.name)) {
    out.push(u.name);
    u = u.parent ? units.find((x) => x.name === u.parent) : null;
  }
  return out;
}

export function allows(rule: Rule, u: any, p?: any): boolean {
  if (!u) return false;
  if (u.admin || rule.all) return true;
  if (rule.people?.includes(u.id)) return true;
  const o = S.orgs?.[u.org];
  if (rule.level) {
    const lv: any[] = o?.levels || LV_DEFAULT;
    const ri = lv.findIndex((l) => l.k === rule.level);
    const ui = lv.findIndex((l) => l.k === u.level);
    if (ri >= 0 && ui >= 0 && ui <= ri) return true;
  }
  const path = unitPath(o, u.unit);
  if (rule.units?.length && path.some((n) => rule.units!.includes(n))) return true;
  if (rule.members && p) {
    if (p.members?.includes(u.id)) return true;
    if (p.team && path.includes(p.team)) return true;
  }
  return false;
}

/** 급여 정보를 볼 수 있는지 */
export const canPay = (u: any = viewer()): boolean => allows(ruleOf('pay', u?.org || S.view), u);

/** 이 과제의 연구비(과제 자체)를 볼 수 있는지 */
export const canResearch = (p: any, u: any = viewer()): boolean => {
  if (!p) return false;
  if (!u) return true; // 로그인 전 (가입 화면 등)
  return allows(ruleOf('proj:' + p.id, u.org), u, p);
};

/** 이 사람의 급여(기준 인건비)를 화면에 보여도 되는지 */
export const canSeeSalary = (): boolean => canPay() || ruleOf('pay').forResearch !== false;

/** 기관 관리자인지 (열람 권한을 바꿀 수 있어요) */
export const isOrgAdmin = (u: any = viewer()): boolean => !!u?.admin;

/** 이 사람의 급여를 계산에 써도 되는지 (본인 급여는 언제나) */
export const salaryVisible = (pid: string): boolean => canPay() || pid === viewer()?.id || ruleOf('pay').forResearch !== false;

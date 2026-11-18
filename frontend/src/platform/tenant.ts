// 회사 주소: 서비스 주소 뒤에 회사 아이디를 붙여 회사마다 로그인 주소를 줘요.
// 예) https://carnot-office.onrender.com/saesol
// 서버 없이 도는 시연 페이지는 주소 경로를 바꿀 수 없어서 #saesol 처럼 # 뒤에 붙여요.
import { S, onRender } from '../core/state';
import { api } from './api';
import { server } from './sync';

export type Tenant = { code: string; name: string; short?: string; logo?: string };

const CODE = /^[a-z0-9]{3,20}$/;
/** 회사 주소로 쓸 수 없는 이름 (화면 파일·API 경로) */
const RESERVED = new Set(['api', 'assets', 'actuator', 'index', 'favicon']);

/** 지금 주소의 회사 아이디 */
export function codeFromUrl(): string {
  const path = location.pathname.replace(/^\/+|\/+$/g, '');
  if (server.on && CODE.test(path) && !RESERVED.has(path)) return path;
  const h = location.hash.replace(/^#/, '').toLowerCase();
  return CODE.test(h) && !RESERVED.has(h) ? h : '';
}

/** 사람에게 보여 줄 회사 주소 */
export function tenantHref(code: string): string {
  if (server.on) return `${location.origin}/${code}`;
  return `${location.origin}${location.pathname}#${code}`;
}

/** 주소창을 회사 주소로 바꿔요 (페이지를 다시 읽지 않아요) */
export function setUrl(code: string | null): void {
  if (codeFromUrl() === (code || '')) return;
  try {
    if (server.on) history.replaceState(null, '', code ? `/${code}` : '/');
    else history.replaceState(null, '', code ? `#${code}` : location.pathname + location.search);
  } catch {
    /* 주소를 못 바꾸는 곳(미리보기 등)에서는 그대로 둬요 */
  }
}

/** 회사 아이디로 회사 정보를 찾아요. 없으면 null */
export async function findTenant(code: string): Promise<Tenant | null> {
  const c = (code || '').trim().toLowerCase();
  if (!CODE.test(c) || RESERVED.has(c)) return null;
  if (server.on) {
    try {
      return await api<Tenant>(`/api/public/orgs/${encodeURIComponent(c)}`);
    } catch {
      return null;
    }
  }
  const id = c === 'admin' ? 'sa' : Object.keys(S.orgs || {}).find((k) => S.orgs[k].code === c && !S.orgs[k].hidden);
  const o = id && S.orgs[id];
  return o ? { code: o.code || c, name: o.name, short: o.short, logo: o.logo } : null;
}

/** 시작할 때: 주소의 회사를 찾아 로그인 화면에 보여요. 로그인하면 주소를 그 회사 주소로 맞춰요. */
export async function initTenant(): Promise<void> {
  const c = codeFromUrl();
  if (c) S.tenant = await findTenant(c);
  if (c && !S.tenant) S.f.l_err = `등록되지 않은 회사 주소예요 (${c}). 주소를 확인해 주세요.`;
  onRender(() => {
    if (!S.auth) return;
    const o = S.orgs?.[S.view];
    if (o?.code && o.code !== S.tenant?.code) S.tenant = { code: o.code, name: o.name, short: o.short, logo: o.logo };
    else if (o && S.tenant && o.logo !== S.tenant.logo) S.tenant.logo = o.logo;
    if (o?.code) setUrl(o.code);
  });
}

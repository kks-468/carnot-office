// 로그인 뒤의 전체 틀: 왼쪽 메뉴 + 본문 + 바닥글
import type { ReactNode } from 'react';
import { useS } from '../core/state';
import { MENUS, MENU_NAME } from '../core/catalog';
import { me, isLead } from '../core/org';
import { canPay, isOrgAdmin } from '../core/acl';
import { apvList } from '../core/approval';
import { Btn, Nav } from '../ui/primitives';
import { Footer } from './Footer';
import { MainBody } from './MainBody';

export function Shell() {
  const S = useS();
  const o = S.orgs[S.view];
  const m = me();
  const pend = apvList('wait').length;
  const treqOf = (ph: string) =>
    S.projects
      .filter((p: any) => isLead(p) && !p.archived && p.consortium && (p.phase === '제안') === (ph === 'teamProp'))
      .reduce((n: number, p: any) => n + p.parts.filter((q: any) => q.status === '신청 중').length, 0);
  const menus = (MENUS as [string, string][]).filter((x) => (x[0] !== 'staff' || canPay()) && (x[0] !== 'acl' || isOrgAdmin())).map((x) =>
    x[0] === 'approval' && pend
      ? [x[0], x[1], <span className="soon">{pend}</span>]
      : (x[0] === 'team' || x[0] === 'teamProp') && treqOf(x[0])
        ? [x[0], x[1], <span className="soon">{treqOf(x[0])}</span>]
        : x,
  ) as [string, string, ReactNode?][];
  return (
    <div className="app">
      <aside className="side">
        <div className="logo">
          {o.logo ? (
            <img src={o.logo} alt={o.name} className="orglogo" />
          ) : (
            <div className="orgmark">
              <b>{o.short || o.name}</b>
              <span>{o.name}</span>
            </div>
          )}
        </div>
        <div className="org">
          <div className="avatar" aria-hidden="true">
            {(m?.name || o.short)[0]}
          </div>
          <div>
            <strong>{m?.name || '담당자'}</strong>
            <span>
              {o.name} · {o.type}
            </span>
          </div>
        </div>
        <Btn a="logout" className="logout">
          {m?.login || ''}@{o.code || ''} · 로그아웃
        </Btn>
        <nav className="menu" aria-label="주 메뉴">
          <Nav items={menus} cur={S.menu} a="menu" />
        </nav>
      </aside>
      <main className="main">
        <MainBody />
        <Footer />
      </main>
    </div>
  );
}

/** 각 화면 맨 위 머리글 (기관 이름 · 메뉴 이름 · 탭) */
export function TopBar({ tabs }: { tabs?: ReactNode }) {
  const S = useS();
  return (
    <header className="top">
      <div className="crumb">{S.orgs[S.view].name}</div>
      <h1>{MENU_NAME[S.menu]}</h1>
      {tabs ? (
        <nav className="tabs" aria-label="업무 탭">
          {tabs}
        </nav>
      ) : (
        <div style={{ height: 14 }} />
      )}
    </header>
  );
}

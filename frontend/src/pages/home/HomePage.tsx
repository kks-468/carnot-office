// 홈: 오늘 할 일 요약 (결재, 회사일정, 업무보고, 내 과제, 회의, 업데이트)
import type { ReactNode } from 'react';
import { useS } from '../../core/state';
import { ABSENT, TODAY, UPDATES } from '../../core/catalog';
import { me, live, proj, person, visible } from '../../core/org';
import { apvList } from '../../core/approval';
import { companyEvents, weekStart, evOn, evKind, evTime, ckCls } from '../../core/work';
import { evSum } from '../../core/evidence';
import { budgetOf, spentOf, inCur, rateOf, totRate } from '../../core/budget';
import { addDays, fdate, pct } from '../../core/util';
import { Btn, LinkBtn, Meter } from '../../ui/primitives';

function HCard({ title, act, children }: { title: string; act?: ReactNode; children: ReactNode }) {
  return (
    <section className="hcard">
      <div className="row between">
        <h3 className="h3" style={{ margin: 0 }}>
          {title}
        </h3>
        {act}
      </div>
      {children}
    </section>
  );
}

export function HomePage() {
  const S = useS();
  const m = me();
  const o = S.orgs[S.view];
  const wd = '일월화수목금토'[new Date(TODAY + 'T00:00:00').getDay()];
  const wait = apvList('wait');
  const draft = apvList('draft').filter((a: any) => a.status === '진행');
  const rej = apvList('rejected');
  const ev = companyEvents();
  const ws = weekStart(TODAY);
  const weekEv = ev.filter((e: any) => e.start <= addDays(ws, 6) && (e.end || e.start) >= TODAY).sort((a: any, b: any) => (a.start < b.start ? -1 : 1));
  const away = ev.filter((e: any) => evOn(e, TODAY) && ABSENT.includes(e.kind));
  const rw = S.reports.filter((r: any) => r.week === ws);
  const staff = S.people.filter((p: any) => p.org === S.view && p.acct !== '가입 신청' && p.acct !== '중지' && !p.admin);
  const done = staff.filter((p: any) => rw.some((r: any) => r.by === p.id)).length;
  const mineW = rw.filter((r: any) => r.by === m?.id).length;
  const myP = visible().filter((p: any) => p.members.includes(m?.id));
  const missEv = S.entries.filter((e: any) => e.org === S.view && live(proj(e.proj)) && inCur(e) && !evSum(e).ok).length;
  const nr = S.receipts.filter((r: any) => r.st === 'new').length;
  const meets = S.meetings
    .filter((x: any) => x.date >= TODAY && live(proj(x.proj)))
    .sort((a: any, b: any) => (a.date < b.date ? -1 : 1))
    .slice(0, 5);
  const apvItems = [...wait.map((a: any) => ['대기', a]), ...draft.map((a: any) => ['진행', a])].slice(0, 5);
  return (
    <>
      <div className="page-head">
        <div>
          <h2>안녕하세요, {m?.name || ''}님</h2>
          <p className="small muted">
            {o.name} · {m?.unit || ''} · {fdate(TODAY)} ({wd})
          </p>
        </div>
      </div>
      <div className="hstats">
        <Btn a="homeGo" x="apv:wait" className="">
          <span>결재할 문서</span>
          <strong className={wait.length ? 'err' : ''}>{wait.length}</strong>
        </Btn>
        <Btn a="homeGo" x="apv:draft" className="">
          <span>기안 진행 중</span>
          <strong>{draft.length}</strong>
        </Btn>
        <Btn a="homeGo" x="evid" className="">
          <span>증빙 미비</span>
          <strong className={missEv ? 'err' : ''}>{missEv}</strong>
        </Btn>
        <Btn a="homeGo" x="receipt" className="">
          <span>영수증 미연결</span>
          <strong>{nr}</strong>
        </Btn>
        <Btn a="homeGo" x="report" className="">
          <span>이번 주 업무보고</span>
          <strong>{mineW ? '작성 완료' : '미작성'}</strong>
        </Btn>
      </div>
      <div className="homegrid">
        <HCard title="전자결재" act={<Btn a="homeGo" x="apv:home" className="btn sm">전자결재로</Btn>}>
          <p className="small muted" style={{ margin: 0 }}>
            결재 대기 {wait.length} · 기안 진행 {draft.length} · 반려 {rej.length}
          </p>
          <ul className="hlist">
            {apvItems.length ? (
              apvItems.map(([k, a]: any) => (
                <li key={a.id}>
                  <LinkBtn a="apvOpen" x={a.id}>
                    <span className={`chip ${k === '대기' ? 'bad' : 'info'}`}>{k === '대기' ? '결재 대기' : '기안 중'}</span> {a.title}
                  </LinkBtn>
                  <span className="small muted">
                    {person(a.drafter)?.name || ''} · {fdate(a.date).slice(5)}
                  </span>
                </li>
              ))
            ) : (
              <li className="muted">처리할 결재가 없어요.</li>
            )}
          </ul>
        </HCard>
        <HCard title="이번 주 회사일정" act={<Btn a="homeGo" x="ccal" className="btn sm">회사일정</Btn>}>
          <p className="small" style={{ margin: 0 }}>
            <b>오늘 부재</b>{' '}
            {away.length ? away.map((e: any) => `${person(e.pid)?.name || ''}(${evKind(e)}${e.time && e.time2 ? ' ' + evTime(e) : ''})`).join(', ') : '없음'}
          </p>
          <ul className="hlist">
            {weekEv.length ? (
              weekEv.slice(0, 6).map((e: any, i: number) => (
                <li key={i}>
                  <span>
                    <span className={`chip ck-${ckCls(e.kind)}`}>{evKind(e)}</span> {e.auto ? e.title : (person(e.pid)?.name || '') + (e.title ? ' · ' + e.title : '')}
                  </span>
                  <span className="small muted num">
                    {fdate(e.start).slice(5)}
                    {e.time ? ' ' + evTime(e) : ''}
                  </span>
                </li>
              ))
            ) : (
              <li className="muted">이번 주 일정이 없어요.</li>
            )}
          </ul>
        </HCard>
        <HCard
          title="업무보고"
          act={
            <Btn a={mineW ? 'homeGo' : 'wrNew'} x="report" className={`btn sm ${mineW ? '' : 'primary'}`}>
              {mineW ? '보러 가기' : '이번 주 쓰기'}
            </Btn>
          }
        >
          <p className="small" style={{ margin: 0 }}>
            {fdate(ws)} 주간 · 작성{' '}
            <b>
              {done}/{staff.length}명
            </b>
          </p>
          <Meter pct={staff.length ? pct(done, staff.length) : 0} />
          <p className="small muted" style={{ margin: 0 }}>
            {mineW ? `내 업무보고 ${mineW}건을 올렸어요.` : '아직 내 업무보고를 쓰지 않았어요.'}
          </p>
        </HCard>
        <HCard title="내 과제" act={<Btn a="homeGo" x="admin" className="btn sm">연구행정</Btn>}>
          <ul className="hlist">
            {myP.length ? (
              myP.map((p: any) => {
                const b = budgetOf(p, S.view);
                const s = spentOf(p, S.view);
                return (
                  <li key={p.id}>
                    <LinkBtn a="openProject" x={p.id}>
                      {p.name}
                    </LinkBtn>
                    <span className="small muted num">
                      참여 {rateOf(m.id, p.id)}% · 집행 {pct(s, b)}%
                    </span>
                  </li>
                );
              })
            ) : (
              <li className="muted">참여 중인 과제가 없어요.</li>
            )}
          </ul>
          {myP.length ? (
            <p className="small muted" style={{ margin: 0 }}>
              총 참여율 {totRate(m.id)}%
            </p>
          ) : null}
        </HCard>
        <HCard title="다가오는 회의" act={<Btn a="homeGo" x="meet" className="btn sm">회의일정</Btn>}>
          <ul className="hlist">
            {meets.length ? (
              meets.map((x: any) => (
                <li key={x.id}>
                  <LinkBtn a="openMeeting" x={x.id}>
                    {x.topic}
                  </LinkBtn>
                  <span className="small muted num">
                    {fdate(x.date).slice(5)} {x.start} · {proj(x.proj).short}
                  </span>
                </li>
              ))
            ) : (
              <li className="muted">예정된 회의가 없어요.</li>
            )}
          </ul>
        </HCard>
      </div>
      <section className="hcard" style={{ marginTop: 14 }}>
        <div className="row between">
          <h3 className="h3" style={{ margin: 0 }}>
            Carnot office 업데이트
          </h3>
          <span className="small muted">최근 변경 사항</span>
        </div>
        <ul className="hlist upd">
          {UPDATES.map((u: any, i: number) => (
            <li key={i}>
              <span>
                <span className={`chip ${u.tag === '새 기능' ? 'good' : u.tag === '개선' ? 'info' : ''}`}>{u.tag}</span> {u.t}
              </span>
              <span className="small muted num">{fdate(u.d).slice(5)}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

// 연구단 과제 상세의 탭 화면들
import type { CSSProperties, ReactNode } from 'react';
import { S } from '../../core/state';
import { EVK, ITEMS, TIERS, TODAY } from '../../core/catalog';
import { isLead, orgColor, part, partLabel, peopleOf, person, roleName, sortParts } from '../../core/org';
import { curY, inY, spentOf, yLabel } from '../../core/budget';
import { allocOf, alYear, propCalc, propTotal, propYearsOf } from '../../core/proposal';
import { canGoal, canPerfOrg, goalT, goalsOf, gStatus, gYear, invState, perfOrgs } from '../../core/perf';
import { docVisibleAny } from '../../core/evidence';
import { eok, fdate, pct, sum, won, ymAdd, ymDiff } from '../../core/util';
import { Btn, In, LinkBtn } from '../../ui/primitives';
import { MonthGrid, MonthNav } from '../../ui/MonthGrid';
import { PerfBars, PerfGoalTable, PerfOrgBar, PerfOrgTable, PerfOutTable } from '../perf/Perf';
import { PropTable } from '../proposal/PropParts';

const ocStyle = (oc: string) => ({ ['--oc' as string]: oc }) as CSSProperties;
const Mini = ({ x, b }: { x: number; b: number }) => (
  <>
    <span className="mini">
      <i style={{ width: `${Math.min(100, pct(x, b))}%` }} />
    </span>
    {pct(x, b)}%
  </>
);

/* ---------- 연구관리: 사업비 현황 ---------- */
export function TeamSum({ p }: { p: any }) {
  const rows = sortParts(p.parts.filter((x: any) => x.status === '수락')).map((q: any) => ({ q, B: sum(Object.values(q.budget)), K: sum(Object.values(q.inkind || {})), X: spentOf(p, q.org) }));
  const B = sum(rows.map((r: any) => r.B));
  const K = sum(rows.map((r: any) => r.K));
  const X = sum(rows.map((r: any) => r.X));
  const cy = curY(p);
  const tiers = [...new Set(rows.map((r: any) => r.q.tier || '총괄'))] as string[];
  const yrs = (p.years || []).map((y: any) => {
    const yb = y.closed ? sum(Object.values(y.budget || {}).map((b: any) => sum(Object.values(b)))) : y.no === p.cur ? B : 0;
    const yx = sum(S.entries.filter((e: any) => e.proj === p.id && inY(e, y)).map((e: any) => e.amount));
    return { y, yb, yx };
  });
  return (
    <>
      <div className="stats">
        <div>
          <span>{cy ? cy.no + '차년도 ' : ''}연구단 사업비</span>
          <strong>{won(B)}</strong>
          <span className="small muted">
            현금 {eok(B - K)} · 현물 {eok(K)}
          </span>
        </div>
        <div>
          <span>연구단 집행액</span>
          <strong>{won(X)}</strong>
        </div>
        <div>
          <span>집행률</span>
          <strong>{pct(X, B)}%</strong>
        </div>
        <div>
          <span>참여기관</span>
          <strong>{rows.length}곳</strong>
        </div>
      </div>
      <section>
        <h3 className="h3">
          기관별 예산·집행 <span className="muted small">{cy ? yLabel(cy) : ''}</span>
        </h3>
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>구분</th>
                <th>기관</th>
                <th>역할</th>
                <th className="r">현금 예산</th>
                <th className="r">현물 예산</th>
                <th className="r">집행</th>
                <th>집행률</th>
              </tr>
            </thead>
            <tbody>
              {tiers.map((t) => {
                const rs = rows.filter((r: any) => (r.q.tier || '총괄') === t);
                const sb = sum(rs.map((r: any) => r.B));
                const sk = sum(rs.map((r: any) => r.K));
                const sx = sum(rs.map((r: any) => r.X));
                return [
                  ...rs.map(({ q, B: b, K: k, X: x }: any) => (
                    <tr key={q.org}>
                      <td>{t}</td>
                      <td>
                        {S.orgs[q.org].name}
                        {q.org === S.view ? (
                          <>
                            {' '}
                            <span className="chip">우리 기관</span>
                          </>
                        ) : null}
                      </td>
                      <td>{roleName(q)}</td>
                      <td className="r num">{eok(b - k)}</td>
                      <td className="r num">{k ? eok(k) : '-'}</td>
                      <td className="r num">{eok(x)}</td>
                      <td className="num">
                        <Mini x={x} b={b} />
                      </td>
                    </tr>
                  )),
                  rs.length > 1 ? (
                    <tr key={t + 's'}>
                      <td colSpan={3} className="small muted">
                        {t} 소계
                      </td>
                      <td className="r num small">{eok(sb - sk)}</td>
                      <td className="r num small">{eok(sk)}</td>
                      <td className="r num small">{eok(sx)}</td>
                      <td className="num small">{pct(sx, sb)}%</td>
                    </tr>
                  ) : null,
                ];
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3}>연구단 합계</td>
                <td className="r num">{eok(B - K)}</td>
                <td className="r num">{eok(K)}</td>
                <td className="r num">{eok(X)}</td>
                <td className="num">{pct(X, B)}%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
      {yrs.length ? (
        <section>
          <h3 className="h3">연차별 예산 집행률</h3>
          <div className="tw">
            <table>
              <thead>
                <tr>
                  <th>연차</th>
                  <th>기간</th>
                  <th>상태</th>
                  <th className="r">예산</th>
                  <th className="r">집행</th>
                  <th>집행률</th>
                </tr>
              </thead>
              <tbody>
                {yrs.map(({ y, yb, yx }: any) => (
                  <tr key={y.no}>
                    <td>{y.no}차년도</td>
                    <td className="num small">
                      {fdate(y.start)}~{fdate(y.end)}
                    </td>
                    <td>{y.closed ? <span className="chip">마감</span> : y.no === p.cur ? <span className="chip good">진행 중</span> : <span className="chip">예정</span>}</td>
                    <td className="r num">{eok(yb)}</td>
                    <td className="r num">{eok(yx)}</td>
                    <td className="num">
                      <Mini x={yx} b={yb} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
      <p className="small muted">연구단에는 기관별 합계만 보여요. 회의비·출장비 같은 세부 집행 내역과 증빙은 각 기관의 연구행정 관리에서만 볼 수 있어요.</p>
    </>
  );
}

/* ---------- 연구관리: 연구일정 (간트) ---------- */
export function TeamGantt({ p }: { p: any }) {
  const y = gYear(p);
  if (!y) return <div className="notice">연차 기간이 없어 일정을 그릴 수 없어요.</div>;
  const y0 = y.start.slice(0, 7);
  const ms = Array.from({ length: 12 }, (_, i) => ymAdd(y0, i));
  const y1 = ms[11];
  const now = TODAY.slice(0, 7);
  const ni = ms.indexOf(now);
  const orgs = sortParts(p.parts.filter((x: any) => x.status === '수락'));
  const tasks = (p.tasks || []).filter((t: any) => t.e >= y0 && t.s <= y1);
  const miles = (p.miles || []).filter((m: any) => m.ym >= y0 && m.ym <= y1);
  const avg = (a: any[]) => (a.length ? Math.round(sum(a.map((t) => +t.prog || 0)) / a.length) : 0);
  const late = tasks.filter((t: any) => gStatus(t)[0] === '지연').length;
  const pos = (a: string, b: string) => {
    const s = Math.max(0, ymDiff(y0, a));
    const e = Math.min(11, ymDiff(y0, b));
    return { l: (s / 12) * 100, w: ((e - s + 1) / 12) * 100 };
  };
  const cells = ms.map((ym) => <i className="cell" key={ym} />);
  const nowL = ni >= 0 ? <span className="gnow" style={{ left: `${((ni + 0.5) / 12) * 100}%` }} /> : null;
  const mm = (ym: string) => `${+ym.slice(5, 7)}월`;
  const can = (o: string) => canPerfOrg(p, o);
  const row = (t: any) => {
    const st = gStatus(t);
    const ps = pos(t.s, t.e);
    const fill = (ps.w * Math.min(100, +t.prog || 0)) / 100;
    return (
      <div className="gr" style={ocStyle(orgColor(p, t.org))} key={t.id}>
        <span style={{ paddingLeft: 24, display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {can(t.org) ? (
              <LinkBtn a="gTaskEdit" x={`${p.id}|${t.id}`}>
                {t.title}
              </LinkBtn>
            ) : (
              t.title
            )}
          </span>
          <span className={`chip ${st[1]}`}>{st[0]}</span>
        </span>
        <span className="small muted">
          {mm(t.s)}~{mm(t.e)}
        </span>
        <span className="r">
          {can(t.org) ? (
            <label>
              <span hidden>{t.title} 진척률</span>
              <In className="gprog" id={`gp-${t.id}`} type="number" min="0" max="100" data-gt={`${p.id}|${t.id}`} value={+t.prog || 0} />
            </label>
          ) : (
            <b className="num">{+t.prog || 0}%</b>
          )}
        </span>
        <span className="gtl" title={`${S.orgs[t.org]?.short || ''} · ${t.title} · ${t.s}~${t.e} · 진척 ${+t.prog || 0}%`}>
          {cells}
          <span className="gbar" style={{ left: `${ps.l}%`, width: `${ps.w}%` }} />
          <span className="gbar p" style={{ left: `${ps.l}%`, width: `${fill}%` }} />
          {nowL}
        </span>
      </div>
    );
  };
  const mcount = ms.map((ym) => miles.filter((m: any) => m.ym === ym).length);
  const lead = isLead(p);
  return (
    <>
      <div className="row between" style={{ flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        <div>
          <h3 className="h3" style={{ margin: 0 }}>
            {yLabel(y)} 추진일정
          </h3>
          <p className="small muted" style={{ margin: '2px 0 0' }}>
            각 기관은 자기 기관 세부 연구와 진척률만 고치고, 총괄기관은 모두 고칠 수 있어요. 막대의 옅은 부분은 계획 기간, 진한 부분은 진척률이에요.
          </p>
        </div>
        <div className="row" style={{ gap: 6 }}>
          <label>
            <span hidden>차년도</span>
            <In as="select" id={`gy-${p.id}`} data-gy={p.id} style={{ width: 'auto' }} value={y.no}>
              {(p.years || []).map((z: any) => (
                <option key={z.no} value={z.no}>
                  {z.no}차년도
                </option>
              ))}
            </In>
          </label>
          {canGoal(p) ? (
            <Btn a="gTaskNew" x={p.id} className="btn sm primary">
              + 세부 연구
            </Btn>
          ) : null}
        </div>
      </div>
      <div className="gstats">
        <div className="card">
          <small>참여 기관</small>
          <b>
            {orgs.length}
            <small>개</small>
          </b>
        </div>
        <div className="card">
          <small>세부 연구</small>
          <b>
            {tasks.length}
            <small>건</small>
          </b>
        </div>
        <div className="card">
          <small>평균 진척률</small>
          <b>
            {avg(tasks)}
            <small>%</small>
          </b>
        </div>
        <div className="card">
          <small>지연 연구</small>
          <b style={late ? { color: 'var(--bad)' } : undefined}>
            {late}
            <small>건</small>
          </b>
        </div>
        <div className="card">
          <small>주요 공정 완료</small>
          <b>
            {miles.filter((m: any) => m.st === '완료').length} / {miles.length}
            <small>건</small>
          </b>
        </div>
      </div>
      <section className="card" style={{ padding: 0 }}>
        <div className="tw" style={{ border: 0, margin: 0 }}>
          <div className="gch">
            <div className="gr gh">
              <span>기관 / 세부 연구</span>
              <span>계획 기간</span>
              <span className="r">진척률</span>
              {ms.map((ym, i) => (
                <span key={ym} className={`mc ${i === ni ? 'now' : ''}`}>
                  {mm(ym)}
                </span>
              ))}
            </div>
            <div className="gr">
              <span>
                <b>◆ 주요 공정</b>
              </span>
              <span />
              <span />
              <span className="gtl">
                {cells}
                {mcount.map((c, i) =>
                  c ? (
                    <span key={i} className="gms" style={{ left: `${((i + 0.5) / 12) * 100}%` }} title={`${mm(ms[i])} 주요 공정 ${c}건`}>
                      ◆ {c}
                    </span>
                  ) : null,
                )}
                {nowL}
              </span>
            </div>
            {orgs.map((q: any) => {
              const ts = tasks.filter((t: any) => t.org === q.org);
              return [
                <div className="gr go" style={ocStyle(orgColor(p, q.org))} key={'o' + q.org}>
                  <span>
                    <span className="odot" />
                    <b>{S.orgs[q.org].short}</b> <span className="small muted">{partLabel(q)}</span>
                  </span>
                  <span />
                  <span className="r small">
                    <b>평균 {avg(ts)}%</b>
                  </span>
                  <span className="gtl">
                    {cells}
                    {nowL}
                  </span>
                </div>,
                ts.length ? (
                  ts.map(row)
                ) : (
                  <div className="gr" key={'e' + q.org}>
                    <span className="small muted" style={{ paddingLeft: 24 }}>
                      등록한 세부 연구가 없어요
                    </span>
                    <span />
                    <span />
                    <span className="gtl">
                      {cells}
                      {nowL}
                    </span>
                  </div>
                ),
              ];
            })}
          </div>
        </div>
      </section>
      <section className="card">
        <div className="row between" style={{ marginBottom: 8 }}>
          <div>
            <h3 className="h3" style={{ margin: 0 }}>
              주요 공정
            </h3>
            <p className="small muted" style={{ margin: '2px 0 0' }}>
              월을 정하면 위 차트의 ◆ 주요 공정 줄에 표시돼요.
            </p>
          </div>
          {canGoal(p) ? (
            <Btn a="gMileNew" x={p.id} className="btn sm primary">
              + 공정 추가
            </Btn>
          ) : null}
        </div>
        {miles.length ? (
          <div className="tw">
            <table>
              <thead>
                <tr>
                  <th>월</th>
                  <th>기관</th>
                  <th>주요 공정 내용</th>
                  <th>담당자</th>
                  <th>상태</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {[...miles]
                  .sort((a: any, b: any) => a.ym.localeCompare(b.ym))
                  .map((m: any) => {
                    const ed = can(m.org);
                    return (
                      <tr key={m.id}>
                        <td>
                          {ed ? (
                            <label>
                              <span hidden>월</span>
                              <In as="select" id={`gm-${m.id}-ym`} data-gm={`${p.id}|${m.id}|ym`} style={{ width: 'auto' }} value={m.ym}>
                                {ms.map((z) => (
                                  <option key={z} value={z}>
                                    {mm(z)}
                                  </option>
                                ))}
                              </In>
                            </label>
                          ) : (
                            mm(m.ym)
                          )}
                        </td>
                        <td>
                          {ed && lead ? (
                            <label>
                              <span hidden>기관</span>
                              <In as="select" id={`gm-${m.id}-org`} data-gm={`${p.id}|${m.id}|org`} style={{ width: 'auto' }} value={m.org}>
                                {orgs.map((q: any) => (
                                  <option key={q.org} value={q.org}>
                                    {S.orgs[q.org].short}
                                  </option>
                                ))}
                              </In>
                            </label>
                          ) : (
                            <span style={ocStyle(orgColor(p, m.org))}>
                              <span className="odot" />
                              {S.orgs[m.org]?.short || ''}
                            </span>
                          )}
                        </td>
                        <td>
                          {ed ? (
                            <label>
                              <span hidden>내용</span>
                              <In id={`gm-${m.id}-title`} type="text" data-gm={`${p.id}|${m.id}|title`} value={m.title} />
                            </label>
                          ) : (
                            m.title
                          )}
                        </td>
                        <td>
                          {ed ? (
                            <label>
                              <span hidden>담당자</span>
                              <In id={`gm-${m.id}-owner`} type="text" data-gm={`${p.id}|${m.id}|owner`} value={m.owner || ''} placeholder="담당자" style={{ width: 110 }} />
                            </label>
                          ) : (
                            m.owner || '-'
                          )}
                        </td>
                        <td>
                          {ed ? (
                            <label>
                              <span hidden>상태</span>
                              <In as="select" id={`gm-${m.id}-st`} data-gm={`${p.id}|${m.id}|st`} style={{ width: 'auto' }} value={m.st}>
                                {['예정', '진행', '완료'].map((z) => (
                                  <option key={z}>{z}</option>
                                ))}
                              </In>
                            </label>
                          ) : (
                            <span className={`chip ${m.st === '완료' ? 'good' : m.st === '진행' ? 'warn' : ''}`}>{m.st}</span>
                          )}
                        </td>
                        <td className="r">
                          {ed ? (
                            <Btn a="gMileDel" x={`${p.id}|${m.id}`} className="btn sm" aria-label="공정 삭제">
                              ×
                            </Btn>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="small muted">이 차년도 주요 공정이 없어요.</p>
        )}
        <label className="field" htmlFor={`gmemo-${p.id}`} style={{ marginTop: 10 }}>
          <span>
            기타 메모 (회의 결정사항, 이슈 등) {lead ? null : <small>총괄기관이 써요</small>}
          </span>
          <In as="textarea" id={`gmemo-${p.id}`} data-gmemo={p.id} rows={3} readOnly={!lead} placeholder="예: 12월 연차평가 자료는 각 기관 11/28까지 제출" value={p.sMemo || ''} />
        </label>
      </section>
    </>
  );
}

/* ---------- 연구관리: 성과 ---------- */
export function TeamPerf({ p }: { p: any }) {
  const pre = p.phase === '제안';
  return (
    <>
      <div className="row between" style={{ marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
        <p className="small muted" style={{ margin: 0 }}>
          {pre ? '제안서에 넣을 성과 목표예요.' : '성과 목표와 실적이에요.'} 각 기관은 자기 기관 목표와 실적만 넣고 봐요. 총괄기관은 모든 기관을 보고 고칠 수 있어요.
        </p>
        <div className="row">
          {canGoal(p) ? (
            <Btn a="perfGoalNew" x={p.id} className="btn sm">
              + 성과 목표
            </Btn>
          ) : null}
          {!pre && canGoal(p) ? (
            <Btn a="perfOutNew" x={p.id} className="btn sm primary">
              + 성과 등록
            </Btn>
          ) : null}
        </div>
      </div>
      <PerfOrgBar p={p} />
      <section className="card">
        <h3 className="h3">성과 목표{pre ? '' : ' · 달성 현황'}</h3>
        <PerfGoalTable p={p} plan={pre} />
      </section>
      {pre ? null : (
        <>
          <PerfBars p={p} />
          <PerfOrgTable p={p} />
          <section className="card">
            <h3 className="h3">성과 실적</h3>
            <PerfOutTable p={p} />
          </section>
        </>
      )}
    </>
  );
}

/* ---------- 달력: 연구단 회의일정 ---------- */
const EV_BG: Record<string, string> = { mtg: 'info-bg', ws: 'good-bg', due: 'warn-bg', eval: 'bad-bg', etc: 'mute-bg' };
export function TeamSched({ p }: { p: any }) {
  const ev = [
    ...(p.events || []),
    ...S.meetings.filter((m: any) => m.proj === p.id).map((m: any) => ({ date: m.date, title: m.topic, kind: '회의', org: person(m.att[0])?.org || '', time: m.start })),
  ].sort((a: any, b: any) => (a.date + (a.time || '') < b.date + (b.time || '') ? -1 : 1));
  const c = S.tcal || (S.tcal = { y: +TODAY.slice(0, 4), m: +TODAY.slice(5, 7) - 1 });
  const { y, m } = c;
  const month = `${y}-${String(m + 1).padStart(2, '0')}`;
  const list = ev.filter((x: any) => x.date.startsWith(month));
  const next = ev.find((x: any) => x.date >= TODAY);
  return (
    <>
      <div className="row between" style={{ marginBottom: 8 }}>
        <p className="small muted" style={{ margin: 0 }}>
          연구단 공동 일정과 각 기관이 잡은 회의가 함께 보여요. 회의 비용과 참석자 명단은 각 기관만 봐요.
        </p>
        <Btn a="tevNew" x={p.id} className="btn sm primary">
          + 연구단 일정
        </Btn>
      </div>
      {next ? (
        <div className="notice">
          다음 일정: <b>{fdate(next.date)}</b> {next.kind} · {next.title}
          {next.date.slice(0, 7) !== month ? (
            <>
              {' '}
              <LinkBtn a="tcalGo" x={next.date.slice(0, 7)}>
                그 달로 이동
              </LinkBtn>
            </>
          ) : null}
        </div>
      ) : null}
      <div className="row between">
        <MonthNav y={y} m={m} prev="tcalPrev" next="tcalNext" today="tcalToday" />
        <div className="legend">
          {Object.entries(EVK).map(([k, v]: [string, any]) => (
            <span key={k}>
              <i className={`sw ev-${v}`} style={{ background: `var(--${EV_BG[v]})` }} />
              {k}
            </span>
          ))}
        </div>
      </div>
      <MonthGrid
        y={y}
        m={m}
        renderDay={(ds) =>
          ev
            .filter((x: any) => x.date === ds)
            .map((x: any, i: number) => (
              <div key={i} className={`mt ev-${EVK[x.kind] || 'etc'}`} title={`${x.kind} · ${x.title} · ${S.orgs[x.org]?.short || ''}`}>
                <b>
                  {x.time ? x.time + ' ' : ''}
                  {x.kind} · {S.orgs[x.org]?.short || ''}
                </b>
                <span>{x.title}</span>
              </div>
            ))
        }
      />
      <section>
        <h3 className="h3">
          {m + 1}월 일정 {list.length}건
        </h3>
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>날짜</th>
                <th>구분</th>
                <th>내용</th>
                <th>등록 기관</th>
              </tr>
            </thead>
            <tbody>
              {list.length ? (
                list.map((x: any, i: number) => (
                  <tr key={i} className={x.date < TODAY ? 'muted' : ''}>
                    <td className="num">
                      {fdate(x.date)}
                      {x.time ? <span className="small muted"> {x.time}</span> : null}
                    </td>
                    <td>
                      <span className={`chip ${x.kind === '회의' ? 'info' : x.kind === '보고서 마감' ? 'warn' : x.kind === '평가' ? 'bad' : 'org'}`}>{x.kind}</span>
                    </td>
                    <td>{x.title}</td>
                    <td className="small">{S.orgs[x.org]?.short || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="muted">
                    이 달에는 일정이 없어요.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

/* ---------- 파일 취합 (연차별 보고서 · 제안서 취합) ---------- */
function UploadBtn({ c, label, primary }: { c: any; label: string; primary?: boolean }) {
  return (
    <label className={`btn sm ${primary ? 'primary' : ''}`} htmlFor={`colup-${c.id}`}>
      {label}
      <input id={`colup-${c.id}`} type="file" hidden data-a-change="colUp" data-x={c.id} />
    </label>
  );
}

export function TeamReport({ p }: { p: any }) {
  const lead = isLead(p);
  const cs = S.collect.filter((c: any) => c.proj === p.id && c.kind !== 'prop').sort((a: any, b: any) => (a.due < b.due ? 1 : -1));
  const ps = sortParts(p.parts.filter((x: any) => x.status === '수락'));
  return (
    <>
      <div className="row between" style={{ marginBottom: 8 }}>
        <p className="small muted" style={{ margin: 0 }}>
          총괄기관이 양식과 마감일을 올리면 각 기관이 자기 몫을 올려요. 올린 자료는 연구단 모든 기관이 열람·내려받을 수 있어요.
        </p>
        {lead ? (
          <Btn a="colNew" x={p.id} className="btn sm primary">
            + 취합 요청
          </Btn>
        ) : null}
      </div>
      {cs.length ? (
        cs.map((c: any) => {
          const n = ps.filter((q: any) => c.subs[q.org]).length;
          const all = n === ps.length;
          return (
            <section className="card" key={c.id}>
              <div className="row between">
                <div>
                  <h3 className="h3" style={{ margin: 0 }}>
                    {c.title}
                  </h3>
                  <p className="small muted">
                    마감 {fdate(c.due)} · 양식 {c.tpl || '없음'} · 요청 {S.orgs[c.by]?.short || ''}
                  </p>
                </div>
                <div className="row">
                  <span className={`chip ${all ? 'good' : c.due < TODAY ? 'bad' : 'warn'}`}>
                    제출 {n}/{ps.length}
                  </span>
                  <Btn a="colZip" x={c.id} className="btn sm warm">
                    {all ? '취합본' : '양식·제출본'} 내려받기 (ZIP)
                  </Btn>
                  {lead && !all ? (
                    <Btn a="colRemind" x={c.id} className="btn sm">
                      미제출 기관에 알림
                    </Btn>
                  ) : null}
                </div>
              </div>
              <div className="tw" style={{ marginTop: 8 }}>
                <table>
                  <thead>
                    <tr>
                      <th>구분</th>
                      <th>기관</th>
                      <th>상태</th>
                      <th>파일</th>
                      <th>제출</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {ps.map((q: any) => {
                      const s = c.subs[q.org];
                      const mine = q.org === S.view;
                      return (
                        <tr key={q.org}>
                          <td>{q.tier || '총괄'}</td>
                          <td>{S.orgs[q.org].short}</td>
                          <td>{s ? <span className="chip good">제출</span> : c.due < TODAY ? <span className="chip bad">기한 지남</span> : <span className="chip warn">미제출</span>}</td>
                          <td className="small">{s ? s.name : '-'}</td>
                          <td className="num small">{s ? `${fdate(s.date)} · ${person(s.by)?.name || ''}` : '-'}</td>
                          <td className="r">{mine ? <UploadBtn c={c} label={s ? '다시 올리기' : '우리 기관 자료 올리기'} /> : null}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })
      ) : (
        <div className="notice">취합 요청이 없어요.</div>
      )}
    </>
  );
}

export function TeamPropCollect({ p }: { p: any }) {
  const lead = isLead(p);
  const cs = S.collect.filter((c: any) => c.proj === p.id && c.kind === 'prop').sort((a: any, b: any) => (a.due < b.due ? 1 : -1));
  const ps = sortParts(p.parts.filter((x: any) => x.status === '수락'));
  const docs = S.docs.filter((d: any) => d.proj === p.id && d.kind === '제안서' && docVisibleAny(d));
  return (
    <>
      <div className="row between" style={{ marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
        <p className="small muted" style={{ margin: 0 }}>
          총괄기관이 제안서 양식을 올리면 각 기관이 내려받아 자기 기관 부분을 채워 올려요. {lead ? '올라온 파일은 총괄기관이 모두 내려받을 수 있어요.' : '우리 기관이 올린 파일은 우리 기관과 총괄기관만 봐요.'}
        </p>
        {lead ? (
          <Btn a="colNew" x={`${p.id}|prop`} className="btn sm primary">
            + 제안서 양식 올리기
          </Btn>
        ) : null}
      </div>
      {cs.length ? (
        cs.map((c: any) => {
          const n = ps.filter((q: any) => c.subs[q.org]).length;
          const all = n === ps.length;
          const late = c.due < TODAY;
          return (
            <section className="card" key={c.id}>
              <div className="row between" style={{ flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <h3 className="h3" style={{ margin: 0 }}>
                    {c.title}
                  </h3>
                  <p className="small muted" style={{ margin: '2px 0 0' }}>
                    마감 {fdate(c.due)} · 올린 기관 {S.orgs[c.by]?.short || ''}
                  </p>
                </div>
                <div className="row" style={{ flexWrap: 'wrap' }}>
                  {c.tpl ? (
                    <Btn a="colTplDl" x={c.id} className="btn sm">
                      양식 내려받기 · {c.tpl}
                    </Btn>
                  ) : (
                    <span className="small muted">양식 파일 없음</span>
                  )}
                  <span className={`chip ${all ? 'good' : late ? 'bad' : 'warn'}`}>
                    제출 {n}/{ps.length}
                  </span>
                  {lead ? (
                    <>
                      <Btn a="colZip" x={c.id} className="btn sm warm">
                        모두 내려받기 (ZIP)
                      </Btn>
                      {all ? null : (
                        <Btn a="colRemind" x={c.id} className="btn sm">
                          미제출 기관에 알림
                        </Btn>
                      )}
                    </>
                  ) : null}
                </div>
              </div>
              <div className="tw" style={{ marginTop: 8 }}>
                <table>
                  <thead>
                    <tr>
                      <th>구분</th>
                      <th>기관</th>
                      <th>상태</th>
                      <th>올린 파일</th>
                      <th>제출</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {ps.map((q: any) => {
                      const sb = c.subs[q.org];
                      const mine = q.org === S.view;
                      const see = lead || mine;
                      return (
                        <tr key={q.org}>
                          <td>{q.tier || '총괄'}</td>
                          <td>
                            {S.orgs[q.org].short}
                            {mine ? (
                              <>
                                {' '}
                                <span className="chip">우리 기관</span>
                              </>
                            ) : null}
                          </td>
                          <td>{sb ? <span className="chip good">제출</span> : late ? <span className="chip bad">기한 지남</span> : <span className="chip warn">미제출</span>}</td>
                          <td className="small">
                            {sb ? (
                              see ? (
                                <LinkBtn a="colSubDl" x={`${c.id}|${q.org}`}>
                                  {sb.name}
                                </LinkBtn>
                              ) : (
                                '제출됨'
                              )
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="num small">{sb ? `${fdate(sb.date)}${see ? ' · ' + (person(sb.by)?.name || '') : ''}` : '-'}</td>
                          <td className="r">{mine ? <UploadBtn c={c} label={sb ? '다시 올리기' : '우리 기관 제안서 올리기'} primary={!sb} /> : null}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })
      ) : (
        <div className="notice">{lead ? '‘+ 제안서 양식 올리기’로 양식과 마감일을 올리면 참여기관 화면에 바로 나타나요.' : '총괄기관이 아직 제안서 양식을 올리지 않았어요.'}</div>
      )}
      {docs.length ? (
        <section>
          <h3 className="h3">공유된 제안서</h3>
          <div className="tw">
            <table>
              <thead>
                <tr>
                  <th>문서</th>
                  <th>작성 기관</th>
                  <th>날짜</th>
                </tr>
              </thead>
              <tbody>
                {docs.map((d: any) => (
                  <tr key={d.id}>
                    <td>
                      <LinkBtn a="openDoc" x={d.id}>
                        {d.name}
                      </LinkBtn>
                    </td>
                    <td>{S.orgs[d.org].short}</td>
                    <td className="num">{fdate(d.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </>
  );
}

/* ---------- 참여기관 · 초대번호 ---------- */
export function TeamOrgs({ p }: { p: any }) {
  const lead = isLead(p);
  const ps = sortParts(p.parts);
  return (
    <>
      <div className="notice row between" style={{ flexWrap: 'wrap', gap: 8 }}>
        <span>
          참여 방법은 세 가지예요. ① 연구단 코드 <b className="num">{p.code}</b>로 신청 → 총괄기관 승인 ② 플랫폼에 가입한 기관을 초대 → 상대가 수락 ③ <b>1회용 초대번호</b>를 보내면 입력하는 즉시 참여
        </span>
        {lead ? (
          <span className="row">
            <Btn a="inviteOrg" x={p.id} className="btn sm">
              기관 초대
            </Btn>
            <Btn a="invCode" x={p.id} className="btn sm primary">
              1회용 초대번호 만들기
            </Btn>
          </span>
        ) : null}
      </div>
      <div className="tw">
        <table>
          <thead>
            <tr>
              <th>구분</th>
              <th>기관</th>
              <th>등록번호</th>
              <th>역할</th>
              <th>상태</th>
              <th className="r">구성원</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {ps.map((q: any) => {
              const o = S.orgs[q.org];
              const n = peopleOf(p).filter((x: any) => x.org === q.org).length;
              const ed = lead && q.role !== '주관';
              return (
                <tr key={q.org}>
                  <td>
                    {ed ? (
                      <label>
                        <span hidden>{o.short} 구분</span>
                        <In as="select" id={`tier-${q.org}`} data-tier={`${p.id}|${q.org}`} style={{ width: 'auto' }} value={q.tier || '총괄'}>
                          {TIERS.map((t: string) => (
                            <option key={t}>{t}</option>
                          ))}
                        </In>
                      </label>
                    ) : (
                      q.tier || '총괄'
                    )}
                  </td>
                  <td>
                    {o.name}
                    {q.org === S.view ? (
                      <>
                        {' '}
                        <span className="chip">우리 기관</span>
                      </>
                    ) : null}
                    {q.msg ? (
                      <>
                        <br />
                        <span className="small muted">“{q.msg}”</span>
                      </>
                    ) : null}
                  </td>
                  <td className="num small">{o.number}</td>
                  <td>
                    {ed ? (
                      <label>
                        <span hidden>{o.short} 역할</span>
                        <In as="select" id={`prole-${q.org}`} data-prole={`${p.id}|${q.org}`} style={{ width: 'auto' }} value={q.role}>
                          {['세부주관', '참여'].map((t) => (
                            <option key={t}>{t}</option>
                          ))}
                        </In>
                      </label>
                    ) : (
                      roleName(q)
                    )}
                  </td>
                  <td>{q.status === '수락' ? <span className="chip good">참여 중</span> : q.status === '신청 중' ? <span className="chip warn">참여 신청 {q.reqDate ? fdate(q.reqDate) : ''}</span> : <span className="chip">초대 중</span>}</td>
                  <td className="r num">{q.status === '수락' ? n + '명' : '-'}</td>
                  <td className="r" style={{ whiteSpace: 'nowrap' }}>
                    {lead && q.status === '신청 중' ? (
                      <>
                        <Btn a="teamOk" x={`${p.id}|${q.org}`} className="btn sm primary">
                          승인
                        </Btn>{' '}
                        <Btn a="teamNo" x={`${p.id}|${q.org}`} className="btn sm">
                          거절
                        </Btn>
                      </>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="small muted">구분(총괄 · 1세부 · 2세부)과 역할(총괄주관 · 세부주관 · 참여)은 총괄기관이 정해요. 승인 전까지 신청 기관은 과제 내용을 볼 수 없어요.</p>
      {lead ? <InvList p={p} /> : null}
    </>
  );
}

function InvList({ p }: { p: any }) {
  const vs = p.invites || [];
  return (
    <section style={{ marginTop: 14 }}>
      <h3 className="h3">
        1회용 초대번호 <span className="small muted">{vs.filter((v: any) => invState(v) === 'ok').length}개 사용 가능</span>
      </h3>
      {vs.length ? (
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>초대번호</th>
                <th>구분 · 역할</th>
                <th>보낼 곳</th>
                <th>만든 날 · 만료</th>
                <th>상태</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {[...vs].reverse().map((v: any) => {
                const st = invState(v);
                return (
                  <tr key={v.code}>
                    <td className="num">
                      <b>{v.code}</b>
                    </td>
                    <td>
                      {v.tier} · {v.role}
                    </td>
                    <td className="small">{v.memo || '-'}</td>
                    <td className="num small">
                      {fdate(v.date)} · ~{fdate(v.exp)}
                    </td>
                    <td>
                      {st === 'used' ? (
                        <span className="chip good">
                          사용됨 · {S.orgs[v.used.org]?.short || ''} {fdate(v.used.date)}
                        </span>
                      ) : st === 'revoked' ? (
                        <span className="chip">폐기</span>
                      ) : st === 'expired' ? (
                        <span className="chip warn">만료</span>
                      ) : (
                        <span className="chip info">사용 가능</span>
                      )}
                    </td>
                    <td className="r" style={{ whiteSpace: 'nowrap' }}>
                      {st === 'ok' ? (
                        <>
                          <Btn a="invCopy" x={v.code} className="btn sm">
                            복사
                          </Btn>{' '}
                          <Btn a="invRevoke" x={`${p.id}|${v.code}`} className="btn sm">
                            폐기
                          </Btn>
                        </>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="small muted">아직 만든 초대번호가 없어요. 번호는 한 번 쓰면 바로 사용 처리돼요.</p>
      )}
    </section>
  );
}

/* ---------- 제안관리: 사업비 편성 ---------- */
function AlYearSeg({ p, withAll }: { p: any; withAll?: boolean }) {
  const ys = propYearsOf(p);
  const sel = alYear(p);
  const items: [number, string][] = [...(withAll ? [[-1, '전체 기간'] as [number, string]] : []), ...ys.map((y: any, i: number) => [i, y.no + '차년도'] as [number, string])];
  return (
    <div className="seg" role="group" aria-label="차년도">
      {items.map(([k, l]) => (
        <button key={k} type="button" data-a="alY" data-x={`${p.id}|${k}`} aria-pressed={sel === k}>
          {l}
        </button>
      ))}
    </div>
  );
}

function AllocTable({ p }: { p: any }) {
  const ys = propYearsOf(p);
  const lead = isLead(p);
  const os = sortParts(p.parts.filter((x: any) => x.status === '수락'));
  let i = alYear(p);
  if (i < 0) i = 0;
  const rows = os.map((q: any) => ({ q, al: allocOf(p, q.org, i), c: propCalc(p, q.org, i) }));
  const inp = (o: string, fk: string, v: unknown, lbl: string, step: number, ph: unknown) => (
    <label>
      <span hidden>{lbl}</span>
      <In id={`pal-${p.id}-${o}-${i}-${fk}`} type="number" step={step} data-pal={`${p.id}|${o}|${i}|${fk}`} value={v ?? ''} placeholder={String(ph ?? 0)} style={{ width: fk === 'G' ? 140 : 70, textAlign: 'right' }} />
    </label>
  );
  const sumG = sum(rows.map((r: any) => r.c.pr.G));
  const T = +p.govT?.[i] || 0;
  const left = T - sumG;
  return (
    <section className="card">
      <div className="row between" style={{ flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
        <div>
          <h3 className="h3" style={{ margin: 0 }}>
            연구단 사업비 배정 <span className="small muted">{ys[i].no}차년도 · 단위 원</span>
          </h3>
          <p className="small muted" style={{ margin: '2px 0 0' }}>
            {lead ? '기관마다 정부지원금, 기관부담 비율, 현금 비율을 정하면 현금·현물이 자동 계산돼요. 정한 값은 각 기관의 연구제안 관리 ① 재원 구성에 고정되고, 각 기관은 그 안에서 세부 비목을 짜요.' : '총괄기관이 정한 기관별 재원이에요. 우리 기관은 연구제안 관리에서 이 금액 안에서 세부 비목을 짜요.'}
          </p>
        </div>
        <AlYearSeg p={p} />
      </div>
      <div className="tw">
        <table style={{ whiteSpace: 'nowrap' }}>
          <thead>
            <tr>
              <th>기관</th>
              <th className="r">정부지원</th>
              <th className="r">기관부담 비율</th>
              <th className="r">현금 비율</th>
              <th className="r">기관부담 현금</th>
              <th className="r">현물</th>
              <th className="r">현금 합계</th>
              <th className="r">총 사업비</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ background: 'var(--sunk)' }}>
              <td>
                <b>공고 기준 정부지원 총액</b>
              </td>
              <td className="r">
                {lead ? (
                  <label>
                    <span hidden>{ys[i].no}차년도 연구단 정부지원 총액</span>
                    <In id={`pal-${p.id}-T-${i}`} type="number" step="1000000" data-pal={`${p.id}|_T|${i}`} value={p.govT?.[i] ?? ''} placeholder="0" style={{ width: 140, textAlign: 'right' }} />
                  </label>
                ) : (
                  <span className="num">{T ? won(T) : '-'}</span>
                )}
              </td>
              <td colSpan={7} className="small muted">
                {T ? (
                  <>
                    배정 {won(sumG)} · <b className={left < 0 ? 'err' : ''}>{left < 0 ? '초과 ' + won(-left) : '남은 금액 ' + won(left)}</b>
                  </>
                ) : (
                  '공고의 연구단 정부지원 총액을 넣으면 남은 금액을 알려 줘요.'
                )}
              </td>
            </tr>
            {rows.map(({ q, al, c }: any) => (
              <tr key={q.org}>
                <td>
                  {S.orgs[q.org].short} <span className="small muted">{partLabel(q)}</span>
                </td>
                <td className="r">{lead ? inp(q.org, 'G', al?.G ?? '', `${S.orgs[q.org].short} 정부지원`, 1000000, al ? 0 : c.pr.G.toLocaleString()) : <span className="num">{won(c.pr.G)}</span>}</td>
                <td className="r">
                  {lead ? (
                    <>
                      {inp(q.org, 'share', al?.share ?? '', `${S.orgs[q.org].short} 기관부담 비율`, 0.5, al ? 0 : c.pr.share)}%
                    </>
                  ) : (
                    <span className="num">{c.pr.share}%</span>
                  )}
                </td>
                <td className="r">
                  {lead ? (
                    <>
                      {inp(q.org, 'cashPct', al?.cashPct ?? '', `${S.orgs[q.org].short} 현금 비율`, 1, al ? 0 : c.pr.cashPct)}%
                    </>
                  ) : (
                    <span className="num">{c.pr.cashPct}%</span>
                  )}
                </td>
                <td className="r num">{eok(c.Bc)}</td>
                <td className="r num">{eok(c.Bk)}</td>
                <td className="r num">{eok(c.cashT)}</td>
                <td className="r num">
                  <b>{eok(c.T)}</b>
                </td>
                <td>{al ? <span className="chip good">배정</span> : <span className="chip warn">미배정</span>}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td>연구단 합계</td>
              <td className="r num">{eok(sumG)}</td>
              <td />
              <td />
              <td className="r num">{eok(sum(rows.map((r: any) => r.c.Bc)))}</td>
              <td className="r num">{eok(sum(rows.map((r: any) => r.c.Bk)))}</td>
              <td className="r num">{eok(sum(rows.map((r: any) => r.c.cashT)))}</td>
              <td className="r num">
                <b>{eok(sum(rows.map((r: any) => r.c.T)))}</b>
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
      {lead ? (
        <p className="small muted" style={{ margin: '6px 0 0' }}>
          미배정 기관의 흐린 숫자는 그 기관이 직접 넣은 값이에요. 세 칸 중 하나라도 넣으면 ‘배정’이 되고 그 기관은 재원을 고칠 수 없어요.
        </p>
      ) : null}
    </section>
  );
}

function BudgetStatus({ p }: { p: any }) {
  const ys = propYearsOf(p);
  const sel = alYear(p);
  const os = sortParts(p.parts.filter((x: any) => x.status === '수락'));
  const rows = os.map((q: any) => {
    const cs = sel >= 0 ? [propCalc(p, q.org, sel)] : ys.map((_y: any, i: number) => propCalc(p, q.org, i));
    const f = (k: string) => sum(cs.map((c: any) => c[k]));
    return { q, fixed: sel >= 0 ? !!allocOf(p, q.org, sel) : ys.some((_y: any, i: number) => allocOf(p, q.org, i)), aC: f('cashT'), aK: f('kindT'), C: f('C'), K: f('K') };
  });
  const left = (a: number, b: number) => {
    const d = a - b;
    return <span className={`num ${d < 0 ? 'err' : d > 0 ? '' : 'good'}`}>{d < 0 ? '초과 ' + eok(-d) : d > 0 ? eok(d) : '0'}</span>;
  };
  const tot = (k: string) => sum(rows.map((r: any) => r[k]));
  return (
    <section className="card" style={{ marginTop: 14 }}>
      <div className="row between" style={{ flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
        <div>
          <h3 className="h3" style={{ margin: 0 }}>
            기관별 편성 현황
          </h3>
          <p className="small muted" style={{ margin: '2px 0 0' }}>
            정해진 재원(배정)과 각 기관이 비목에 넣은 금액(편성)을 비교해요. 남은 금액이 0이 되면 편성 완료예요.
          </p>
        </div>
        <AlYearSeg p={p} withAll />
      </div>
      <div className="tw">
        <table style={{ whiteSpace: 'nowrap' }}>
          <thead>
            <tr>
              <th rowSpan={2}>기관</th>
              <th colSpan={3} className="r" style={{ textAlign: 'center' }}>
                현금
              </th>
              <th colSpan={3} className="r" style={{ textAlign: 'center' }}>
                현물
              </th>
              <th rowSpan={2}>상태</th>
            </tr>
            <tr>
              <th className="r">배정</th>
              <th className="r">편성</th>
              <th className="r">남은 금액</th>
              <th className="r">배정</th>
              <th className="r">편성</th>
              <th className="r">남은 금액</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r: any) => {
              const ok = r.aC === r.C && r.aK === r.K;
              const over = r.C > r.aC || r.K > r.aK;
              return (
                <tr key={r.q.org}>
                  <td>
                    {S.orgs[r.q.org].short}
                    {r.q.org === S.view ? (
                      <>
                        {' '}
                        <span className="chip">우리 기관</span>
                      </>
                    ) : null}
                    {r.fixed ? null : <span className="small muted"> · 자체 재원</span>}
                  </td>
                  <td className="r num">{eok(r.aC)}</td>
                  <td className="r num">{eok(r.C)}</td>
                  <td className="r">{left(r.aC, r.C)}</td>
                  <td className="r num">{eok(r.aK)}</td>
                  <td className="r num">{eok(r.K)}</td>
                  <td className="r">{left(r.aK, r.K)}</td>
                  <td>{ok ? <span className="chip good">완료</span> : over ? <span className="chip bad">초과</span> : <span className="chip warn">작성 중</span>}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td>연구단 합계</td>
              <td className="r num">{eok(tot('aC'))}</td>
              <td className="r num">{eok(tot('C'))}</td>
              <td className="r">{left(tot('aC'), tot('C'))}</td>
              <td className="r num">{eok(tot('aK'))}</td>
              <td className="r num">{eok(tot('K'))}</td>
              <td className="r">{left(tot('aK'), tot('K'))}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}

function PropItemTable({ p }: { p: any }) {
  const ys = propYearsOf(p);
  const sel = S.tiY?.[p.id] ?? -1;
  const cs = sortParts(p.parts.filter((x: any) => x.status === '수락')).map((q: any) => {
    const t = propTotal(p, q.org);
    const cc = sel >= 0 ? [t.cs[sel]] : t.cs;
    const by: Record<string, number> = {};
    cc.forEach((c: any) =>
      c.rows.forEach((r: any) => {
        by[r.i] = (by[r.i] || 0) + r.c + r.k;
      }),
    );
    return { q, by, T: sum(Object.values(by)) };
  });
  const its = ITEMS.filter((i: string) => cs.some((x: any) => x.by[i]));
  const items: [number, string][] = [[-1, '전체 기간'], ...ys.map((y: any, i: number) => [i, y.no + '차년도'] as [number, string])];
  return (
    <section className="card" style={{ marginTop: 14 }}>
      <div className="row between" style={{ flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
        <h3 className="h3" style={{ margin: 0 }}>
          기관별 비목별 편성 <span className="small muted">현금+현물 · 단위 원</span>
        </h3>
        <div className="seg" role="group" aria-label="차년도">
          {items.map(([k, l]) => (
            <button key={k} type="button" data-a="tiY" data-x={`${p.id}|${k}`} aria-pressed={sel === k}>
              {l}
            </button>
          ))}
        </div>
      </div>
      <div className="tw">
        <table style={{ whiteSpace: 'nowrap' }}>
          <thead>
            <tr>
              <th>기관</th>
              {its.map((i: string) => (
                <th key={i} className="r">
                  {i}
                </th>
              ))}
              <th className="r">합계</th>
            </tr>
          </thead>
          <tbody>
            {cs.map((x: any) => (
              <tr key={x.q.org}>
                <td>
                  {S.orgs[x.q.org].short} <span className="small muted">{partLabel(x.q)}</span>
                  {x.q.org === S.view ? (
                    <>
                      {' '}
                      <span className="chip">우리 기관</span>
                    </>
                  ) : null}
                </td>
                {its.map((i: string) => (
                  <td key={i} className="r num">
                    {x.by[i] ? eok(x.by[i]) : '-'}
                  </td>
                ))}
                <td className="r num">
                  <b>{eok(x.T)}</b>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td>연구단 합계</td>
              {its.map((i: string) => (
                <td key={i} className="r num">
                  {eok(sum(cs.map((x: any) => x.by[i] || 0)))}
                </td>
              ))}
              <td className="r num">
                <b>{eok(sum(cs.map((x: any) => x.T)))}</b>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}

export function TeamBudget({ p }: { p: any }) {
  return (
    <>
      <div className="notice row between" style={{ flexWrap: 'wrap', gap: 8 }}>
        <span>총괄기관이 기관별 정부지원 배정액을 정하면, 각 기관은 연구제안 관리에서 자기 기관 예산만 편성해요. 여기에는 그 결과가 모여요.</span>
        {part(p, S.view)?.status === '수락' ? (
          <Btn a="propOpen" x={p.id} className="btn sm primary">
            우리 기관 예산 편성하기
          </Btn>
        ) : null}
      </div>
      <AllocTable p={p} />
      <BudgetStatus p={p} />
      <PropItemTable p={p} />
    </>
  );
}

/* ---------- 제안관리: 성과 목표 ---------- */
export function TeamGoalProp({ p }: { p: any }) {
  const lead = isLead(p);
  const os = perfOrgs(p);
  const v = S.pgOrgP?.[p.id];
  const sel = v === 'all' || os.includes(v) ? v : 'all';
  const items: [string, string][] = [['all', '연구단 합계'], ...os.map((o: string) => [o, S.orgs[o].short + (o === S.view ? ' (우리)' : '')] as [string, string])];
  let foot: ReactNode = null;
  if (sel === 'all')
    foot = (
      <p className="small muted" style={{ margin: '6px 0 0' }}>
        {lead ? `기관별 목표: ${os.map((o: string) => `${S.orgs[o].short} ${sum(goalsOf(p).map((g: any) => goalT(p, g, null, o)))}건`).join(' · ')}` : '합계는 모든 기관 목표를 더한 값이에요.'}
      </p>
    );
  return (
    <>
      <div className="row between" style={{ marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
        <p className="small muted" style={{ margin: 0 }}>
          제안서에 넣을 차년도별 성과 목표예요. 각 기관이 자기 기관 탭에서 목표를 넣으면 연구단 합계에 바로 더해져요. {lead ? '총괄기관은 모든 기관 목표를 고칠 수 있어요.' : '다른 기관 목표는 그 기관과 총괄기관만 고쳐요.'}
        </p>
        {canGoal(p) ? (
          <Btn a="perfGoalNew" x={p.id} className="btn sm">
            + 성과 목표
          </Btn>
        ) : null}
      </div>
      <div className="seg" role="group" aria-label="보기" style={{ marginBottom: 10, flexWrap: 'wrap' }}>
        {items.map(([k, l]) => (
          <button key={k} type="button" data-a="pgOrgP" data-x={`${p.id}|${k}`} aria-pressed={sel === k}>
            {l}
          </button>
        ))}
      </div>
      <section className="card">
        <h3 className="h3">{sel === 'all' ? '연구단 합계 목표' : `${S.orgs[sel].short} 성과 목표`}</h3>
        <PerfGoalTable p={p} plan simple sel={sel} />
        {foot}
      </section>
    </>
  );
}

// 연구단 편성 현황 표는 연구제안 화면과 같은 부품을 써요.
export { PropTable };

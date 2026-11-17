// 성과관리 부품: 기관 선택, 목표 표(기관별/전체), 실적 표, 기관별 막대그래프, 성과관리 화면
import type { CSSProperties } from 'react';
import { S, useS } from '../../core/state';
import { isLead, part, partLabel, sortParts, orgColor } from '../../core/org';
import { curY } from '../../core/budget';
import { canGoal, canPerfOrg, goalName, goalT, goalsOf, outYear, perfDone, perfOrgs, perfSel, perfYears } from '../../core/perf';
import { fdate, sum } from '../../core/util';
import { Btn, In, LinkBtn, Meter } from '../../ui/primitives';

const Rate = ({ pc, has }: { pc: number; has: boolean }) => (
  <td>
    <Meter pct={Math.min(100, pc)} color={pc >= 100 ? 'var(--good)' : undefined} style={{ marginTop: 0 }} />
    <span className={`small ${pc >= 100 ? 'good' : 'muted'}`}>{has ? pc + '%' : '목표 없음'}</span>
  </td>
);

/** 총괄기관이 보는 기관 선택 버튼 (참여기관에는 안내 문구만) */
export function PerfOrgBar({ p }: { p: any }) {
  if (!p.consortium) return null;
  const sel = perfSel(p);
  const os = perfOrgs(p);
  if (!isLead(p))
    return (
      <p className="small muted" style={{ margin: '0 0 8px' }}>
        우리 기관({S.orgs[S.view].short}) 성과만 보여요. 다른 기관 성과는 총괄기관만 봐요.
      </p>
    );
  const items: [string, string][] = [['all', '연구단 전체'], ...os.map((o: string) => [o, S.orgs[o].short + (o === S.view ? ' (우리)' : '')] as [string, string])];
  return (
    <div className="seg" role="group" aria-label="기관 선택" style={{ marginBottom: 10, flexWrap: 'wrap' }}>
      {items.map(([k, l]) => (
        <button key={k} type="button" data-a="pgOrg" data-x={`${p.id}|${k}`} aria-pressed={sel === k}>
          {l}
        </button>
      ))}
    </div>
  );
}

/** 성과 목표 표. sel이 'all'이면 기관별로 묶은 표, 기관이면 그 기관 목표(고칠 수 있으면 입력칸) */
export function PerfGoalTable({ p, plan, simple, sel: sel0 }: { p: any; plan?: boolean; simple?: boolean; sel?: string }) {
  const ys = perfYears(p);
  const gs = goalsOf(p);
  const cy = p.phase !== '제안' ? curY(p)?.no : null;
  const sel = sel0 ?? perfSel(p);
  const org = sel === 'all' ? null : sel;
  if (!org && gs.length && !simple) return <PerfAllTable p={p} plan={plan} />;
  const edit = org && canPerfOrg(p, org);
  const del = isLead(p) || !p.consortium;
  if (!gs.length)
    return (
      <p className="small muted">
        아직 성과 목표가 없어요.{canGoal(p) ? ' ‘+ 성과 목표’로 논문·특허·SW 등록 같은 목표를 넣어 주세요.' : ''}
      </p>
    );
  return (
    <>
      <div className="tw">
        <table className="perf">
          <thead>
            <tr>
              <th>성과</th>
              <th>단위</th>
              {ys.map((y: any) => (
                <th key={y.no} className={`r ${y.no === cy ? 'cur' : ''}`}>
                  {y.no}차년도
                  {y.no === cy ? (
                    <>
                      {' '}
                      <span className="chip info">진행</span>
                    </>
                  ) : null}
                </th>
              ))}
              <th className="r">전체 목표</th>
              {plan ? null : (
                <>
                  <th className="r">실적</th>
                  <th style={{ minWidth: 120 }}>달성률</th>
                </>
              )}
              {del ? <th /> : null}
            </tr>
          </thead>
          <tbody>
            {gs.map((g: any) => {
              const tot = goalT(p, g, null, org);
              const done = perfDone(p, g, null, org);
              const pc = tot ? Math.round((done / tot) * 100) : 0;
              return (
                <tr key={g.id}>
                  <td>
                    <b>{goalName(g)}</b>
                  </td>
                  <td className="small muted">{g.unit}</td>
                  {ys.map((y: any) => {
                    const v = goalT(p, g, y.no, org);
                    const d = plan ? 0 : perfDone(p, g, y.no, org);
                    return (
                      <td key={y.no} className={`r ${y.no === cy ? 'cur' : ''}`}>
                        {edit ? (
                          <label>
                            <span hidden>
                              {goalName(g)} {y.no}차년도 목표
                            </span>
                            <In id={`pg-${p.id}-${g.id}-${y.no}`} type="number" min="0" data-pg={`${p.id}|${g.id}|${y.no}|${org}`} value={v || ''} placeholder="0" style={{ width: 64, textAlign: 'right' }} />
                          </label>
                        ) : (
                          <span className="num">{v || '-'}</span>
                        )}
                        {plan ? null : <div className={`small ${d >= v && v ? 'good' : 'muted'}`}>실적 {d}</div>}
                      </td>
                    );
                  })}
                  <td className="r num">
                    <b>{tot}</b>
                  </td>
                  {plan ? null : (
                    <>
                      <td className="r num">
                        <b>{done}</b>
                      </td>
                      <Rate pc={pc} has={!!tot} />
                    </>
                  )}
                  {del ? (
                    <td className="r">
                      <Btn a="perfGoalDel" x={`${p.id}|${g.id}`} className="btn sm" aria-label={`${goalName(g)} 목표 삭제`}>
                        삭제
                      </Btn>
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {p.consortium ? (
        <p className="small muted" style={{ margin: '6px 0 0' }}>
          {org ? `${S.orgs[org].short} 목표예요. ${edit ? '칸에 숫자를 넣으면 바로 저장돼요.' : ''}` : '모든 기관 목표의 합계예요. 기관을 고르면 그 기관 목표를 고칠 수 있어요.'} 목표는 각 기관이 정하고, 총괄기관은 모든 기관 목표를 고칠 수 있어요.
        </p>
      ) : null}
    </>
  );
}

/** 연구단 전체: 기관별로 묶은 목표·실적 표 */
function PerfAllTable({ p, plan }: { p: any; plan?: boolean }) {
  const ys = perfYears(p);
  const gs = goalsOf(p);
  const cy = p.phase !== '제안' ? curY(p)?.no : null;
  const os = perfOrgs(p);
  const span = ys.length + (plan ? 2 : 3);
  const cell = (g: any, y: number, o: string | null) => {
    const t = goalT(p, g, y, o);
    const d = plan ? 0 : perfDone(p, g, y, o);
    if (plan) return <span className="num">{t || '-'}</span>;
    return t || d ? (
      <span className={`num ${d >= t && t ? 'good' : ''}`}>
        {d} / {t}
      </span>
    ) : (
      <span className="muted">-</span>
    );
  };
  const line = (g: any, o: string | null, strong?: boolean) => {
    const t = goalT(p, g, null, o);
    const d = perfDone(p, g, null, o);
    const pc = t ? Math.round((d / t) * 100) : 0;
    return (
      <tr key={g.id + (o || 'all')}>
        <td style={{ paddingLeft: strong ? 8 : 26 }}>{strong ? <b>{goalName(g)}</b> : goalName(g)}</td>
        {ys.map((y: any) => (
          <td key={y.no} className={`r ${y.no === cy ? 'cur' : ''}`}>
            {cell(g, y.no, o)}
          </td>
        ))}
        <td className="r num">
          <b>{plan ? t : `${d} / ${t}`}</b>
        </td>
        {plan ? null : <Rate pc={pc} has={!!t} />}
      </tr>
    );
  };
  return (
    <>
      <div className="tw">
        <table className="perf">
          <thead>
            <tr>
              <th>기관 / 성과</th>
              {ys.map((y: any) => (
                <th key={y.no} className={`r ${y.no === cy ? 'cur' : ''}`}>
                  {y.no}차년도
                </th>
              ))}
              <th className="r">{plan ? '전체 목표' : '실적 / 목표'}</th>
              {plan ? null : <th style={{ minWidth: 120 }}>달성률</th>}
            </tr>
          </thead>
          <tbody>
            {os.map((o: string) => {
              const q = part(p, o);
              const mine = gs.filter((g: any) => goalT(p, g, null, o) || perfDone(p, g, null, o));
              const T = sum(mine.map((g: any) => goalT(p, g, null, o)));
              const D = sum(mine.map((g: any) => Math.min(perfDone(p, g, null, o), goalT(p, g, null, o))));
              return [
                <tr key={'h' + o} style={{ background: 'var(--sunk)', ['--oc' as string]: orgColor(p, o) } as CSSProperties}>
                  <td colSpan={span}>
                    <span className="odot" />
                    <b>{S.orgs[o].short}</b> <span className="small muted">{partLabel(q)}</span>
                    {plan ? null : <span className="small"> · 달성 {T ? Math.round((D / T) * 100) : 0}%</span>}
                    {canPerfOrg(p, o) ? (
                      <>
                        {' '}
                        <LinkBtn a="pgOrg" x={`${p.id}|${o}`} className="linkbtn small">
                          목표 고치기
                        </LinkBtn>
                      </>
                    ) : null}
                  </td>
                </tr>,
                mine.length ? (
                  mine.map((g: any) => line(g, o))
                ) : (
                  <tr key={'e' + o}>
                    <td colSpan={span} className="small muted" style={{ paddingLeft: 26 }}>
                      목표·실적이 없어요
                    </td>
                  </tr>
                ),
              ];
            })}
            <tr style={{ background: 'var(--sunk)' }}>
              <td colSpan={span}>
                <b>연구단 합계</b>
              </td>
            </tr>
            {gs.map((g: any) => line(g, null, true))}
          </tbody>
        </table>
      </div>
      <p className="small muted" style={{ margin: '6px 0 0' }}>
        {plan ? '칸의 숫자는 목표예요.' : '칸의 숫자는 실적 / 목표예요.'} 기관 이름 옆 ‘목표 고치기’를 누르면 그 기관 목표를 고칠 수 있어요.
      </p>
    </>
  );
}

/** 등록된 성과 실적 목록 */
export function PerfOutTable({ p }: { p: any }) {
  const ys = perfYears(p);
  const yf = S.perfY || 'all';
  const sel = perfSel(p);
  let os = [...(p.outputs || [])].filter((o: any) => perfOrgs(p).includes(o.org) && (sel === 'all' || o.org === sel)).sort((a: any, b: any) => b.date.localeCompare(a.date));
  if (yf !== 'all') os = os.filter((o: any) => outYear(p, o) === +yf);
  const items: [string, string][] = [['all', '전체'], ...ys.map((y: any) => [String(y.no), y.no + '차년도'] as [string, string])];
  return (
    <>
      <div className="seg" role="group" aria-label="차년도" style={{ marginBottom: 8 }}>
        {items.map(([k, l]) => (
          <button key={k} type="button" data-a="perfY" data-x={k} aria-pressed={yf === k}>
            {l}
          </button>
        ))}
      </div>
      {os.length ? (
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>일자</th>
                <th>차년도</th>
                <th>성과</th>
                <th>성과명</th>
                <th>번호·학술지 등</th>
                {p.consortium ? <th>기관</th> : null}
                <th className="r">수량</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {os.map((o: any) => (
                <tr key={o.id}>
                  <td className="num small">{fdate(o.date)}</td>
                  <td className="small">{outYear(p, o)}차</td>
                  <td>
                    <span className="chip">{o.kind === '기타' && o.label ? o.label : o.kind}</span>
                  </td>
                  <td>{o.title}</td>
                  <td className="small muted">{o.note || ''}</td>
                  {p.consortium ? <td className="small">{S.orgs[o.org]?.short || ''}</td> : null}
                  <td className="r num">
                    {o.qty || 1}
                    {o.kind === '사업화 매출' ? ' 백만원' : ''}
                  </td>
                  <td className="r">
                    {canPerfOrg(p, o.org) ? (
                      <Btn a="perfOutDel" x={`${p.id}|${o.id}`} className="btn sm">
                        삭제
                      </Btn>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="small muted">등록된 성과가 없어요.</p>
      )}
    </>
  );
}

/** 총괄기관에만 보이는 기관별 목표 대비 실적 */
export function PerfOrgTable({ p }: { p: any }) {
  const gs = goalsOf(p);
  const ps = sortParts(p.parts.filter((x: any) => x.status === '수락'));
  if (!gs.length || !isLead(p)) return null;
  return (
    <section className="card">
      <h3 className="h3">기관별 목표 대비 실적 (전체 기간)</h3>
      <div className="tw">
        <table>
          <thead>
            <tr>
              <th>기관</th>
              {gs.map((g: any) => (
                <th key={g.id} className="r">
                  {goalName(g)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ps.map((q: any) => (
              <tr key={q.org}>
                <td>
                  {S.orgs[q.org].short} <span className="small muted">{partLabel(q)}</span>
                </td>
                {gs.map((g: any) => {
                  const t = goalT(p, g, null, q.org);
                  const d = perfDone(p, g, null, q.org);
                  return (
                    <td key={g.id} className="r num">
                      {t || d ? `${d} / ${t}` : '-'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="small muted" style={{ margin: '6px 0 0' }}>
        실적 / 목표 · 총괄기관에만 보여요.
      </p>
    </section>
  );
}

/** 기관별 성과 막대그래프 (차년도·성과 종류 선택) */
export function PerfBars({ p }: { p: any }) {
  const gs = goalsOf(p);
  if (!gs.length) return null;
  const ys = perfYears(p);
  const cy = curY(p)?.no || 1;
  const yno = +S.pbY?.[p.id]?.y || cy;
  const gid = S.pbY?.[p.id]?.g;
  const g = gs.find((x: any) => x.id === gid) || gs[0];
  const ps = sortParts(p.parts.filter((x: any) => x.status === '수락' && perfOrgs(p).includes(x.org)));
  const vals = ps.map((q: any) => ({ q, v: perfDone(p, g, yno, q.org), t: goalT(p, g, yno, q.org) }));
  const tot = perfDone(p, g, yno);
  const tgt = goalT(p, g, yno);
  const mx = Math.max(1, tgt, tot, ...vals.map((x: any) => Math.max(x.v, x.t))) * 1.1;
  const bar = (key: string, label: string, sub: string, v: number, t: number, strong?: boolean, oc?: string) => (
    <div key={key} className="pb-row" title={`${label} · ${yno}차년도 ${goalName(g)} 실적 ${v}${g.unit}${t ? ` / 목표 ${t}${g.unit}` : ''}`}>
      <span className="pb-l">
        {strong ? <b>{label}</b> : label}
        {sub ? <span className="small muted"> {sub}</span> : null}
      </span>
      <span className="pb-t" style={(oc ? { ['--oc' as string]: oc } : {}) as CSSProperties}>
        {v ? <i style={{ width: `${Math.max(2, (v / mx) * 100)}%`, ...(oc ? { background: 'var(--oc)' } : {}) }} /> : null}
        {t ? <em style={{ left: `${(t / mx) * 100}%` }} aria-hidden="true" /> : null}
      </span>
      <span className="pb-v num">
        {v}
        {t ? <span className="muted">/{t}</span> : null}
        {g.unit}
      </span>
    </div>
  );
  return (
    <section className="card">
      <div className="row between" style={{ flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        <div>
          <h3 className="h3" style={{ margin: 0 }}>
            {isLead(p) ? '기관별 성과' : '우리 기관 성과'} · {yno}차년도
          </h3>
          <p className="small muted" style={{ margin: '2px 0 0' }}>
            성과를 등록·저장하면 바로 반영돼요. 등록 날짜로 차년도를 나눠요.
          </p>
        </div>
        <div className="row" style={{ gap: 6 }}>
          <label>
            <span hidden>차년도</span>
            <In as="select" id={`pb-y-${p.id}`} data-pby={`${p.id}|y`} style={{ width: 'auto' }} value={yno}>
              {ys.map((y: any) => (
                <option key={y.no} value={y.no}>
                  {y.no}차년도{y.no === cy ? ' (진행)' : ''}
                </option>
              ))}
            </In>
          </label>
          <label>
            <span hidden>성과 종류</span>
            <In as="select" id={`pb-g-${p.id}`} data-pby={`${p.id}|g`} style={{ width: 'auto' }} value={g.id}>
              {gs.map((x: any) => (
                <option key={x.id} value={x.id}>
                  {goalName(x)}
                </option>
              ))}
            </In>
          </label>
        </div>
      </div>
      <div className="pb">
        {bar('all', '연구단 합계', tgt ? `달성 ${Math.round((tot / tgt) * 100)}%` : '', tot, tgt, true)}
        {vals.map((x: any) => bar(x.q.org, S.orgs[x.q.org].short, partLabel(x.q) + (x.t ? ` · ${Math.round((x.v / x.t) * 100)}%` : ''), x.v, x.t, false, orgColor(p, x.q.org)))}
      </div>
      <p className="small muted" style={{ margin: '8px 0 0' }}>
        <span className="pb-key" aria-hidden="true" /> 세로선은 그 기관의 이 차년도 목표예요. 숫자는 실적/목표예요.
      </p>
      <details style={{ marginTop: 8 }}>
        <summary className="small">표로 보기</summary>
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>기관</th>
                <th className="r">목표</th>
                <th className="r">실적</th>
              </tr>
            </thead>
            <tbody>
              {vals.map((x: any) => (
                <tr key={x.q.org}>
                  <td>{S.orgs[x.q.org].short}</td>
                  <td className="r num">{x.t}</td>
                  <td className="r num">{x.v}</td>
                </tr>
              ))}
              <tr>
                <td>
                  <b>연구단 합계</b>
                </td>
                <td className="r num">
                  <b>{tgt}</b>
                </td>
                <td className="r num">
                  <b>{tot}</b>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}

/** 연구행정 관리 → 과제 → 성과관리 화면 */
export function PerfPage({ p }: { p: any }) {
  useS();
  const gs = goalsOf(p);
  const sel = perfSel(p);
  const org = sel === 'all' ? null : sel;
  const tot = sum(gs.map((g: any) => goalT(p, g, null, org)));
  const done = sum(gs.map((g: any) => Math.min(perfDone(p, g, null, org), goalT(p, g, null, org))));
  return (
    <>
      <div className="page-head">
        <div>
          <h2>{p.short} 성과관리</h2>
          <p className="small muted">
            {p.year || ''} · 목표 {gs.length}종 · {org ? S.orgs[org].short + ' ' : '연구단 '}달성 {tot ? Math.round((done / tot) * 100) : 0}%
          </p>
        </div>
        <div className="row">
          {canGoal(p) ? (
            <Btn a="perfGoalNew" x={p.id}>
              + 성과 목표
            </Btn>
          ) : null}
          {canGoal(p) && p.phase !== '제안' ? (
            <Btn a="perfOutNew" x={p.id} className="btn primary">
              + 성과 등록
            </Btn>
          ) : null}
        </div>
      </div>
      <PerfOrgBar p={p} />
      <section className="card">
        <h3 className="h3">성과 목표 · 달성 현황</h3>
        <PerfGoalTable p={p} />
        <p className="small muted">실적은 아래에 등록한 성과를 종류별로 세요. 날짜로 차년도를 나눠요.</p>
      </section>
      <section className="card">
        <h3 className="h3">성과 실적</h3>
        <PerfOutTable p={p} />
      </section>
      {p.consortium ? <PerfOrgTable p={p} /> : null}
    </>
  );
}

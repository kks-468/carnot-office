// 연구제안 관리: 제안 과제 목록과 우리 기관 편성(재원 · 인건비 · 비목 · 성과 목표)
import type { ReactNode } from 'react';
import { useS, S } from '../../core/state';
import { ITEMS, PRESET } from '../../core/catalog';
import { byTeam, isLead, joined, part, partLabel } from '../../core/org';
import { totRate } from '../../core/budget';
import { payYears } from '../../core/pay';
import { allocOf, propCalc, propTotal, propYearsOf, yMonths } from '../../core/proposal';
import { canGoal } from '../../core/perf';
import { eok, fdate, sum, won } from '../../core/util';
import { Btn, In, LinkBtn } from '../../ui/primitives';
import { TeamChips } from '../../ui/TeamChips';
import { PerfGoalTable, PerfOrgBar } from '../perf/Perf';
import { PropTable } from './PropParts';

export function ProposalPage() {
  const S = useS();
  const all = S.projects.filter((p: any) => joined(p, S.view) && p.phase === '제안');
  const p = S.propSel && all.find((x: any) => x.id === S.propSel);
  if (p) return <PropDetail p={p} />;
  const list = byTeam(all);
  return (
    <>
      <div className="page-head">
        <div>
          <h2>연구제안 관리</h2>
          <p className="small muted">제안 단계 과제의 재원(정부지원 · 기관부담 현금 · 현물)과 비목별 예산을 짜요. 인건비는 직원·급여 설정과 참여율로 자동 계산돼요. 선정되면 그대로 연구행정 관리로 넘어가요.</p>
        </div>
        <Btn a="newProposal" className="btn primary">
          + 새 제안 과제
        </Btn>
      </div>
      <TeamChips list={all} />
      {list.length ? (
        <div className="cards">
          {list.map((q: any) => {
            const c = propTotal(q, S.view);
            const mp = part(q, S.view);
            return (
              <Btn key={q.id} a="propOpen" x={q.id} className="pcard">
                <div className="row between">
                  <span className="chip org">{partLabel(mp)}</span>
                  {c.ok ? <span className="chip good">편성 완료</span> : <span className="chip warn">작성 중</span>}
                </div>
                <h3>{q.name}</h3>
                <dl className="kv">
                  <dt>공고</dt>
                  <dd>{q.call || '-'}</dd>
                  <dt>부처명</dt>
                  <dd>{q.ministry}</dd>
                  <dt>사업기간</dt>
                  <dd>
                    {fdate(q.start)}~{fdate(q.end)}
                  </dd>
                  <dt>제안 마감</dt>
                  <dd>{q.due ? fdate(q.due) : '-'}</dd>
                  <dt>연구기간</dt>
                  <dd>총 {propYearsOf(q).length}차년도</dd>
                  <dt>우리 기관 전체</dt>
                  <dd className="num">{won(c.T)}</dd>
                </dl>
                <span className="small muted num">
                  참여기관 {q.parts.filter((x: any) => x.status === '수락').length}곳 · 현금 {eok(c.cashT)} · 현물 {eok(c.kindT)}
                </span>
              </Btn>
            );
          })}
        </div>
      ) : (
        <div className="notice">제안 중인 과제가 없어요. ‘+ 새 제안 과제’로 시작해 보세요.</div>
      )}
    </>
  );
}

function PropYearBar({ p }: { p: any }) {
  const ys = propYearsOf(p);
  const cur = S.propYr ?? 0;
  const lead = isLead(p);
  return (
    <div className="card" style={{ padding: '12px 14px', marginBottom: 14 }}>
      <div className="row between" style={{ flexWrap: 'wrap', gap: 8 }}>
        <div className="row" role="tablist" aria-label="연차 선택" style={{ flexWrap: 'wrap' }}>
          {ys.map((y: any, i: number) => {
            const ok = propCalc(p, S.view, i).ok;
            return (
              <Btn key={i} a="propYr" x={i} className={`btn sm ${cur === i ? 'primary' : ''}`} aria-pressed={cur === i}>
                {y.no}차년도 {ok ? '✓' : ''}
              </Btn>
            );
          })}
          <Btn a="propYr" x={-1} className={`btn sm ${cur === -1 ? 'primary' : ''}`} aria-pressed={cur === -1}>
            전체 기간 합계
          </Btn>
        </div>
        <div className="row">
          <span className="small muted">총 {ys.length}차년도</span>
          {lead ? (
            <>
              <Btn a="propYrAdd" x={p.id} className="btn sm" disabled={ys.length >= 9}>
                + 차년도 추가
              </Btn>
              {ys.length > 1 ? (
                <Btn a="propYrDel" x={p.id} className="btn sm">
                  {cur >= 0 ? ys[cur].no : ys.length}차년도 삭제
                </Btn>
              ) : null}
            </>
          ) : null}
          {cur > 0 ? (
            <Btn a="propCopyPrev" className="btn sm">
              {cur}차년도 값 복사
            </Btn>
          ) : null}
        </div>
      </div>
      {cur >= 0 ? (
        <div className="row small" style={{ marginTop: 8, gap: 6 }}>
          <span className="muted">{ys[cur].no}차년도 기간</span>
          {lead ? (
            <>
              <label>
                <span hidden>시작일</span>
                <In id="pyd-s" type="date" data-pyd={`${p.id}|${cur}|start`} value={ys[cur].start} style={{ width: 'auto' }} />
              </label>
              ~
              <label>
                <span hidden>종료일</span>
                <In id="pyd-e" type="date" data-pyd={`${p.id}|${cur}|end`} value={ys[cur].end} style={{ width: 'auto' }} />
              </label>
            </>
          ) : (
            `${fdate(ys[cur].start)}~${fdate(ys[cur].end)}`
          )}
          <span className="muted">· {yMonths(ys[cur])}개월</span>
        </div>
      ) : null}
    </div>
  );
}

function PayYrCtl({ p, c }: { p: any; c: any }) {
  const q = part(p, S.view);
  const pr = q.prop || {};
  const ys = payYears();
  const i = c.yi;
  const r = c.pyr;
  return (
    <div className="row" style={{ flexWrap: 'wrap', gap: 8, margin: '6px 0 2px' }}>
      <label className="row" htmlFor={`ppb-${p.id}`} style={{ gap: 6 }}>
        <span className="small muted">1차년도 인건비 기준연도</span>
        <In as="select" id={`ppb-${p.id}`} data-ppb={p.id} style={{ width: 'auto' }} value={pr.payBase ? String(+pr.payBase) : ''}>
          <option value="">자동 (차년도 시작 연도)</option>
          {ys.map((y: number) => (
            <option key={y} value={y}>
              {y}년 → {y}·{y + 1}·{y + 2}…
            </option>
          ))}
        </In>
      </label>
      <label className="row" htmlFor={`pyp-${p.id}`} style={{ gap: 6 }}>
        <span className="small muted">{c.py.no}차년도 적용</span>
        <In as="select" id={`pyp-${p.id}`} data-pyp={`${p.id}|${i}`} style={{ width: 'auto' }} value={pr.years?.[i]?.payYr ? String(+pr.years[i].payYr) : ''}>
          <option value="">{r.how === '직접' ? '연차대로' : `연차대로 (${r.want}년)`}</option>
          {ys.map((y: number) => (
            <option key={y} value={y}>
              {y}년 급여표
            </option>
          ))}
        </In>
      </label>
      {r.ok ? (
        <span className="chip good">{r.yr}년 급여표 적용</span>
      ) : (
        <span className="chip warn">
          {r.want}년 급여표가 없어 {r.yr}년 적용 · 직원·급여에서 {r.want}년을 추가해 주세요
        </span>
      )}
    </div>
  );
}

function PropSummary({ p }: { p: any }) {
  const t = propTotal(p, S.view);
  const ys = propYearsOf(p);
  return (
    <>
      <div className="stats">
        <div>
          <span>전체 연구개발비</span>
          <strong>{won(t.T)}</strong>
        </div>
        <div>
          <span>정부지원</span>
          <strong>{won(t.G)}</strong>
        </div>
        <div>
          <span>현금 (정부+기관 현금)</span>
          <strong>{won(t.cashT)}</strong>
        </div>
        <div>
          <span>현물</span>
          <strong>{won(t.kindT)}</strong>
        </div>
      </div>
      <section>
        <h3 className="h3">연차별 편성 · {S.orgs[S.view].short}</h3>
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>연차</th>
                <th>기간</th>
                <th className="r">정부지원</th>
                <th className="r">기관부담 현금</th>
                <th className="r">현물</th>
                <th className="r">총 연구개발비</th>
                <th className="r">인건비</th>
                <th>급여 기준</th>
                <th>편성</th>
              </tr>
            </thead>
            <tbody>
              {t.cs.map((c: any, i: number) => (
                <tr key={i}>
                  <td>
                    <LinkBtn a="propYr" x={i}>
                      {ys[i].no}차년도
                    </LinkBtn>
                  </td>
                  <td className="num small">
                    {fdate(ys[i].start)}~{fdate(ys[i].end)}
                  </td>
                  <td className="r num">{eok(c.pr.G)}</td>
                  <td className="r num">{eok(c.Bc)}</td>
                  <td className="r num">{eok(c.Bk)}</td>
                  <td className="r num">{eok(c.T)}</td>
                  <td className="r num">{eok(sum(c.rows.filter((r: any) => r.auto === 'lab').map((r: any) => r.c + r.k)))}</td>
                  <td>
                    {c.pyr.ok ? (
                      <span className="chip">{c.yr}년</span>
                    ) : (
                      <span className="chip warn" title={`${c.pyr.want}년 급여표가 없어요`}>
                        {c.yr}년*
                      </span>
                    )}
                  </td>
                  <td>{c.ok ? <span className="chip good">완료</span> : <span className="chip warn">작성 중</span>}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2}>전체 기간</td>
                <td className="r num">{eok(t.G)}</td>
                <td className="r num">{eok(t.Bc)}</td>
                <td className="r num">{eok(t.Bk)}</td>
                <td className="r num">{eok(t.T)}</td>
                <td className="r num">{eok(t.lab)}</td>
                <td />
                <td>{t.ok ? <span className="chip good">완료</span> : null}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
      <section>
        <h3 className="h3">비목별 전체 기간 합계</h3>
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>비목</th>
                {ys.map((y: any) => (
                  <th key={y.no} className="r">
                    {y.no}차년도
                  </th>
                ))}
                <th className="r">합계</th>
              </tr>
            </thead>
            <tbody>
              {ITEMS.map((it: string) => {
                const v = t.cs.map((c: any) => {
                  const r = c.rows.find((x: any) => x.i === it);
                  return r.c + r.k;
                });
                return (
                  <tr key={it}>
                    <td>{it}</td>
                    {v.map((x: number, i: number) => (
                      <td key={i} className="r num">
                        {eok(x)}
                      </td>
                    ))}
                    <td className="r num">
                      <b>{eok(sum(v))}</b>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function Num({ k, lab, step, v }: { k: string; lab: string; step: number; v: unknown }) {
  return (
    <label className="field" htmlFor={`pp-${k}`}>
      <span>{lab}</span>
      <In id={`pp-${k}`} type="number" data-pp={k} value={v} step={step} />
    </label>
  );
}

function YearEditor({ p }: { p: any }) {
  const c = propCalc(p, S.view);
  const pr = c.pr;
  const lead = isLead(p);
  const o = S.orgs[S.view];
  const cand = S.people.filter((x: any) => x.org === S.view && !pr.staff.some((s: any) => s.pid === x.id));
  const over = c.st.filter((s: any) => s.left < s.rate);
  const dc = c.cashT - c.C;
  const dk = c.kindT - c.K;
  const diff = (d: number) => (d > 0 ? `${won(d)} 남음` : d < 0 ? `${won(-d)} 초과` : '일치');
  const fixed = allocOf(p, S.view, c.yi) && !lead;
  let src: ReactNode;
  if (fixed)
    src = (
      <>
        <div className="grid3">
          {[
            ['정부지원 연구개발비(원)', won(pr.G)],
            ['기관부담 비율', pr.share + '%'],
            ['기관부담 중 현금 비율', pr.cashPct + '%'],
          ].map(([k, v]) => (
            <div className="field" key={k}>
              <span>{k}</span>
              <div className="num" style={{ padding: '8px 0', fontWeight: 700 }}>
                {v}
              </div>
            </div>
          ))}
        </div>
        <p className="small muted" style={{ margin: '6px 0 0' }}>
          총괄기관이 연구단 사업비 편성에서 정한 금액이에요. 이 안에서 ② 인건비와 ③ 비목을 짜 주세요.
        </p>
      </>
    );
  else
    src = (
      <div className="grid3">
        <Num k="G" lab={allocOf(p, S.view, c.yi) ? '정부지원 연구개발비(원) · 배정' : '정부지원 연구개발비(원)'} step={1000000} v={pr.G} />
        <Num k="share" lab="기관부담 비율(% · 총 연구개발비 대비)" step={0.5} v={pr.share} />
        <Num k="cashPct" lab="기관부담 중 현금 비율(%)" step={1} v={pr.cashPct} />
      </div>
    );
  return (
    <>
      <section className="card">
        <div className="row between" style={{ marginBottom: 8 }}>
          <h3 className="h3" style={{ margin: 0 }}>
            ① 재원 구성{' '}
            <span className="muted small">
              {o.short} · {c.py.no}차년도 ({fdate(c.py.start)}~{fdate(c.py.end)})
            </span>
          </h3>
          {fixed ? (
            <span className="chip info">총괄기관 배정</span>
          ) : (
            <div className="row">
              <span className="small muted">기관 유형 예시</span>
              {Object.keys(PRESET).map((k) => (
                <Btn key={k} a="propPreset" x={k} className="btn sm">
                  {k}
                </Btn>
              ))}
            </div>
          )}
        </div>
        {src}
        <div className="stats" style={{ marginTop: 12 }}>
          <div>
            <span>총 연구개발비</span>
            <strong>{won(c.T)}</strong>
          </div>
          <div>
            <span>기관부담금</span>
            <strong>{won(c.B)}</strong>
          </div>
          <div>
            <span>현금 (정부지원 + 기관 현금)</span>
            <strong>{won(c.cashT)}</strong>
          </div>
          <div>
            <span>현물</span>
            <strong>{won(c.kindT)}</strong>
          </div>
        </div>
        <p className="small muted">기관 유형 버튼은 흔히 쓰는 하한 예시(중소기업 25%·현금 10%, 중견기업 30%·13%, 대기업 50%·15%, 대학·연구기관 0%)를 넣어요. 실제 비율은 공고문과 사업별 관리지침을 확인해 고쳐 주세요.</p>
      </section>
      <section className="card">
        <div className="row between" style={{ marginBottom: 8 }}>
          <div>
            <h3 className="h3" style={{ margin: 0 }}>
              ② 인건비 자동 계산
            </h3>
            <PayYrCtl p={p} c={c} />
            <p className="small muted">
              {c.yr}년 직원·급여 설정의 월 인건비 기준액 · 이 연차 {yMonths(c.py)}개월(급여 + 4대보험 기관부담 + 퇴직급여 적립) × 참여율 × 개월. 대학원생·학부연구생은 학생인건비로 들어가요.
            </p>
          </div>
          <label className="field" htmlFor="pp-add" style={{ minWidth: 220 }}>
            <span hidden>참여 인원 추가</span>
            <In as="select" id="pp-add" data-ppadd="1" value="">
              <option value="">+ 참여 인원 추가</option>
              {cand.map((x: any) => (
                <option key={x.id} value={x.id}>
                  {x.name} · {x.role} · 남은 {Math.max(0, 100 - totRate(x.id))}%
                </option>
              ))}
            </In>
          </label>
        </div>
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>이름</th>
                <th>비목</th>
                <th className="r">월 기준액</th>
                <th>수행 중 참여율</th>
                <th className="r">남은 참여율</th>
                <th className="r">이 제안 참여율</th>
                <th className="r">개월</th>
                <th>재원</th>
                <th className="r">계상액</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {c.st.length ? (
                c.st.map((s: any, i: number) => (
                  <tr key={i}>
                    <td>
                      {s.x?.name || ''} <span className="small muted">{s.x?.role || ''}</span>
                    </td>
                    <td className="small">{s.it}</td>
                    <td className="r num">{eok(s.base)}</td>
                    <td className="small">
                      {s.act.length ? (
                        s.act.map((a: any, j: number) => (
                          <span key={j}>
                            {j ? <br /> : null}
                            {a.p.short} {a.r}%
                          </span>
                        ))
                      ) : (
                        <span className="muted">없음</span>
                      )}
                      {s.other.length ? (
                        <>
                          <br />
                          <span className="muted">다른 제안 {s.other.map((a: any) => a.r + '%').join('·')}</span>
                        </>
                      ) : null}
                    </td>
                    <td className={`r num ${s.left < s.rate ? 'rate-over' : ''}`}>{s.left}%</td>
                    <td className="r">
                      <label>
                        <span hidden>{s.x?.name || ''} 참여율</span>
                        <In id={`pps-r-${i}`} type="number" min="0" max="100" data-pps={`${i}|rate`} value={s.rate} style={{ width: 68, textAlign: 'right' }} aria-invalid={s.left < s.rate ? 'true' : undefined} /> %
                      </label>
                    </td>
                    <td className="r">
                      <label>
                        <span hidden>{s.x?.name || ''} 개월</span>
                        <In id={`pps-m-${i}`} type="number" min="1" max="12" data-pps={`${i}|months`} value={s.months} style={{ width: 58, textAlign: 'right' }} />
                      </label>
                    </td>
                    <td>
                      <label>
                        <span hidden>{s.x?.name || ''} 재원</span>
                        <In as="select" id={`pps-f-${i}`} data-pps={`${i}|fund`} style={{ width: 'auto' }} value={s.fund}>
                          {['현금', '현물'].map((v) => (
                            <option key={v}>{v}</option>
                          ))}
                        </In>
                      </label>
                    </td>
                    <td className="r num">{eok(s.amt)}</td>
                    <td className="r">
                      <Btn a="ppRm" x={i} className="btn sm">
                        빼기
                      </Btn>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="muted">
                    참여 인원을 추가해 주세요.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={8}>합계</td>
                <td className="r num">{eok(sum(c.st.map((s: any) => s.amt)))}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
        {over.length ? (
          <div className="notice bad" style={{ marginTop: 8 }}>
            참여율이 남은 참여율을 넘는 사람이 있어요: {over.map((s: any) => `${s.x.name} (남은 ${s.left}%, 입력 ${s.rate}%)`).join(', ')}. 수행 중인 과제 참여율을 줄이거나 이 제안의 참여율을 낮춰 주세요.
          </div>
        ) : null}
        <p className="small muted">수행 중 참여율은 연구행정 관리의 인건비(참여율)에서 실시간으로 가져와요. 남은 참여율 = 100% − 수행 중 참여율.</p>
      </section>
      <section className="card">
        <div className="row between" style={{ marginBottom: 8, alignItems: 'flex-end' }}>
          <h3 className="h3" style={{ margin: 0 }}>
            ③ 비목별 편성
          </h3>
          <div className="row" style={{ alignItems: 'flex-end' }}>
            <label className="field" htmlFor="pp-ind" style={{ maxWidth: 190 }}>
              <span>간접비율(% · 직접비 현금 대비)</span>
              <In id="pp-ind" type="number" step="0.1" data-pp="ind" value={pr.ind} />
            </label>
            <Btn a="propFill" disabled={!(dc || dk)}>
              차액 자동 채우기
            </Btn>
          </div>
        </div>
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>비목</th>
                <th className="r">현금</th>
                <th className="r">현물</th>
                <th className="r">합계</th>
              </tr>
            </thead>
            <tbody>
              {c.rows.map((r: any) => (
                <tr key={r.i}>
                  <td>
                    {r.i}
                    {r.auto ? (
                      <>
                        {' '}
                        <span className="chip">{r.auto === 'lab' ? '자동 · 인건비 계산' : '자동 · 간접비율'}</span>
                      </>
                    ) : null}
                  </td>
                  {r.auto ? (
                    <>
                      <td className="r num">{eok(r.c)}</td>
                      <td className="r num">{eok(r.k)}</td>
                    </>
                  ) : (
                    ['c', 'k'].map((x) => (
                      <td key={x} className="r">
                        <label>
                          <span hidden>
                            {r.i} {x === 'c' ? '현금' : '현물'}
                          </span>
                          <In id={`ppi-${x}-${r.i}`} type="number" step="1000000" data-ppi={`${r.i}|${x}`} value={r[x] || ''} style={{ width: 140, textAlign: 'right' }} />
                        </label>
                      </td>
                    ))
                  )}
                  <td className="r num">{eok(r.c + r.k)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td>편성 합계</td>
                <td className="r num">{eok(c.C)}</td>
                <td className="r num">{eok(c.K)}</td>
                <td className="r num">{eok(c.C + c.K)}</td>
              </tr>
              <tr>
                <td>목표 (①)</td>
                <td className="r num">{eok(c.cashT)}</td>
                <td className="r num">{eok(c.kindT)}</td>
                <td className="r num">{eok(c.T)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        {dc || dk ? (
          <div className="notice warn">
            현금 {diff(dc)} · 현물 {diff(dk)}. ‘차액 자동 채우기’를 누르면 남는 현금은 연구재료비, 현물은 연구시설·장비비에 넣어요.
          </div>
        ) : (
          <div className="notice good">현금·현물 편성이 재원 구성과 일치해요.</div>
        )}
      </section>
    </>
  );
}

function PropDetail({ p }: { p: any }) {
  const lead = isLead(p);
  const q = part(p, S.view);
  return (
    <>
      <div className="apv-bar">
        <div className="row">
          <Btn a="propBack" className="btn sm">
            ‹ 제안 목록
          </Btn>
          <span className="chip org">{partLabel(q)}</span>
          {p.consortium ? (
            <span className="small muted">
              연구단 코드 <b className="num">{p.code || '-'}</b>
            </span>
          ) : (
            <span className="chip">단독 과제</span>
          )}
        </div>
        <div className="row">
          {p.consortium ? (
            <Btn a="teamOpen" x={p.id}>
              연구단 과제에서 보기
            </Btn>
          ) : null}
          {lead ? (
            <Btn a="propGoAsk" x={p.id} className="btn primary">
              선정 · 추진 단계로 전환
            </Btn>
          ) : null}
        </div>
      </div>
      <div className="page-head">
        <div>
          <h2>{p.name}</h2>
          <p className="small muted">
            {p.call || ''}
            {p.call ? ' · ' : ''}
            {p.ministry} · {fdate(p.start)}~{fdate(p.end)}
            {p.due ? ` · 제안 마감 ${fdate(p.due)}` : ''}
          </p>
        </div>
      </div>
      <PropYearBar p={p} />
      {S.propYr === -1 ? <PropSummary p={p} /> : <YearEditor p={p} />}
      <section className="card">
        <div className="row between" style={{ marginBottom: 8 }}>
          <div>
            <h3 className="h3" style={{ margin: 0 }}>
              ④ 성과 목표
            </h3>
            <p className="small muted" style={{ margin: '2px 0 0' }}>
              차년도별 논문·특허·SW 등록 같은 목표예요. 연구단 과제는 기관마다 따로 정해요. 추진 단계로 바뀌면 연구행정관리 → 성과관리로 그대로 이어져요.
            </p>
          </div>
          {canGoal(p) ? (
            <Btn a="perfGoalNew" x={p.id} className="btn sm">
              + 성과 목표
            </Btn>
          ) : null}
        </div>
        <PerfOrgBar p={p} />
        <PerfGoalTable p={p} plan />
      </section>
      {p.parts.filter((x: any) => x.status === '수락').length > 1 ? (
        <section>
          <h3 className="h3">연구단 편성 현황</h3>
          <PropTable p={p} />
          <p className="small muted">제안 단계에서는 연구단 모든 기관이 서로의 편성 총액을 함께 봐요.</p>
        </section>
      ) : null}
    </>
  );
}

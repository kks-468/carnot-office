// 프로토타입 화면을 React 컴포넌트로 옮겼어요. 버튼·입력은 data-* 속성으로 core/actions의 A와 연결돼요.
import { actualMonth, actualSub, budgetOf, monthly, planOf, rateOf, subPlanOf, totRate } from '../../core/budget';
import { CAT, ITEMS, TODAY } from '../../core/catalog';
import { schedEvents } from '../../core/meeting';
import { peopleOf } from '../../core/org';
import { costBase, payOf, rkOf } from '../../core/pay';
import { salaryVisible } from '../../core/acl';
import { S } from '../../core/state';
import { eok, fdate, months, pct, sum, won, ymd } from '../../core/util';
import { Legend } from './AdminBody';
import { ax, jn } from '../../ui/jsx';
import { In } from '../../ui/primitives';

export function PlanPage({ p }: any) {
  const ms = months(p);
  const pl = planOf(p);
  const cur = TODAY.slice(0, 7);
  const unit = 1000;
  const sp = subPlanOf(p);
  let negRest = 0;
  const rows = jn(
    ITEMS.map((i, ii) => {
      const b = Math.round(budgetOf(p, S.view, i) / unit);
      const tot = sum(pl[i]);
      const mis = tot !== b;
      const subs = Object.keys(sp[i] || {});
      const left = CAT[i].map((x) => x.s).filter((x) => !subs.includes(x));
      const addSel = left.length ? (
        <label>
          <span hidden>{i} 세부유형 추가</span>
          <In as="select" className="addsub" id={`addsub-${ii}`} data-addsub={`${p.id}|${i}`}>
            <option value="">+ 세부유형</option>
            {jn(left.map((x, _i) => <option key={_i}>{x}</option>))}
          </In>
        </label>
      ) : null;
      const subRows = jn(
        subs.map((sname, si) => {
          const arr = sp[i][sname];
          return (
            <tr key={si} className="subr">
              <td className="sticky">
                └ {sname}{' '}
                <button className="xbtn" data-a="rmSub" data-x={`${p.id}|${i}|${sname}`} aria-label={`${sname} 빼기`} title="계획표에서 빼기">
                  ×
                </button>
              </td>
              <td className="r num muted">{eok(sum(arr))}</td>
              {jn(
                ms.map((m, k) => {
                  const act = Math.round(actualSub(p, S.view, i, sname, m) / unit);
                  return (
                    <td key={k} className={m === cur ? 'cur' : ''}>
                      <label>
                        <span hidden>
                          {sname} {m} 계획
                        </span>
                        <In type="number" id={`sp-${p.id}-${ii}-${si}-${k}`} data-splan={`${p.id}|${i}|${sname}|${k}`} value={arr[k]} min="0" />
                      </label>
                      {act ? <span className={`act num ${act > arr[k] ? 'over' : ''}`}>실적 {eok(act)}</span> : null}
                    </td>
                  );
                }),
              )}
              <td className="r num">{eok(sum(arr))}</td>
              <td className="r small muted">{tot ? Math.round((sum(arr) / tot) * 100) : 0}%</td>
            </tr>
          );
        }),
      );
      const rest = subs.length
        ? (() => {
            const r = ms.map((_m, k) => pl[i][k] - sum(subs.map((x) => sp[i][x][k])));
            if (r.some((v) => v < 0)) negRest++;
            return (
              <tr className="rest">
                <td className="sticky">
                  └ 그 외 <span className="small">(자동 계산)</span>
                </td>
                <td />
                {jn(
                  r.map((v, k) => (
                    <td key={k} className={`r num ${v < 0 ? 'neg' : ''} ${ms[k] === cur ? 'cur' : ''}`}>
                      {eok(v)}
                    </td>
                  )),
                )}
                <td className={`r num ${sum(r) < 0 ? 'neg' : ''}`}>{eok(sum(r))}</td>
                <td />
              </tr>
            );
          })()
        : '';
      return (
        <>
          <tr className={mis ? 'mis' : ''}>
            <td className="sticky">
              <b>{i}</b>
              {addSel}
            </td>
            <td className="r num">{eok(b)}</td>
            {jn(
              ms.map((m, k) => {
                const act = Math.round(actualMonth(p, S.view, i, m) / unit);
                return (
                  <td key={k} className={m === cur ? 'cur' : ''}>
                    <label>
                      <span hidden>
                        {i} {m} 계획
                      </span>
                      <In type="number" id={`pl-${p.id}-${ii}-${k}`} data-plan={`${p.id}|${i}|${k}`} value={pl[i][k]} min="0" />
                    </label>
                    {act ? <span className={`act num ${act > pl[i][k] ? 'over' : ''}`}>실적 {eok(act)}</span> : null}
                  </td>
                );
              }),
            )}
            <td className="r num">
              <b>{eok(tot)}</b>
            </td>
            <td className="r num">
              {mis ? (
                <span className="chip bad">
                  {tot > b ? '+' : ''}
                  {eok(tot - b)}
                </span>
              ) : (
                <span className="chip good">일치</span>
              )}
            </td>
          </tr>
          {subRows}
          {rest}
        </>
      );
    }),
  );
  const mt = ms.map((_m, k) => sum(ITEMS.map((i) => pl[i][k])));
  const ma = ms.map((m) => Math.round(sum(ITEMS.map((i) => actualMonth(p, S.view, i, m))) / unit));
  const misCount = ITEMS.filter((i) => sum(pl[i]) !== Math.round(budgetOf(p, S.view, i) / unit)).length;
  return (
    <>
      <div className="page-head">
        <div>
          <h2>{p.short} 월별 계획표</h2>
          <p className="small muted">
            {p.year} · {S.orgs[S.view].short} · 단위 천원
          </p>
        </div>
        <button className="btn sm" data-a="resetPlan">
          기본 배분으로 다시 채우기
        </button>
      </div>
      {misCount ? (
        <div className="notice bad">{misCount}개 비목의 월별 합계가 연차 예산과 달라요. 빨간 줄을 맞춰 주세요.</div>
      ) : (
        <div className="notice good">모든 비목의 월별 합계가 연차 예산과 일치해요.</div>
      )}{' '}
      {negRest ? <div className="notice warn">{negRest}개 비목에서 세부유형 계획이 비목 계획보다 커요. ‘그 외’ 줄의 빨간 숫자를 확인해 주세요.</div> : null}
      <p className="small muted">
        필요한 세부유형만 비목 이름 아래 ‘+ 세부유형’으로 추가해 따로 계획할 수 있어요. 추가하지 않은 나머지는 ‘그 외’로 자동 계산돼요. 여기 추가한 세부유형은 일정관리에도 줄로 나타나요.
      </p>
      <div className="tw">
        <table className="plan-t">
          <thead>
            <tr>
              <th className="sticky">비목</th>
              <th className="r">연차 예산</th>
              {jn(
                ms.map((m, k) => (
                  <th key={k} className={`r ${m === cur ? 'cur' : ''}`}>
                    {+m.slice(5)}월
                    {k === 0 || m.slice(5) === '01' ? (
                      <>
                        <br />
                        <span className="small">{m.slice(0, 4)}</span>
                      </>
                    ) : null}
                  </th>
                )),
              )}
              <th className="r">계획 합계</th>
              <th className="r">차이</th>
            </tr>
          </thead>
          <tbody>{rows}</tbody>
          <tfoot>
            <tr>
              <td className="sticky">월 계획</td>
              <td />
              {jn(
                mt.map((v, _i) => (
                  <td key={_i} className="r num">
                    {eok(v)}
                  </td>
                )),
              )}
              <td className="r num">{eok(sum(mt))}</td>
              <td />
            </tr>
            <tr>
              <td className="sticky">월 실적</td>
              <td />
              {jn(
                ma.map((v, k) => (
                  <td key={k} className={`r num ${v > mt[k] ? 'err' : ''}`}>
                    {v ? eok(v) : '-'}
                  </td>
                )),
              )}
              <td className="r num">{eok(sum(ma))}</td>
              <td />
            </tr>
            {(() => {
              const B = Math.round(budgetOf(p, S.view) / unit);
              let acc = 0;
              const rest = ma.map((v, k) => {
                acc += v;
                return ms[k] <= cur ? B - acc : null;
              });
              return (
                <tr className="restrow">
                  <td className="sticky">
                    잔액 <span className="small muted">(예산 − 누적 실적)</span>
                  </td>
                  <td className="r num">{eok(B)}</td>
                  {jn(
                    rest.map((v, k) => (
                      <td key={k} className={`r num ${v !== null && v < 0 ? 'neg' : ''} ${ms[k] === cur ? 'cur' : ''}`}>
                        {v === null ? <span className="muted">-</span> : eok(v)}
                      </td>
                    )),
                  )}
                  <td className="r num">
                    <b>{eok(B - sum(ma))}</b>
                  </td>
                  <td />
                </tr>
              );
            })()}
          </tfoot>
        </table>
      </div>
      <p className="small muted">
        각 칸 아래의 ‘실적’은 그 달에 등록한 집행 합계예요. 계획보다 많이 쓰면 빨간색으로 표시돼요. ‘잔액’은 연차 예산에서 그 달까지 쓴 금액을 뺀 값이에요. 주황 밑줄은 이번 달이에요.
      </p>
    </>
  );
}
export function PlanCards({ title, desc, cards }: any) {
  return (
    <>
      <div className="page-head">
        <h2>{title}</h2>
        <span className="chip org">다음 단계에서 구현</span>
      </div>
      <p
        style={{
          maxWidth: '62ch',
        }}
      >
        {desc}
      </p>
      <div className="plangrid">
        {jn(
          cards.map(([h, t], _i) => (
            <div key={_i}>
              <h3>{h}</h3>
              <p className="small">{t}</p>
            </div>
          )),
        )}
      </div>
    </>
  );
}
export function ProjLabor({ p }: any) {
  const mine = peopleOf(p).filter((x) => x.org === S.view);
  const others = peopleOf(p).filter((x) => x.org !== S.view);
  const mon = sum(mine.map((x) => monthly(x.id, p.id)));
  const monK = sum(mine.filter((x) => rkOf(x.id, p.id) === '현물').map((x) => monthly(x.id, p.id)));
  const bud = budgetOf(p, S.view, '인건비') + budgetOf(p, S.view, '학생인건비');
  const over = mine.filter((x) => totRate(x.id) > 100);
  const cand = S.people.filter((x) => x.org === S.view && !p.members.includes(x.id));
  const g: any = {};
  cand.forEach((x) => {
    (g[x.unit || '기타'] = g[x.unit || '기타'] || []).push(x);
  });
  return (
    <>
      <div className="page-head">
        <div>
          <h2>{p.short} 인건비(참여율)</h2>
          <p className="small muted">{p.year} · 이 과제의 참여율만 고쳐요. 다른 과제 참여율과 더한 총 참여율이 함께 보여요.</p>
        </div>
        <label
          className="field"
          htmlFor="lab-add"
          style={{
            minWidth: '240px',
          }}
        >
          <span hidden>참여 인원 추가</span>
          <In as="select" id="lab-add" data-labadd={p.id}>
            <option value="">+ 참여 인원 추가</option>
            {jn(
              Object.entries(g).map(([k, xs], _i) => (
                <optgroup key={_i} label={k}>
                  {jn(
                    xs.map((x, _i) => (
                      <option key={_i} value={x.id}>
                        {x.name} · {x.role}
                      </option>
                    )),
                  )}
                </optgroup>
              )),
            )}
          </In>
        </label>
      </div>
      <div className="stats">
        <div>
          <span>참여 인원</span>
          <strong>{mine.length}명</strong>
        </div>
        <div>
          <span>월 인건비 계상액</span>
          <strong>{won(mon)}</strong>
          <span className="small muted">
            현금 {eok(mon - monK)} · 현물 {eok(monK)}
          </span>
        </div>
        <div>
          <span>연차 계상액(12개월)</span>
          <strong>{won(mon * 12)}</strong>
        </div>
        <div className={mon * 12 > bud ? 'bad' : ''}>
          <span>인건비 예산 대비</span>
          <strong>{bud ? pct(mon * 12, bud) : 0}%</strong>
        </div>
      </div>
      {over.length ? <div className="notice bad">{over.map((x) => x.name).join(', ')}님의 총 참여율이 100%를 넘어요. 다른 과제 참여율과 함께 조정해 주세요.</div> : null}
      <div className="tw">
        <table>
          <thead>
            <tr>
              <th>이름</th>
              <th>역할</th>
              <th className="r">월 인건비 기준액</th>
              <th className="r">이 과제 참여율</th>
              <th>재원</th>
              <th className="r">월 계상액</th>
              <th>다른 과제</th>
              <th className="r">총 참여율</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {jn(
              mine.map((x, _i) => {
                const t = totRate(x.id);
                const oth = S.projects.filter((q) => q.id !== p.id && q.members.includes(x.id) && rateOf(x.id, q.id));
                return (
                  <tr key={_i}>
                    <td>{x.name}</td>
                    <td className="small muted">
                      {x.role} · {x.unit}
                    </td>
                    <td className="r num">
                      {salaryVisible(x.id) ? (
                        <>
                          {eok(costBase(x.id))}
                          <br />
                          <span className="small muted">급여 {eok(payOf(x.id))}</span>
                        </>
                      ) : (
                        <span className="small muted" title="급여 열람 권한이 없어요">•••</span>
                      )}
                    </td>
                    <td className="r">
                      <label>
                        <span hidden>{x.name} 참여율</span>
                        <In
                          type="number"
                          min="0"
                          max="100"
                          id={`prate-${x.id}`}
                          data-rate={`${x.id}|${p.id}`}
                          value={rateOf(x.id, p.id)}
                          style={{
                            width: '72px',
                            textAlign: 'right',
                          }}
                        />{' '}
                        %
                      </label>
                    </td>
                    <td>
                      <label>
                        <span hidden>{x.name} 재원</span>
                        <In
                          as="select"
                          id={`rk-${x.id}`}
                          data-rk={`${x.id}|${p.id}`}
                          style={{
                            width: 'auto',
                          }}
                        >
                          {jn(
                            ['현금', '현물'].map((v, _i) => (
                              <option key={_i} {...ax(rkOf(x.id, p.id) === v ? 'selected' : '')}>
                                {v}
                              </option>
                            )),
                          )}
                        </In>
                      </label>
                    </td>
                    <td className="r num">{eok(monthly(x.id, p.id))}</td>
                    <td className="small">{oth.map((q) => `${q.short} ${rateOf(x.id, q.id)}%`).join(', ') || '-'}</td>
                    <td className="r num">
                      <b className={t > 100 ? 'err' : ''}>{t}%</b>
                    </td>
                    <td className="r">
                      <button className="btn sm" data-a="labRm" data-x={`${p.id}|${x.id}`}>
                        참여 종료
                      </button>
                    </td>
                  </tr>
                );
              }),
            ) || (
              <tr>
                <td colSpan={9} className="muted">
                  참여 인원이 없어요.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2}>합계</td>
              <td />
              <td className="r num">{sum(mine.map((x) => rateOf(x.id, p.id)))}%</td>
              <td />
              <td className="r num">{eok(mon)}</td>
              <td colSpan={3} />
            </tr>
          </tfoot>
        </table>
      </div>
      {others.length ? (
        <p className="small muted">
          참여기관 인원 {others.length}명({[...new Set<any>(others.map((x) => S.orgs[x.org].short))].join(', ')})의 참여율은 각 기관에서 관리해요.
        </p>
      ) : null}
      <p className="small muted">
        월 계상액 = 월 인건비 기준액(급여 + 4대보험 기관부담 + 퇴직급여 적립) × 참여율. 급여와 보험요율은 업무 지원 → 직원·급여에서 연도별로 정해요. 여기 참여율은 연구총괄표의 인건비(참여율)와
        ‘참여연구자 현황표’ 증빙에 그대로 반영돼요.
      </p>
    </>
  );
}
export function ProjSchedule({ p }: any) {
  const all = schedEvents(p);
  const subs = [...new Set<any>(all.map((x) => x.sub))];
  const f = S.schf && S.schf !== 'all' && subs.includes(S.schf) ? S.schf : 'all';
  const ev = all.filter((x) => f === 'all' || x.sub === f);
  const c =
    S.pcal ||
    (S.pcal = {
      y: 2026,
      m: 10,
    });
  const { y, m } = c;
  const first = new Date(y, m, 1);
  const sd = first.getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const lead = new Date(y, m, 1 - sd);
  const total = Math.ceil((sd + days) / 7) * 7;
  const cells: any = [];
  const lab = {
    done: '완료',
    plan: '예정',
    late: '지난 예정',
  };
  for (let i = 0; i < total; i++) {
    const d = new Date(lead.getFullYear(), lead.getMonth(), lead.getDate() + i);
    const ds = ymd(d);
    const xs = ev.filter((x) => x.date === ds);
    cells.push(
      <div className={`day ${d.getMonth() !== m ? 'out' : ''} ${ds === TODAY ? 'today' : ''}`}>
        <span className="dn">{d.getDate()}</span>
        {jn(
          xs.map((x, _i) => (
            <button key={_i} className={`mt st-${x.st}`} data-a={x.act} data-x={x.id} title={`${x.sub} · ${x.title}`}>
              <b>
                {x.time ? x.time + ' ' : ''}
                {x.sub}
                {x.kind === 'entry' ? ' · 집행' : ''}
              </b>
              <span>{x.title}</span>
            </button>
          )),
        )}
      </div>,
    );
  }
  const month = `${y}-${String(m + 1).padStart(2, '0')}`;
  const list = ev.filter((x) => x.date.startsWith(month));
  const bySub = subs
    .map((sb) => {
      const xs = all.filter((x) => x.sub === sb && x.date.startsWith(month));
      return {
        sb,
        plan: sum(xs.filter((x) => x.kind !== 'entry' && x.st !== 'done').map((x) => x.amount)),
        done: sum(xs.filter((x) => x.kind === 'entry').map((x) => x.amount)) + sum(xs.filter((x) => x.kind !== 'entry' && x.st === 'done').map((x) => x.amount)),
        n: xs.length,
      };
    })
    .filter((r) => r.n);
  return (
    <>
      <div className="page-head">
        <div>
          <h2>{p.short} 일정관리</h2>
          <p className="small muted">회의·야근·특근·출장·자문 일정을 미리 잡고, 끝나면 그대로 집행 등록해요. 같은 날 같은 사람이 겹치면 알려 줘요.</p>
        </div>
        <div className="row">
          <button className="btn" data-a="newMeeting" data-x={p.id}>
            회의 예비 등록
          </button>
          <button className="btn primary" data-a="newSched">
            + 일정 추가
          </button>
        </div>
      </div>
      <div
        className="row"
        style={{
          flexWrap: 'wrap',
          gap: '6px',
          marginBottom: '10px',
        }}
      >
        <span className="small muted">세부유형</span>
        <div className="seg" role="group">
          {jn(
            [['all', `전체 ${all.length}`], ...subs.map((sb) => [sb, `${sb} ${all.filter((x) => x.sub === sb).length}`])].map(([k, l], _i) => (
              <button key={_i} data-a="schFilter" data-x={k} aria-pressed={f === k}>
                {l}
              </button>
            )),
          )}
        </div>
      </div>
      <div className="row between">
        <div className="row">
          <button className="btn sm" data-a="pcalPrev" aria-label="이전 달">
            ‹
          </button>
          <strong
            style={{
              fontSize: '16px',
              minWidth: '96px',
              textAlign: 'center',
            }}
            className="num"
          >
            {y}년 {m + 1}월
          </strong>
          <button className="btn sm" data-a="pcalNext" aria-label="다음 달">
            ›
          </button>
          <button className="btn sm" data-a="pcalToday">
            오늘
          </button>
        </div>
        {<Legend />}
      </div>
      <div className="calwrap">
        <div className="cal">
          {jn(
            ['일', '월', '화', '수', '목', '금', '토'].map((d, _i) => (
              <div key={_i} className="dow">
                {d}
              </div>
            )),
          )}
          {jn(cells)}
        </div>
      </div>
      {bySub.length ? (
        <section>
          <h3 className="h3">{m + 1}월 세부유형별</h3>
          <div className="tw">
            <table>
              <thead>
                <tr>
                  <th>세부유형</th>
                  <th className="r">건수</th>
                  <th className="r">예정 금액</th>
                  <th className="r">완료·집행 금액</th>
                </tr>
              </thead>
              <tbody>
                {jn(
                  bySub.map((r, _i) => (
                    <tr key={_i}>
                      <td>{r.sb}</td>
                      <td className="r num">{r.n}건</td>
                      <td className="r num">{eok(r.plan)}</td>
                      <td className="r num">{eok(r.done)}</td>
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
      <section>
        <h3 className="h3">
          {m + 1}월 일정 {list.length}건
        </h3>
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>날짜</th>
                <th>세부유형</th>
                <th>내용</th>
                <th className="r">금액</th>
                <th>상태</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {jn(
                list.map((x, _i) => (
                  <tr key={_i}>
                    <td className="num">
                      {fdate(x.date)}
                      {x.time ? ' ' + x.time : ''}
                    </td>
                    <td>{x.sub}</td>
                    <td>{x.title}</td>
                    <td className="r num">{x.amount ? eok(x.amount) : '-'}</td>
                    <td>
                      <span className={`chip ${x.kind === 'entry' ? 'good' : x.st === 'late' ? 'bad' : x.st === 'done' ? 'info' : 'warn'}`}>{x.kind === 'entry' ? '집행' : lab[x.st]}</span>
                    </td>
                    <td className="r">
                      <button className="btn sm" data-a={x.act} data-x={x.id}>
                        {x.kind === 'entry' ? '증빙' : '열기'}
                      </button>
                    </td>
                  </tr>
                )),
              ) || (
                <tr>
                  <td colSpan={6} className="muted">
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

// 프로토타입 화면을 React 컴포넌트로 옮겼어요. 버튼·입력은 data-* 속성으로 core/actions의 A와 연결돼요.
import { budgetOf, inCur, monthly, periodOf, rateOf, spentOf, totRate, totalBudget } from '../../core/budget';
import { ITEMS, PCOL, TODAY } from '../../core/catalog';
import { evSum } from '../../core/evidence';
import { schedEvents } from '../../core/meeting';
import { byTeam, isLead, part, proj, visible } from '../../core/org';
import { S } from '../../core/state';
import { eok, fdate, pct, sum, won, ymd } from '../../core/util';
import { TopBar } from '../../layout/Shell';
import { EvidPage, ItemPage } from './ItemPages';
import { CompletePage, MeetPage } from './MeetPages';
import { PlanPage, ProjLabor, ProjSchedule } from './ProjPlan';
import { ProjectSummary } from './ProjectSummary';
import { ReceiptPage } from './ReceiptPage';
import { LibraryPage } from '../library/LibraryPage';
import { PerfPage } from '../perf/Perf';
import { TeamChips } from '../../ui/TeamChips';
import { css, jn } from '../../ui/jsx';
import { In, Nav } from '../../ui/primitives';

export function AdminBody() {
  const t = (k, l) => (
    <button data-a="tab" data-x={k} aria-current={S.tab === k}>
      {l}
    </button>
  );
  const nr = S.receipts.filter((r) => r.st === 'new').length;
  const vis = visible();
  if (!S.openTabs) S.openTabs = vis.slice(0, 3).map((p) => p.id);
  S.openTabs = S.openTabs.filter((id) => vis.some((p) => p.id === id));
  if (vis.some((p) => p.id === S.tab) && !S.openTabs.includes(S.tab)) S.openTabs.push(S.tab);
  const lbl = (n) => (n.length > 16 ? n.slice(0, 15) + '…' : n);
  const ptab = (p) => (
    <span className={`ptab ${S.tab === p.id ? 'on' : ''}`}>
      <button data-a="tab" data-x={p.id} aria-current={S.tab === p.id} title={p.name}>
        {lbl(p.name)}
      </button>
      <button className="tx" data-a="tabClose" data-x={p.id} aria-label={`${p.name} 탭 닫기`} title="탭 닫기">
        ×
      </button>
    </span>
  );
  const rest = vis.filter((p) => !S.openTabs.includes(p.id));
  const teams = [...new Set<any>(rest.map((p) => p.team || '기타'))];
  const opener = rest.length ? (
    <label className="tabopen" htmlFor="tabopen">
      <span hidden>과제 열기</span>
      <In as="select" id="tabopen" data-a-change="tabOpen">
        <option value="">＋ 과제 열기 ({rest.length})</option>
        {jn(
          teams.map((tm, _i) => (
            <optgroup key={_i} label={tm}>
              {jn(
                rest
                  .filter((p) => (p.team || '기타') === tm)
                  .map((p, _i) => (
                    <option key={_i} value={p.id}>
                      {p.name}
                    </option>
                  )),
              )}
            </optgroup>
          )),
        )}
      </In>
    </label>
  ) : null;
  const tabs = (
    <>
      {t('overview', '연구총괄표')}
      {t('meet', '회의일정')}
      {t('receipt', `영수증${nr ? ` (${nr})` : ''}`)}
      {t('evid', '증빙 관리')}
      <span className="tsep" aria-hidden="true" />
      {jn(S.openTabs.map((id) => ptab(proj(id))))}
      {opener}
    </>
  );
  let body: any;
  if (S.tab === 'overview')
    body = (
      <div className="body">
        <nav className="subnav" aria-label="총괄 메뉴">
          {
            <Nav
              items={[
                ['cards', '과제관리 카드'],
                ['budget', '총괄예산'],
                ['labor', '인건비(참여율)'],
                ['schedule', '일정표'],
              ]}
              cur={S.sub}
              a={'sub'}
            />
          }
        </nav>
        <div className="work">
          {{
            cards: () => <CardsPage />,
            budget: () => <BudgetPage />,
            labor: () => <LaborPage />,
            schedule: () => <SchedulePage />,
          }[S.sub]()}
        </div>
      </div>
    );
  else if (S.tab === 'meet')
    body = (
      <div className="body single">
        <div className="work">{S.mwiz ? <CompletePage /> : <MeetPage />}</div>
      </div>
    );
  else if (S.tab === 'receipt')
    body = (
      <div className="body single">
        <div className="work">{<ReceiptPage />}</div>
      </div>
    );
  else if (S.tab === 'evid')
    body = (
      <div className="body single">
        <div className="work">{<EvidPage />}</div>
      </div>
    );
  else if (S.tab === 'library')
    body = (
      <div className="body single">
        <div className="work">{<LibraryPage />}</div>
      </div>
    );
  else {
    const p = proj(S.tab);
    body = (
      <div className="body">
        <nav className="subnav" aria-label="과제 메뉴">
          {
            <Nav
              items={[['summary', '총괄관리'], ['plan', '월별 계획표'], ['labor', '인건비(참여율)'], ['schedule', '일정관리'], ['perf', '성과관리'], ['-', '비목별 집행'], ...ITEMS.map((i) => [i, i])]}
              cur={S.psub}
              a={'psub'}
            />
          }
        </nav>
        <div className="work">
          {S.psub === 'summary' ? (
            <ProjectSummary p={p} />
          ) : S.psub === 'plan' ? (
            <PlanPage p={p} />
          ) : S.psub === 'labor' ? (
            <ProjLabor p={p} />
          ) : S.psub === 'schedule' ? (
            <ProjSchedule p={p} />
          ) : S.psub === 'perf' ? (
            <PerfPage p={p} />
          ) : (
            <ItemPage p={p} item={S.psub} />
          )}
        </div>
      </div>
    );
  }
  return (
    <>
      <TopBar tabs={tabs} />
      {body}
    </>
  );
}
export function CardsPage() {
  const invites = S.projects.filter((p) => part(p, S.view)?.status === '초대 중');
  return (
    <>
      <div className="page-head">
        <h2>과제관리 카드</h2>
        <span className="small muted">{visible().length}개 과제</span>
      </div>
      {<TeamChips list={visible()} />}{' '}
      {jn(
        invites.map((p, _i) => {
          const lead = p.parts.find((q) => q.role === '주관');
          return (
            <div key={_i} className="notice row between">
              <span>
                <b>{S.orgs[lead.org].short}</b>에서 공동 과제 <b>{p.name}</b>에 초대했어요.
              </span>
              <button className="btn primary sm" data-a="acceptInvite" data-x={p.id}>
                초대 수락
              </button>
            </div>
          );
        }),
      )}{' '}
      {visible().length ? null : <div className="notice">아직 등록한 과제가 없어요. + 과제 추가로 첫 과제를 등록해 보세요.</div>}
      <div className="cards">
        {jn(
          byTeam(visible()).map((p, _i) => {
            const lead = isLead(p);
            const b = budgetOf(p, S.view),
              s = spentOf(p, S.view);
            const miss = S.entries.filter((e) => e.proj === p.id && e.org === S.view && inCur(e) && !evSum(e).ok).length;
            return (
              <button key={_i} className="pcard" data-a="openProject" data-x={p.id}>
                <div className="row between">
                  <span
                    className="row"
                    style={{
                      gap: '4px',
                    }}
                  >
                    <span className={`chip ${lead ? 'org' : ''}`}>{lead ? '주관' : '참여'}</span>
                    <span className="chip">{p.kind || '연구'}</span>
                    {p.consortium ? <span className="chip info">연구단</span> : <span className="chip">단독</span>}
                  </span>
                  {miss ? <span className="chip bad">증빙 미비 {miss}건</span> : <span className="chip good">증빙 완료</span>}
                </div>
                <h3>{p.name}</h3>
                <dl className="kv">
                  <dt>부처명</dt>
                  <dd>{p.ministry}</dd>
                  <dt>연구기간</dt>
                  <dd>{periodOf(p)}</dd>
                  <dt>사업연차</dt>
                  <dd>{p.year}</dd>
                  <dt>사업비</dt>
                  <dd className="num">{won(lead ? totalBudget(p) : b)}</dd>
                  <dt>관리팀</dt>
                  <dd>{p.team}</dd>
                </dl>
                <div className="meter">
                  <i style={css(`width:${Math.min(100, pct(s, b))}%`)} />
                </div>
                <span className="small muted num">
                  우리 기관 집행 {pct(s, b)}% · 잔액 {won(b - s)}
                </span>
              </button>
            );
          }),
        )}{' '}
        <button className="addcard" data-a="newProject">
          + 과제 추가
        </button>
      </div>
    </>
  );
}
export function BudgetPage() {
  const rows = byTeam(visible()).map((p) => ({
    p,
    b: budgetOf(p, S.view),
    s: spentOf(p, S.view),
  }));
  const B = sum(rows.map((r) => r.b)),
    X = sum(rows.map((r) => r.s));
  return (
    <>
      <div className="page-head">
        <h2>총괄예산</h2>
        <span className="small muted">{S.orgs[S.view].short} 예산 · 당해 연차</span>
      </div>
      {<TeamChips list={visible()} />}
      <div className="stats">
        <div>
          <span>총 예산</span>
          <strong>{won(B)}</strong>
        </div>
        <div>
          <span>집행액</span>
          <strong>{won(X)}</strong>
        </div>
        <div>
          <span>잔액</span>
          <strong>{won(B - X)}</strong>
        </div>
        <div>
          <span>집행률</span>
          <strong>{pct(X, B)}%</strong>
        </div>
      </div>
      <div className="tw">
        <table>
          <thead>
            <tr>
              <th>과제</th>
              {jn(
                ITEMS.map((i, _i) => (
                  <th key={_i} className="r">
                    {i}
                  </th>
                )),
              )}
              <th className="r">합계 잔액</th>
            </tr>
          </thead>
          <tbody>
            {jn(
              rows.map(({ p, b, s }, _i) => (
                <tr key={_i}>
                  <td>
                    <button className="linkbtn" data-a="openProject" data-x={p.id}>
                      {p.short}
                    </button>
                  </td>
                  {jn(
                    ITEMS.map((i, _i) => (
                      <td key={_i} className="r num">
                        {eok(budgetOf(p, S.view, i) - spentOf(p, S.view, i))}
                      </td>
                    )),
                  )}
                  <td className="r num">
                    <b>{eok(b - s)}</b>
                  </td>
                </tr>
              )),
            )}
          </tbody>
        </table>
      </div>
      <p className="small muted">비목별 잔액(원)이에요. 월별 배분은 각 과제의 ‘월별 계획표’에서 관리해요.</p>
    </>
  );
}
export function LaborPage() {
  const ps = visible();
  const people = S.people.filter((x) => x.org === S.view && ps.some((p) => p.members.includes(x.id)));
  const tot = ps.map((p) => sum(people.filter((x) => p.members.includes(x.id)).map((x) => monthly(x.id, p.id))));
  const over = people.filter((x) => totRate(x.id) > 100);
  return (
    <>
      <div className="page-head">
        <div>
          <h2>인건비(참여율) 총괄</h2>
          <p className="small muted">각 과제의 인건비(참여율)를 사람별로 더해 보여요. 숫자를 바꾸면 해당 과제에도 바로 반영돼요.</p>
        </div>
      </div>
      <div className="stats">
        <div>
          <span>참여 인원</span>
          <strong>{people.length}명</strong>
        </div>
        <div>
          <span>월 인건비 계상액 합계</span>
          <strong>{won(sum(tot))}</strong>
        </div>
        <div className={over.length ? 'bad' : ''}>
          <span>참여율 100% 초과</span>
          <strong>{over.length}명</strong>
        </div>
      </div>
      <div className="tw">
        <table>
          <thead>
            <tr>
              <th>이름</th>
              <th>역할</th>
              {jn(
                ps.map((p, _i) => (
                  <th key={_i} className="r">
                    <button className="linkbtn" data-a="goLabor" data-x={p.id}>
                      {p.short}
                    </button>
                  </th>
                )),
              )}
              <th className="r">총 참여율</th>
              <th className="r">월 계상액 합계</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            {jn(
              people.map((x, _i) => {
                const t = totRate(x.id);
                return (
                  <tr key={_i}>
                    <td>{x.name}</td>
                    <td className="small muted">{x.role}</td>
                    {jn(
                      ps.map((p, _i) =>
                        p.members.includes(x.id) ? (
                          <td key={_i} className="r">
                            <label>
                              <span hidden>
                                {x.name} {p.short} 참여율
                              </span>
                              <In
                                type="number"
                                min="0"
                                max="100"
                                style={{
                                  width: '72px',
                                  textAlign: 'right',
                                }}
                                id={`rate-${x.id}-${p.id}`}
                                value={rateOf(x.id, p.id)}
                                data-rate={`${x.id}|${p.id}`}
                              />
                            </label>
                          </td>
                        ) : (
                          <td key={_i} className="r muted small">
                            -
                          </td>
                        ),
                      ),
                    )}
                    <td className="r num">
                      <b className={t > 100 ? 'err' : ''}>{t}%</b>
                    </td>
                    <td className="r num">{eok(sum(ps.map((p) => (p.members.includes(x.id) ? monthly(x.id, p.id) : 0))))}</td>
                    <td>{t > 100 ? <span className="chip bad">100% 초과</span> : <span className="chip good">정상</span>}</td>
                  </tr>
                );
              }),
            )}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2}>과제별 월 계상액</td>
              {jn(
                tot.map((v, _i) => (
                  <td key={_i} className="r num">
                    {eok(v)}
                  </td>
                )),
              )}
              <td />
              <td className="r num">{eok(sum(tot))}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="small muted">과제 이름을 누르면 그 과제의 인건비(참여율) 화면으로 가요. 참여 인원 추가와 현금·현물 구분도 거기서 바꿔요. 급여는 직원·급여 메뉴에서 정해요.</p>
    </>
  );
}
export function SchedulePage() {
  const ps = byTeam(visible());
  const col = (p) => PCOL[visible().indexOf(p) % PCOL.length];
  const all = ps.flatMap((q) =>
    schedEvents(q).map((x) => ({
      ...x,
      q,
    })),
  );
  const pf = S.osp && S.osp !== 'all' && ps.some((q) => q.id === S.osp) ? S.osp : 'all';
  const subs = [...new Set<any>(all.filter((x) => pf === 'all' || x.q.id === pf).map((x) => x.sub))];
  const sf = S.osf && subs.includes(S.osf) ? S.osf : 'all';
  const ev = all.filter((x) => (pf === 'all' || x.q.id === pf) && (sf === 'all' || x.sub === sf));
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
  for (let i = 0; i < total; i++) {
    const d = new Date(lead.getFullYear(), lead.getMonth(), lead.getDate() + i);
    const ds = ymd(d);
    const xs = ev.filter((x) => x.date === ds);
    cells.push(
      <div className={`day ${d.getMonth() !== m ? 'out' : ''} ${ds === TODAY ? 'today' : ''}`}>
        <span className="dn">{d.getDate()}</span>
        {jn(
          xs.slice(0, 5).map((x, _i) => (
            <button key={_i} className={`mt st-${x.st}`} style={css(`border-left:4px solid ${col(x.q)}`)} data-a={x.act} data-x={x.id} title={`${x.q.name} · ${x.sub} · ${x.title}`}>
              <b>
                {x.time ? x.time + ' ' : ''}
                {x.q.short}
              </b>
              <span>
                {x.sub} · {x.title}
              </span>
            </button>
          )),
        )}
        {xs.length > 5 ? <span className="small muted">+{xs.length - 5}건</span> : null}
      </div>,
    );
  }
  const month = `${y}-${String(m + 1).padStart(2, '0')}`;
  const list = ev.filter((x) => x.date.startsWith(month));
  const lab = {
    done: '완료',
    plan: '예정',
    late: '지난 예정',
  };
  return (
    <>
      <div className="page-head">
        <div>
          <h2>일정표</h2>
          <p className="small muted">모든 과제의 일정관리(회의·야근·특근·출장·자문·연구활동비 집행)를 한 달력에서 봐요. 일정을 누르면 바로 열려요.</p>
        </div>
        <span className="small muted">{ps.length}개 과제</span>
      </div>
      {<TeamChips list={visible()} />}
      <div
        className="row"
        style={{
          flexWrap: 'wrap',
          gap: '6px',
          marginBottom: '6px',
        }}
      >
        <span className="small muted">과제</span>
        <div className="seg" role="group">
          {jn(
            [['all', '전체'], ...ps.map((q) => [q.id, q.short])].map(([k, l], _i) => (
              <button key={_i} data-a="ospF" data-x={k} aria-pressed={pf === k}>
                {k === 'all' ? null : <i className="pdot" style={css(`background:${col(proj(k))}`)} />}
                {l}
              </button>
            )),
          )}
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
            [['all', '전체'], ...subs.map((x) => [x, x])].map(([k, l], _i) => (
              <button key={_i} data-a="osfF" data-x={k} aria-pressed={sf === k}>
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
      <section>
        <h3 className="h3">
          {m + 1}월 일정 {list.length}건
        </h3>
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>날짜</th>
                <th>과제</th>
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
                    <td
                      style={{
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <i className="pdot" style={css(`background:${col(x.q)}`)} />
                      {x.q.short}
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
                  <td colSpan={7} className="muted">
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
export function Legend() {
  return (
    <div className="legend">
      <span>
        <i className="sw st-plan" />
        예비
      </span>
      <span>
        <i className="sw st-done" />
        완료
      </span>
      <span>
        <i className="sw st-late" />
        지난 예비 일정(완료 처리 필요)
      </span>
    </div>
  );
}

// 프로토타입 화면을 React 컴포넌트로 옮겼어요. 버튼·입력은 data-* 속성으로 core/actions의 A와 연결돼요.
import { apprOf, apvAttached, apvOrg } from '../../core/approval';
import { budgetOf, inCur, spentOf, subPlanOf } from '../../core/budget';
import { AFORMS, CAT, ITEMS } from '../../core/catalog';
import { docsFor, evState, evSum, evidRows, isPending, pendingApprovals } from '../../core/evidence';
import { peopleNames } from '../../core/meeting';
import { live, proj, teamOk, visible } from '../../core/org';
import { S } from '../../core/state';
import { eok, fdate, pct, short, sum, won } from '../../core/util';
import { TeamChips } from '../../ui/TeamChips';
import { ax, css, jb, jn } from '../../ui/jsx';
import { In, OxChip, OxSummary } from '../../ui/primitives';

export function ItemPage({ p, item }: any) {
  const B = budgetOf(p, S.view, item),
    X = spentOf(p, S.view, item);
  const all = S.entries.filter((e) => e.proj === p.id && e.org === S.view && e.item === item && inCur(e)).sort((a, b) => (a.date < b.date ? 1 : -1));
  const sp = subPlanOf(p)[item] || {};
  const subs = CAT[item].map((x) => x.s).filter((x) => all.some((e) => e.sub === x) || sp[x]);
  if (S.subf !== 'all' && !subs.includes(S.subf)) S.subf = 'all';
  const months = [...new Set<any>(all.map((e) => e.date.slice(0, 7)))].sort().reverse();
  const mf = months.includes(S.imf) ? S.imf : 'all';
  const bySub = S.subf === 'all' ? all : all.filter((e) => e.sub === S.subf);
  const rows = mf === 'all' ? bySub : bySub.filter((e) => e.date.startsWith(mf));
  const sumT =
    subs.length > 1 || Object.keys(sp).length ? (
      <div className="tw">
        <table>
          <thead>
            <tr>
              <th>세부유형</th>
              <th className="r">건수</th>
              <th className="r">집행액</th>
              <th className="r">연차 계획</th>
              <th>계획 대비</th>
              <th>증빙</th>
            </tr>
          </thead>
          <tbody>
            {jn(
              subs.map((x, _i) => {
                const es = all.filter((e) => e.sub === x);
                const amt = sum(es.map((e) => e.amount));
                const pl = sp[x] ? sum(sp[x]) * 1000 : null;
                const miss = es.filter((e) => !evSum(e).ok).length;
                return (
                  <tr key={_i}>
                    <td>
                      <button className="linkbtn" data-a="subFilter" data-x={x}>
                        {x}
                      </button>
                    </td>
                    <td className="r num">{es.length}</td>
                    <td className="r num">{eok(amt)}</td>
                    <td className="r num">{pl !== null ? eok(pl) : <span className="muted small">계획표에 없음</span>}</td>
                    <td className="num">
                      {pl ? (
                        <>
                          <span className="mini">
                            <i style={css(`width:${Math.min(100, pct(amt, pl))}%`)} />
                          </span>
                          {pct(amt, pl)}%
                        </>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>{es.length ? miss ? <span className="chip bad">미비 {miss}건</span> : <span className="chip good">완료</span> : '-'}</td>
                  </tr>
                );
              }),
            )}
          </tbody>
        </table>
      </div>
    ) : null;
  return (
    <>
      <div className="page-head">
        <div>
          <h2>{item}</h2>
          <p className="small muted">
            {p.short} · {S.orgs[S.view].short} 집행 내역
          </p>
        </div>
        <button className="btn primary" data-a="newEntry">
          집행 등록
        </button>
      </div>
      <div className="stats">
        <div>
          <span>예산</span>
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
      </div>
      {S.subf === 'all' ? sumT : null}
      <div className="seg" role="group" aria-label="세부유형 필터">
        <button data-a="subFilter" data-x="all" aria-pressed={S.subf === 'all'}>
          전체 {all.length}
        </button>
        {jn(
          subs.map((x, _i) => (
            <button key={_i} data-a="subFilter" data-x={x} aria-pressed={S.subf === x}>
              {x} {all.filter((e) => e.sub === x).length}
            </button>
          )),
        )}
      </div>
      <div
        className="row"
        style={{
          margin: '8px 0',
          gap: '8px',
          flexWrap: 'wrap',
        }}
      >
        <label
          className="row"
          htmlFor="imf"
          style={{
            gap: '6px',
          }}
        >
          <span className="small muted">월별 보기</span>
          <In
            as="select"
            id="imf"
            data-imf="1"
            style={{
              width: 'auto',
            }}
          >
            <option value="all">전체 월</option>
            {jn(
              months.map((m, _i) => (
                <option key={_i} value={m} {...ax(mf === m ? 'selected' : '')}>
                  {m.slice(0, 4)}년 {+m.slice(5, 7)}월 ({bySub.filter((e) => e.date.startsWith(m)).length}건)
                </option>
              )),
            )}
          </In>
        </label>
        {mf !== 'all' ? (
          <>
            <span className="small muted">
              {mf.slice(0, 4)}년 {+mf.slice(5, 7)}월 · {rows.length}건 · {won(sum(rows.map((e) => e.amount)))}
            </span>
            <button className="btn sm" data-a="imfClear">
              전체 월 보기
            </button>
          </>
        ) : null}
      </div>
      {S.subf !== 'all' && mf === 'all' ? (
        <p className="small muted">
          {S.subf} · {rows.length}건 · {won(sum(rows.map((e) => e.amount)))}
        </p>
      ) : null}
      {rows.length ? <EntryTable rows={rows} /> : <p className="small muted">이 달에 집행이 없어요.</p>}
    </>
  );
}
export function EntryTable({ rows, proj: showProj = false }: any) {
  return (
    <div className="tw">
      <table>
        <thead>
          <tr>
            <th>날짜</th>
            {showProj ? <th>과제</th> : null}
            <th>비목 · 세부유형</th>
            <th>내용</th>
            <th className="r">금액</th>
            <th>증빙 O/X</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {jn(
            rows.map((e, _i) => {
              const ds = docsFor(e);
              return (
                <tr key={_i} className={e.id === S.newEntry ? 'new' : ''}>
                  <td className="num">{fdate(e.date)}</td>
                  {showProj ? (
                    <td
                      style={{
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {proj(e.proj).short}
                    </td>
                  ) : null}
                  <td>
                    <span className="small muted">{e.item}</span>
                    <br />
                    {e.sub}
                  </td>
                  <td>
                    {e.desc}
                    {e.meeting ? (
                      <>
                        {' '}
                        <span className="chip info">회의 연결</span>
                      </>
                    ) : null}
                    {e.appr ? (
                      <>
                        {' '}
                        <button className="linkbtn small" data-a="apvOpen" data-x={e.appr}>
                          전자결재
                        </button>
                      </>
                    ) : null}
                    {peopleNames(e).length ? (
                      <>
                        {' '}
                        <span className="chip" title={peopleNames(e).join(', ')}>
                          인원 {peopleNames(e).length}
                        </span>
                      </>
                    ) : null}
                    {e.receipt ? (
                      <>
                        {' '}
                        <span className="chip good">앱 영수증</span>
                      </>
                    ) : null}
                  </td>
                  <td className="r num">{eok(e.amount)}</td>
                  <td
                    style={{
                      minWidth: '240px',
                    }}
                  >
                    <div className="ox">
                      {<OxSummary e={e} />}
                      {jn(ds.map((d, _i) => (d.kind === 'exempt' ? null : <OxChip key={_i} s={isPending(e, d) ? 'P' : evState(e, d)} label={short(d.n) + (apprOf(e, d) ? ' · 결재' : '')} />)))}
                    </div>
                  </td>
                  <td className="r">
                    <div
                      className="row"
                      style={{
                        justifyContent: 'flex-end',
                        flexWrap: 'nowrap',
                      }}
                    >
                      <button className="btn sm" data-a="openEvidence" data-x={e.id}>
                        증빙
                      </button>
                      <button className="btn sm" data-a="dlEntry" data-x={e.id}>
                        내려받기
                      </button>
                    </div>
                  </td>
                </tr>
              );
            }),
          ) || (
            <tr>
              <td colSpan={7} className="muted">
                해당하는 집행 내역이 없어요.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
export function EvidPage() {
  const all = S.entries.filter((e) => e.org === S.view && live(proj(e.proj)) && inCur(e) && teamOk(proj(e.proj)));
  const miss = all.filter((e) => !evSum(e).ok);
  const missDocs = sum(all.map((e) => evSum(e).x));
  const pend = pendingApprovals().length;
  return (
    <>
      <div className="page-head">
        <div>
          <h2>증빙 관리</h2>
          <p className="small muted">증빙은 플랫폼에서 작성하고, 내부결재는 전자결재로, 카드매출전표는 앱 영수증으로 채워요. 기준: 산업기술혁신사업 [별표 7]</p>
        </div>
      </div>
      {<TeamChips list={visible()} />}
      <div className="stats">
        <div>
          <span>집행 건수</span>
          <strong>{all.length}건</strong>
        </div>
        <div>
          <span>증빙 완료</span>
          <strong>{all.length - miss.length}건</strong>
        </div>
        <div className={miss.length ? 'bad' : ''}>
          <span>증빙 미비</span>
          <strong>
            {miss.length}건 · 서류 {missDocs}개
          </strong>
        </div>
        <div>
          <span>결재 진행 중</span>
          <strong>{pend}건</strong>
        </div>
      </div>
      {(() => {
        const done = S.appr.filter((a) => apvOrg(a) === S.view && a.status === '완료' && AFORMS.find((x) => x.id === a.fid)?.group === '연구행정');
        if (!done.length) return null;
        return (
          <section>
            <h3 className="h3">
              전자결재 완료 문서 <span className="muted small">결재 문서 원본이 그대로 연구비 증빙이 돼요</span>
            </h3>
            <div className="tw">
              <table>
                <thead>
                  <tr>
                    <th>승인일</th>
                    <th>양식</th>
                    <th>제목</th>
                    <th>문서번호</th>
                    <th>연결된 집행</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {jn(
                    done.map((a, _i) => {
                      const at = apvAttached(a);
                      const last = a.line[a.line.length - 1].date;
                      return (
                        <tr key={_i}>
                          <td className="num">{fdate(last || a.date)}</td>
                          <td className="small">{a.form}</td>
                          <td>
                            <button className="linkbtn" data-a="apvOpen" data-x={a.id}>
                              {a.title}
                            </button>
                          </td>
                          <td className="num small">{a.no}</td>
                          <td>
                            {at.length ? (
                              jb(
                                at.map((x, _i) => (
                                  <span key={_i} className="chip good">
                                    {proj(x.e.proj).short} {x.e.desc} · {short(x.n)}
                                  </span>
                                )),
                                ' ',
                              )
                            ) : (
                              <span className="chip warn">미연결</span>
                            )}
                          </td>
                          <td className="r">
                            {at.length ? (
                              <button className="btn sm" data-a="apvDl" data-x={a.id}>
                                A4 PDF
                              </button>
                            ) : (
                              <button className="btn sm primary" data-a="apvOpen" data-x={a.id}>
                                집행에 붙이기
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    }),
                  )}
                </tbody>
              </table>
            </div>
          </section>
        );
      })()}
      <div className="legend">
        <span>
          <i className="src form">플랫폼 작성</i> 서식을 채우면 A4 문서가 만들어져요
        </span>
        <span>
          <i className="src approval">전자결재</i> 결재가 끝나면 O
        </span>
        <span>
          <i className="src card">앱 영수증</i> 앱에서 찍은 영수증
        </span>
        <span>
          <i className="src">외부 서류</i> 세금계산서·계약서 등 첨부
        </span>
      </div>
      <div className="row between">
        <div className="seg" role="group" aria-label="과제">
          {jn(
            [['all', '전체 과제'], ...visible().map((p) => [p.id, p.short])].map(([k, l], _i) => (
              <button key={_i} data-a="evProj" data-x={k} aria-pressed={S.evf.proj === k}>
                {l}
              </button>
            )),
          )}
        </div>
        <div className="row">
          <label
            className="field"
            htmlFor="evItem"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span className="small">비목</span>
            <In
              as="select"
              id="evItem"
              data-a-change="evItem"
              style={{
                width: 'auto',
              }}
            >
              <option value="all">전체</option>
              {jn(
                ITEMS.map((i, _i) => (
                  <option key={_i} {...ax(S.evf.item === i ? 'selected' : '')}>
                    {i}
                  </option>
                )),
              )}
            </In>
          </label>{' '}
          {S.evf.item !== 'all' ? (
            <label
              className="field"
              htmlFor="evSub"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span className="small">세부유형</span>
              <In
                as="select"
                id="evSub"
                data-a-change="evSub"
                style={{
                  width: 'auto',
                }}
              >
                <option value="all">전체</option>
                {jn(
                  CAT[S.evf.item].map((x, _i) => (
                    <option key={_i} {...ax(S.evf.sub === x.s ? 'selected' : '')}>
                      {x.s}
                    </option>
                  )),
                )}
              </In>
            </label>
          ) : null}
          <div className="seg" role="group" aria-label="상태">
            {jn(
              [
                ['all', '전체'],
                ['miss', '미비만'],
                ['ok', '완료만'],
              ].map(([k, l], _i) => (
                <button key={_i} data-a="evSt" data-x={k} aria-pressed={S.evf.st === k}>
                  {l}
                </button>
              )),
            )}
          </div>
        </div>
      </div>
      {
        <EntryTable
          rows={evidRows()}
          {...{
            proj: true,
          }}
        />
      }
      <p className="small muted">‘내려받기’를 누르면 그 집행 건의 증빙이 모두 A4 크기 PDF로 만들어져 ZIP 하나로 내려받아져요. RCMS에서 해당 집행 건에 그대로 올리면 돼요.</p>
    </>
  );
}

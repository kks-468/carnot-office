// 프로토타입 화면을 React 컴포넌트로 옮겼어요. 버튼·입력은 data-* 속성으로 core/actions의 A와 연결돼요.
import { inY, yLabel, yearOf } from '../../core/budget';
import { ITEMS } from '../../core/catalog';
import { docVisibleAny, evSum, libScope } from '../../core/evidence';
import { archivedList, byTeam, isLead, joined, person, proj, teamOk } from '../../core/org';
import { S } from '../../core/state';
import { eok, fdate, pct, sum, won } from '../../core/util';
import { TeamChips } from '../../ui/TeamChips';
import { css, jn } from '../../ui/jsx';
import { OxSummary } from '../../ui/primitives';

export function LibraryPage() {
  const list = byTeam(archivedList());
  const [sid, sno] = String(S.libSel || '').split('|');
  if (sno) {
    const q = proj(sid);
    const y = yearOf(q, sno);
    if (q && y && joined(q, S.view)) return <LibDetail p={q} y={y} />;
  }
  const p = S.libSel && list.find((x) => x.id === S.libSel);
  if (p) return <LibDetail p={p} />;
  const yrs = S.projects
    .filter((q) => joined(q, S.view) && !q.archived && teamOk(q))
    .flatMap((q) =>
      (q.years || [])
        .filter((y) => y.closed)
        .map((y) => ({
          q,
          y,
        })),
    );
  return (
    <>
      <div className="page-head">
        <div>
          <h2>자료실</h2>
          <p className="small muted">끝난 과제와 마감한 연차의 제안서·보고서·회의록·결재 문서·증빙을 보관해요. 진행 중인 과제의 자료는 연구행정 관리의 각 과제 ‘총괄관리’에서 올려요.</p>
        </div>
      </div>
      {<TeamChips list={S.projects.filter((q) => joined(q, S.view) && (q.archived || (q.years || []).some((y) => y.closed)))} />}{' '}
      {list.length ? (
        <div className="cards">
          {jn(
            list.map((q, _i) => {
              const es = S.entries.filter((e) => e.proj === q.id && e.org === S.view);
              const ok = es.filter((e) => evSum(e).ok).length;
              return (
                <button key={_i} className="pcard" data-a="libOpen" data-x={q.id}>
                  <div className="row between">
                    <span className="chip">종료 · {q.short}</span>
                    <span className="small muted">이관 {fdate(q.archived.date)}</span>
                  </div>
                  <h3>{q.name}</h3>
                  <dl className="kv">
                    <dt>부처명</dt>
                    <dd>{q.ministry}</dd>
                    <dt>사업기간</dt>
                    <dd>
                      {fdate(q.start)}~{fdate(q.end)}
                    </dd>
                    <dt>문서</dt>
                    <dd>{S.docs.filter((d) => d.proj === q.id && docVisibleAny(d)).length}건</dd>
                    <dt>집행</dt>
                    <dd className="num">
                      {es.length}건 · {won(sum(es.map((e) => e.amount)))}
                    </dd>
                  </dl>
                  <div className="meter">
                    <i style={css(`width:${es.length ? pct(ok, es.length) : 0}%`)} />
                  </div>
                  <span className="small muted">
                    증빙 완료 {ok}/{es.length}건
                  </span>
                </button>
              );
            }),
          )}
        </div>
      ) : (
        <div className="notice">아직 보관된 과제가 없어요. 과제가 끝나면 연구행정 관리 → 과제 → 총괄관리의 ‘과제 종료 · 자료실로 옮기기’를 눌러 주세요.</div>
      )}
      <h3
        className="h3"
        style={{
          marginTop: '22px',
        }}
      >
        연차 정산 자료 <span className="muted small">진행 중인 과제의 마감된 연차</span>
      </h3>
      {yrs.length ? (
        <div className="cards">
          {jn(
            yrs.map(({ q, y }, _i) => {
              const es = S.entries.filter((e) => e.proj === q.id && e.org === S.view && inY(e, y));
              const ok = es.filter((e) => evSum(e).ok).length;
              return (
                <button key={_i} className="pcard" data-a="libOpen" data-x={`${q.id}|${y.no}`}>
                  <div className="row between">
                    <span className="chip info">
                      {y.no}차년도 · {q.short}
                    </span>
                    <span className="small muted">마감 {fdate(y.closed.date)}</span>
                  </div>
                  <h3>{q.name}</h3>
                  <dl className="kv">
                    <dt>연차 기간</dt>
                    <dd className="num">
                      {fdate(y.start)}~{fdate(y.end)}
                    </dd>
                    <dt>집행</dt>
                    <dd className="num">
                      {es.length}건 · {won(sum(es.map((e) => e.amount)))}
                    </dd>
                  </dl>
                  <div className="meter">
                    <i style={css(`width:${es.length ? pct(ok, es.length) : 0}%`)} />
                  </div>
                  <span className="small muted">
                    증빙 완료 {ok}/{es.length}건
                  </span>
                </button>
              );
            }),
          )}
        </div>
      ) : (
        <div className="notice">마감된 연차가 없어요. 연차가 끝나면 총괄관리의 ‘연차 관리’에서 마감해 주세요.</div>
      )}
    </>
  );
}
export function LibDetail({ p, y }: any) {
  const { es, docs, aps, bud, sp } = libScope(p, y);
  const lead = isLead(p);
  const key = y ? `${p.id}|${y.no}` : p.id;
  const byItem = ITEMS.map((i) => ({
    i,
    b: bud(i),
    x: sp(i),
  })).filter((r) => r.b || r.x);
  return (
    <>
      <div className="apv-bar">
        <div className="row">
          <button className="btn sm" data-a="libBack">
            ‹ 자료실
          </button>
          {y ? (
            <>
              <span className="chip info">
                {y.no}차년도 정산 · {p.short}
              </span>
              <span className="small muted">
                {fdate(y.closed.date)} 마감 · {person(y.closed.by)?.name || ''}
              </span>
            </>
          ) : (
            <>
              <span className="chip">종료 · {p.short}</span>
              <span className="small muted">
                {fdate(p.archived.date)} 이관 · {person(p.archived.by)?.name || ''}
              </span>
            </>
          )}
        </div>
        <div className="row">
          <button className="btn warm" data-a="libZip" data-x={key}>
            {y ? `${y.no}차년도 자료` : '전체 자료'} 내려받기 (ZIP)
          </button>
          {!y && lead ? (
            <button className="btn" data-a="libRestore" data-x={p.id}>
              진행 중으로 되돌리기
            </button>
          ) : null}
          {y && !p.archived ? (
            <button className="btn" data-a="openProject" data-x={p.id}>
              진행 중 과제로 가기
            </button>
          ) : null}
        </div>
      </div>
      <div className="page-head">
        <div>
          <h2>{p.name}</h2>
          <p className="small muted">
            {p.ministry} · {y ? yLabel(y) : `${fdate(p.start)}~${fdate(p.end)}`} · {p.team}
          </p>
        </div>
      </div>
      {!y && p.years?.length > 1 ? (
        <div
          className="row"
          style={{
            marginBottom: '12px',
          }}
        >
          <span className="small muted">연차별로 보기</span>
          {jn(
            p.years.map((z, _i) => (
              <button key={_i} className="btn sm" data-a="libOpen" data-x={`${p.id}|${z.no}`}>
                {z.no}차년도
              </button>
            )),
          )}
        </div>
      ) : null}
      <div className="stats">
        <div>
          <span>{y ? y.no + '차년도 ' : '총 '}예산</span>
          <strong>{won(bud())}</strong>
        </div>
        <div>
          <span>집행액</span>
          <strong>{won(sp())}</strong>
        </div>
        <div>
          <span>집행률</span>
          <strong>{pct(sp(), bud())}%</strong>
        </div>
        <div className={es.some((e) => !evSum(e).ok) ? 'bad' : ''}>
          <span>증빙 완료</span>
          <strong>
            {es.filter((e) => evSum(e).ok).length}/{es.length}건
          </strong>
        </div>
      </div>
      <section>
        <h3 className="h3">
          문서 <span className="muted small">{docs.length}건</span>
        </h3>
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>문서</th>
                <th>종류</th>
                <th>작성 기관</th>
                <th>날짜</th>
              </tr>
            </thead>
            <tbody>
              {jn(
                docs.map((d, _i) => (
                  <tr key={_i}>
                    <td>
                      <button className="linkbtn" data-a="openDoc" data-x={d.id}>
                        {d.name}
                      </button>
                    </td>
                    <td>{d.kind}</td>
                    <td>{S.orgs[d.org].short}</td>
                    <td className="num">{fdate(d.date)}</td>
                  </tr>
                )),
              ) || (
                <tr>
                  <td colSpan={4} className="muted">
                    문서가 없어요.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      {aps.length ? (
        <section>
          <h3 className="h3">
            전자결재 문서 <span className="muted small">{aps.length}건</span>
          </h3>
          <div className="tw">
            <table>
              <thead>
                <tr>
                  <th>문서번호</th>
                  <th>양식</th>
                  <th>제목</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {jn(
                  aps.map((a, _i) => (
                    <tr key={_i}>
                      <td className="num small">{a.no}</td>
                      <td className="small">{a.form}</td>
                      <td>{a.title}</td>
                      <td className="r">
                        <button className="btn sm" data-a="apvDl" data-x={a.id}>
                          A4 PDF
                        </button>
                      </td>
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
      <section>
        <h3 className="h3">비목별 결산</h3>
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>비목</th>
                <th className="r">예산</th>
                <th className="r">집행</th>
                <th className="r">잔액</th>
                <th className="r">집행률</th>
              </tr>
            </thead>
            <tbody>
              {jn(
                byItem.map((r, _i) => (
                  <tr key={_i}>
                    <td>{r.i}</td>
                    <td className="r num">{eok(r.b)}</td>
                    <td className="r num">{eok(r.x)}</td>
                    <td className="r num">{eok(r.b - r.x)}</td>
                    <td className="r num">{pct(r.x, r.b)}%</td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </div>
      </section>
      <section>
        <h3 className="h3">
          집행·증빙 <span className="muted small">{es.length}건</span>
        </h3>
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>날짜</th>
                <th>비목 · 세부유형</th>
                <th>내용</th>
                <th className="r">금액</th>
                <th>증빙</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {jn(
                es.map((e, _i) => (
                  <tr key={_i}>
                    <td className="num">{fdate(e.date)}</td>
                    <td>
                      <span className="small muted">{e.item}</span>
                      <br />
                      {e.sub}
                    </td>
                    <td>{e.desc}</td>
                    <td className="r num">{eok(e.amount)}</td>
                    <td>{<OxSummary e={e} />}</td>
                    <td className="r">
                      <button className="btn sm" data-a="dlEntry" data-x={e.id}>
                        A4 내려받기
                      </button>
                    </td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </div>
      </section>
      <p className="small muted">
        {y ? '마감된 연차 자료는 열람과 내려받기만 돼요. 이 연차의 집행 건은 진행 중 화면에 나오지 않아요.' : '보관된 과제는 열람과 내려받기만 돼요. 고쳐야 하면 ‘진행 중으로 되돌리기’를 눌러 주세요.'}
      </p>
    </>
  );
}

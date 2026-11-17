// 프로토타입 화면을 React 컴포넌트로 옮겼어요. 버튼·입력은 data-* 속성으로 core/actions의 A와 연결돼요.
import { budgetOf, curY, inCur, inY, inkOf, spentOf } from '../../core/budget';
import { ITEMS, TODAY } from '../../core/catalog';
import { docVisible, evSum } from '../../core/evidence';
import { monthOf, planRows } from '../../core/meeting';
import { isLead, part } from '../../core/org';
import { S } from '../../core/state';
import { eok, fdate, pct, sum, won } from '../../core/util';
import { ax, css, jn } from '../../ui/jsx';
import { In } from '../../ui/primitives';

export function ProjectSummary({ p }: any) {
  const b = budgetOf(p, S.view),
    s = spentOf(p, S.view);
  const K = inkOf(p, S.view);
  const lead = isLead(p);
  const es = S.entries.filter((e) => e.proj === p.id && e.org === S.view && inCur(e));
  const miss = es.filter((e) => !evSum(e).ok).length;
  const cy = curY(p);
  const myPart = part(p, S.view);
  return (
    <>
      <div className="page-head">
        <div>
          <h2>{p.name}</h2>
          <p className="small muted">
            {p.ministry} · {p.year}
          </p>
        </div>
        <div className="row">
          <button className="btn" data-a="newMeeting" data-x={p.id}>
            회의 예비 등록
          </button>
          <button className="btn primary" data-a="newEntryAny">
            집행 등록
          </button>
        </div>
      </div>
      <div className="stats">
        <div>
          <span>우리 기관 예산</span>
          <strong>{won(b)}</strong>
          <span className="small muted">
            현금 {eok(b - K)} · 현물 {eok(K)}
          </span>
        </div>
        <div>
          <span>집행액</span>
          <strong>{won(s)}</strong>
        </div>
        <div>
          <span>잔액</span>
          <strong>{won(b - s)}</strong>
        </div>
        <div className={miss ? 'bad' : ''}>
          <span>증빙 미비 집행</span>
          <strong>
            {miss}건 / {es.length}건
          </strong>
        </div>
      </div>
      {myPart?.status === '수락' && !b ? (
        <div className="notice warn row between">
          <span>
            <b>{cy ? cy.no + '차년도 ' : ''}예산이 아직 편성되지 않았어요.</b> 비목별 예산을 넣어야 잔액·집행률·월별 계획표가 계산돼요.
          </span>
          <button className="btn sm primary" data-a="budgetEdit" data-x={p.id}>
            예산 편성
          </button>
        </div>
      ) : null}
      <section>
        <div
          className="row between"
          style={{
            marginBottom: '8px',
          }}
        >
          <h3
            className="h3"
            style={{
              margin: 0,
            }}
          >
            비목별 현황
            {cy ? (
              <>
                {' '}
                <span className="muted small">{cy.no}차년도</span>
              </>
            ) : null}
          </h3>
          {myPart?.status === '수락' ? (
            <button className="btn sm" data-a="budgetEdit" data-x={p.id}>
              예산 편성
            </button>
          ) : null}
        </div>
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>비목</th>
                <th className="r">현금 예산</th>
                <th className="r">현물 예산</th>
                <th className="r">집행</th>
                <th className="r">잔액</th>
                <th>집행률</th>
                <th>증빙</th>
              </tr>
            </thead>
            <tbody>
              {jn(
                ITEMS.map((i, _i) => {
                  const B = budgetOf(p, S.view, i),
                    X = spentOf(p, S.view, i);
                  const Ki = inkOf(p, S.view, i);
                  const ie = es.filter((e) => e.item === i);
                  const im = ie.filter((e) => !evSum(e).ok).length;
                  return (
                    <tr key={_i}>
                      <td>
                        <button className="linkbtn" data-a="psub" data-x={i}>
                          {i}
                        </button>
                      </td>
                      <td className="r num">{eok(B - Ki)}</td>
                      <td className="r num">{Ki ? eok(Ki) : '-'}</td>
                      <td className="r num">{eok(X)}</td>
                      <td className="r num">{eok(B - X)}</td>
                      <td className="num">
                        <span className="mini">
                          <i style={css(`width:${Math.min(100, pct(X, B))}%`)} />
                        </span>
                        {pct(X, B)}%
                      </td>
                      <td>{ie.length ? im ? <span className="chip bad">미비 {im}건</span> : <span className="chip good">완료</span> : <span className="muted small">-</span>}</td>
                    </tr>
                  );
                }),
              )}
            </tbody>
            <tfoot>
              <tr>
                <td>합계</td>
                <td className="r num">{eok(b - K)}</td>
                <td className="r num">{eok(K)}</td>
                <td className="r num">{eok(s)}</td>
                <td className="r num">{eok(b - s)}</td>
                <td className="num">{pct(s, b)}%</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
      <section>
        <div
          className="row between"
          style={{
            marginBottom: '8px',
          }}
        >
          <div>
            <h3
              className="h3"
              style={{
                margin: 0,
              }}
            >
              제안서 · 보고서
            </h3>
            <p className="small muted">올린 자료는 AI 회의록·자문의견서의 근거로 쓰여요.</p>
          </div>
          <button className="btn sm primary" data-a="newDoc">
            제안서·보고서 올리기
          </button>
        </div>
        {(() => {
          const ds = S.docs.filter((d) => d.proj === p.id && docVisible(d) && ['제안서', '보고서', '계획서', '기타'].includes(d.kind)).sort((a, b) => (a.date < b.date ? 1 : -1));
          const kinds = ['제안서', '보고서', '계획서'];
          return (
            <>
              <div
                className="row"
                style={{
                  marginBottom: '8px',
                }}
              >
                {jn(
                  kinds.map((k, _i) => {
                    const n = ds.filter((d) => d.kind === k).length;
                    return (
                      <span key={_i} className={`chip ${n ? 'info' : 'warn'}`}>
                        {k} {n ? n + '건' : '없음'}
                      </span>
                    );
                  }),
                )}
              </div>
              <div className="tw">
                <table>
                  <thead>
                    <tr>
                      <th>문서</th>
                      <th>종류</th>
                      <th>작성 기관</th>
                      <th>공개 범위</th>
                      <th>버전</th>
                      <th>올린 날</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jn(
                      ds.map((d, _i) => (
                        <tr key={_i} className={d.isNew ? 'new' : ''}>
                          <td>
                            <button className="linkbtn" data-a="openDoc" data-x={d.id}>
                              {d.name}
                            </button>
                          </td>
                          <td>{d.kind}</td>
                          <td>{S.orgs[d.org].short}</td>
                          <td>{d.share === '전체' ? <span className="chip info">참여기관 전체</span> : <span className="chip">소속 기관만</span>}</td>
                          <td>{d.ver}</td>
                          <td className="num">{fdate(d.date)}</td>
                        </tr>
                      )),
                    ) || (
                      <tr>
                        <td colSpan={6} className="muted">
                          아직 올린 자료가 없어요. 제안서나 보고서를 올려 주세요.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          );
        })()}
      </section>
      {<YearSection p={p} lead={lead} />}
      <section className="card">
        <div className="row between">
          <div>
            <h3
              className="h3"
              style={{
                margin: 0,
              }}
            >
              과제 종료
            </h3>
            <p className="small muted">
              사업이 끝나면 이 과제의 제안서·보고서·회의록·결재 문서·증빙을 한꺼번에 자료실로 옮겨요. 옮긴 뒤에는 연구행정 관리 목록에서 빠지고 자료실에서 열람·내려받기만 할 수 있어요.
            </p>
          </div>
          {lead ? (
            <button className="btn" data-a="archiveAsk" data-x={p.id}>
              과제 종료 · 자료실로 옮기기
            </button>
          ) : (
            <span className="small muted">주관기관이 종료 처리해요</span>
          )}
        </div>
      </section>
      {!p.consortium ? (
        <section className="card">
          <div className="row between">
            <div>
              <h3
                className="h3"
                style={{
                  margin: 0,
                }}
              >
                과제 유형 · 단독 과제
              </h3>
              <p className="small muted">우리 기관만 수행하는 과제라 연구 관리에서만 보여요. 다른 기관과 함께하게 되면 연구단 과제로 바꿔 주세요.</p>
            </div>
            {lead ? (
              <button className="btn" data-a="consOn" data-x={p.id}>
                연구단 과제로 바꾸기
              </button>
            ) : null}
          </div>
        </section>
      ) : (
        <section>
          <div
            className="row between"
            style={{
              marginBottom: '8px',
            }}
          >
            <h3
              className="h3"
              style={{
                margin: 0,
              }}
            >
              참여기관 <span className="chip info">연구단 과제</span>{' '}
              <span className="small muted">
                코드 <b className="num">{p.code || ''}</b>
              </span>
            </h3>
            <div className="row">
              <button className="btn sm" data-a="teamOpen" data-x={p.id}>
                연구단 관리에서 보기
              </button>
              {lead ? (
                <button className="btn sm" data-a="inviteOrg">
                  참여기관 초대
                </button>
              ) : null}
              {lead && p.parts.length === 1 ? (
                <button className="btn sm" data-a="consOff" data-x={p.id}>
                  단독 과제로 되돌리기
                </button>
              ) : null}
            </div>
          </div>
          <div className="tw">
            <table>
              <thead>
                <tr>
                  <th>기관</th>
                  <th>역할</th>
                  <th>상태</th>
                  <th className="r">예산</th>
                  <th className="r">집행</th>
                  <th className="r">집행률</th>
                </tr>
              </thead>
              <tbody>
                {jn(
                  p.parts.map((q, _i) => {
                    const o = S.orgs[q.org];
                    const mine = q.org === S.view;
                    const can = mine || lead;
                    const B = q.status === '수락' ? sum(Object.values(q.budget)) : 0,
                      X = spentOf(p, q.org);
                    return (
                      <tr key={_i}>
                        <td>
                          {o.name}
                          {mine ? (
                            <>
                              {' '}
                              <span className="chip">우리 기관</span>
                            </>
                          ) : null}
                        </td>
                        <td>{q.role}</td>
                        <td>{q.status === '수락' ? <span className="chip good">참여 중</span> : <span className="chip warn">초대 중</span>}</td>
                        {q.status !== '수락' ? (
                          <td className="r muted" colSpan={3}>
                            수락 후 표시
                          </td>
                        ) : can ? (
                          <>
                            <td className="r num">{eok(B)}</td>
                            <td className="r num">{eok(X)}</td>
                            <td className="r num">{pct(X, B)}%</td>
                          </>
                        ) : (
                          <td className="r muted" colSpan={3}>
                            비공개
                          </td>
                        )}
                      </tr>
                    );
                  }),
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
export function YearSection({ p, lead }: any) {
  const ys = p.years || [];
  if (!ys.length) return null;
  const cy = curY(p);
  const last = cy && !p.endOpen && cy.end >= p.end;
  return (
    <section className="card">
      <div
        className="row between"
        style={{
          marginBottom: '8px',
        }}
      >
        <div>
          <h3
            className="h3"
            style={{
              margin: 0,
            }}
          >
            연차 관리
          </h3>
          <p className="small muted">과제는 하나로 두고 연차마다 마감해요. 마감한 연차의 집행·증빙·문서는 자료실 ‘연차 정산 자료’로 넘어가고, 다음 연차는 새 예산으로 시작해요.</p>
        </div>
        {lead && cy ? (
          last ? (
            <span className="small muted">마지막 연차예요. 끝나면 아래 ‘과제 종료’를 눌러 주세요.</span>
          ) : (
            <button className="btn" data-a="yearAsk" data-x={p.id}>
              {cy.no}차년도 마감 · 다음 연차 시작
            </button>
          )
        ) : lead ? null : (
          <span className="small muted">주관기관이 연차를 마감해요</span>
        )}
      </div>
      <div className="tw">
        <table>
          <thead>
            <tr>
              <th>연차</th>
              <th>기간</th>
              <th>상태</th>
              <th className="r">집행</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {jn(
              ys.map((y, _i) => {
                const es = S.entries.filter((e) => e.proj === p.id && e.org === S.view && inY(e, y));
                return (
                  <tr key={_i}>
                    <td>{y.no}차년도</td>
                    <td className="num small">
                      {lead && !y.closed ? (
                        <span
                          className="row"
                          style={{
                            gap: '4px',
                            flexWrap: 'nowrap',
                          }}
                        >
                          <label>
                            <span hidden>{y.no}차년도 시작일</span>
                            <In
                              id={`yd-s-${y.no}`}
                              type="date"
                              data-yd={`${p.id}|${y.no}|start`}
                              value={y.start}
                              style={{
                                width: 'auto',
                              }}
                            />
                          </label>
                          ~
                          <label>
                            <span hidden>{y.no}차년도 종료일</span>
                            <In
                              id={`yd-e-${y.no}`}
                              type="date"
                              data-yd={`${p.id}|${y.no}|end`}
                              value={y.end}
                              style={{
                                width: 'auto',
                              }}
                            />
                          </label>
                        </span>
                      ) : (
                        `${fdate(y.start)}~${fdate(y.end)}`
                      )}
                    </td>
                    <td>
                      {y.closed?.prior ? (
                        <span className="chip">등록 전 연차</span>
                      ) : y.closed ? (
                        <span className="chip">마감 {fdate(y.closed.date)}</span>
                      ) : y.no === p.cur ? (
                        <span className="chip good">진행 중</span>
                      ) : (
                        <span className="chip">예정</span>
                      )}
                    </td>
                    <td className="r num">
                      {es.length}건 · {eok(sum(es.map((e) => e.amount)))}
                    </td>
                    <td className="r">
                      {y.closed && !y.closed.prior ? (
                        <button className="btn sm" data-a="libOpen" data-x={`${p.id}|${y.no}`}>
                          자료실에서 보기
                        </button>
                      ) : null}
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
}
export function MplanSection({ p, lead }: any) {
  const cy = curY(p);
  if (!cy) return null;
  const rows = planRows(p, cy.no);
  const mi = monthOf(p, TODAY);
  const nowM = mi && mi.y.no === cy.no ? mi.m : 0;
  const bar = (r) => (
    <div className="mbar">
      {Array.from(
        {
          length: 12,
        },
        (_, i) => <i className={`${i + 1 >= r.m1 && i + 1 <= r.m2 ? 'on' : ''} ${i + 1 === nowM ? 'now' : ''}`} />,
      ).join('')}
    </div>
  );
  const inp = (i, k, v, w, type = 'text') =>
    lead ? (
      <label>
        <span hidden>{k}</span>
        <In id={`mp-${k}-${i}`} type={type} data-mp={`${i}|${k}`} value={v} {...ax(type === 'number' ? 'min="1" max="12"' : '')} style={css(`width:${w}`)} />
      </label>
    ) : (
      v
    );
  return (
    <section className="card">
      <div
        className="row between"
        style={{
          marginBottom: '8px',
        }}
      >
        <div>
          <h3
            className="h3"
            style={{
              margin: 0,
            }}
          >
            월차별 추진 일정{' '}
            <span className="muted small">
              {cy.no}차년도{nowM ? ` · 지금 ${nowM}월차` : ''}
            </span>
          </h3>
          <p className="small muted">제안서·사업계획서의 연차 추진 일정이에요. AI 회의록은 회의 날짜가 몇 월차인지 보고 그 월차 연구내용과 참석 전문가를 묶어 회의 목적을 써요.</p>
        </div>
        {lead ? (
          <div className="row">
            <button className="btn sm" data-a="mpExtract" data-x={p.id} {...ax(S.mpGen ? 'disabled' : '')}>
              {S.mpGen ? '제안서를 읽는 중…' : '제안서에서 AI로 불러오기'}
            </button>
            <button className="btn sm" data-a="mpAdd" data-x={p.id}>
              + 일정
            </button>
          </div>
        ) : null}
      </div>
      <div className="tw">
        <table>
          <thead>
            <tr>
              <th>월차</th>
              <th
                style={{
                  minWidth: '150px',
                }}
              >
                {Array.from(
                  {
                    length: 12,
                  },
                  (_, i) => <span className={`mhd ${i + 1 === nowM ? 'now' : ''}`}>{i + 1}</span>,
                ).join('')}
              </th>
              <th>연구내용</th>
              <th>세부 내용</th>
              <th>담당</th>
              {lead ? <th /> : null}
            </tr>
          </thead>
          <tbody>
            {jn(
              rows.map((r, i) => (
                <tr key={i} className={nowM >= r.m1 && nowM <= r.m2 ? 'mp-now' : ''}>
                  <td
                    className="num"
                    style={{
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {inp(i, 'm1', r.m1, '52px', 'number')} ~ {inp(i, 'm2', r.m2, '52px', 'number')}
                  </td>
                  <td>{bar(r)}</td>
                  <td>{inp(i, 'task', r.task, '180px')}</td>
                  <td>{inp(i, 'detail', r.detail, '260px')}</td>
                  <td>
                    {lead ? (
                      <label>
                        <span hidden>담당</span>
                        <In
                          as="select"
                          id={`mp-org-${i}`}
                          data-mp={`${i}|org`}
                          style={{
                            width: 'auto',
                          }}
                        >
                          {jn(
                            p.parts
                              .filter((q) => q.status === '수락')
                              .map((q, _i) => (
                                <option key={_i} value={q.org} {...ax(r.org === q.org ? 'selected' : '')}>
                                  {S.orgs[q.org].short}
                                </option>
                              )),
                          )}
                        </In>
                      </label>
                    ) : (
                      S.orgs[r.org]?.short || ''
                    )}
                  </td>
                  {lead ? (
                    <td className="r">
                      <button className="btn sm" data-a="mpRm" data-x={`${p.id}|${i}`}>
                        빼기
                      </button>
                    </td>
                  ) : null}
                </tr>
              )),
            ) || (
              <tr>
                <td colSpan={6} className="muted">
                  아직 추진 일정이 없어요. 제안서에서 불러오거나 직접 추가해 주세요.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

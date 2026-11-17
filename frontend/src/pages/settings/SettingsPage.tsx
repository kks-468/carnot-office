// 프로토타입 화면을 React 컴포넌트로 옮겼어요. 버튼·입력은 data-* 속성으로 core/actions의 A와 연결돼요.
import { defaultLine, lineNorm, lineSteps, resolveSteps, stepsLabel } from '../../core/approval';
import { AFORMS, CAT, ITEMS, LTYPES, SET_TABS, SRC_LABEL } from '../../core/catalog';
import { srcOf } from '../../core/evidence';
import { deptHead, exemptOrg, forProfit, lvName, lvRank, me, memberKinds, orgCfg, person, ukRank, ukinds, unitChain, unitKind, unitOrder, unitPath } from '../../core/org';
import { S } from '../../core/state';
import { eok } from '../../core/util';
import { LeavePage } from '../staff/StaffPage';
import { ax, css, jb, jn } from '../../ui/jsx';
import { In } from '../../ui/primitives';

export function SettingsPage() {
  const o = S.orgs[S.view];
  const tab = S.setTab || 'org';
  const n = S.people.filter((p) => p.org === S.view).length;
  const head = (
    <div className="page-head">
      <div>
        <h2>{o.name}</h2>
        <p className="small muted">
          {o.type} · 구성원 {n}명
        </p>
      </div>
    </div>
  );
  if (tab === 'leave')
    return (
      <>
        {head}
        <LeavePage />
      </>
    );
  if (tab === 'org')
    return (
      <>
        {head}
        <section
          className="card row"
          style={{
            gap: '16px',
            alignItems: 'center',
            flexWrap: 'wrap',
            marginBottom: '14px',
          }}
        >
          <div className="logoprev">{o.logo ? <img src={o.logo} alt="기관 로고" /> : <span className="small muted">로고 없음</span>}</div>
          <div
            style={{
              flex: '1',
              minWidth: '200px',
            }}
          >
            <b>기관 로고</b>
            <p
              className="small muted"
              style={{
                margin: '2px 0 8px',
              }}
            >
              올리면 왼쪽 메뉴 맨 위에 우리 기관 로고가 표시돼요. 가로형 PNG·SVG를 추천해요.
            </p>
            <div className="row">
              <label className="btn sm" htmlFor="logo-up">
                {o.logo ? '로고 바꾸기' : '로고 올리기'}
                <In id="logo-up" type="file" accept="image/*" hidden data-a-change="logoUp" />
              </label>
              {o.logo ? (
                <button className="btn sm" data-a="logoRm">
                  지우기
                </button>
              ) : null}
            </div>
          </div>
        </section>
        <dl
          className="kv"
          style={{
            gridTemplateColumns: '110px 1fr',
            fontSize: '13.5px',
          }}
        >
          <dt>회사 아이디</dt>
          <dd className="num">{o.code || '-'}</dd>
          <dt>{o.numType}</dt>
          <dd className="num">{o.number}</dd>
          <dt>결재선</dt>
          <dd>기안 → {stepsLabel(orgCfg(S.view), orgCfg(S.view).lineTpl)}</dd>
        </dl>
        {<OrgSettings />}
      </>
    );
  if (tab === 'members')
    return (
      <>
        {head}
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
              구성원
            </h3>
            <div className="row">
              <span className="small muted">로그인 계정·급여는 업무 지원 → 직원·급여에서 관리해요</span>
              <button className="btn sm primary" data-a="newStaff">
                + 직원 계정 만들기
              </button>
            </div>
          </div>
          <div className="tw">
            <table>
              <thead>
                <tr>
                  <th>이름</th>
                  <th>아이디</th>
                  <th>직급</th>
                  {jn(memberKinds(orgCfg(S.view)).map((k, _i) => <th key={_i}>{k}</th>))}
                  <th>직위</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const o = orgCfg(S.view);
                  const ks = memberKinds(o);
                  return jn(
                    S.people
                      .filter((p) => p.org === S.view)
                      .map((p, _i) => (
                        <tr key={_i}>
                          <td>
                            {p.name}
                            {p.acct && p.acct !== '활성' ? (
                              <>
                                {' '}
                                <span className={`chip ${p.acct === '가입 신청' ? 'bad' : 'warn'}`}>{p.acct}</span>
                              </>
                            ) : null}
                          </td>
                          <td className="num small">{p.login || ''}</td>
                          <td className="small muted">{p.role}</td>
                          {jn(ks.map((k, _i) => <td key={_i}>{<MemberKindSel o={o} p={p} k={k} />}</td>))}
                          <td>
                            <label>
                              <span hidden>{p.name} 직위</span>
                              <In as="select" id={`pl-${p.id}`} data-pl={p.id}>
                                {jn(
                                  o.levels.map((l, _i) => (
                                    <option key={_i} value={l.k} {...ax(l.k === p.level ? 'selected' : '')}>
                                      {l.n}
                                    </option>
                                  )),
                                )}
                              </In>
                            </label>
                          </td>
                        </tr>
                      )),
                  );
                })()}
              </tbody>
            </table>
          </div>
        </section>
      </>
    );
  if (tab === 'line')
    return (
      <>
        {head}
        <LineSettings part={'line'} />
      </>
    );
  return (
    <>
      {head}
      <dl
        className="kv"
        style={{
          gridTemplateColumns: '110px 1fr',
          fontSize: '13.5px',
        }}
      >
        <dt>증빙 기준</dt>
        <dd>산업기술혁신사업 [별표 7] · {exemptOrg(o) ? '대학·연구기관 면제 규정 적용' : forProfit(o) ? '영리기관 추가 서류 적용' : '기본'}</dd>
      </dl>
      <section>
        <h3 className="h3">회의비 기준</h3>
        <label
          className="field"
          htmlFor="limit"
          style={{
            maxWidth: '220px',
          }}
        >
          <span>1인당 한도(원)</span>
          <In id="limit" type="number" value={o.limit} data-limit="1" />
          <small>시연용 값이에요.</small>
        </label>
      </section>
      <section className="card">
        <h3 className="h3">비목·세부유형별 증빙 목록</h3>
        <p className="small muted">산업기술혁신사업 [별표 7] 요약. 각 서류의 출처를 함께 표시해요.</p>
        {jn(
          ITEMS.map((i, _i) => (
            <details key={_i} className="cat">
              <summary>
                {i} <span className="muted small">세부유형 {CAT[i].length}개</span>
              </summary>
              {jn(
                CAT[i].map((s, _i) => (
                  <>
                    <p
                      className="small"
                      style={{
                        marginTop: '8px',
                      }}
                    >
                      <b>{s.s}</b>
                      {s.note ? (
                        <>
                          {' '}
                          <span className="muted">{s.note}</span>
                        </>
                      ) : null}
                    </p>
                    <ul>
                      {jn(
                        s.d.map((r, _i) => {
                          const d =
                            typeof r === 'string'
                              ? {
                                  n: r,
                                }
                              : r;
                          return (
                            <li key={_i}>
                              {d.n} <i className={`src ${srcOf(d.n)}`}>{SRC_LABEL[srcOf(d.n)]}</i>
                              {d.opt ? (
                                <>
                                  {' '}
                                  <span className="muted">({d.opt})</span>
                                </>
                              ) : null}
                              {d.min ? (
                                <>
                                  {' '}
                                  <span className="muted">({d.note})</span>
                                </>
                              ) : null}
                              {d.fp ? (
                                <>
                                  {' '}
                                  <span className="muted">(영리기관)</span>
                                </>
                              ) : null}
                              {d.np ? (
                                <>
                                  {' '}
                                  <span className="muted">(대학·연구기관 면제 가능)</span>
                                </>
                              ) : null}
                            </li>
                          );
                        }),
                      )}
                    </ul>
                  </>
                )),
              )}
            </details>
          )),
        )}
      </section>
    </>
  );
}
export function SetTabs() {
  return jn(
    SET_TABS.map(([k, l], _i) => (
      <button key={_i} data-a="setTab" data-x={k} aria-current={(S.setTab || 'org') === k}>
        {l}
      </button>
    )),
  );
}
export function OrgSettings() {
  const org = S.view;
  const o = orgCfg(org);
  const ps = S.people.filter((p) => p.org === org && !p.admin);
  const rows = unitOrder(o);
  const lv = (
    <div>
      <b
        style={{
          fontSize: '13.5px',
        }}
      >
        직위 단계
      </b>{' '}
      <span className="small muted">위가 높은 단계예요</span>
      <div
        className="aline"
        style={{
          marginTop: '6px',
        }}
      >
        {jn(
          o.levels.map((l, i) => (
            <div
              key={i}
              className="ar"
              style={{
                gridTemplateColumns: '28px minmax(0,1fr) auto auto',
              }}
            >
              <span className="no">{i + 1}</span>
              <label>
                <span hidden>단계 이름</span>
                <In id={`lvn-${i}`} type="text" data-lvn={i} value={l.n} />
              </label>
              <span
                className="small muted"
                style={{
                  whiteSpace: 'nowrap',
                }}
              >
                {ps.filter((p) => p.level === l.k).length}명
              </span>
              <span className="ops">
                <button type="button" data-a="lvMv" data-x={`${i}|-1`} aria-label="위로" {...ax(i === 0 ? 'disabled' : '')}>
                  ↑
                </button>
                <button type="button" data-a="lvMv" data-x={`${i}|1`} aria-label="아래로" {...ax(i === o.levels.length - 1 ? 'disabled' : '')}>
                  ↓
                </button>
                <button type="button" data-a="lvRm" data-x={i} aria-label="단계 빼기" {...ax(o.levels.length <= 2 ? 'disabled' : '')}>
                  ×
                </button>
              </span>
            </div>
          )),
        )}
      </div>
      <button
        className="btn sm"
        data-a="lvAdd"
        style={{
          marginTop: '8px',
        }}
      >
        + 단계 추가
      </button>
    </div>
  );
  const tree = (n) => {
    const u = o.units.find((x) => x.name === n);
    const ch = o.units.filter((x) => x.parent === n);
    const ms = ps.filter((p) => p.unit === n).sort((a, b) => lvRank(o, a.level) - lvRank(o, b.level));
    const h = deptHead(org, n, null);
    return (
      <li>
        <b>{n}</b> <span className="chip">{unitKind(u)}</span>{' '}
        {h && !ms.includes(h) ? (
          <>
            <span
              className="pchip"
              style={{
                paddingRight: '10px',
              }}
            >
              ★ {h.name} <small>부서장(겸)</small>
            </span>{' '}
          </>
        ) : null}
        {jb(
          ms.map((p, _i) => (
            <span
              key={_i}
              className="pchip"
              style={{
                paddingRight: '10px',
              }}
            >
              {p === h ? '★ ' : ''}
              {p.name} <small>{lvName(o, p.level)}</small>
            </span>
          )),
          ' ',
        )}
        {ch.length ? <ul>{jn(ch.map((c) => tree(c.name)))}</ul> : null}
      </li>
    );
  };
  const root = rows[0]?.u.name;
  return (
    <section
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      <div>
        <h3
          className="h3"
          style={{
            margin: 0,
          }}
        >
          조직도와 직위
        </h3>
        <p className="small muted">본부·팀 같은 부서 구조와 직위 단계(예: 대표 · 본부장 · 팀장 · 직원)를 정해요. 결재선은 이 구조를 따라 자동으로 찾아가요. ★는 부서장이에요.</p>
      </div>
      <div
        className="grid2"
        style={{
          alignItems: 'start',
        }}
      >
        {lv}
        <div>
          <b
            style={{
              fontSize: '13.5px',
            }}
          >
            조직도 미리보기
          </b>
          <ul
            className="small"
            style={{
              margin: '6px 0 0',
              paddingLeft: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              lineHeight: '2',
            }}
          >
            {root ? tree(root) : null}
          </ul>
        </div>
      </div>
      <div>
        <div
          className="row between"
          style={{
            marginBottom: '6px',
          }}
        >
          <b
            style={{
              fontSize: '13.5px',
            }}
          >
            조직 단위와 조직 위계
          </b>
          <span className="small muted">위에 있을수록 큰 단위예요 · 부서는 자기보다 큰 단위 아래에만 둘 수 있어요</span>
        </div>
        <div
          className="row"
          style={{
            flexWrap: 'wrap',
            gap: '8px',
            alignItems: 'stretch',
          }}
        >
          {jn(
            ukinds(o).map((k, i) => {
              const n = o.units.filter((u) => unitKind(u) === k).length;
              return (
                <div key={i} className="ukbox">
                  <span className="no">{i + 1}</span>
                  <label>
                    <span hidden>단위 이름</span>
                    <In
                      id={`ukn-${i}`}
                      type="text"
                      data-ukn={i}
                      value={k}
                      style={{
                        width: '90px',
                      }}
                    />
                  </label>
                  <span className="small muted">{n}개</span>
                  <span className="ops">
                    <button type="button" data-a="ukMv" data-x={`${i}|-1`} aria-label="위로" {...ax(i === 0 ? 'disabled' : '')}>
                      ↑
                    </button>
                    <button type="button" data-a="ukMv" data-x={`${i}|1`} aria-label="아래로" {...ax(i === ukinds(o).length - 1 ? 'disabled' : '')}>
                      ↓
                    </button>
                    <button type="button" data-a="ukRm" data-x={i} aria-label="단위 빼기" {...ax(n ? 'disabled title="이 단위를 쓰는 부서가 있어요"' : '')}>
                      ×
                    </button>
                  </span>
                </div>
              );
            }),
          )}
          <div className="ukbox">
            <label>
              <span hidden>새 단위</span>
              <In
                id="uk-new"
                type="text"
                data-b="uk_new"
                value={S.f.uk_new || ''}
                placeholder="예: 사업부"
                style={{
                  width: '90px',
                }}
              />
            </label>
            <button className="btn sm" data-a="ukAdd">
              + 추가
            </button>
          </div>
        </div>
      </div>
      <div>
        <div
          className="row between"
          style={{
            marginBottom: '6px',
          }}
        >
          <b
            style={{
              fontSize: '13.5px',
            }}
          >
            부서 편집
          </b>
          <span className="small muted">이름·유형·상위 부서·부서장을 바로 고칠 수 있어요</span>
        </div>
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>부서명</th>
                <th>유형</th>
                <th>상위 부서</th>
                <th>부서장</th>
                <th className="r">인원</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {jn(
                rows.map(({ u, d }, _i) => {
                  const i = o.units.indexOf(u);
                  const isRoot = !u.parent;
                  const n = ps.filter((p) => p.unit === u.name).length;
                  const auto = deptHead(org, u.name, null);
                  return (
                    <tr key={_i}>
                      <td>
                        <div
                          className="row"
                          style={{
                            flexWrap: 'nowrap',
                            gap: '4px',
                          }}
                        >
                          <span style={css(`width:${d * 16}px;flex:none`)} aria-hidden="true" />
                          {d ? (
                            <span className="muted" aria-hidden="true">
                              └
                            </span>
                          ) : null}
                          <label
                            style={{
                              flex: '1',
                            }}
                          >
                            <span hidden>부서 이름</span>
                            <In
                              id={`un-${i}`}
                              type="text"
                              data-un={i}
                              value={u.name}
                              style={{
                                minWidth: '140px',
                              }}
                            />
                          </label>
                        </div>
                      </td>
                      <td>
                        {isRoot ? (
                          <span className="chip">기관</span>
                        ) : (
                          <label>
                            <span hidden>유형</span>
                            <In
                              as="select"
                              id={`uk-${i}`}
                              data-uk={i}
                              style={{
                                width: 'auto',
                              }}
                            >
                              {jn(
                                ukinds(o).map((k, _i) => (
                                  <option key={_i} {...ax(unitKind(u) === k ? 'selected' : '')}>
                                    {k}
                                  </option>
                                )),
                              )}
                              {ukinds(o).includes(unitKind(u)) ? null : <option selected>{unitKind(u)}</option>}
                            </In>
                          </label>
                        )}
                      </td>
                      <td>
                        {isRoot ? (
                          <span className="small muted">최상위</span>
                        ) : (
                          <>
                            <label>
                              <span hidden>상위 부서</span>
                              <In
                                as="select"
                                id={`up-${i}`}
                                data-up={i}
                                style={{
                                  width: 'auto',
                                }}
                              >
                                {jn(
                                  o.units
                                    .filter((x) => x !== u && !unitChain(o, x.name).includes(u.name) && (x.name === u.parent || ukRank(o, unitKind(x)) < ukRank(o, unitKind(u))))
                                    .map((x, _i) => (
                                      <option key={_i} {...ax(x.name === u.parent ? 'selected' : '')}>
                                        {x.name}
                                      </option>
                                    )),
                                )}
                              </In>
                            </label>
                            {(() => {
                              const pu = o.units.find((x) => x.name === u.parent);
                              return pu && ukRank(o, unitKind(pu)) >= ukRank(o, unitKind(u)) ? (
                                <>
                                  {' '}
                                  <span className="chip warn" title="조직 위계와 맞지 않아요">
                                    위계 확인
                                  </span>
                                </>
                              ) : null;
                            })()}
                          </>
                        )}
                      </td>
                      <td>
                        <label>
                          <span hidden>부서장</span>
                          <In
                            as="select"
                            id={`uh-${i}`}
                            data-uh={i}
                            style={{
                              width: 'auto',
                            }}
                          >
                            <option value="">자동 (최고 직위{auto && !u.head ? ` · ${auto.name}` : ''})</option>
                            {jn(
                              ps.map((p, _i) => (
                                <option key={_i} value={p.id} {...ax(u.head === p.id ? 'selected' : '')}>
                                  {p.name} · {p.unit || ''}
                                </option>
                              )),
                            )}
                          </In>
                        </label>
                      </td>
                      <td className="r num">{n}명</td>
                      <td className="r">
                        {isRoot ? null : (
                          <button className="btn sm" data-a="unRm" data-x={i}>
                            빼기
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
        <div
          className="row"
          style={{
            marginTop: '8px',
            flexWrap: 'wrap',
          }}
        >
          <label
            htmlFor="un-new"
            style={{
              flex: '1',
              minWidth: '160px',
            }}
          >
            <span hidden>새 부서</span>
            <In id="un-new" type="text" data-b="un_name" value={S.f.un_name || ''} placeholder="새 부서 이름 (예: 연구개발본부)" />
          </label>{' '}
          <label>
            <span hidden>유형</span>
            <In
              as="select"
              id="un-kind"
              data-b="un_kind"
              data-r="1"
              style={{
                width: 'auto',
              }}
            >
              {jn(
                ukinds(o).map((k, _i) => (
                  <option key={_i} {...ax((S.f.un_kind || ukinds(o)[0]) === k ? 'selected' : '')}>
                    {k}
                  </option>
                )),
              )}
            </In>
          </label>{' '}
          <label>
            <span hidden>상위 부서</span>
            <In
              as="select"
              id="un-parent"
              style={{
                width: 'auto',
              }}
            >
              {jn(rows.filter(({ u }) => ukRank(o, unitKind(u)) < ukRank(o, S.f.un_kind || ukinds(o)[0])).map(({ u }, _i) => <option key={_i}>{u.name}</option>))}
            </In>
          </label>{' '}
          <button className="btn sm primary" data-a="unAdd">
            + 부서 추가
          </button>
        </div>
      </div>
    </section>
  );
}
export function MemberKindSel({ o, p, k }: any) {
  const path = unitPath(o, p.unit);
  const r = ukRank(o, k);
  const cur = path.find((u) => u.parent && unitKind(u) === k);
  const anc = [...path].reverse().find((u) => !u.parent || ukRank(o, unitKind(u)) < r);
  const opts = o.units.filter((u) => u.parent && unitKind(u) === k && (!anc || unitPath(o, u.name).includes(anc)));
  return (
    <label>
      <span hidden>
        {p.name} {k}
      </span>
      <In
        as="select"
        id={`puk-${p.id}-${k}`}
        data-puk={`${p.id}|${k}`}
        style={{
          minWidth: '96px',
        }}
      >
        <option value="">—</option>
        {jn(
          opts.map((u, _i) => (
            <option key={_i} {...ax(cur === u ? 'selected' : '')}>
              {u.name}
            </option>
          )),
        )}
      </In>
    </label>
  );
}
export function StepEditor({ ctx, steps, o }: any) {
  const nt = lineNorm(
    steps.map((x) => ({
      type: x.type || '결재',
    })),
  );
  const opt = (x) => (
    <>
      <optgroup label="직위 (기안자 소속 라인에서 찾아요)">
        {jn(
          o.levels.map((l, _i) => (
            <option key={_i} value={`lv:${l.k}`} {...ax(x && x.lv === l.k ? 'selected' : '')}>
              {l.n}
            </option>
          )),
        )}
      </optgroup>
      <optgroup label="특정 부서장">
        {jn(
          o.units.map((u, _i) => (
            <option key={_i} value={`dept:${u.name}`} {...ax(x && x.dept === u.name ? 'selected' : '')}>
              {u.name} 부서장
            </option>
          )),
        )}
      </optgroup>
    </>
  );
  return (
    <>
      <div className="aline">
        <div
          className="ar"
          style={{
            background: 'var(--sunk)',
            gridTemplateColumns: '28px 92px minmax(0,1fr)',
          }}
        >
          <span className="no">1</span>
          <span className="chip">기안</span>
          <span className="small muted">결재를 올리는 사람</span>
        </div>
        {jn(
          steps.map((x, i) => (
            <div
              key={i}
              className="ar"
              style={{
                gridTemplateColumns: '28px minmax(0,1fr) 92px auto',
              }}
            >
              <span className="no">{i + 2}</span>
              <label>
                <span hidden>단계 {i + 2}</span>
                <In as="select" id={`stt-${ctx}-${i}`} data-stt={`${ctx}|${i}`}>
                  {opt(x)}
                </In>
              </label>
              <label>
                <span hidden>결재 종류</span>
                <In as="select" id={`sty-${ctx}-${i}`} data-sty={`${ctx}|${i}`}>
                  {jn(
                    LTYPES.map((k, _i) => (
                      <option key={_i} {...ax(nt[i].type === k ? 'selected' : '')}>
                        {k}
                      </option>
                    )),
                  )}
                </In>
              </label>
              <span className="ops">
                <button type="button" data-a="stMv" data-x={`${ctx}|${i}|-1`} aria-label="위로" {...ax(i === 0 ? 'disabled' : '')}>
                  ↑
                </button>
                <button type="button" data-a="stMv" data-x={`${ctx}|${i}|1`} aria-label="아래로" {...ax(i === steps.length - 1 ? 'disabled' : '')}>
                  ↓
                </button>
                <button type="button" data-a="stRm" data-x={`${ctx}|${i}`} aria-label="빼기">
                  ×
                </button>
              </span>
            </div>
          )),
        )}
      </div>
      <label
        className="field"
        htmlFor={`stadd-${ctx}`}
        style={{
          marginTop: '8px',
          maxWidth: '360px',
        }}
      >
        <span hidden>단계 추가</span>
        <In as="select" id={`stadd-${ctx}`} data-stadd={ctx}>
          <option value="">+ 결재 단계 추가</option>
          {opt(null)}
        </In>
      </label>
    </>
  );
}
export function OrgTree({ o, name, depth }: any) {
  const ch = o.units.filter((u) => u.parent === name);
  const ms = S.people.filter((p) => p.org === S.view && p.unit === name).sort((a, b) => lvRank(o, a.level) - lvRank(o, b.level));
  return (
    <li>
      <b>{name}</b>{' '}
      {jb(
        ms.map((p, _i) => (
          <span
            key={_i}
            className="pchip"
            style={{
              paddingRight: '10px',
            }}
          >
            {p.name} <small>{lvName(o, p.level)}</small>
          </span>
        )),
        ' ',
      )}
      {ch.length ? <ul>{jn(ch.map((c, _i) => <OrgTree key={_i} o={o} name={c.name} depth={depth + 1} />))}</ul> : null}
    </li>
  );
}
export function LineSettings({ part }: any) {
  const org = S.view;
  const o = orgCfg(org);
  const ps = S.people.filter((p) => p.org === org);
  const root = o.units.find((u) => !u.parent)?.name || o.units[0].name;
  const sel = S.ls.form;
  const fsel = AFORMS.find((x) => x.id === sel);
  const simP = ps.find((p) => p.id === S.ls.simP) || me();
  const steps = lineSteps(org, S.ls.simF, +S.ls.simAmt || 0);
  const res = resolveSteps(org, steps, simP);
  const fin = defaultLine(org, S.ls.simF, +S.ls.simAmt || 0, simP.id);
  if (part === 'org')
    return (
      <section
        className="card"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        <div>
          <h3
            className="h3"
            style={{
              margin: 0,
            }}
          >
            조직도와 직위
          </h3>
          <p className="small muted">부서 구조와 직위 단계(예: 대표 · 본부장 · 팀장 · 직원)를 정해요. 결재선은 이 직위를 따라 자동으로 찾아가요.</p>
        </div>
        <div
          className="grid2"
          style={{
            alignItems: 'start',
          }}
        >
          <div>
            <b
              style={{
                fontSize: '13.5px',
              }}
            >
              직위 단계
            </b>{' '}
            <span className="small muted">위가 높은 단계예요</span>
            <div
              className="aline"
              style={{
                marginTop: '6px',
              }}
            >
              {jn(
                o.levels.map((l, i) => (
                  <div
                    key={i}
                    className="ar"
                    style={{
                      gridTemplateColumns: '28px minmax(0,1fr) auto auto',
                    }}
                  >
                    <span className="no">{i + 1}</span>
                    <label>
                      <span hidden>단계 이름</span>
                      <In id={`lvn-${i}`} type="text" data-lvn={i} value={l.n} />
                    </label>
                    <span
                      className="small muted"
                      style={{
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {ps.filter((p) => p.level === l.k).length}명
                    </span>
                    <span className="ops">
                      <button type="button" data-a="lvMv" data-x={`${i}|-1`} aria-label="위로" {...ax(i === 0 ? 'disabled' : '')}>
                        ↑
                      </button>
                      <button type="button" data-a="lvMv" data-x={`${i}|1`} aria-label="아래로" {...ax(i === o.levels.length - 1 ? 'disabled' : '')}>
                        ↓
                      </button>
                      <button type="button" data-a="lvRm" data-x={i} aria-label="단계 빼기" {...ax(o.levels.length <= 2 ? 'disabled' : '')}>
                        ×
                      </button>
                    </span>
                  </div>
                )),
              )}
            </div>
            <button
              className="btn sm"
              data-a="lvAdd"
              style={{
                marginTop: '8px',
              }}
            >
              + 단계 추가
            </button>
          </div>
          <div>
            <b
              style={{
                fontSize: '13.5px',
              }}
            >
              조직도
            </b>{' '}
            <span className="small muted">구성원의 부서와 직위는 ‘구성원’ 탭에서 바꿔요</span>
            <ul
              className="small"
              style={{
                margin: '6px 0 0',
                paddingLeft: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                lineHeight: '2',
              }}
            >
              {<OrgTree o={o} name={root} depth={0} />}
            </ul>
            <details
              style={{
                marginTop: '8px',
              }}
              open
            >
              <summary
                className="small"
                style={{
                  cursor: 'pointer',
                }}
              >
                부서 편집
              </summary>
              <div
                className="aline"
                style={{
                  marginTop: '6px',
                }}
              >
                {jn(
                  o.units.map((u, i) => (
                    <div
                      key={i}
                      className="ar"
                      style={{
                        gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr) auto',
                      }}
                    >
                      <label>
                        <span hidden>부서 이름</span>
                        <In id={`un-${i}`} type="text" data-un={i} value={u.name} />
                      </label>
                      <label>
                        <span hidden>상위 부서</span>
                        <In as="select" id={`up-${i}`} data-up={i} {...ax(!u.parent ? 'disabled' : '')}>
                          {!u.parent ? (
                            <option>최상위</option>
                          ) : (
                            jn(
                              o.units
                                .filter((x) => x.name !== u.name)
                                .map((x, _i) => (
                                  <option key={_i} {...ax(x.name === u.parent ? 'selected' : '')}>
                                    {x.name}
                                  </option>
                                )),
                            )
                          )}
                        </In>
                      </label>
                      <span className="ops">
                        {u.parent ? (
                          <button type="button" data-a="unRm" data-x={i} aria-label="부서 빼기">
                            ×
                          </button>
                        ) : null}
                      </span>
                    </div>
                  )),
                )}
              </div>
              <div
                className="row"
                style={{
                  marginTop: '6px',
                }}
              >
                <label
                  htmlFor="un-new"
                  style={{
                    flex: '1',
                  }}
                >
                  <span hidden>새 부서</span>
                  <In id="un-new" type="text" placeholder="새 부서 이름" />
                </label>
                <button className="btn sm" data-a="unAdd">
                  + 부서 추가
                </button>
              </div>
            </details>
          </div>
        </div>
      </section>
    );
  return (
    <section
      className="card"
      id="line-settings"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
      }}
    >
      <div>
        <h3
          className="h3"
          style={{
            margin: 0,
          }}
        >
          결재선 설정
        </h3>
        <p className="small muted">
          이름이 아니라 직위로 정해요. 결재를 올리면 기안자의 소속 부서에서 위로 올라가며 해당 직위의 사람을 찾아 자동으로 넣어요. 그 직위에 사람이 없거나 기안자보다 아래 직위면 건너뛰어요.
        </p>
      </div>
      <div>
        <b
          style={{
            fontSize: '13.5px',
          }}
        >
          1. 기본 결재선
        </b>{' '}
        <span className="small muted">기안 → {stepsLabel(o, o.lineTpl)}</span>
        <div
          style={{
            marginTop: '6px',
          }}
        >
          {<StepEditor ctx={'def'} steps={o.lineTpl} o={o} />}
        </div>
      </div>
      <div>
        <div
          className="row between"
          style={{
            marginBottom: '6px',
          }}
        >
          <b
            style={{
              fontSize: '13.5px',
            }}
          >
            2. 금액 기준 결재
          </b>
          <button className="btn sm" data-a="lsAddRule">
            + 규칙 추가
          </button>
        </div>
        <div className="aline">
          {jn(
            o.amtRules.map((r, i) => (
              <div
                key={i}
                className="ar"
                style={{
                  gridTemplateColumns: 'auto minmax(0,1fr) auto',
                }}
              >
                <label
                  htmlFor={`lr-min-${i}`}
                  className="row"
                  style={{
                    gap: '6px',
                    flexWrap: 'nowrap',
                  }}
                >
                  <span className="small">집행 금액</span>
                  <In
                    id={`lr-min-${i}`}
                    type="number"
                    data-lrmin={i}
                    value={r.min}
                    style={{
                      width: '130px',
                    }}
                  />
                  <span className="small">원 이상이면</span>
                </label>
                <label
                  htmlFor={`lr-lv-${i}`}
                  className="row"
                  style={{
                    gap: '6px',
                    flexWrap: 'nowrap',
                  }}
                >
                  <In as="select" id={`lr-lv-${i}`} data-lrlv={i}>
                    {jn(
                      o.levels.map((l, _i) => (
                        <option key={_i} value={l.k} {...ax(l.k === r.lv ? 'selected' : '')}>
                          {l.n}
                        </option>
                      )),
                    )}
                  </In>
                  <span
                    className="small"
                    style={{
                      whiteSpace: 'nowrap',
                    }}
                  >
                    결재 추가
                  </span>
                </label>
                <span className="ops">
                  <button type="button" data-a="lsRmRule" data-x={i} aria-label="규칙 빼기">
                    ×
                  </button>
                </span>
              </div>
            )),
          ) || (
            <div
              className="ar"
              style={{
                gridTemplateColumns: '1fr',
              }}
            >
              <span className="small muted">규칙이 없어요.</span>
            </div>
          )}
        </div>
      </div>
      <div>
        <b
          style={{
            fontSize: '13.5px',
          }}
        >
          3. 양식별 결재선
        </b>{' '}
        <span className="small muted">결재선이 다른 양식만 따로 정해요</span>
        <div
          className="tw"
          style={{
            marginTop: '6px',
          }}
        >
          <table>
            <thead>
              <tr>
                <th>양식</th>
                <th>결재선</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {jn(
                AFORMS.filter((x) => x.use !== false).map((x, _i) => {
                  const own = o.formLines[x.id];
                  return (
                    <tr key={_i} {...ax(x.id === sel ? 'style="background:var(--info-bg)"' : '')}>
                      <td>
                        {x.name} <span className="small muted">{x.group}</span>
                      </td>
                      <td className="small">{own ? '기안 → ' + stepsLabel(o, own) : <span className="muted">기본 결재선</span>}</td>
                      <td className="r">
                        <button className="btn sm" data-a="lsForm" data-x={x.id}>
                          {x.id === sel ? '닫기' : '편집'}
                        </button>
                      </td>
                    </tr>
                  );
                }),
              )}
            </tbody>
          </table>
        </div>
        {fsel ? (
          <div
            className="card"
            style={{
              marginTop: '8px',
              background: 'var(--sunk)',
            }}
          >
            <div
              className="row between"
              style={{
                marginBottom: '8px',
              }}
            >
              <b>{fsel.name} 결재선</b>
              <label className="check" htmlFor="ls-own">
                <In id="ls-own" type="checkbox" data-lsown={fsel.id} {...ax(o.formLines[fsel.id] ? 'checked' : '')} />
                <span>이 양식만 따로 정하기</span>
              </label>
            </div>
            {o.formLines[fsel.id] ? <StepEditor ctx={'f_' + fsel.id} steps={o.formLines[fsel.id]} o={o} /> : <p className="small muted">기본 결재선을 써요.</p>}
          </div>
        ) : null}
      </div>
      <div className="notice">
        <b>결재선 확인</b> <span className="small">누가 어떤 양식으로 얼마를 올리면 누가 결재하는지 미리 봐요.</span>
        <div
          className="grid3"
          style={{
            marginTop: '8px',
          }}
        >
          <label className="field" htmlFor="sim-p">
            <span>기안자</span>
            <In as="select" id="sim-p" data-sim="simP">
              {jn(
                ps.map((p, _i) => (
                  <option key={_i} value={p.id} {...ax(p.id === simP.id ? 'selected' : '')}>
                    {p.name} · {lvName(o, p.level)} · {p.unit}
                  </option>
                )),
              )}
            </In>
          </label>{' '}
          <label className="field" htmlFor="sim-f">
            <span>양식</span>
            <In as="select" id="sim-f" data-sim="simF">
              {jn(
                AFORMS.filter((x) => x.use !== false).map((x, _i) => (
                  <option key={_i} value={x.id} {...ax(x.id === S.ls.simF ? 'selected' : '')}>
                    {x.name}
                  </option>
                )),
              )}
            </In>
          </label>{' '}
          <label className="field" htmlFor="sim-a">
            <span>집행 금액(원)</span>
            <In id="sim-a" type="number" data-sim="simAmt" value={S.ls.simAmt} />
          </label>
        </div>
        <ul
          className="small"
          style={{
            margin: '8px 0 0',
            paddingLeft: '18px',
          }}
        >
          {jn(
            res.map((x, _i) => (
              <li key={_i}>
                {x.label}
                {x.st.amt ? (
                  <>
                    {' '}
                    <span className="muted">({eok(x.st.amt)}원 이상)</span>
                  </>
                ) : null}
                :{' '}
                {x.p ? (
                  <>
                    <b>{x.p.name}</b> {x.st.type || '결재'}
                  </>
                ) : (
                  <span className="muted">건너뜀 · {x.why}</span>
                )}
              </li>
            )),
          )}
        </ul>
        <p
          style={{
            marginTop: '6px',
          }}
        >
          <b>{fin.map((l) => `${l.type} ${person(l.pid)?.name}`).join(' → ')}</b>
        </p>
      </div>
    </section>
  );
}

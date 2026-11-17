// 프로토타입 화면을 React 컴포넌트로 옮겼어요. 버튼·입력은 data-* 속성으로 core/actions의 A와 연결돼요.
import { canEditExp, person, visExp, xCat, xLabel, xShareOpts, xVal } from '../../core/org';
import { S } from '../../core/state';
import { ax, jn } from '../../ui/jsx';
import { In } from '../../ui/primitives';

export function ExpertPage() {
  const gs = S.expGroups;
  const sc = S.xsc || 'all';
  const base = visExp().filter((x) => sc === 'all' || xCat(x) === sc);
  const cnt = (g) => base.filter((x) => (x.group || '미분류') === g).length;
  const un = base.filter((x) => !gs.includes(x.group));
  const vis = visExp();
  const all = [...gs, ...(un.length ? ['미분류'] : [])];
  return (
    <>
      <div className="page-head">
        <div>
          <h2>전문가</h2>
          <p className="small muted">이력은 AI가 회의록·자문의견서를 쓸 때 참석 전문가 소개에 쓰이고, 자문확인서에도 들어가요.</p>
        </div>
        <button className="btn primary" data-a="newExpert">
          전문가 등록
        </button>
      </div>
      <div
        className="seg"
        role="group"
        aria-label="공유 범위"
        style={{
          marginBottom: '12px',
          flexWrap: 'wrap',
        }}
      >
        {jn(
          [
            ['all', '전체'],
            ['org', '회사 전체 공유'],
            ['unit', '부서 공유'],
            ['me', '나만 보기'],
          ].map(([k, l], _i) => (
            <button key={_i} data-a="xsc" data-x={k} aria-pressed={sc === k}>
              {l} <span className="small muted">{k === 'all' ? vis.length : vis.filter((x) => xCat(x) === k).length}</span>
            </button>
          )),
        )}
      </div>
      <p
        className="small muted"
        style={{
          margin: '-4px 0 12px',
        }}
      >
        공유 범위는 등록한 사람의 조직 위계(본부·연구소·팀 등)에서 골라요. 회사 전체 공유는 우리 기관 모든 직원이, 부서 공유는 고른 부서와 그 하위 부서 직원이, 나만 보기는 등록한 사람만 봐요. 다른
        기관에는 보이지 않아요.
      </p>
      <section className="card">
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
            그룹 설정
          </h3>
          <span className="small muted">회의·자문 일정에서 전문가를 고를 때 이 그룹으로 묶여 보여요</span>
        </div>
        <div className="aline">
          {jn(
            gs.map((g, i) => (
              <div
                key={i}
                className="ar"
                style={{
                  gridTemplateColumns: '28px minmax(0,1fr) auto auto',
                }}
              >
                <span className="no">{i + 1}</span>
                <label>
                  <span hidden>그룹 이름</span>
                  <In id={`xg-${i}`} type="text" data-xgn={i} value={g} />
                </label>
                <span
                  className="small muted"
                  style={{
                    whiteSpace: 'nowrap',
                  }}
                >
                  {cnt(g)}명
                </span>
                <span className="ops">
                  <button type="button" data-a="xgMv" data-x={`${i}|-1`} aria-label="위로" {...ax(i === 0 ? 'disabled' : '')}>
                    ↑
                  </button>
                  <button type="button" data-a="xgMv" data-x={`${i}|1`} aria-label="아래로" {...ax(i === gs.length - 1 ? 'disabled' : '')}>
                    ↓
                  </button>
                  <button type="button" data-a="xgRm" data-x={i} aria-label="그룹 삭제">
                    ×
                  </button>
                </span>
              </div>
            )),
          )}
        </div>
        <div
          className="row"
          style={{
            marginTop: '8px',
          }}
        >
          <label
            htmlFor="xg-new"
            style={{
              flex: '1',
              maxWidth: '320px',
            }}
          >
            <span hidden>새 그룹</span>
            <In id="xg-new" type="text" placeholder="새 그룹 이름 (예: 경영·사업화)" />
          </label>
          <button className="btn sm" data-a="xgAdd">
            + 그룹 추가
          </button>
        </div>
        <p
          className="small muted"
          style={{
            marginTop: '6px',
          }}
        >
          그룹을 지우면 속한 전문가는 ‘미분류’로 옮겨져요.
        </p>
      </section>
      {jn(
        all.map((g, _i) => {
          const xs = base.filter((x) => (g === '미분류' ? !gs.includes(x.group) : x.group === g));
          return (
            <section key={_i}>
              <h3 className="h3">
                {g} <span className="muted small">{xs.length}명</span>
              </h3>
              <div className="tw">
                <table>
                  <thead>
                    <tr>
                      <th>이름</th>
                      <th>소속</th>
                      <th>분야</th>
                      <th>공유</th>
                      <th>그룹</th>
                      <th>이력</th>
                      <th>연락처</th>
                      <th>메일</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jn(
                      xs.map((x, _i) => (
                        <tr key={_i}>
                          <td
                            style={{
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {x.name}
                          </td>
                          <td
                            style={{
                              minWidth: '110px',
                            }}
                          >
                            {x.org}
                          </td>
                          <td
                            style={{
                              minWidth: '90px',
                            }}
                          >
                            {x.field}
                          </td>
                          <td
                            style={{
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {canEditExp(x) ? (
                              <label>
                                <span hidden>{x.name} 공유 범위</span>
                                <In
                                  as="select"
                                  id={`xsh-${x.id}`}
                                  data-xsh={x.id}
                                  style={{
                                    width: 'auto',
                                  }}
                                >
                                  {(() => {
                                    const ops = xShareOpts(x.by);
                                    const cur = xVal(x);
                                    return jn(
                                      (ops.some((o) => o[0] === cur) ? ops : [...ops, [cur, xLabel(x)]]).map(([k, l], _i) => (
                                        <option key={_i} value={k} {...ax(cur === k ? 'selected' : '')}>
                                          {l}
                                        </option>
                                      )),
                                    );
                                  })()}
                                </In>
                              </label>
                            ) : (
                              <span className="chip">{xLabel(x)}</span>
                            )}
                            <div className="small muted">{person(x.by)?.name || ''}</div>
                          </td>
                          <td>
                            <label>
                              <span hidden>{x.name} 그룹</span>
                              <In
                                as="select"
                                id={`xgs-${x.id}`}
                                data-xg={x.id}
                                style={{
                                  width: 'auto',
                                }}
                              >
                                {jn(
                                  gs.map((o, _i) => (
                                    <option key={_i} {...ax(o === x.group ? 'selected' : '')}>
                                      {o}
                                    </option>
                                  )),
                                )}
                                {gs.includes(x.group) ? null : <option selected>미분류</option>}
                              </In>
                            </label>
                          </td>
                          <td
                            className="small"
                            style={{
                              minWidth: '240px',
                            }}
                          >
                            {x.career || ''}
                          </td>
                          <td className="num">{x.phone}</td>
                          <td
                            className="small"
                            style={{
                              whiteSpace: 'nowrap',
                            }}
                          >
                            <span
                              style={{
                                userSelect: 'all',
                              }}
                            >
                              {x.email || '-'}
                            </span>
                            {x.email ? (
                              <>
                                {' '}
                                <button className="btn sm" data-a="copyMail" data-x={x.email} aria-label={`${x.name} 메일 복사`}>
                                  복사
                                </button>
                              </>
                            ) : null}
                          </td>
                        </tr>
                      )),
                    ) || (
                      <tr>
                        <td colSpan={8} className="muted">
                          이 그룹에 보이는 전문가가 없어요.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          );
        }),
      )}
    </>
  );
}

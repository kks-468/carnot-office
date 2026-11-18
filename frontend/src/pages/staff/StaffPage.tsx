// 프로토타입 화면을 React 컴포넌트로 옮겼어요. 버튼·입력은 data-* 속성으로 core/actions의 A와 연결돼요.
import { tenantHref } from '../../platform/tenant';
import { TODAY } from '../../core/catalog';
import { lvName, me, orgCfg, person } from '../../core/org';
import { costParts, gradesOf, insOf, leaveCalc, payParts, payYears, pgOf, workdays } from '../../core/pay';
import { stampHtml } from '../../core/print';
import { S } from '../../core/state';
import { eok, fdate, pct, sum } from '../../core/util';
import { evTime } from '../../core/work';
import { ax, css, jn } from '../../ui/jsx';
import { Field, In } from '../../ui/primitives';

export function StaffPage() {
  const o = S.orgs[S.view];
  const tab = S.stTab || 'acct';
  const ppl = S.people.filter((x) => x.org === S.view);
  const oc = orgCfg(S.view);
  const T = (k, l) => (
    <button className={`btn sm ${tab === k ? 'primary' : ''}`} data-a="stTab" data-x={k} aria-pressed={tab === k}>
      {l}
    </button>
  );
  let body: any;
  if (tab === 'leave') body = <LeavePage />;
  else if (tab === 'raise') body = <RaisePage />;
  else if (tab === 'acct')
    body = (
      <>
        <div
          className="row between"
          style={{
            marginBottom: '8px',
          }}
        >
          <p
            className="small muted"
            style={{
              margin: 0,
            }}
          >
            직원은 회사 주소 <b className="num">{tenantHref(o.code || '').replace(/^https?:\/\//, '')}</b>에서 아이디와 비밀번호로 로그인해요. 계정을 만들면 임시 비밀번호가 나오고, 직원이 그 비밀번호로 처음 로그인할 때 새 비밀번호를 정해요.
          </p>
          <button className="btn sm primary" data-a="newStaff">
            + 직원 계정 만들기
          </button>
        </div>
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>이름</th>
                <th>아이디</th>
                <th>부서</th>
                <th>직위</th>
                <th>직급</th>
                <th>도장</th>
                <th>상태</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {jn(
                ppl.map((x, _i) => (
                  <tr key={_i}>
                    <td>{x.name}</td>
                    <td className="num small">
                      {x.login}@{o.code || ''}
                    </td>
                    <td className="small">{x.unit || '-'}</td>
                    <td className="small">{x.level ? lvName(oc, x.level) : '-'}</td>
                    <td className="small">{x.role}</td>
                    <td
                      className="mini-stamp"
                      dangerouslySetInnerHTML={{
                        __html: stampHtml(x.id),
                      }}
                    />
                    <td>
                      {x.acct === '활성' ? (
                        <span className="chip good">사용 중</span>
                      ) : x.acct === '초대됨' ? (
                        <span className="chip warn">초대됨</span>
                      ) : x.acct === '가입 신청' ? (
                        <span className="chip bad">가입 신청</span>
                      ) : (
                        <span className="chip">사용 중지</span>
                      )}
                    </td>
                    <td
                      className="r"
                      style={{
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {x.acct === '가입 신청' ? (
                        <>
                          <button className="btn sm primary" data-a="acctOk" data-x={x.id}>
                            승인
                          </button>{' '}
                          <button className="btn sm" data-a="acctNo" data-x={x.id}>
                            거절
                          </button>
                        </>
                      ) : x.acct === '초대됨' ? (
                        <button className="btn sm" data-a="acctReset" data-x={x.id}>
                          초대 다시 보내기
                        </button>
                      ) : x.acct === '활성' ? (
                        <>
                          <button className="btn sm" data-a="acctReset" data-x={x.id}>
                            비밀번호 초기화
                          </button>{' '}
                          <button className="btn sm" data-a="acctSet" data-x={`${x.id}|중지`}>
                            사용 중지
                          </button>
                        </>
                      ) : (
                        <button className="btn sm" data-a="acctSet" data-x={`${x.id}|활성`}>
                          다시 사용
                        </button>
                      )}
                      {x.id !== me()?.id && !x.admin ? (
                        <>
                          {' '}
                          <button className="btn sm" data-a="acctDelAsk" data-x={x.id}>
                            삭제
                          </button>
                        </>
                      ) : null}
                    </td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </div>
      </>
    );
  else {
    const r = insOf(S.view, S.payYear);
    const rows = ppl
      .filter((x) => !x.admin)
      .map((x) => ({
        x,
        ...costParts(x.id),
      }));
    const inp = (k, l) => (
      <label className="field" htmlFor={`ins-${k}`}>
        <span>{l}</span>
        <In id={`ins-${k}`} type="number" step="0.001" data-ins={k} value={r[k]} />
      </label>
    );
    body = (
      <>
        <div
          className="row between"
          style={{
            marginBottom: '8px',
          }}
        >
          <div className="row">
            <span className="small muted">기준 연도</span>
            {jn(
              payYears().map((y, _i) => (
                <button key={_i} className={`btn sm ${S.payYear === y ? 'primary' : ''}`} data-a="payYear" data-x={y} aria-pressed={S.payYear === y}>
                  {y}년
                </button>
              )),
            )}
          </div>
          <div className="row">
            {S.pay[S.payYear - 1] ? (
              <button className="btn sm" data-a="payCopy">
                {S.payYear - 1}년 값 복사
              </button>
            ) : null}
            <button className="btn sm" data-a="payAdd">
              + {Math.max(...payYears()) + 1}년 추가
            </button>
            <button className="btn sm primary" data-a="stTab" data-x="raise">
              급여 등급표 · 임금 인상
            </button>
          </div>
        </div>
        <section className="card">
          <h3 className="h3">{S.payYear}년 4대보험 기관(사업주) 부담 요율</h3>
          <div className="grid3">
            {inp('np', '국민연금(%)')}
            {inp('hi', '건강보험(%)')}
            {inp('ltc', '장기요양(건강보험료 대비 %)')}
            {inp('ei', '고용보험(%)')}
            {inp('ia', '산재보험(%)')}
            <div className="field">
              <span>합계(급여 대비)</span>
              <strong
                className="num"
                style={{
                  padding: '10px 0',
                }}
              >
                {(r.np + r.hi + (r.hi * r.ltc) / 100 + r.ei + r.ia).toFixed(3)}%
              </strong>
            </div>
          </div>
          <p className="small muted">
            기본값은 {S.payYear}년 사업주 부담분 예시예요(고용보험은 150인 미만 기준 실업급여 0.9% + 고용안정 0.25%, 산재보험은 업종별로 달라요
            {S.payYear === 2027 ? ', 2027년 건강보험은 고시 전이라 2026년 값' : ''}). 기관 사정에 맞게 고쳐 주세요.
          </p>
        </section>
        <div className="tw">
          <table
            style={{
              whiteSpace: 'nowrap',
            }}
          >
            <thead>
              <tr>
                <th>이름</th>
                <th>직급</th>
                <th>인건비 기준 년차(등급)</th>
                <th className="r">월 급여 (과세)</th>
                <th className="r">월 비과세</th>
                <th>4대보험</th>
                <th>퇴직급여</th>
                <th className="r">보험 기관부담</th>
                <th className="r">퇴직급여 적립</th>
                <th className="r">월 인건비 기준액</th>
                <th className="r">연 기준액</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const gs = gradesOf(S.view, S.payYear);
                return jn(
                  rows.map(({ x, tax, free, src, ins, ret, tot }, _i) => (
                    <tr key={_i}>
                      <td>{x.name}</td>
                      <td className="small muted">{x.role}</td>
                      <td>
                        <label>
                          <span hidden>{x.name} 등급</span>
                          <In
                            as="select"
                            id={`pg-${x.id}`}
                            data-pg={x.id}
                            style={{
                              width: 'auto',
                            }}
                          >
                            <option value="">직접 입력</option>
                            {jn(
                              gs.map((g, _i) => (
                                <option key={_i} value={g.no} {...ax(+pgOf(x.id) === +g.no ? 'selected' : '')}>
                                  {g.no} · {g.name}
                                </option>
                              )),
                            )}
                          </In>
                        </label>
                      </td>
                      {src === 'grade' ? (
                        <>
                          <td className="r num">
                            {eok(tax)}
                            <br />
                            <span className="small muted">등급표</span>
                          </td>
                          <td className="r num">{eok(free)}</td>
                        </>
                      ) : (
                        <>
                          <td className="r">
                            <label>
                              <span hidden>{x.name} 과세 급여</span>
                              <In
                                id={`pay-${x.id}`}
                                type="number"
                                step="10000"
                                data-pay={x.id}
                                value={tax}
                                style={{
                                  width: '120px',
                                  textAlign: 'right',
                                }}
                              />
                            </label>
                          </td>
                          <td className="r">
                            <label>
                              <span hidden>{x.name} 비과세</span>
                              <In
                                id={`payf-${x.id}`}
                                type="number"
                                step="10000"
                                data-payf={x.id}
                                value={free}
                                style={{
                                  width: '100px',
                                  textAlign: 'right',
                                }}
                              />
                            </label>
                          </td>
                        </>
                      )}
                      <td>
                        <label className="check" htmlFor={`pf-i-${x.id}`}>
                          <In id={`pf-i-${x.id}`} type="checkbox" data-pflag={`${x.id}|noIns`} {...ax(x.noIns ? '' : 'checked')} />
                          <span className="small">적용</span>
                        </label>
                      </td>
                      <td>
                        <label className="check" htmlFor={`pf-r-${x.id}`}>
                          <In id={`pf-r-${x.id}`} type="checkbox" data-pflag={`${x.id}|noRet`} {...ax(x.noRet ? '' : 'checked')} />
                          <span className="small">적용</span>
                        </label>
                      </td>
                      <td className="r num">{eok(ins)}</td>
                      <td className="r num">{eok(ret)}</td>
                      <td className="r num">
                        <b>{eok(tot)}</b>
                      </td>
                      <td className="r num">{eok(tot * 12)}</td>
                    </tr>
                  )),
                );
              })()}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3}>합계</td>
                <td className="r num">{eok(sum(rows.map((r) => r.tax)))}</td>
                <td className="r num">{eok(sum(rows.map((r) => r.free)))}</td>
                <td />
                <td />
                <td className="r num">{eok(sum(rows.map((r) => r.ins)))}</td>
                <td className="r num">{eok(sum(rows.map((r) => r.ret)))}</td>
                <td className="r num">{eok(sum(rows.map((r) => r.tot)))}</td>
                <td className="r num">{eok(sum(rows.map((r) => r.tot)) * 12)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <p className="small muted">
          인건비 기준 년차(등급)를 고르면 ‘급여 등급표’의 금액이 자동으로 들어가요. 등급이 없거나 다르게 받는 직원은 ‘직접 입력’으로 둬요. 4대보험 기관부담은 과세 급여에만, 퇴직급여 적립은 (과세 +
          비과세) ÷ 12로 계산해요. 월 인건비 기준액 × 참여율이 과제 인건비와 연구제안 인건비 계산에 쓰여요.
        </p>
      </>
    );
  }
  return (
    <>
      <div className="page-head">
        <div>
          <h2>직원·급여</h2>
          <p className="small muted">
            회사 아이디 <b className="num">{o.code || ''}</b>로 로그인한 관리자가 직원 계정을 만들고, 연도별 급여와 4대보험·퇴직급여를 정해요.
          </p>
        </div>
      </div>
      <div
        className="row"
        style={{
          marginBottom: '14px',
        }}
      >
        {T('acct', '직원 계정')}
        {T('pay', '급여·인건비 기준')}
        {T('raise', '급여 등급표')}
        {T('leave', '연차관리')}
      </div>
      {body}
    </>
  );
}
export function RaisePage() {
  const f = S.f;
  const ys = payYears();
  const yr = S.payYear;
  const gs = gradesOf(S.view, yr);
  const ppl = S.people.filter((p) => p.org === S.view && !p.admin && p.acct !== '가입 신청');
  if (!f.rs_from)
    Object.assign(f, {
      rs_from: String(Math.max(...ys)),
      rs_to: String(Math.max(...ys) + 1),
      rs_mode: 'all',
      rs_all: '3',
      rs_round: '10000',
      rs_name: '',
    });
  const from = +f.rs_from,
    to = +f.rs_to;
  const rnd = +f.rs_round || 1;
  const n = (v) => +String(v ?? '').replace(/[^\d.-]/g, '') || 0;
  const fromG = gradesOf(S.view, from);
  const rateG = (g) => (f.rs_mode === 'grade' ? n(f['rs_g_' + g.no] ?? f.rs_all) : n(f.rs_all));
  const prevG = fromG.map((g) => ({
    g,
    r: rateG(g),
    nt: Math.round((g.tax * (1 + rateG(g) / 100)) / rnd) * rnd,
  }));
  const manual = ppl.filter((p) => !pgOf(p.id, from));
  const prevM = manual.map((p) => {
    const q = payParts(p.id, from);
    return {
      p,
      q,
      nt: Math.round((q.tax * (1 + n(f.rs_all) / 100)) / rnd) * rnd,
    };
  });
  const gIn = (i, k, v, w, type = 'text') => (
    <label>
      <span hidden>{k}</span>
      <In id={`gr-${k}-${i}`} type={type} data-gr={`${i}|${k}`} value={v} style={css(`width:${w};text-align:${type === 'number' ? 'right' : 'left'}`)} />
    </label>
  );
  const hist = (S.raises || [])
    .filter((x) => x.org === S.view)
    .slice()
    .reverse();
  return (
    <>
      <section
        className="card"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <div
          className="row between"
          style={{
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div>
            <h3
              className="h3"
              style={{
                margin: 0,
              }}
            >
              급여 등급표 · 인건비 기준 년차
            </h3>
            <p className="small muted">1, 2, 3, 4 … 등급마다 이름(예: 3 · 과장)과 월 급여를 정해 두면, 직원에게 등급만 고르면 급여가 자동으로 연동돼요.</p>
          </div>
          <div className="row">
            <span className="small muted">기준 연도</span>
            {jn(
              ys.map((y, _i) => (
                <button key={_i} className={`btn sm ${yr === y ? 'primary' : ''}`} data-a="payYear" data-x={y} aria-pressed={yr === y}>
                  {y}년
                </button>
              )),
            )}
          </div>
        </div>
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>등급</th>
                <th>이름 (직급)</th>
                <th className="r">월 급여 (과세)</th>
                <th className="r">월 비과세</th>
                <th className="r">월 합계</th>
                <th className="r">인원</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {jn(
                gs.map((g, i) => {
                  const cnt = ppl.filter((p) => +pgOf(p.id, yr) === +g.no).length;
                  return (
                    <tr key={i}>
                      <td>{gIn(i, 'no', g.no, '56px', 'number')}</td>
                      <td>{gIn(i, 'name', g.name, '160px')}</td>
                      <td className="r">{gIn(i, 'tax', g.tax, '130px', 'number')}</td>
                      <td className="r">{gIn(i, 'free', g.free, '110px', 'number')}</td>
                      <td className="r num">
                        <b>{eok((+g.tax || 0) + (+g.free || 0))}</b>
                      </td>
                      <td className="r num">{cnt}명</td>
                      <td className="r">
                        <button className="btn sm" data-a="grRm" data-x={i} {...ax(cnt ? 'disabled title="이 등급인 직원이 있어요"' : '')}>
                          빼기
                        </button>
                      </td>
                    </tr>
                  );
                }),
              ) || (
                <tr>
                  <td colSpan={7} className="muted">
                    등급이 없어요. ‘+ 등급 추가’로 만들어 주세요.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="row">
          <button className="btn sm" data-a="grAdd">
            + 등급 추가
          </button>
          <span className="small muted">직원별 등급은 ‘급여·인건비 기준’ 탭에서 골라요.</span>
        </div>
      </section>
      <section
        className="card"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div>
          <h3
            className="h3"
            style={{
              margin: 0,
            }}
          >
            임금 인상 차수
          </h3>
          <p className="small muted">기준 연도 등급표에 인상률을 적용해 적용 연도 등급표를 만들어요. 직원 등급은 그대로 이어지고, ‘직접 입력’ 직원은 기본 인상률로 올려요. 비과세는 그대로 유지해요.</p>
        </div>
        <div className="grid3">
          {
            <Field
              label={'기준 연도'}
              name={'rs_from'}
              {...{
                options: ys.map((y) => [String(y), `${y}년`]),
                r: 1,
              }}
            />
          }
          {
            <Field
              label={'적용 연도'}
              name={'rs_to'}
              {...{
                options: Array.from(
                  {
                    length: 4,
                  },
                  (_, i) => String(Math.max(...ys) - 1 + i),
                ).map((y) => [y, `${y}년${S.pay[y] || S.grades[S.view]?.[y]?.length ? ' (있음)' : ''}`]),
                r: 1,
              }}
            />
          }
          {
            <Field
              label={'차수 이름'}
              name={'rs_name'}
              {...{
                ph: `예: ${to}년 정기 인상`,
              }}
            />
          }
        </div>
        <div className="field">
          <span>인상 방식</span>
          <div className="seg" role="group">
            {jn(
              [
                ['all', '일괄 인상'],
                ['grade', '등급별 인상'],
              ].map(([k, l], _i) => (
                <button key={_i} type="button" data-a="rsMode" data-x={k} aria-pressed={f.rs_mode === k}>
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
            gap: '10px',
            alignItems: 'flex-end',
          }}
        >
          <label
            className="field"
            htmlFor="f-rs_all"
            style={{
              maxWidth: '150px',
            }}
          >
            <span>{f.rs_mode === 'grade' ? '기본 인상률(%) · 직접 입력 직원' : '인상률(%)'}</span>
            <In id="f-rs_all" data-b="rs_all" data-r="1" type="number" step="0.1" value={f.rs_all ?? ''} />
          </label>{' '}
          {f.rs_mode === 'grade'
            ? jn(
                fromG.map((g, _i) => (
                  <label
                    key={_i}
                    className="field"
                    htmlFor={`f-rs_g_${g.no}`}
                    style={{
                      maxWidth: '130px',
                    }}
                  >
                    <span>
                      {g.no} · {g.name}(%)
                    </span>
                    <In id={`f-rs_g_${g.no}`} data-b={`rs_g_${g.no}`} data-r="1" type="number" step="0.1" value={f['rs_g_' + g.no] ?? f.rs_all ?? ''} />
                  </label>
                )),
              )
            : null}{' '}
          {
            <Field
              label={'반올림'}
              name={'rs_round'}
              {...{
                options: [
                  ['10000', '만 원 단위'],
                  ['1000', '천 원 단위'],
                  ['1', '원 단위'],
                ],
                r: 1,
              }}
            />
          }
        </div>
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>구분</th>
                <th>이름</th>
                <th className="r">{from}년 과세</th>
                <th className="r">인상률</th>
                <th className="r">{to}년 과세</th>
                <th className="r">차액</th>
              </tr>
            </thead>
            <tbody>
              {jn(
                prevG.map((x, _i) => (
                  <tr key={_i}>
                    <td>등급 {x.g.no}</td>
                    <td>{x.g.name}</td>
                    <td className="r num">{eok(x.g.tax)}</td>
                    <td className="r num">{x.r.toFixed(1)}%</td>
                    <td className="r num">
                      <b>{eok(x.nt)}</b>
                    </td>
                    <td className="r num">+{eok(x.nt - x.g.tax)}</td>
                  </tr>
                )),
              )}
              {jn(
                prevM.map((x, _i) => (
                  <tr key={_i}>
                    <td className="small muted">직접 입력</td>
                    <td>{x.p.name}</td>
                    <td className="r num">{eok(x.q.tax)}</td>
                    <td className="r num">{n(f.rs_all).toFixed(1)}%</td>
                    <td className="r num">
                      <b>{eok(x.nt)}</b>
                    </td>
                    <td className="r num">{x.q.tax ? '+' + eok(x.nt - x.q.tax) : '-'}</td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </div>
        <div className="row">
          <button className="btn primary" data-a="rsApply" {...ax(to <= from ? 'disabled' : '')}>
            {to}년 등급표·급여로 적용
          </button>
          {to <= from ? <span className="small err">적용 연도는 기준 연도보다 뒤여야 해요.</span> : null}
        </div>
      </section>
      <section>
        <h3 className="h3">인상 차수 기록</h3>
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>차수</th>
                <th>기준 → 적용</th>
                <th>방식</th>
                <th className="r">평균 인상률</th>
                <th>적용일</th>
                <th>적용자</th>
              </tr>
            </thead>
            <tbody>
              {jn(
                hist.map((h, _i) => (
                  <tr key={_i}>
                    <td>{h.name}</td>
                    <td className="num">
                      {h.from} → {h.to}
                    </td>
                    <td className="small">{h.modeLabel}</td>
                    <td className="r num">{h.avg}%</td>
                    <td className="num small">{fdate(h.date)}</td>
                    <td className="small">{person(h.by)?.name || ''}</td>
                  </tr>
                )),
              ) || (
                <tr>
                  <td colSpan={6} className="muted">
                    아직 적용한 인상 차수가 없어요.
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
export function LeavePage() {
  const yr = S.leaveYr || +TODAY.slice(0, 4);
  const ppl = S.people.filter((p) => p.org === S.view && !p.admin && p.acct !== '가입 신청');
  const canEd = me()?.admin || /행정|관리자|본부장|단장/.test(me()?.role || '');
  const open = S.leaveOpen;
  const rows = ppl.map((p) => ({
    p,
    c: leaveCalc(p.id, yr),
  }));
  const tot = (k) => sum(rows.map((r) => r.c[k]));
  return (
    <>
      <div
        className="row between"
        style={{
          marginBottom: '10px',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div className="row">
          <button className="btn sm" data-a="leaveYr" data-x={yr - 1} aria-label="이전 해">
            ‹
          </button>
          <strong
            className="num"
            style={{
              minWidth: '70px',
              textAlign: 'center',
            }}
          >
            {yr}년
          </strong>
          <button className="btn sm" data-a="leaveYr" data-x={yr + 1} aria-label="다음 해">
            ›
          </button>
        </div>
        <span className="small muted">사용은 그해 1.1~12.31 회사일정에서 자동 집계(연차 1일 · 반차 0.5일) · 발생은 {TODAY.slice(0, 4) == String(yr) ? '오늘' : `${yr}.12.31`} 기준 근속으로 계산</span>
      </div>
      <div className="stats">
        <div>
          <span>발생 합계</span>
          <strong>{tot('total')}일</strong>
        </div>
        <div>
          <span>사용 합계</span>
          <strong>{tot('used')}일</strong>
        </div>
        <div>
          <span>잔여 합계</span>
          <strong>{tot('left')}일</strong>
        </div>
        <div>
          <span>잔여 5일 이상</span>
          <strong>{rows.filter((r) => r.c.left >= 5).length}명</strong>
        </div>
      </div>
      <div className="tw">
        <table>
          <thead>
            <tr>
              <th>이름</th>
              <th>부서</th>
              <th>입사일</th>
              <th className="r">자동 발생</th>
              <th className="r">조정</th>
              <th className="r">발생</th>
              <th className="r">사용</th>
              <th className="r">잔여</th>
              <th>사용률</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {jn(
              rows.map(({ p, c }, _i) => (
                <>
                  <tr>
                    <td>{p.name}</td>
                    <td className="small">{p.unit || ''}</td>
                    <td>
                      {canEd ? (
                        <label>
                          <span hidden>{p.name} 입사일</span>
                          <In
                            id={`hire-${p.id}`}
                            type="date"
                            data-hire={p.id}
                            value={c.hire}
                            style={{
                              width: 'auto',
                            }}
                          />
                        </label>
                      ) : (
                        <span className="num small">{c.hire ? fdate(c.hire) : '-'}</span>
                      )}
                    </td>
                    <td className="r num" title={c.basis}>
                      {c.auto}일<br />
                      <span className="small muted">{c.basis}</span>
                    </td>
                    <td className="r">
                      {canEd ? (
                        <label>
                          <span hidden>{p.name} 조정</span>
                          <In
                            id={`adj-${p.id}`}
                            type="text"
                            inputMode="decimal"
                            data-ladj={p.id}
                            value={c.adj || ''}
                            placeholder="0"
                            style={{
                              width: '64px',
                              textAlign: 'right',
                            }}
                          />
                        </label>
                      ) : c.adj ? (
                        c.adj + '일'
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="r num">
                      <b>{c.total}일</b>
                    </td>
                    <td className="r num">{c.used}일</td>
                    <td className={`r num ${c.left < 0 ? 'rate-over' : ''}`}>{c.left}일</td>
                    <td className="num">
                      <span className="mini">
                        <i style={css(`width:${Math.min(100, pct(c.used, c.total))}%`)} />
                      </span>
                      {pct(c.used, c.total)}%
                    </td>
                    <td className="r">
                      <button className="btn sm" data-a="leaveOpen" data-x={p.id}>
                        {open === p.id ? '닫기' : '사용 내역'}
                      </button>
                    </td>
                  </tr>
                  {open === p.id ? (
                    <tr>
                      <td
                        colSpan={10}
                        style={{
                          background: 'var(--sunk)',
                        }}
                      >
                        {c.evs.length ? (
                          <ul
                            className="small"
                            style={{
                              margin: 0,
                              paddingLeft: '18px',
                            }}
                          >
                            {jn(
                              c.evs
                                .sort((a, b) => (a.start < b.start ? -1 : 1))
                                .map((e, _i) => (
                                  <li key={_i}>
                                    {fdate(e.start)}
                                    {e.end && e.end !== e.start ? '~' + fdate(e.end).slice(5) : ''} · {e.kind}
                                    {e.time ? ' ' + evTime(e) : ''} · {e.kind === '연차' ? workdays(e.start, e.end || e.start) : 0.5}일
                                  </li>
                                )),
                            )}
                          </ul>
                        ) : (
                          <span className="small muted">이 해에 쓴 연차가 없어요.</span>
                        )}
                      </td>
                    </tr>
                  ) : null}
                </>
              )),
            )}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={5}>합계</td>
              <td className="r num">{tot('total')}일</td>
              <td className="r num">{tot('used')}일</td>
              <td className="r num">{tot('left')}일</td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="small muted">
        자동 발생은 근로기준법 기준(1년 미만 월 1일·최대 11일, 1년 이상 15일, 2년마다 1일 추가·최대 25일)으로 계산한 참고값이에요. 회사 규정이나 회계연도 정산 방식에 맞게 ‘조정’ 칸에 더하거나 빼
        주세요.{canEd ? '' : ' 입사일과 조정은 관리자·행정 담당자가 바꿀 수 있어요.'}
      </p>
    </>
  );
}

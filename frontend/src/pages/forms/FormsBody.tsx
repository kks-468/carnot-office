// 프로토타입 화면을 React 컴포넌트로 옮겼어요. 버튼·입력은 data-* 속성으로 core/actions의 A와 연결돼요.
import { apprOf, defaultLine } from '../../core/approval';
import { AFORMS, CAT, ITEMS, PLACEHOLDERS, SRC_LABEL, TODAY } from '../../core/catalog';
import { docsFor, srcOf, tplFor } from '../../core/evidence';
import { me, proj } from '../../core/org';
import { a4Html, apvHtml, orgSealHtml, sealOf } from '../../core/print';
import { S } from '../../core/state';
import { TopBar } from '../../layout/Shell';
import { ax, css, jn } from '../../ui/jsx';
import { In } from '../../ui/primitives';

export function FormsBody() {
  const t = (k, l) => (
    <button data-a="fmTab" data-x={k} aria-current={S.fm.tab === k}>
      {l}
    </button>
  );
  const tabs = (
    <>
      {t('apv', '전자결재 양식')}
      {t('tpl', '증빙 서식')}
      {t('cat', '비목별 증빙 목록')}
      {t('common', '문서 공통')}
    </>
  );
  const page = {
    apv: () => <FmApv />,
    tpl: () => <FmTpl />,
    cat: () => <FmCat />,
    common: () => <FmCommon />,
  }[S.fm.tab]();
  return (
    <>
      <TopBar tabs={tabs} />
      <div className="body single">
        <div className="work">{page}</div>
      </div>
    </>
  );
}
export function FmOps({ act, i, len }: any) {
  return (
    <span className="ops">
      <button type="button" data-a={`${act}Mv`} data-x={`${i}|-1`} aria-label="위로" {...ax(i === 0 ? 'disabled' : '')}>
        ↑
      </button>
      <button type="button" data-a={`${act}Mv`} data-x={`${i}|1`} aria-label="아래로" {...ax(i === len - 1 ? 'disabled' : '')}>
        ↓
      </button>
      <button type="button" data-a={`${act}Rm`} data-x={i} aria-label="빼기">
        ×
      </button>
    </span>
  );
}
export function FmApv() {
  const cur = AFORMS.find((x) => x.id === S.fm.sel) || AFORMS[0];
  S.fm.sel = cur.id;
  const groups = [...new Set<any>(AFORMS.map((x) => x.group))];
  const pv = {
    id: 'pv',
    no: '(예시)',
    fid: cur.id,
    form: cur.name,
    title: '(제목)',
    drafter: me().id,
    date: TODAY,
    status: '임시',
    urgent: false,
    refs: [],
    files: [],
    fields: cur.fields.map((k) => [k, '']),
    body: cur.body,
    link: null,
    line: defaultLine(S.view, cur.id).map((l) => ({
      ...l,
      st: '예정',
    })),
    log: [],
  };
  return (
    <>
      <div className="page-head">
        <div>
          <h2>전자결재 양식</h2>
          <p className="small muted">
            양식 이름, 입력 항목, 본문 기본 문구를 바꾸면 새 결재부터 바로 적용돼요. 결재선은{' '}
            <button className="linkbtn" data-a="goLineSet">
              기관설정 → 결재선 설정
            </button>
            에서 정해요.
          </p>
        </div>
        <div className="row">
          <button className="btn" data-a="fmCopy">
            복제
          </button>
          <button className="btn primary" data-a="fmNew">
            새 양식
          </button>
        </div>
      </div>
      <div
        className="apv-grid"
        style={{
          gridTemplateColumns: '240px minmax(0,1fr) 340px',
        }}
      >
        <nav
          className="card"
          style={{
            padding: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
          aria-label="양식 목록"
        >
          {jn(
            groups.map((g, _i) => (
              <>
                <div
                  className="small muted"
                  style={{
                    padding: '8px 8px 2px',
                  }}
                >
                  {g}
                </div>
                {jn(
                  AFORMS.filter((x) => x.group === g).map((x, _i) => (
                    <button
                      key={_i}
                      className="linkbtn"
                      style={css(`text-decoration:none;padding:6px 8px;border-radius:6px;${x.id === cur.id ? 'background:var(--info-bg);font-weight:600' : ''}`)}
                      data-a="fmSel"
                      data-x={x.id}
                    >
                      {x.name}
                      {x.use === false ? (
                        <>
                          {' '}
                          <span className="chip">사용 안 함</span>
                        </>
                      ) : null}
                    </button>
                  )),
                )}
              </>
            )),
          )}
        </nav>
        <section
          className="card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div className="grid2">
            <label className="field" htmlFor="fm-name">
              <span>양식 이름</span>
              <In id="fm-name" type="text" data-fma="name" value={cur.name} />
            </label>{' '}
            <label className="field" htmlFor="fm-group">
              <span>
                분류 <small>새 분류 이름을 써도 돼요</small>
              </span>
              <In id="fm-group" type="text" list="fmgroups" data-fma="group" value={cur.group} />
              <datalist id="fmgroups">{jn(groups.map((g, _i) => <option key={_i} value={g} />))}</datalist>
            </label>
          </div>
          <label className="field" htmlFor="fm-desc">
            <span>설명</span>
            <In id="fm-desc" type="text" data-fma="desc" value={cur.desc || ''} />
          </label>
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
                입력 항목
              </b>
              <button className="btn sm" data-a="fmAddItem">
                + 항목 추가
              </button>
            </div>
            <div className="aline">
              {jn(
                cur.fields.map((k, i) => (
                  <div
                    key={i}
                    className="ar"
                    style={{
                      gridTemplateColumns: '28px minmax(0,1fr) auto',
                    }}
                  >
                    <span className="no">{i + 1}</span>
                    <label>
                      <span hidden>항목 {i + 1}</span>
                      <In id={`fmi-${i}`} type="text" data-fmi={i} value={k} />
                    </label>
                    {<FmOps act={'fmItem'} i={i} len={cur.fields.length} />}
                  </div>
                )),
              ) || (
                <div
                  className="ar"
                  style={{
                    gridTemplateColumns: '1fr',
                  }}
                >
                  <span className="small muted">항목이 없어요. 본문만 쓰는 양식이에요.</span>
                </div>
              )}
            </div>
          </div>
          <label className="field" htmlFor="fm-body">
            <span>본문 기본 문구</span>
            <In as="textarea" id="fm-body" rows={6} data-fma="body" value={cur.body} />
          </label>
          <div className="row between">
            <label className="check" htmlFor="fm-use">
              <In id="fm-use" type="checkbox" data-fmuse="1" {...ax(cur.use !== false ? 'checked' : '')} />
              <span>사용 (끄면 새 결재 양식 목록에서 숨겨요)</span>
            </label>
            {cur.custom ? (
              <button className="btn sm" data-a="fmDel">
                양식 삭제
              </button>
            ) : null}
          </div>
        </section>
        <div
          className="a4wrap"
          style={{
            maxHeight: 'none',
          }}
        >
          <div
            style={{
              zoom: '.5',
            }}
            dangerouslySetInnerHTML={{
              __html: apvHtml(pv),
            }}
          />
        </div>
      </div>
    </>
  );
}
export function FmTpl() {
  const cur = S.TPL.find((x) => x.key === S.fm.tsel) || S.TPL[0];
  S.fm.tsel = cur.key;
  let pe = null,
    pd = null;
  for (const e of S.entries.filter((x) => x.org === S.view)) {
    const d = docsFor(e).find((d) => tplFor(d.n) === cur && !apprOf(e, d));
    if (d) {
      pe = e;
      pd = d;
      break;
    }
  }
  return (
    <>
      <div className="page-head">
        <div>
          <h2>증빙 서식</h2>
          <p className="small muted">
            플랫폼에서 만드는 증빙 서류의 모양이에요. 항목 값에 {'{'}중괄호{'}'} 자리표시를 넣으면 집행 정보로 자동으로 채워져요.
          </p>
        </div>
      </div>
      <div
        className="apv-grid"
        style={{
          gridTemplateColumns: '240px minmax(0,1fr) 340px',
        }}
      >
        <nav
          className="card"
          style={{
            padding: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
          aria-label="서식 목록"
        >
          {jn(
            S.TPL.map((x, _i) => (
              <button
                key={_i}
                className="linkbtn"
                style={css(`text-decoration:none;padding:6px 8px;border-radius:6px;${x.key === cur.key ? 'background:var(--info-bg);font-weight:600' : ''}`)}
                data-a="fmTsel"
                data-x={x.key}
              >
                {x.name}
              </button>
            )),
          )}
        </nav>
        <section
          className="card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div className="grid2">
            <label className="field" htmlFor="tp-title">
              <span>문서 제목</span>
              <In id="tp-title" type="text" data-tpa="title" value={cur.title} />
            </label>{' '}
            <label className="field" htmlFor="tp-match">
              <span>
                적용 서류 <small>증빙 이름에 이 말이 들어가면 이 서식을 써요 (|로 여러 개)</small>
              </span>
              <In id="tp-match" type="text" data-tpa="match" value={cur.match} />
            </label>
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
                항목
              </b>
              <button className="btn sm" data-a="tpAddRow">
                + 항목 추가
              </button>
            </div>
            <div className="aline">
              {jn(
                cur.rows.map(([l, v], i) => (
                  <div
                    key={i}
                    className="ar"
                    style={{
                      gridTemplateColumns: '28px 140px minmax(0,1fr) auto',
                    }}
                  >
                    <span className="no">{i + 1}</span>
                    <label>
                      <span hidden>항목 이름</span>
                      <In id={`tpl-${i}`} type="text" data-tpr={`${i}|0`} value={l} />
                    </label>
                    <label>
                      <span hidden>값</span>
                      <In id={`tpv-${i}`} type="text" data-tpr={`${i}|1`} value={v} />
                    </label>
                    {<FmOps act={'tpRow'} i={i} len={cur.rows.length} />}
                  </div>
                )),
              )}
            </div>
          </div>
          {cur.table ? (
            <div className="notice small">
              이 서식에는 {cur.table === 'rate' ? '참여연구자 표(성명·소속·역할·참여율)' : '참여 인원 표(성명·소속·역할·근무 시간)'}가 자동으로 붙어요.
              {cur.table === 'time' ? (
                <>
                  {' '}
                  <label
                    htmlFor="tp-time"
                    style={{
                      display: 'inline-flex',
                      gap: '6px',
                      alignItems: 'center',
                      marginLeft: '6px',
                    }}
                  >
                    기본 근무 시간{' '}
                    <In
                      id="tp-time"
                      type="text"
                      data-tpa="time"
                      value={cur.time || ''}
                      style={{
                        width: '130px',
                      }}
                    />
                  </label>
                </>
              ) : null}
            </div>
          ) : null}{' '}
          <label className="field" htmlFor="tp-body">
            <span>본문</span>
            <In as="textarea" id="tp-body" rows={5} data-tpa="body" value={cur.body} />
          </label>
          <div>
            <b
              style={{
                fontSize: '13px',
              }}
            >
              쓸 수 있는 자리표시
            </b>{' '}
            <span className="small muted">누르면 본문 끝에 들어가요</span>
            <div
              className="row"
              style={{
                marginTop: '6px',
                gap: '4px',
              }}
            >
              {jn(
                PLACEHOLDERS.map((k, _i) => (
                  <button
                    key={_i}
                    className="chip"
                    style={{
                      border: 0,
                      cursor: 'pointer',
                    }}
                    data-a="tpPh"
                    data-x={k}
                  >
                    {'{'}
                    {k}
                    {'}'}
                  </button>
                )),
              )}
            </div>
          </div>
          <div className="row">
            <button className="btn sm" data-a="tpReset">
              처음 서식으로 되돌리기
            </button>
          </div>
        </section>
        <div
          className="a4wrap"
          style={{
            maxHeight: 'none',
          }}
        >
          {pe ? (
            <>
              <p
                className="small muted"
                style={{
                  marginBottom: '6px',
                }}
              >
                미리보기: {proj(pe.proj).short} {pe.desc}
              </p>
              <div
                style={{
                  zoom: '.5',
                }}
                dangerouslySetInnerHTML={{
                  __html: a4Html(pe, pd),
                }}
              />
            </>
          ) : (
            <p className="small muted">이 서식을 쓰는 집행이 아직 없어 미리보기가 없어요.</p>
          )}
        </div>
      </div>
    </>
  );
}
export function FmCat() {
  const item = S.fm.item;
  return (
    <>
      <div className="page-head">
        <div>
          <h2>비목별 증빙 목록</h2>
          <p className="small muted">세부유형마다 필요한 증빙과 그 서류를 어디서 채우는지 정해요. 기본값은 산업기술혁신사업 [별표 7]이에요.</p>
        </div>
      </div>
      <div className="seg" role="group" aria-label="비목">
        {jn(
          ITEMS.map((i, _i) => (
            <button key={_i} data-a="fmItem" data-x={i} aria-pressed={i === item}>
              {i}
            </button>
          )),
        )}
      </div>
      {jn(
        CAT[item].map((sb, si) => (
          <section key={si} className="card">
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
                {sb.s}
              </h3>
              <span className="small muted">{sb.d.length}개 서류</span>
            </div>
            <div className="aline">
              {jn(
                sb.d.map((r, di) => {
                  const d =
                    typeof r === 'string'
                      ? {
                          n: r,
                        }
                      : r;
                  const src = srcOf(d.n);
                  return (
                    <div
                      key={di}
                      className="ar"
                      style={{
                        gridTemplateColumns: '28px minmax(0,1fr) 130px auto',
                      }}
                    >
                      <span className="no">{di + 1}</span>
                      <label>
                        <span hidden>서류 이름</span>
                        <In id={`cn-${si}-${di}`} type="text" data-catn={`${si}|${di}`} value={d.n} />
                      </label>
                      <label>
                        <span hidden>출처</span>
                        <In as="select" id={`cs-${si}-${di}`} data-cats={`${si}|${di}`}>
                          {jn(
                            Object.entries(SRC_LABEL).map(([k, l], _i) => (
                              <option key={_i} value={k} {...ax(k === src ? 'selected' : '')}>
                                {l}
                              </option>
                            )),
                          )}
                        </In>
                      </label>
                      <span className="ops">
                        {d.opt ? (
                          <span className="chip" title={d.opt}>
                            해당 시
                          </span>
                        ) : null}
                        {d.min ? <span className="chip">{d.note}</span> : null}
                        {d.np ? <span className="chip">면제 가능</span> : null}
                        {d.fp ? <span className="chip">영리</span> : null}
                        <button type="button" data-a="catRm" data-x={`${si}|${di}`} aria-label="빼기">
                          ×
                        </button>
                      </span>
                    </div>
                  );
                }),
              )}
            </div>
            <div
              className="row"
              style={{
                marginTop: '8px',
              }}
            >
              <label
                htmlFor={`ca-${si}`}
                style={{
                  flex: '1',
                }}
              >
                <span hidden>추가할 서류</span>
                <In id={`ca-${si}`} type="text" placeholder="추가할 서류 이름 (예: 사진 대지)" />
              </label>
              <button className="btn sm" data-a="catAdd" data-x={si}>
                + 서류 추가
              </button>
            </div>
          </section>
        )),
      )}
      <section className="card">
        <div className="row">
          <label
            htmlFor="ca-sub"
            style={{
              flex: '1',
            }}
          >
            <span hidden>새 세부유형</span>
            <In id="ca-sub" type="text" placeholder="새 세부유형 이름" />
          </label>
          <button className="btn sm" data-a="catAddSub">
            + 세부유형 추가
          </button>
        </div>
      </section>
      <p className="small muted">서류 이름을 바꾸면 이미 등록한 집행의 증빙 상태도 새 이름으로 옮겨져요. 서류를 빼면 해당 집행에서 그 증빙을 더 이상 요구하지 않아요.</p>
    </>
  );
}
export function FmCommon() {
  return (
    <>
      <div className="page-head">
        <div>
          <h2>문서 공통</h2>
          <p className="small muted">모든 A4 증빙과 결재 문서에 공통으로 적용돼요.</p>
        </div>
      </div>
      <section
        className="card"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          maxWidth: '640px',
        }}
      >
        <label className="field" htmlFor="fc-foot">
          <span>
            문서 맨 아래 문구 <small>비워 두면 아무것도 표시하지 않아요</small>
          </span>
          <In id="fc-foot" type="text" data-fc="docFooter" value={S.docFooter} placeholder="예: 새솔대학교 산학협력단 연구지원팀" />
        </label>{' '}
        <label className="check" htmlFor="fc-sign">
          <In id="fc-sign" type="checkbox" data-fcsign="1" {...ax(S.docSign ? 'checked' : '')} />
          <span>서식 아래에 작성일과 기관명 넣기</span>
        </label>{' '}
        <label className="check" htmlFor="fc-seal">
          <In id="fc-seal" type="checkbox" data-fcseal="1" {...ax(S.docSeal ? 'checked' : '')} {...ax(S.docSign ? '' : 'disabled')} />
          <span>기관명 옆에 직인 찍기</span>
        </label>
      </section>
      <section
        className="card"
        style={{
          maxWidth: '640px',
        }}
      >
        <h3 className="h3">기관 직인</h3>
        {(() => {
          const c = sealOf(S.view);
          return (
            <div
              className="row"
              style={{
                alignItems: 'flex-start',
                gap: '18px',
                flexWrap: 'wrap',
              }}
            >
              <div
                className="stampopt"
                style={{
                  width: '150px',
                }}
              >
                <span
                  className="pv"
                  dangerouslySetInnerHTML={{
                    __html: orgSealHtml(S.view),
                  }}
                />
                <span className="small">{c.kind === 'image' ? '올린 이미지' : '자동 생성'}</span>
              </div>
              <div
                style={{
                  flex: '1',
                  minWidth: '220px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div className="row">
                  <button className={`btn sm ${c.kind === 'auto' ? 'primary' : ''}`} data-a="sealKind" data-x="auto">
                    자동 생성
                  </button>
                  <label className={`btn sm ${c.kind === 'image' ? 'primary' : ''}`} htmlFor="seal-up">
                    직인 이미지 올리기
                    <In id="seal-up" type="file" accept="image/*" hidden data-a-change="sealUp" />
                  </label>
                </div>
                {c.kind === 'auto' ? (
                  <label className="field" htmlFor="seal-text">
                    <span>
                      직인 문구 <small>오른쪽 줄부터 위에서 아래로 읽혀요</small>
                    </span>
                    <In id="seal-text" type="text" data-sealtext="1" value={c.text} maxLength={16} />
                  </label>
                ) : null}
                <p className="small muted">증빙 서식 아래 작성일·기관명 옆에 찍혀요. 실제 등록 직인을 스캔해 올리면 흰 배경은 자동으로 투명해져요.</p>
              </div>
            </div>
          );
        })()}
      </section>
    </>
  );
}

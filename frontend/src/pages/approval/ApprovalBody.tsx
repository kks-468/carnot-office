// 전자결재: 홈 · 결재함 · 문서 보기 · 새 결재 작성 · 서명·도장
import type { ReactNode } from 'react';
import { useS, S as SS } from '../../core/state';
import { AFORMS, BOX, CAT, ITEMS, LTYPES, RX_HIDE, RX_AMT, RX_DATE, TODAY } from '../../core/catalog';
import { me, person, personLv, proj } from '../../core/org';
import { apvCur, apvList, apvAttached, apvOrg, rxNew, rxProjs } from '../../core/approval';
import { apvFormOf, docsFor, evState, isPending } from '../../core/evidence';
import { fundBudget, spentF } from '../../core/budget';
import { apvHtml, sealSvg, stampHtml, stampOf } from '../../core/print';
import { fdate, short, won } from '../../core/util';
import { Btn, Check, Html, In, LinkBtn, Nav } from '../../ui/primitives';

/** 결재 상태 표시 */
export function StChip({ a }: { a: any }) {
  const c = apvCur(a);
  if (a.status === '진행')
    return (
      <span className="chip org">
        진행 중{c ? ` · ${person(c.pid)?.name}` : ''}
      </span>
    );
  if (a.status === '완료') return <span className="chip good">완료</span>;
  if (a.status === '반려') return <span className="chip bad">반려</span>;
  return <span className="chip">임시 저장</span>;
}

/** 결재 문서 목록 표 */
export function ApvTable({ list, empty }: { list: any[]; empty: string }) {
  return (
    <div className="tw">
      <table>
        <thead>
          <tr>
            <th>기안일</th>
            <th>결재양식</th>
            <th>제목</th>
            <th>첨부</th>
            <th>기안자</th>
            <th>문서번호</th>
            <th>상태</th>
          </tr>
        </thead>
        <tbody>
          {list.length ? (
            list.map((a) => (
              <tr key={a.id}>
                <td className="num">{fdate(a.date)}</td>
                <td className="small">{a.form}</td>
                <td>
                  {a.urgent ? (
                    <>
                      <span className="chip bad">긴급</span>{' '}
                    </>
                  ) : null}
                  <LinkBtn a="apvOpen" x={a.id}>
                    {a.title}
                  </LinkBtn>
                  {a.link ? (
                    <>
                      {' '}
                      <span className="chip info">연구비 연동</span>
                    </>
                  ) : null}
                </td>
                <td className="small">{a.files.length ? a.files.length + '개' : ''}</td>
                <td>{person(a.drafter)?.name}</td>
                <td className="num small">{a.no || '-'}</td>
                <td>
                  <StChip a={a} />
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={7} className="muted">
                {empty}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function ApprovalBody() {
  const S = useS();
  const n = (k: string) => apvList(k).length;
  const cnt = (k: string, hot?: boolean) => {
    const c = n(k);
    return c ? <span className={`cnt ${hot ? '' : 'mute'}`}>{c}</span> : null;
  };
  const it: [string, string, ReactNode?][] = [
    ['home', '전자결재 홈'],
    ['-', '결재하기'],
    ['wait', '결재 대기 문서', cnt('wait', true)],
    ['upcoming', '결재 예정 문서', cnt('upcoming')],
    ['ref', '참조·열람 문서', cnt('ref')],
    ['-', '개인 문서함'],
    ['draft', '기안 문서함', cnt('draft')],
    ['done', '결재 문서함', cnt('done')],
    ['temp', '임시 저장함', cnt('temp')],
    ['rejected', '반려 문서', cnt('rejected', true)],
    ['-', '설정'],
    ['stamp', '서명·도장'],
  ];
  const cur = S.apv.edit || S.apv.doc ? '' : S.apv.box;
  const page = S.apv.edit ? <ApvEditor /> : S.apv.doc ? <ApvDoc /> : S.apv.box === 'home' ? <ApvHome /> : S.apv.box === 'stamp' ? <ApvStamp /> : <ApvBox k={S.apv.box} />;
  return (
    <div className="body">
      <nav className="subnav" aria-label="전자결재 메뉴">
        <Btn a="apvNew" className="newbtn">
          새 결재 진행
        </Btn>
        <Nav items={it} cur={cur} a="apvBox" />
      </nav>
      <div className="work">{page}</div>
    </div>
  );
}

function ApvHome() {
  const m = me();
  const card = (k: string, label: string, bad?: boolean) => (
    <Btn a="apvBox" x={k} className="pcard" style={{ gap: 2 }}>
      <span className="small muted">{label}</span>
      <strong style={{ fontSize: 24 }} className={`num ${bad && apvList(k).length ? 'err' : ''}`}>
        {apvList(k).length}
      </strong>
    </Btn>
  );
  return (
    <>
      <div className="page-head">
        <div>
          <h2>전자결재 홈</h2>
          <p className="small muted">
            {m.name} · {m.unit} · 연구행정의 내부결재 증빙도 여기서 결재해요
          </p>
        </div>
      </div>
      <div className="cards" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))' }}>
        {card('wait', '결재할 문서', true)}
        {card('upcoming', '결재 예정')}
        {card('draft', '내가 기안한 문서')}
        {card('rejected', '반려된 문서', true)}
      </div>
      <section>
        <div className="row between" style={{ marginBottom: 8 }}>
          <h3 className="h3" style={{ margin: 0 }}>
            결재 대기 문서
          </h3>
          <Btn a="apvBox" x="wait" className="btn sm">
            전체 보기
          </Btn>
        </div>
        <ApvTable list={apvList('wait').slice(0, 5)} empty="결재할 문서가 없어요. 위의 ‘보는 사람’을 최민재로 바꾸면 행정 담당자의 결재함을 볼 수 있어요." />
      </section>
      <section>
        <div className="row between" style={{ marginBottom: 8 }}>
          <h3 className="h3" style={{ margin: 0 }}>
            최근 기안 문서
          </h3>
          <Btn a="apvBox" x="draft" className="btn sm">
            전체 보기
          </Btn>
        </div>
        <ApvTable list={apvList('draft').slice(0, 5)} empty="기안한 문서가 없어요." />
      </section>
      <section>
        <h3 className="h3">자주 쓰는 양식</h3>
        <div className="formlist">
          {AFORMS.filter((x: any) => x.use !== false)
            .slice(0, 6)
            .map((fm: any) => (
              <Btn key={fm.id} a="apvStart" x={fm.id} className="">
                <b>{fm.name}</b>
                <small>{fm.desc}</small>
              </Btn>
            ))}
        </div>
      </section>
    </>
  );
}

function ApvBox({ k }: { k: string }) {
  const q = SS.apv.q.trim();
  const list = apvList(k).filter((a: any) => !q || (a.title + a.form + (person(a.drafter)?.name || '')).includes(q));
  return (
    <>
      <div className="page-head">
        <h2>{BOX[k]}</h2>
        <label className="field" htmlFor="apvq" style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <span className="small">검색</span>
          <In id="apvq" type="text" data-ae="q" value={SS.apv.q} placeholder="제목, 양식, 기안자" style={{ width: 220 }} />
        </label>
      </div>
      <ApvTable list={list} empty={k === 'wait' ? '결재할 문서가 없어요.' : '문서가 없어요.'} />
    </>
  );
}

function ResearchSide({ a }: { a: any }) {
  const S = SS;
  const e = a.link && S.entries.find((x: any) => x.id === a.link.e);
  const at = apvAttached(a);
  const research = AFORMS.find((x: any) => x.id === a.fid)?.group === '연구행정';
  if (a.status === '완료') {
    if (!research && !at.length) return null;
    const opts: [string, string, string][] = [];
    S.entries
      .filter((x: any) => x.org === apvOrg(a))
      .forEach((x: any) =>
        docsFor(x).forEach((d: any) => {
          if (d.kind !== 'exempt' && evState(x, d) !== 'O' && (d.src === 'approval' || d.src === 'form')) opts.push([`${x.id}|${d.n}`, `${fdate(x.date)} ${proj(x.proj).short} · ${x.sub} · ${x.desc} → ${short(d.n)}`, d.src]);
        }),
      );
    opts.sort((p, q) => (p[2] === 'approval' ? 0 : 1) - (q[2] === 'approval' ? 0 : 1));
    return (
      <section className="card">
        <h3 className="h3">연구비 증빙</h3>
        {at.length ? (
          <ul style={{ margin: '0 0 8px', paddingLeft: 16, fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {at.map((x: any, i: number) => (
              <li key={i}>
                {proj(x.e.proj).short} · {x.e.desc}
                <br />
                <span className="small muted">{short(x.n)} 증빙으로 붙음</span>
                <div className="row" style={{ marginTop: 4 }}>
                  <Btn a="openEvidence" x={x.e.id} className="btn sm">
                    증빙 보기
                  </Btn>
                  <Btn a="apvDl" x={a.id} className="btn sm">
                    PDF
                  </Btn>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="small muted">아직 연구비 집행에 붙지 않았어요.</p>
        )}
        {opts.length ? (
          <>
            <label className="field" htmlFor="f-apl" style={{ marginTop: 8 }}>
              <span>집행 증빙으로 붙이기</span>
              <In as="select" id="f-apl" data-b="apl" value={S.f.apl || ''}>
                <option value="">집행과 증빙 선택</option>
                {opts.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </In>
            </label>
            <Btn a="apvAttach" className="btn sm primary" style={{ marginTop: 8 }}>
              증빙으로 붙이기
            </Btn>
          </>
        ) : null}
      </section>
    );
  }
  if (!e && a.rx) {
    const p = proj(a.rx.proj);
    return (
      <section className="card">
        <h3 className="h3">연구비 연동</h3>
        <p className="small">
          {p?.short || ''} · {a.rx.item}/{a.rx.sub} ({a.rx.fund})
          <br />
          {a.rx.desc || a.title} · {won(a.rx.amount)} · {fdate(a.rx.date)}
        </p>
        <p className="small muted" style={{ marginTop: 6 }}>
          {a.status === '반려' ? '반려돼서 연구행정관리에 등록되지 않았어요.' : '최종 승인되면 연구행정관리 집행으로 등록되고 이 문서가 내부결재 증빙으로 붙어요.'}
        </p>
      </section>
    );
  }
  if (!e) return null;
  return (
    <section className="card">
      <h3 className="h3">연구비 연동</h3>
      <p className="small">
        {proj(e.proj).short} · {e.item}/{e.sub}
        <br />
        {e.desc} · {won(e.amount)}
      </p>
      <p className="small muted" style={{ marginTop: 6 }}>
        최종 승인되면 이 결재 문서가 그대로 ‘{short(a.link.n)}’ 증빙으로 붙어요.
      </p>
      <Btn a="openEvidence" x={e.id} className="btn sm" style={{ marginTop: 8 }}>
        증빙 보기
      </Btn>
    </section>
  );
}

function ApvDoc() {
  const S = useS();
  const a = S.appr.find((x: any) => x.id === S.apv.doc);
  const m = me();
  const cur = apvCur(a);
  const mine = cur?.pid === m.id;
  const canWithdraw = a.drafter === m.id && a.status === '진행' && !a.line.some((l: any) => l.type !== '기안' && ['승인', '반려'].includes(l.st));
  return (
    <>
      <div className="apv-bar">
        <div className="row">
          <Btn a="apvBack" className="btn sm">
            ‹ 목록
          </Btn>
          <StChip a={a} />
          {a.urgent ? <span className="chip bad">긴급</span> : null}
        </div>
        <div className="row">
          {mine ? (
            <>
              <Btn a="apvApprove" className="btn primary">
                {cur.type === '협조' ? '협조' : cur.type === '검토' ? '검토 완료' : '승인'}
              </Btn>
              <Btn a="apvRejectBtn">반려</Btn>
            </>
          ) : null}
          {canWithdraw ? <Btn a="apvWithdraw">회수</Btn> : null}
          {a.status === '반려' && a.drafter === m.id ? (
            <Btn a="apvRedraft" className="btn primary">
              재기안
            </Btn>
          ) : null}
          <Btn a="apvPdf">A4 PDF</Btn>
        </div>
      </div>
      <div className="apv-grid">
        <Html className="a4wrap doc" html={apvHtml(a)} />
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {mine ? (
            <section className="card">
              <h3 className="h3">결재 의견</h3>
              <label className="field" htmlFor="apvc">
                <span hidden>결재 의견</span>
                <In as="textarea" id="apvc" data-ae="comment" rows={4} placeholder="승인은 의견 없이도 돼요. 반려할 때는 사유를 써 주세요." value={S.apv.comment} />
              </label>
              {S.apv.err ? (
                <p className="err" role="alert">
                  {S.apv.err}
                </p>
              ) : null}
            </section>
          ) : null}
          <ResearchSide a={a} />
          <section className="card">
            <h3 className="h3">결재 진행</h3>
            <ol className="tl">
              {a.line.map((l: any, i: number) => {
                const p = person(l.pid);
                return (
                  <li key={i} className={l.st === '승인' ? 'ok' : l.st === '반려' ? 'no' : l.st === '대기' ? 'go' : ''}>
                    <div>
                      <b>{p?.name}</b>{' '}
                      <small>
                        {l.type} · {p?.role || ''}
                      </small>
                      <br />
                      <small>
                        {l.st === '대기' ? '결재 차례' : l.st === '예정' ? '대기 중' : l.st}
                        {l.date ? ' · ' + fdate(l.date) : ''}
                      </small>
                      {l.comment ? <q>{l.comment}</q> : null}
                    </div>
                  </li>
                );
              })}
            </ol>
            {a.refs.length ? (
              <p className="small muted" style={{ marginTop: 10 }}>
                참조: {a.refs.map((i: string) => person(i)?.name).join(', ')}
              </p>
            ) : null}
          </section>
          <section className="card">
            <h3 className="h3">문서 이력</h3>
            <ol className="tl">
              {a.log.length ? (
                a.log
                  .slice()
                  .reverse()
                  .map((l: any, i: number) => (
                    <li key={i} className={l.act === '반려' ? 'no' : l.act === '회수' ? '' : 'ok'}>
                      <div>
                        {person(l.pid)?.name}{' '}
                        <small>
                          {l.act} · {fdate(l.date)}
                        </small>
                        {l.comment ? <q>{l.comment}</q> : null}
                      </div>
                    </li>
                  ))
              ) : (
                <li>
                  <div className="small muted">아직 없어요.</div>
                </li>
              )}
            </ol>
          </section>
        </aside>
      </div>
    </>
  );
}

function ApvStamp() {
  useS();
  const m = me();
  const st = stampOf(m.id);
  const opt = (k: string, l: string, pv: ReactNode) => (
    <Btn a="stampKind" x={k} className="stampopt" aria-pressed={st.kind === k}>
      <span className="pv">{pv}</span>
      <span className="small">
        <b>{l}</b>
      </span>
    </Btn>
  );
  const imgPv = (k: string) => (st.kind === k && st.img ? <img src={st.img} alt="" /> : <span className="small muted">{k === 'draw' ? '직접 그리기' : '파일 올리기'}</span>);
  return (
    <>
      <div className="page-head">
        <div>
          <h2>서명·도장</h2>
          <p className="small muted">{m.name}님이 결재하면 결재란에 찍히는 도장이에요. 전자결재 문서와 연구비 증빙 A4 PDF에 똑같이 들어가요.</p>
        </div>
      </div>
      <section className="card">
        <h3 className="h3">사용할 도장</h3>
        <div className="stampopts">
          {opt('circle', '원형 도장 (자동)', <Html as="span" html={sealSvg(m.name, 'circle')} />)}
          {opt('square', '사각 도장 (자동)', <Html as="span" html={sealSvg(m.name, 'square')} />)}
          {opt('draw', '서명', imgPv('draw'))}
          {opt('image', '도장 이미지', imgPv('image'))}
        </div>
      </section>
      {st.kind === 'draw' ? (
        <section className="card">
          <h3 className="h3">서명 그리기</h3>
          <p className="small muted">마우스나 손가락으로 아래 칸에 서명해 주세요.</p>
          <canvas id="sigpad" width={840} height={320} aria-label="서명 입력 칸" />
          <div className="row" style={{ marginTop: 8 }}>
            <Btn a="sigClear" className="btn sm">
              지우기
            </Btn>
            <Btn a="sigSave" className="btn sm primary">
              서명 저장
            </Btn>
          </div>
        </section>
      ) : null}
      {st.kind === 'image' ? (
        <section className="card">
          <h3 className="h3">도장 이미지 올리기</h3>
          <p className="small muted">흰 종이에 찍은 도장을 사진으로 찍거나 스캔해서 올려 주세요. 흰 배경은 자동으로 투명하게 바꿔요.</p>
          <label className="btn sm" htmlFor="stamp-up">
            이미지 고르기
            <input id="stamp-up" type="file" accept="image/*" hidden data-a-change="stampUp" />
          </label>
        </section>
      ) : null}
      <section>
        <h3 className="h3">결재란 미리보기</h3>
        <div className="a4" style={{ minHeight: 0, padding: 16, width: 'auto', maxWidth: 'min(380px,100%)', boxSizing: 'border-box' }}>
          <div className="appr">
            <div className="t" style={{ width: 'auto', padding: 4 }}>
              결재
            </div>
            <div>
              <div className="r">{personLv(m) || m.role}</div>
              <Html className="s" html={stampHtml(m.id)} />
              <div className="d">
                {m.name}
                <br />
                {fdate(TODAY.slice(5))}
              </div>
            </div>
            <div>
              <div className="r">팀장</div>
              <div className="s" />
              <div className="d">
                &nbsp;
                <br />
                &nbsp;
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function RxBlock({ ed, links }: { ed: any; links: [string, string][] }) {
  const S = SS;
  const rx = ed.rx || (ed.rx = rxNew());
  const ps = rxProjs();
  const p = rx.proj && proj(rx.proj);
  const myLinks = p ? links.filter(([k]) => S.entries.find((e: any) => e.id === +k.split('|')[0])?.proj === p.id) : [];
  let inner: ReactNode = null;
  if (p) {
    const left = fundBudget(p, S.view, rx.item, rx.fund) - spentF(p, S.view, rx.item, rx.fund);
    const amt = +rx.amount || 0;
    const ds = (CAT[rx.item]?.find((x: any) => x.s === rx.sub)?.d || []).map((x: any) => (typeof x === 'string' ? x : x.n));
    const hit = ds.find((n: string) => apvFormOf(n) === ed.fid) || (ed.fid === 'exec' ? ds.find((n: string) => apvFormOf(n) === 'exec') : null);
    inner = (
      <>
        <div className="seg" role="group" aria-label="연결 방식" style={{ marginTop: 2 }}>
          <Btn a="apvRxMode" x="new" className="" aria-pressed={rx.mode !== 'link'}>
            새 집행으로 등록
          </Btn>
          <Btn a="apvRxMode" x="link" className="" aria-pressed={rx.mode === 'link'}>
            이미 등록된 집행에 붙이기
          </Btn>
        </div>
        {rx.mode === 'link' ? (
          <label className="field" htmlFor="ae-link">
            <span>
              연결할 집행 <small>내부결재 증빙이 필요한 집행 건이에요. 최종 승인되면 증빙이 O가 돼요</small>
            </span>
            <In as="select" id="ae-link" data-ae="link" value={ed.link || ''}>
              <option value="">집행 선택</option>
              {myLinks.map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </In>
            {myLinks.length ? null : <small>이 과제에 내부결재가 필요한 집행이 없어요.</small>}
          </label>
        ) : (
          <>
            <div className="grid3">
              <label className="field" htmlFor="rx-item">
                <span>비목</span>
                <In as="select" id="rx-item" data-rx="item" value={rx.item}>
                  {ITEMS.filter((i: string) => i !== '간접비').map((i: string) => (
                    <option key={i}>{i}</option>
                  ))}
                </In>
              </label>
              <label className="field" htmlFor="rx-sub">
                <span>세부유형</span>
                <In as="select" id="rx-sub" data-rx="sub" value={rx.sub}>
                  {(CAT[rx.item] || []).map((x: any) => (
                    <option key={x.s}>{x.s}</option>
                  ))}
                </In>
              </label>
              <label className="field" htmlFor="rx-fund">
                <span>재원</span>
                <In as="select" id="rx-fund" data-rx="fund" value={rx.fund}>
                  {['현금', '현물'].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </In>
              </label>
            </div>
            <div className="grid3">
              <label className="field" htmlFor="rx-amount">
                <span>금액(원)</span>
                <In id="rx-amount" type="number" data-rx="amount" value={rx.amount} />
                <small className={amt > left ? 'err' : ''}>
                  {rx.item} {rx.fund} 잔액 {won(left)}
                  {amt > left ? ' · 잔액보다 커요' : ''}
                </small>
              </label>
              <label className="field" htmlFor="rx-date">
                <span>집행(예정)일</span>
                <In id="rx-date" type="date" data-rx="date" value={rx.date} />
              </label>
              <label className="field" htmlFor="rx-desc">
                <span>집행 내용</span>
                <In id="rx-desc" type="text" data-rx="desc" value={rx.desc} placeholder="비우면 제목으로 들어가요" />
              </label>
            </div>
            <p className="small muted" style={{ margin: 0 }}>
              최종 승인되면 <b>{p.short}</b> 연구행정관리의 {rx.item} · {rx.sub} 집행으로 등록되고,{' '}
              {hit ? (
                <>
                  이 결재 문서가 <b>‘{short(hit)}’</b> 증빙으로 바로 붙어요.
                </>
              ) : (
                '이 세부유형에는 이 양식으로 받는 증빙이 없어서 집행만 등록돼요.'
              )}
            </p>
          </>
        )}
      </>
    );
  }
  return (
    <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div>
        <h3 className="h3" style={{ margin: 0 }}>
          관련 연구
        </h3>
        <p className="small muted" style={{ margin: '2px 0 0' }}>
          연구 과제 비용이면 과제를 골라 주세요. 회사 자체 품의는 ‘연결 안 함’으로 두면 연구행정관리에 들어가지 않아요.
        </p>
      </div>
      <label className="field" htmlFor="rx-proj">
        <span hidden>관련 과제</span>
        <In as="select" id="rx-proj" data-rx="proj" value={rx.proj || ''}>
          <option value="">연결 안 함 · 회사 자체 품의</option>
          {ps.map((x: any) => (
            <option key={x.id} value={x.id}>
              {x.name} ({x.short})
            </option>
          ))}
        </In>
      </label>
      {inner}
    </section>
  );
}

function PeopleSelect({ id, attr, placeholder, groups }: { id: string; attr: string; placeholder: string; groups: Record<string, any[]> }) {
  return (
    <In as="select" id={id} {...{ [attr]: '1' }} value="">
      <option value="">{placeholder}</option>
      {Object.entries(groups).map(([g, xs]) => (
        <optgroup key={g} label={g}>
          {xs.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} · {p.role}
            </option>
          ))}
        </optgroup>
      ))}
    </In>
  );
}

function ApvEditor() {
  const S = useS();
  const ed = S.apv.edit;
  const m = me();
  const fm = AFORMS.find((x: any) => x.id === ed.fid);
  const ps = S.people.filter((p: any) => p.org === S.view);
  const groups: Record<string, any[]> = {};
  ps.filter((p: any) => !ed.line.some((l: any) => l.pid === p.id)).forEach((p: any) => {
    (groups[p.unit || '기타'] = groups[p.unit || '기타'] || []).push(p);
  });
  const rgroups: Record<string, any[]> = {};
  ps.filter((p: any) => !ed.refs.includes(p.id) && p.id !== m.id).forEach((p: any) => {
    (rgroups[p.unit || '기타'] = rgroups[p.unit || '기타'] || []).push(p);
  });
  const links: [string, string][] = [];
  S.entries
    .filter((e: any) => e.org === S.view)
    .forEach((e: any) =>
      docsFor(e).forEach((d: any) => {
        const df = apvFormOf(d.n);
        if (d.src === 'approval' && evState(e, d) !== 'O' && !isPending(e, d) && (df === ed.fid || (ed.fid === 'exec' && !AFORMS.some((f: any) => f.id === df && f.id !== 'exec'))))
          links.push([`${e.id}|${d.n}`, `${fdate(e.date)} ${proj(e.proj).short} · ${e.sub} · ${e.desc} (${short(d.n)})`]);
      }),
    );
  const rx = ed.rx || {};
  const auto = rx.proj && rx.mode !== 'link';
  const fs = ed.fields.map((r: any, i: number) => [r, i]).filter(([[k]]: any) => !RX_HIDE.includes(k) && !(auto && (RX_AMT.includes(k) || RX_DATE.includes(k))));
  return (
    <>
      <div className="apv-bar">
        <div>
          <b>{fm?.name}</b> <span className="small muted">작성 중</span>
        </div>
        <div className="row">
          <Btn a="apvSubmit" className="btn primary">
            결재 요청
          </Btn>
          <Btn a="apvTemp">임시 저장</Btn>
          <Btn a="apvCancel">취소</Btn>
        </div>
      </div>
      {ed.err ? (
        <p className="err" role="alert">
          {ed.err}
        </p>
      ) : null}
      <div className="apv-meta">
        <div>
          <span>기안자</span>
          {m.name} · {m.role}
        </div>
        <div>
          <span>기안부서</span>
          {m.unit}
        </div>
        <div>
          <span>기안일</span>
          {fdate(TODAY)}
        </div>
        <div>
          <span>문서번호</span>결재 요청 시 자동 부여
        </div>
      </div>
      <section className="card">
        <div className="row between" style={{ marginBottom: 8 }}>
          <h3 className="h3" style={{ margin: 0 }}>
            결재선
          </h3>
          <div className="row">
            <Btn a="apvDefaultLine" className="btn sm">
              기본 결재선으로
            </Btn>
            <Btn a="goLineSet" className="btn sm">
              결재선 설정
            </Btn>
          </div>
        </div>
        <div className="aline">
          {ed.line.map((l: any, i: number) => {
            const p = person(l.pid);
            return (
              <div className="ar" key={i + l.pid}>
                <span className="no">{i + 1}</span>
                {l.type === '기안' ? (
                  <span className="chip">기안</span>
                ) : (
                  <label>
                    <span hidden>{p.name} 결재 종류</span>
                    <In as="select" id={`lt-${i}`} data-aetype={i} value={l.type}>
                      {LTYPES.map((k: string) => (
                        <option key={k}>{k}</option>
                      ))}
                    </In>
                  </label>
                )}
                <span>
                  {p.name}{' '}
                  <span className="small muted">
                    {p.role} · {p.unit}
                  </span>
                </span>
                {l.type === '기안' ? (
                  <span />
                ) : (
                  <span className="ops">
                    <button type="button" data-a="apvMv" data-x={`${i}|-1`} aria-label="위로" disabled={i <= 1}>
                      ↑
                    </button>
                    <button type="button" data-a="apvMv" data-x={`${i}|1`} aria-label="아래로" disabled={i === ed.line.length - 1}>
                      ↓
                    </button>
                    <button type="button" data-a="apvRm" data-x={i} aria-label="빼기">
                      ×
                    </button>
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <div className="grid2" style={{ marginTop: 10 }}>
          <label className="field" htmlFor="aeadd">
            <span>
              결재자 추가 <small>부서별로 묶여 있어요. 순서대로 결재해요</small>
            </span>
            <PeopleSelect id="aeadd" attr="data-aeadd" placeholder="+ 결재자 선택" groups={groups} />
          </label>
          <label className="field" htmlFor="aeref">
            <span>
              참조자 추가 <small>결재 없이 문서를 볼 수 있어요</small>
            </span>
            <PeopleSelect id="aeref" attr="data-aeref" placeholder="+ 참조자 선택" groups={rgroups} />
          </label>
        </div>
        {ed.refs.length ? (
          <div className="pchips" style={{ marginTop: 8 }}>
            {ed.refs.map((i: string) => (
              <span className="pchip" key={i}>
                {person(i)?.name} <small>참조</small>
                <button type="button" data-a="apvRefRm" data-x={i} aria-label="참조 빼기">
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : null}
      </section>
      <RxBlock ed={ed} links={links} />
      <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="row" style={{ alignItems: 'flex-end' }}>
          <label className="field" htmlFor="ae-title" style={{ flex: 1 }}>
            <span>제목</span>
            <In id="ae-title" type="text" data-ae="title" value={ed.title} placeholder="예: 연구A 셀 안전성 자문료 지급 품의" />
          </label>
          <label className="check" htmlFor="ae-urgent">
            <Check id="ae-urgent" data-ae="urgent" checked={!!ed.urgent} />
            <span>긴급</span>
          </label>
        </div>
        {fs.length ? (
          <div className="grid2">
            {fs.map(([[k, v], i]: any) => (
              <label className="field" htmlFor={`aef-${i}`} key={i}>
                <span>{k}</span>
                <In id={`aef-${i}`} type="text" data-aef={i} value={v} />
              </label>
            ))}
          </div>
        ) : null}
        <label className="field" htmlFor="ae-body">
          <span>본문</span>
          <In as="textarea" id="ae-body" data-ae="body" rows={10} value={ed.body} />
        </label>
        <label className="field" htmlFor="ae-files">
          <span>첨부</span>
          <input id="ae-files" type="file" multiple data-a-change="apvFiles" />
          {ed.files.length ? <small>{ed.files.join(', ')}</small> : null}
        </label>
      </section>
    </>
  );
}

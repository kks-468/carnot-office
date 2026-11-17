// 프로토타입 화면을 React 컴포넌트로 옮겼어요. 버튼·입력은 data-* 속성으로 core/actions의 A와 연결돼요.
import { budgetOf, spentOf } from '../../core/budget';
import { TODAY } from '../../core/catalog';
import { attNames, conflictText, conflictsFor, mLabel, mStatus, monthLine, sourceBundle, srcDocs, wizCtx } from '../../core/meeting';
import { live, peopleOf, proj, teamOk, visible } from '../../core/org';
import { S } from '../../core/state';
import { fdate, won } from '../../core/util';
import { Legend } from './AdminBody';
import { Picker } from '../../ui/Picker';
import { TeamChips } from '../../ui/TeamChips';
import { Raw, ax, jb, jn } from '../../ui/jsx';
import { Field, In } from '../../ui/primitives';

export function MeetPage() {
  const { y, m } = S.cal;
  const first = new Date(y, m, 1);
  const startDow = first.getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const vis = S.meetings.filter((x) => live(proj(x.proj)) && teamOk(proj(x.proj)));
  const cells: any = [];
  const lead = new Date(y, m, 1 - startDow);
  const total = Math.ceil((startDow + days) / 7) * 7;
  for (let i = 0; i < total; i++) {
    const d = new Date(lead.getFullYear(), lead.getMonth(), lead.getDate() + i);
    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const ms = vis.filter((x) => x.date === ds).sort((a, b) => (a.start < b.start ? -1 : 1));
    cells.push(
      <div className={`day ${d.getMonth() !== m ? 'out' : ''} ${ds === TODAY ? 'today' : ''}`}>
        <span className="dn">{d.getDate()}</span>
        {jn(
          ms.map((x, _i) => (
            <button key={_i} className={`mt st-${mStatus(x)}`} data-a="openMeeting" data-x={x.id} title={`${x.topic} · ${mLabel(x)}`}>
              <b>
                {x.start} {proj(x.proj).short}
              </b>
              <span>{x.topic}</span>
            </button>
          )),
        )}
      </div>,
    );
  }
  const month = `${y}-${String(m + 1).padStart(2, '0')}`;
  const list = vis.filter((x) => x.date.startsWith(month)).sort((a, b) => (a.date + a.start < b.date + b.start ? -1 : 1));
  const late = vis.filter((x) => mStatus(x) === 'late');
  const noPay = vis.filter((x) => x.status === '완료' && !x.entry);
  return (
    <>
      <div className="page-head">
        <div>
          <h2>회의일정</h2>
          <p className="small muted">모든 과제의 회의를 한곳에서 관리해요. 같은 사람이 같은 시간에 두 회의에 들어가면 등록할 수 없어요.</p>
        </div>
        <button className="btn primary" data-a="newMeeting">
          회의 예비 등록
        </button>
      </div>
      {<TeamChips list={visible()} />}{' '}
      {late.length ? (
        <div className="notice bad">
          지난 예비 일정이 {late.length}건 있어요:{' '}
          {jb(
            late.map((x, _i) => (
              <button key={_i} className="linkbtn" data-a="openMeeting" data-x={x.id}>
                {fdate(x.date.slice(5))} {x.topic}
              </button>
            )),
            ', ',
          )}
          . 회의를 했다면 완료 처리해 주세요.
        </div>
      ) : null}{' '}
      {noPay.length ? (
        <div className="notice warn">
          완료된 회의 중 회의비가 등록되지 않은 건이 {noPay.length}건 있어요:{' '}
          {jb(
            noPay.map((x, _i) => (
              <button key={_i} className="linkbtn" data-a="openMeeting" data-x={x.id}>
                {x.topic}
              </button>
            )),
            ', ',
          )}
          . 앱에서 올라온 영수증으로 연결할 수 있어요.
        </div>
      ) : null}
      <div className="row between">
        <div className="row">
          <button className="btn sm" data-a="calPrev" aria-label="이전 달">
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
          <button className="btn sm" data-a="calNext" aria-label="다음 달">
            ›
          </button>
          <button className="btn sm" data-a="calToday">
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
        <h3 className="h3">{m + 1}월 회의 목록</h3>
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>일시</th>
                <th>과제</th>
                <th>안건</th>
                <th>참석자</th>
                <th>상태</th>
                <th>회의비</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {jn(
                list.map((x, _i) => (
                  <tr key={_i}>
                    <td className="num">
                      {fdate(x.date.slice(5))} {x.start}~{x.end}
                    </td>
                    <td>{proj(x.proj).short}</td>
                    <td>
                      <button className="linkbtn" data-a="openMeeting" data-x={x.id}>
                        {x.topic}
                      </button>
                    </td>
                    <td className="small">{attNames(x)}</td>
                    <td>
                      <span
                        className={`chip ${
                          {
                            done: 'info',
                            plan: 'org',
                            late: 'bad',
                          }[mStatus(x)]
                        }`}
                      >
                        {mLabel(x)}
                      </span>
                    </td>
                    <td>
                      {x.entry ? (
                        <span className="chip good">{won(S.entries.find((e) => e.id === x.entry)?.amount)}</span>
                      ) : x.status === '완료' ? (
                        <span className="chip warn">미등록</span>
                      ) : (
                        <span className="muted small">-</span>
                      )}
                    </td>
                    <td className="r">
                      {x.status !== '완료' ? (
                        <button className="btn sm" data-a="startComplete" data-x={x.id}>
                          완료 처리
                        </button>
                      ) : null}
                    </td>
                  </tr>
                )),
              ) || (
                <tr>
                  <td colSpan={7} className="muted">
                    이번 달 회의가 없어요.
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
export function CompletePage() {
  const w = S.mwiz;
  const mt = S.meetings.find((x) => x.id === w.id);
  const p = proj(mt.proj);
  return (
    <>
      <div className="page-head">
        <div>
          <h2>회의 완료 처리</h2>
          <p className="small muted">
            {p.short} · {fdate(mt.date)} {mt.start}~{mt.end} · {mt.topic}
          </p>
        </div>
        <button className="btn" data-a="cancelComplete">
          취소
        </button>
      </div>
      <ol className="steps">
        {jn(
          ['실제 참석자 확인', 'AI 회의록', '회의비 연결'].map((n, i) => (
            <li key={i} className={i + 1 === w.step ? 'on' : i + 1 < w.step ? 'done' : ''}>
              {i + 1}. {n}
            </li>
          )),
        )}
      </ol>
      {[(a0, a1) => <CStep1 mt={a0} p={a1} />, (a0, a1) => <CStep2 mt={a0} p={a1} />, (a0, a1) => <CStep3 mt={a0} p={a1} />][w.step - 1](mt, p)}
    </>
  );
}
export function CStep1({ mt, p }: any) {
  const w = S.mwiz;
  const cs = conflictsFor({
    ...mt,
    att: w.att,
    exp: w.exp,
  });
  const bad = new Set<any>(cs.flatMap((c) => c.names));
  return (
    <>
      <p className="small muted">예비 등록 때의 참석자를 불러왔어요. 실제로 참석한 사람만 남겨 주세요.</p>
      {
        <Picker
          pk={'w'}
          {...{
            pool: peopleOf(p),
            bad,
            title: '실제 참석자',
          }}
        />
      }{' '}
      {cs.length ? (
        <div className="notice bad" role="alert">
          {jb(
            cs.map((c) => conflictText(c)),
            <br />,
          )}
        </div>
      ) : null}
      {w.err ? (
        <p className="err" role="alert">
          {w.err}
        </p>
      ) : null}
      <div className="row">
        <button className="btn primary" data-a="cNext1">
          다음: AI 회의록
        </button>
      </div>
    </>
  );
}
export function SrcPicker({ p, sel, act }: any) {
  const docs = srcDocs(p);
  return docs.length ? (
    <div
      className="checks"
      style={{
        gridTemplateColumns: '1fr',
      }}
    >
      {jn(
        docs.map((d, _i) => (
          <label key={_i} className="check">
            <In type="checkbox" id={`${act}-${d.id}`} data-a={act} data-x={d.id} {...ax(sel.includes(d.id) ? 'checked' : '')} />
            <span>
              {d.name} <span className="chip">{d.kind}</span>
            </span>
          </label>
        )),
      )}
    </div>
  ) : (
    <div className="notice warn small">아직 올린 제안서·보고서가 없어요. 총괄관리의 ‘제안서 · 보고서’에 올리면 여기서 자동으로 불러와요.</div>
  );
}
export function CStep2({ mt, p }: any) {
  const w = S.mwiz;
  const b = sourceBundle();
  return (
    <>
      <div className="grid2">
        {
          <Field
            label={'만들 서류'}
            name={'w_doc'}
            {...{
              options: ['회의록', '자문의견서'],
              r: 1,
            }}
          />
        }
        <div className="field">
          <span>근거 자료</span>
          <small>총괄관리에 올린 제안서·보고서와 최근 회의록을 자동으로 골라 뒀어요. 참석 전문가의 이력도 함께 읽어요.</small>
          <Raw html={monthLine(wizCtx(mt, p))} />
          {<SrcPicker p={p} sel={w.srcs} act={'toggleSrc'} />}
        </div>
      </div>
      <div className="row">
        <button className="btn primary" data-a="genDraft" {...ax(w.gen || !b.paras.length ? 'disabled' : '')}>
          {w.gen ? '자료를 읽고 작성하는 중…' : w.draft ? '다시 작성' : 'AI 초안 작성'}
        </button>{' '}
        {w.src === 'ai' ? <span className="chip good">AI 작성</span> : w.src === 'sample' ? <span className="chip warn">AI 미연결: 예시 초안</span> : null}
      </div>
      {w.note ? <p className="small muted">{w.note}</p> : null}
      <div className="draftgrid">
        <label className="field" htmlFor="wizDraft">
          <span>초안 (직접 고칠 수 있어요)</span>
          <In as="textarea" id="wizDraft" data-w="draft" rows={20} {...ax(w.gen ? 'readonly' : '')} placeholder="AI 초안 작성을 누르면 여기에 초안이 나와요." value={w.draft || ''} />
        </label>
        <aside className="sources">
          <strong>AI가 참고하는 근거</strong>
          {b.experts.length ? (
            <ol>
              {jn(
                b.experts.map((x, _i) => (
                  <li key={_i}>
                    <b>[전문가] {x.name}</b> {x.career || x.field}
                  </li>
                )),
              )}
            </ol>
          ) : null}
          <ol>
            {jn(
              b.paras.map((x, _i) => (
                <li key={_i}>
                  <b>[근거 {x.n}]</b>{' '}
                  <span className="small muted">
                    {x.doc.kind} · {x.doc.name}
                  </span>
                  <br />
                  {x.t}
                </li>
              )),
            ) || <li className="muted">근거 자료를 골라 주세요.</li>}
          </ol>
        </aside>
      </div>
      <label className="check">
        <In type="checkbox" id="w-confirm" data-a="toggleConfirm" {...ax(w.confirm ? 'checked' : '')} {...ax(w.draft && !w.gen ? '' : 'disabled')} />
        <span>
          근거와 실제 회의 내용을 대조했고, <b>[담당자 입력]</b> 표시를 모두 채웠어요.
        </span>
      </label>{' '}
      {w.err ? (
        <p className="err" role="alert">
          {w.err}
        </p>
      ) : null}
      <div className="row">
        <button className="btn" data-a="cBack">
          이전
        </button>
        <button className="btn primary" data-a="cNext2">
          다음: 회의비 연결
        </button>
      </div>
    </>
  );
}
export function CStep3({ p }: any) {
  const w = S.mwiz;
  const rs = S.receipts.filter((r) => r.st === 'new');
  const r = S.receipts.find((x) => x.id === S.f.c_receipt);
  const B = budgetOf(p, S.view, '연구활동비'),
    X = spentOf(p, S.view, '연구활동비');
  const amt = r ? r.amount : 0;
  const n = w.att.length + w.exp.length;
  const lim = S.orgs[S.view].limit;
  return (
    <>
      <p className="small muted">회의비 카드 영수증은 모바일 앱에서 찍어 올려요. 올라온 영수증을 고르면 회의비로 등록되고, 회의록과 카드매출전표가 증빙으로 붙어요. 나중에 연결해도 돼요.</p>
      {
        <Field
          label={'앱에서 올라온 영수증'}
          name={'c_receipt'}
          {...{
            options: [['', '나중에 연결'], ...rs.map((x) => [x.id, `${fdate(x.date)} ${x.vendor} ${won(x.amount)}`])],
            r: 1,
          }}
        />
      }{' '}
      {r ? (
        <div
          className="row"
          style={{
            alignItems: 'flex-start',
            gap: '14px',
          }}
        >
          <img
            src={r.img}
            alt="영수증"
            style={{
              width: '96px',
              border: '1px solid var(--line)',
              borderRadius: '4px',
            }}
          />
          <div className="ledger num">
            <span>1인당 금액</span>
            <span
              style={{
                textAlign: 'right',
              }}
            >
              {n ? won(Math.round(amt / n)) : '-'}
              {n && amt / n > lim ? (
                <>
                  {' '}
                  <span className="chip warn">한도 초과</span>
                </>
              ) : null}
            </span>
            <span>현재 연구활동비 잔액</span>
            <span
              style={{
                textAlign: 'right',
              }}
            >
              {won(B - X)}
            </span>
            <span>이번 회의비</span>
            <span
              style={{
                textAlign: 'right',
              }}
            >
              − {won(amt)}
            </span>
            <span className="tot">등록 후 잔액</span>
            <span
              className="tot"
              style={{
                textAlign: 'right',
              }}
            >
              {won(B - X - amt)}
            </span>
          </div>
        </div>
      ) : null}{' '}
      {w.err ? (
        <p className="err" role="alert">
          {w.err}
        </p>
      ) : null}
      <div className="row">
        <button className="btn" data-a="cBack">
          이전
        </button>
        <button className="btn primary" data-a="cSubmit">
          {r ? '완료 처리하고 회의비 등록' : '회의비 없이 완료 처리'}
        </button>
      </div>
    </>
  );
}

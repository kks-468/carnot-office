// 프로토타입 화면을 React 컴포넌트로 옮겼어요. 버튼·입력은 data-* 속성으로 core/actions의 A와 연결돼요.
import { CAT, ITEMS, LOGO } from '../../core/catalog';
import { subOf } from '../../core/evidence';
import { dayConflicts, dayText, pickOpts } from '../../core/meeting';
import { peopleOf, person, proj, visible } from '../../core/org';
import { S } from '../../core/state';
import { eok, fdate } from '../../core/util';
import { Picker } from '../../ui/Picker';
import { ax, jb, jn } from '../../ui/jsx';
import { In } from '../../ui/primitives';

export function ReceiptPage() {
  const c = S.cap;
  const vis = visible();
  const inbox = S.receipts.slice().sort((a, b) => (a.date < b.date ? 1 : -1));
  let scr: any;
  if (!c)
    scr = (
      <>
        <div className="shot">
          <div className="big">촬영</div>
          <div>영수증을 화면에 맞춰 찍어 주세요</div>
          <In type="file" id="cam" accept="image/*" capture="environment" data-a-change="capPhoto" aria-label="영수증 촬영" />
        </div>
        <button className="btn" data-a="capSample">
          샘플 영수증으로 해보기
        </button>
        <p className="small muted">찍은 영수증은 AI가 읽어서 사용일·가맹점·금액을 채우고, 과제와 비목을 추천해요.</p>
      </>
    );
  else {
    const sub = subOf(c.item, c.sub);
    const ms = sub?.meeting ? S.meetings.filter((x) => x.proj === c.proj && x.status === '완료' && !x.entry) : [];
    scr = (
      <>
        <img className="rimg" src={c.img} alt="찍은 영수증" />{' '}
        {c.reading ? (
          <div className="reading">
            <i />
            AI가 영수증을 읽는 중…
          </div>
        ) : (
          <>
            <div className="row">
              <span className={`chip ${c.how === 'ai' ? 'good' : 'warn'}`}>{c.how === 'ai' ? 'AI가 읽음' : c.how === 'sample' ? '샘플 값' : '직접 입력'}</span>
              {c.note ? <span className="small muted">{c.note}</span> : null}
            </div>
            <div
              className="grid2"
              style={{
                gridTemplateColumns: '1fr 1fr',
              }}
            >
              {<CapFld l={'사용일'} k={'date'} t={'date'} />}
              {<CapFld l={'금액'} k={'amount'} t={'number'} />}
            </div>
            {<CapFld l={'가맹점'} k={'vendor'} t={'text'} />}{' '}
            <label className="field" htmlFor="cap-proj">
              <span>과제 (추천)</span>
              <In as="select" id="cap-proj" data-cap="proj">
                {jn(
                  vis.map((p, _i) => (
                    <option key={_i} value={p.id} {...ax(c.proj === p.id ? 'selected' : '')}>
                      {p.short} · {p.name}
                    </option>
                  )),
                )}
              </In>
            </label>
            <div
              className="grid2"
              style={{
                gridTemplateColumns: '1fr 1fr',
              }}
            >
              <label className="field" htmlFor="cap-item">
                <span>비목</span>
                <In as="select" id="cap-item" data-cap="item">
                  {jn(
                    ITEMS.map((i, _i) => (
                      <option key={_i} {...ax(c.item === i ? 'selected' : '')}>
                        {i}
                      </option>
                    )),
                  )}
                </In>
              </label>{' '}
              <label className="field" htmlFor="cap-sub">
                <span>세부유형</span>
                <In as="select" id="cap-sub" data-cap="sub">
                  {jn(
                    CAT[c.item].map((s, _i) => (
                      <option key={_i} {...ax(c.sub === s.s ? 'selected' : '')}>
                        {s.s}
                      </option>
                    )),
                  )}
                </In>
              </label>
            </div>
            {sub?.meeting ? (
              <label className="field" htmlFor="cap-meeting">
                <span>연결할 회의</span>
                <In as="select" id="cap-meeting" data-cap="meeting">
                  <option value="">연결 안 함</option>
                  {jn(
                    ms.map((x, _i) => (
                      <option key={_i} value={x.id} {...ax(c.meeting === x.id ? 'selected' : '')}>
                        {fdate(x.date.slice(5))} {x.topic}
                      </option>
                    )),
                  )}
                </In>
              </label>
            ) : null}{' '}
            {(() => {
              const po = pickOpts(c.sub);
              if (!po || c.meeting || !c.proj) return null;
              const dc = dayConflicts(c.sub, c.date, c.att || []);
              return (
                <>
                  <Picker
                    pk={'cap'}
                    {...{
                      pool: peopleOf(proj(c.proj)),
                      bad: new Set<any>(dc.flatMap((x) => x.names)),
                      ...po,
                    }}
                  />
                  {dc.length ? (
                    <div className="notice bad small">
                      {jb(
                        dc.map((x) => dayText(x)),
                        <br />,
                      )}
                    </div>
                  ) : null}
                </>
              );
            })()}{' '}
            {c.err ? (
              <p className="err" role="alert">
                {c.err}
              </p>
            ) : null}
            <div className="row">
              <button className="btn" data-a="capCancel">
                다시 찍기
              </button>
              <button
                className="btn warm"
                data-a="capSend"
                style={{
                  flex: '1',
                }}
              >
                집행 등록
              </button>
            </div>
          </>
        )}
      </>
    );
  }
  return (
    <>
      <div className="page-head">
        <div>
          <h2>영수증</h2>
          <p className="small muted">연구원은 Carnot 앱으로 영수증만 찍으면 돼요. 과제와 비목에 연결되고 카드매출전표 증빙이 자동으로 O가 돼요.</p>
        </div>
      </div>
      <div className="rgrid">
        <div>
          <div className="phone" aria-label="모바일 앱 화면 예시">
            <div className="bar">
              <img src={LOGO} alt="Carnot" />
              <span>영수증 등록</span>
            </div>
            <div className="scr">{scr}</div>
          </div>
          <p
            className="small muted"
            style={{
              textAlign: 'center',
              marginTop: '8px',
            }}
          >
            모바일 앱 화면 (시연)
          </p>
        </div>
        <section>
          <h3 className="h3">앱에서 올라온 영수증</h3>
          <p
            className="small muted"
            style={{
              marginBottom: '8px',
            }}
          >
            과제를 고르지 않고 보낸 영수증은 여기서 행정 담당자가 연결해요.
          </p>
          <div className="tw">
            <table>
              <thead>
                <tr>
                  <th />
                  <th>사용일</th>
                  <th>가맹점</th>
                  <th className="r">금액</th>
                  <th>올린 사람</th>
                  <th>상태</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {jn(
                  inbox.map((r, _i) => {
                    const e = S.entries.find((x) => x.id === r.entry);
                    return (
                      <tr key={_i}>
                        <td>
                          <img className="rthumb" src={r.img} alt="" />
                        </td>
                        <td className="num">{fdate(r.date)}</td>
                        <td>
                          {r.vendor}
                          <br />
                          <span className="small muted">{r.card}</span>
                        </td>
                        <td className="r num">{eok(r.amount)}</td>
                        <td>{person(r.by)?.name || '-'}</td>
                        <td>
                          {r.st === 'new' ? (
                            <span className="chip warn">미연결</span>
                          ) : (
                            <span className="chip good">
                              {proj(e?.proj)?.short || ''} · {e?.sub || ''}
                            </span>
                          )}
                        </td>
                        <td className="r">
                          {r.st === 'new' ? (
                            <button className="btn sm primary" data-a="assignReceipt" data-x={r.id}>
                              연결
                            </button>
                          ) : (
                            <button className="btn sm" data-a="openEvidence" data-x={r.entry}>
                              증빙 보기
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  }),
                ) || (
                  <tr>
                    <td colSpan={7} className="muted">
                      올라온 영수증이 없어요.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}
export function CapFld({ l, k, t }: any) {
  return (
    <label className="field" htmlFor={`cap-${k}`}>
      <span>{l}</span>
      <In id={`cap-${k}`} type={t} data-cap={k} value={S.cap[k] ?? ''} />
    </label>
  );
}

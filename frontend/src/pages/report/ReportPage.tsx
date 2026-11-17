// 업무보고: 주간 업무보고를 프로젝트별·사람별로 보기
import { useS } from '../../core/state';
import { me, proj } from '../../core/org';
import { curWeek, wRange, wrKey, wrTitle, wrLast, wrMem } from '../../core/work';
import { addDays, fdate } from '../../core/util';
import { Btn, LinkBtn, Seg } from '../../ui/primitives';

export function ReportPage() {
  const S = useS();
  const ws = curWeek();
  const prev = addDays(ws, -7);
  const view = S.rview || 'proj';
  const list = S.reports.filter((r: any) => r.week === ws && S.people.find((p: any) => p.id === r.by)?.org === S.view);
  const staff = S.people.filter((p: any) => p.org === S.view && p.acct !== '가입 신청' && p.acct !== '중지' && !p.admin);
  const done = staff.filter((p: any) => list.some((r: any) => r.by === p.id));
  const miss = staff.filter((p: any) => !done.includes(p));
  const mine = list.filter((r: any) => r.by === me()?.id);
  const meId = me()?.id;
  const ops = (r: any) =>
    r.by === meId ? (
      <span className="wr-ops" key={'op' + r.id}>
        <LinkBtn a="wrEdit" x={r.id} className="linkbtn small">
          수정
        </LinkBtn>{' '}
        <LinkBtn a="wrDel" x={r.id} className="linkbtn small">
          삭제
        </LinkBtn>
      </span>
    ) : null;
  const blocks = (rs: any[], fn: (r: any) => string) =>
    rs.map((r) => (
      <div className="wr-by" key={r.id}>
        {fn(r) || '-'}
      </div>
    ));
  let body;
  if (view === 'proj') {
    const groups: { k: string; rs: any[] }[] = [];
    list.forEach((r: any) => {
      const k = wrKey(r);
      let g = groups.find((x) => x.k === k);
      if (!g) groups.push((g = { k, rs: [] }));
      g.rs.push(r);
    });
    const rank = (g: any) => {
      const p = proj(g.rs[0].proj);
      return !p ? 3 : p.phase === '제안' ? 2 : p.kind === '용역' ? 1 : 0;
    };
    groups.sort((a, b) => rank(a) - rank(b));
    body = (
      <div className="tw">
        <table className="wr">
          <thead>
            <tr>
              <th>No</th>
              <th>프로젝트명</th>
              <th>지난주 ({wRange(prev)})</th>
              <th>금주 ({wRange(ws)})</th>
              <th>구성원</th>
            </tr>
          </thead>
          <tbody>
            {groups.length ? (
              groups.map((g, i) => {
                const f = g.rs[0];
                const p = proj(f.proj);
                const notes = g.rs.map((r) => r.note).filter(Boolean);
                const my = g.rs.filter((r) => r.by === meId);
                return [
                  <tr key={g.k}>
                    <td className="num c">{i + 1}</td>
                    <td>
                      <b>{wrTitle(f)}</b>
                      <br />
                      {p ? <span className={`chip ${p.phase === '제안' ? 'warn' : 'info'}`}>{p.phase === '제안' ? '제안' : p.kind || '연구'}</span> : <span className="chip">기타 업무</span>}
                      {my.map(ops)}
                    </td>
                    <td className="wr-t">{blocks(g.rs, wrLast)}</td>
                    <td className="wr-t">{blocks(g.rs, (r) => r.next)}</td>
                    <td className="wr-t small">{wrMem(f)}</td>
                  </tr>,
                  notes.length ? (
                    <tr className="wr-note" key={g.k + 'n'}>
                      <td colSpan={2} className="c small">
                        주요 내용
                      </td>
                      <td colSpan={3} className="small">
                        {notes.join(' / ')}
                      </td>
                    </tr>
                  ) : null,
                ];
              })
            ) : (
              <tr>
                <td colSpan={5} className="muted">
                  이 주에 올라온 업무보고가 없어요.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  } else {
    const ppl = staff.filter((p: any) => list.some((r: any) => r.by === p.id));
    body = (
      <div className="tw">
        <table className="wr">
          <thead>
            <tr>
              <th>이름</th>
              <th>프로젝트명</th>
              <th>지난주 ({wRange(prev)})</th>
              <th>금주 ({wRange(ws)})</th>
              <th>주요 내용</th>
            </tr>
          </thead>
          <tbody>
            {ppl.length ? (
              ppl.map((p: any) => {
                const rs = list.filter((r: any) => r.by === p.id);
                return rs.map((r: any, i: number) => (
                  <tr key={r.id}>
                    {i === 0 ? (
                      <td className="wr-cat" rowSpan={rs.length}>
                        {p.name}
                        <br />
                        <span className="small muted">{p.unit || ''}</span>
                      </td>
                    ) : null}
                    <td>
                      <b>{wrTitle(r)}</b>
                      {ops(r)}
                    </td>
                    <td className="wr-t">{wrLast(r) || '-'}</td>
                    <td className="wr-t">{r.next || '-'}</td>
                    <td className="small">{r.note || ''}</td>
                  </tr>
                ));
              })
            ) : (
              <tr>
                <td colSpan={5} className="muted">
                  이 주에 올라온 업무보고가 없어요.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }
  return (
    <>
      <div className="page-head">
        <div>
          <h2>업무보고</h2>
          <p className="small muted">연구 관리의 과제를 골라 금주 계획만 쓰면 돼요. 지난주 칸에는 지난주에 쓴 금주 계획이 자동으로 들어가요. 로그인한 아이디로 저장되고 회사 전체가 함께 봐요.</p>
        </div>
        <div className="row" style={{ flexWrap: 'wrap' }}>
          <Btn a="wrPrint">인쇄</Btn>
          <Btn a="wrPdf">PDF</Btn>
          <Btn a="wrCsv">CSV</Btn>
          <Btn a="wrNew" className="btn primary">
            + 내 업무보고 쓰기
          </Btn>
        </div>
      </div>
      <div className="row between" style={{ marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div className="row">
          <Btn a="wrWeek" x="-7" className="btn sm" aria-label="지난주">
            ‹
          </Btn>
          <strong className="num" style={{ minWidth: 150, textAlign: 'center' }}>
            {fdate(ws)} 주간
          </strong>
          <Btn a="wrWeek" x="7" className="btn sm" aria-label="다음 주">
            ›
          </Btn>
          <Btn a="wrWeek" x="0" className="btn sm">
            이번 주
          </Btn>
        </div>
        <div className="row">
          <Seg label="보기" a="wrView" cur={view} items={[['proj', '프로젝트별'], ['person', '사람별']]} />
          <span className={`chip ${miss.length ? 'warn' : 'good'}`} title={miss.map((p: any) => p.name).join(', ')}>
            작성 {done.length}/{staff.length}명
          </span>
        </div>
      </div>
      {mine.length ? null : (
        <div className="notice row between">
          <span>{me()?.name || ''}님은 이 주 업무보고를 아직 쓰지 않았어요.</span>
          <Btn a="wrNew" className="btn sm primary">
            지금 쓰기
          </Btn>
        </div>
      )}
      {body}
      {miss.length ? (
        <p className="small muted" style={{ marginTop: 8 }}>
          아직 쓰지 않은 사람: {miss.map((p: any) => p.name).join(', ')}
        </p>
      ) : null}
    </>
  );
}

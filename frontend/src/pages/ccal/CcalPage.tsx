// 회사일정: 월 달력 + 목록 (연차·반차·외출·출장·회의·교육·행사·기타)
import { useS } from '../../core/state';
import { ABSENT, CK, TODAY } from '../../core/catalog';
import { me, orgCfg, person, unitPath } from '../../core/org';
import { companyEvents, ckMatch, ckCls, evKind, evOn, evTime } from '../../core/work';
import { fdate, ymd } from '../../core/util';
import { Btn, In, Seg } from '../../ui/primitives';
import { UnitOptions } from '../../ui/UnitOptions';

export function CcalPage() {
  const S = useS();
  const all = companyEvents();
  const kf = S.ckf || 'all';
  const uf = S.cuf || 'all';
  const o = orgCfg(S.view);
  const vis = all.filter((e: any) => ckMatch(e, kf) && (uf === 'all' || unitPath(o, person(e.pid)?.unit).some((u: any) => u.name === uf)));
  const c = S.ccal || (S.ccal = { y: +TODAY.slice(0, 4), m: +TODAY.slice(5, 7) - 1 });
  const { y, m } = c;
  const first = new Date(y, m, 1);
  const sd = first.getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const lead = new Date(y, m, 1 - sd);
  const total = Math.ceil((sd + days) / 7) * 7;
  const cells: JSX.Element[] = [];
  for (let i = 0; i < total; i++) {
    const d = new Date(lead.getFullYear(), lead.getMonth(), lead.getDate() + i);
    const ds = ymd(d);
    const xs = vis.filter((e: any) => evOn(e, ds)).sort((a: any, b: any) => ((a.time || '') < (b.time || '') ? -1 : 1));
    cells.push(
      <div key={ds} className={`day ${d.getMonth() !== m ? 'out' : ''} ${ds === TODAY ? 'today' : ''}`}>
        <span className="dn">{d.getDate()}</span>
        {xs.slice(0, 4).map((e: any, j: number) => (
          <div key={j} className={`mt ck-${ckCls(e.kind)}`} title={`${evKind(e)} · ${e.title || ''}`}>
            <b>
              {evKind(e)}
              {e.time ? ' ' + evTime(e) : ''}
            </b>
            <span>
              {person(e.pid)?.name || ''}
              {e.title && !e.auto ? ' · ' + e.title : e.auto ? ' · ' + e.title : ''}
            </span>
          </div>
        ))}
        {xs.length > 4 ? <span className="small muted">+{xs.length - 4}건</span> : null}
      </div>,
    );
  }
  const today = all.filter((e: any) => evOn(e, TODAY));
  const away = today.filter((e: any) => ABSENT.includes(e.kind));
  const other = today.filter((e: any) => !ABSENT.includes(e.kind));
  const month = `${y}-${String(m + 1).padStart(2, '0')}`;
  const list = vis.filter((e: any) => e.start.slice(0, 7) <= month && (e.end || e.start).slice(0, 7) >= month).sort((a: any, b: any) => (a.start < b.start ? -1 : 1));
  const canEd = (e: any) => !e.auto && (e.by === me()?.id || me()?.admin);
  return (
    <>
      <div className="page-head">
        <div>
          <h2>회사일정</h2>
          <p className="small muted">연차·반차·외출·출장·회의·교육·행사 일정을 회사 전체가 함께 봐요. 연구행정에 잡힌 과제 회의도 자동으로 들어와요.</p>
        </div>
        <Btn a="cevNew" className="btn primary">
          + 일정 등록
        </Btn>
      </div>
      <div className="notice">
        <b>오늘 ({fdate(TODAY)})</b> ·{' '}
        {away.length ? (
          <>
            부재{' '}
            {away.map((e: any, i: number) => (
              <span key={i}>
                {i ? ' · ' : ''}
                <span className={`chip ck-${ckCls(e.kind)}`}>
                  {evKind(e)}
                  {e.time && e.time2 ? ' ' + evTime(e) : ''}
                </span>{' '}
                {person(e.pid)?.name || ''}
              </span>
            ))}
          </>
        ) : (
          '부재자 없음'
        )}
        {other.length ? ` · 일정 ${other.map((e: any) => e.title || e.kind).join(', ')}` : ''}
      </div>
      <div className="row between" style={{ flexWrap: 'wrap', gap: 8 }}>
        <div className="row">
          <Btn a="ccalMv" x="-1" className="btn sm" aria-label="이전 달">
            ‹
          </Btn>
          <strong style={{ fontSize: 16, minWidth: 96, textAlign: 'center' }} className="num">
            {y}년 {m + 1}월
          </strong>
          <Btn a="ccalMv" x="1" className="btn sm" aria-label="다음 달">
            ›
          </Btn>
          <Btn a="ccalMv" x="0" className="btn sm">
            오늘
          </Btn>
        </div>
        <div className="row" style={{ flexWrap: 'wrap' }}>
          <Seg label="종류" a="ckf" cur={kf} items={[['all', '전체'], ['absent', '부재만'], ...CK.map((x: any) => [x[0], x[0]] as [string, string])]} />
          <label>
            <span hidden>부서</span>
            <In as="select" id="cuf" data-cuf="1" style={{ width: 'auto' }} value={uf}>
              <option value="all">전체 부서</option>
              <UnitOptions o={o} />
            </In>
          </label>
        </div>
      </div>
      <div className="calwrap">
        <div className="cal">
          {['일', '월', '화', '수', '목', '금', '토'].map((d) => (
            <div className="dow" key={d}>
              {d}
            </div>
          ))}
          {cells}
        </div>
      </div>
      <section>
        <h3 className="h3">
          {m + 1}월 일정 {list.length}건
        </h3>
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>날짜</th>
                <th>종류</th>
                <th>대상</th>
                <th>내용</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {list.length ? (
                list.map((e: any, i: number) => (
                  <tr key={i}>
                    <td className="num small">
                      {fdate(e.start)}
                      {e.end && e.end !== e.start ? '~' + fdate(e.end).slice(5) : ''}
                      {e.time ? ' ' + evTime(e) : ''}
                    </td>
                    <td>
                      <span className={`chip ck-${ckCls(e.kind)}`}>{evKind(e)}</span>
                    </td>
                    <td>
                      {person(e.pid)?.name || '-'} <span className="small muted">{person(e.pid)?.unit || ''}</span>
                    </td>
                    <td>
                      {e.title || ''}
                      {e.auto ? (
                        <>
                          {' '}
                          <span className="chip info">연구행정</span>
                        </>
                      ) : null}
                    </td>
                    <td className="r">
                      {canEd(e) ? (
                        <Btn a="cevDel" x={e.id} className="btn sm">
                          삭제
                        </Btn>
                      ) : null}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="muted">
                    일정이 없어요.
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

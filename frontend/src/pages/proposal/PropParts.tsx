// 연구제안 부품: 연구단 편성 현황 표 (연구제안·연구단 화면에서 함께 써요)
import { S } from '../../core/state';
import { roleName, sortParts } from '../../core/org';
import { propTotal, propYearsOf } from '../../core/proposal';
import { eok, sum } from '../../core/util';

export function PropTable({ p }: { p: any }) {
  const ys = propYearsOf(p);
  const cs = sortParts(p.parts.filter((x: any) => x.status === '수락')).map((q: any) => ({ q, t: propTotal(p, q.org) }));
  return (
    <div className="tw">
      <table style={{ whiteSpace: 'nowrap' }}>
        <thead>
          <tr>
            <th>구분</th>
            <th>기관</th>
            <th>역할</th>
            {ys.map((y: any) => (
              <th key={y.no} className="r">
                {y.no}차년도
              </th>
            ))}
            <th className="r">전체 합계</th>
            <th className="r">정부지원</th>
            <th className="r">현물</th>
            <th className="r">인건비</th>
            <th>편성</th>
          </tr>
        </thead>
        <tbody>
          {cs.map(({ q, t }: any) => (
            <tr key={q.org}>
              <td>{q.tier || '총괄'}</td>
              <td>
                {S.orgs[q.org].name}
                {q.org === S.view ? (
                  <>
                    {' '}
                    <span className="chip">우리 기관</span>
                  </>
                ) : null}
              </td>
              <td>{roleName(q)}</td>
              {t.cs.map((c: any, i: number) => (
                <td key={i} className="r num">
                  {eok(c.T)}
                </td>
              ))}
              <td className="r num">
                <b>{eok(t.T)}</b>
              </td>
              <td className="r num">{eok(t.G)}</td>
              <td className="r num">{eok(t.Bk)}</td>
              <td className="r num">{eok(t.lab)}</td>
              <td>{t.ok ? <span className="chip good">완료</span> : <span className="chip warn">작성 중</span>}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3}>연구단 합계</td>
            {ys.map((_y: any, i: number) => (
              <td key={i} className="r num">
                {eok(sum(cs.map((x: any) => x.t.cs[i].T)))}
              </td>
            ))}
            <td className="r num">
              <b>{eok(sum(cs.map((x: any) => x.t.T)))}</b>
            </td>
            <td className="r num">{eok(sum(cs.map((x: any) => x.t.G)))}</td>
            <td className="r num">{eok(sum(cs.map((x: any) => x.t.Bk)))}</td>
            <td className="r num">{eok(sum(cs.map((x: any) => x.t.lab)))}</td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

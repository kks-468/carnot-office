// 월 달력 칸 (일~토 7열). 날짜마다 무엇을 그릴지는 renderDay로 넘겨요.
import type { ReactNode } from 'react';
import { TODAY } from '../core/catalog';
import { ymd } from '../core/util';

export function MonthGrid({ y, m, renderDay }: { y: number; m: number; renderDay: (ds: string) => ReactNode }) {
  const first = new Date(y, m, 1);
  const sd = first.getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const lead = new Date(y, m, 1 - sd);
  const total = Math.ceil((sd + days) / 7) * 7;
  const cells: ReactNode[] = [];
  for (let i = 0; i < total; i++) {
    const d = new Date(lead.getFullYear(), lead.getMonth(), lead.getDate() + i);
    const ds = ymd(d);
    cells.push(
      <div key={ds} className={`day ${d.getMonth() !== m ? 'out' : ''} ${ds === TODAY ? 'today' : ''}`}>
        <span className="dn">{d.getDate()}</span>
        {renderDay(ds)}
      </div>,
    );
  }
  return (
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
  );
}

/** ‹ 2026년 11월 › 오늘 */
export function MonthNav({ y, m, prev, next, today, prevX, nextX, todayX }: { y: number; m: number; prev: string; next: string; today: string; prevX?: string; nextX?: string; todayX?: string }) {
  return (
    <div className="row">
      <button type="button" className="btn sm" data-a={prev} data-x={prevX} aria-label="이전 달">
        ‹
      </button>
      <strong style={{ fontSize: 16, minWidth: 96, textAlign: 'center' }} className="num">
        {y}년 {m + 1}월
      </strong>
      <button type="button" className="btn sm" data-a={next} data-x={nextX} aria-label="다음 달">
        ›
      </button>
      <button type="button" className="btn sm" data-a={today} data-x={todayX}>
        오늘
      </button>
    </div>
  );
}

// 조직 위계(본부·팀 등)별로 묶은 부서 선택지
import { ukinds, unitOrder, unitKind, unitPath } from '../core/org';

/** sel을 주면 그 부서를 고른 상태로 그려요 (값을 따로 넘기지 않는 select용). */
export function UnitOptions({ o, sel }: { o: any; sel?: string }) {
  return (
    <>
      {ukinds(o).map((k: string) => {
        const us = unitOrder(o).filter((z: any) => z.u.parent && unitKind(z.u) === k);
        return us.length ? (
          <optgroup key={k} label={k}>
            {us.map((z: any) => (
              <option key={z.u.name} value={z.u.name} {...(sel !== undefined ? { selected: sel === z.u.name } : {})}>
                {unitPath(o, z.u.name)
                  .slice(1)
                  .map((u: any) => u.name)
                  .join(' › ')}
              </option>
            ))}
          </optgroup>
        ) : null;
      })}
    </>
  );
}

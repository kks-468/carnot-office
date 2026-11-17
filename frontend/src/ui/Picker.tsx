// 프로토타입 화면을 React 컴포넌트로 옮겼어요. 버튼·입력은 data-* 속성으로 core/actions의 A와 연결돼요.
import { MIN_LIST } from '../core/catalog';
import { pkObj } from '../core/meeting';
import { expert, person, visExp } from '../core/org';
import { S } from '../core/state';
import { jn } from './jsx';
import { In } from './primitives';

export function Picker({ pk, pool, bad = new Set<any>(), people = true, experts = true, title = '참석자' }: any) {
  const [o, ka, ke] = pkObj[pk]();
  o[ka] = o[ka] || [];
  o[ke] = o[ke] || [];
  const att = o[ka],
    ex = o[ke];
  const groups: any = {};
  pool.forEach((x) => {
    const g = `${S.orgs[x.org].short} · ${x.unit || '소속 없음'}`;
    (groups[g] = groups[g] || []).push(x);
  });
  const eg: any = {};
  S.expGroups.forEach((g) => (eg[g] = []));
  visExp().forEach((x) => {
    const g = S.expGroups.includes(x.group) ? x.group : '미분류';
    (eg[g] = eg[g] || []).push(x);
  });
  const pSel = people ? (
    <label className="field" htmlFor={`pk-${pk}-att`}>
      <span>
        팀원 추가 <small>팀별로 묶여 있어요. 팀 전체도 한 번에 넣을 수 있어요</small>
      </span>
      <In as="select" id={`pk-${pk}-att`} data-pick={`${pk}|att`}>
        <option value="">+ 팀원 선택</option>
        {jn(
          Object.entries(groups).map(([g, xs], _i) => {
            const left = xs.filter((x) => !att.includes(x.id));
            if (!left.length) return null;
            return (
              <optgroup key={_i} label={g}>
                {left.length > 1 ? (
                  <option value={`team:${left.map((x) => x.id).join(',')}`}>
                    {g} 전체 ({left.length}명)
                  </option>
                ) : null}
                {jn(
                  left.map((x, _i) => (
                    <option key={_i} value={x.id}>
                      {x.name} · {x.role}
                    </option>
                  )),
                )}
              </optgroup>
            );
          }),
        )}
      </In>
    </label>
  ) : null;
  const eSel = experts ? (
    <label className="field" htmlFor={`pk-${pk}-exp`}>
      <span>
        외부 전문가 추가 <small>분야 그룹별</small>
      </span>
      <In as="select" id={`pk-${pk}-exp`} data-pick={`${pk}|exp`}>
        <option value="">+ 전문가 선택</option>
        {jn(
          Object.entries(eg).map(([g, xs], _i) => {
            const left = xs.filter((x) => !ex.includes(x.id));
            if (!left.length) return null;
            return (
              <optgroup key={_i} label={g}>
                {jn(
                  left.map((x, _i) => (
                    <option key={_i} value={x.id}>
                      {x.name} · {x.org} · {x.field}
                    </option>
                  )),
                )}
              </optgroup>
            );
          }),
        )}
      </In>
    </label>
  ) : null;
  const chips = jn([
    ...att.map((i, _i) => {
      const x = person(i);
      if (!x) return null;
      return (
        <span key={_i} className={`pchip ${bad.has(x.name) ? 'conf' : ''}`}>
          {x.name}{' '}
          <small>
            {S.orgs[x.org].short}·{x.role}
          </small>
          <button type="button" data-a="unpick" data-x={`${pk}|att|${i}`} aria-label={`${x.name} 빼기`}>
            ×
          </button>
        </span>
      );
    }),
    ...ex.map((i, _i) => {
      const x = expert(i);
      if (!x) return null;
      return (
        <span key={_i} className={`pchip exp ${bad.has(x.name) ? 'conf' : ''}`}>
          {x.name}{' '}
          <small>
            {x.group || ''}·{x.field}
          </small>
          <button type="button" data-a="unpick" data-x={`${pk}|exp|${i}`} aria-label={`${x.name} 빼기`}>
            ×
          </button>
        </span>
      );
    }),
  ]);
  return (
    <section className="picker">
      <div className="row between">
        <h3
          className="h3"
          style={{
            margin: 0,
          }}
        >
          {title} <span className="muted small">{att.length + ex.length}명</span>
        </h3>
        {att.length + ex.length ? (
          <button type="button" className="btn sm" data-a="pickClear" data-x={pk}>
            모두 빼기
          </button>
        ) : null}
      </div>
      <div className="pickrow">
        {pSel}
        {eSel}
      </div>
      <div className="pchips">{chips || <span className="small muted">아직 아무도 없어요. 위에서 골라 주세요.</span>}</div>
    </section>
  );
}
export function MinFld({ name, label = '부처명 (발주처)' }: any) {
  return (
    <label className="field" htmlFor={`f-${name}`}>
      <span>
        {label} <small>목록에서 고르거나 직접 써요</small>
      </span>
      <In id={`f-${name}`} data-b={name} type="text" list="min-list" value={S.f[name] || ''} placeholder="예: 산업통상부" autoComplete="off" />
      <datalist id="min-list">{jn(MIN_LIST.map((x, _i) => <option key={_i} value={x} />))}</datalist>
    </label>
  );
}

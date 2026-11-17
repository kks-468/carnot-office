// 여러 화면에서 함께 쓰는 기본 부품이에요.
// 버튼은 data-a="동작 이름", data-x="값"으로 core/actions.ts의 A와 연결돼요 (core/events.ts가 클릭을 받아 실행).
// 입력은 data-b="이름"으로 S.f[이름]에 바로 저장돼요.
import { useLayoutEffect, useRef, type ReactNode, type CSSProperties } from 'react';
import { S } from '../core/state';
import { evSum } from '../core/evidence';

type Dict = Record<string, unknown>;
export type Opt = string | number | [string | number, string];

/** data-* 속성만 골라 그대로 넘겨요. */
function dataProps(p: Dict): Dict {
  const out: Dict = {};
  for (const k of Object.keys(p)) if (k.startsWith('data-') || k.startsWith('aria-')) out[k] = p[k];
  return out;
}

/**
 * 값이 바뀌어도 입력 중인 칸은 건드리지 않는 입력칸이에요.
 * (React 비제어 입력 + 바깥 값이 바뀌면 포커스가 없을 때만 맞춰 줘요)
 */
export function In(props: Dict & { value?: unknown; checked?: unknown; as?: 'input' | 'textarea' | 'select'; children?: ReactNode }) {
  const { value, checked, as = 'input', children, ...rest } = props;
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement & HTMLSelectElement>(null);
  // 값을 주지 않은 select는 <option selected>로 고른 값을 그대로 써요.
  const has = value !== undefined;
  const v = value === undefined || value === null ? '' : String(value);
  const box = rest.type === 'checkbox' || rest.type === 'radio';
  const ck = checked === undefined && !box ? undefined : !!checked;
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (ck !== undefined && (el as HTMLInputElement).checked !== ck) (el as HTMLInputElement).checked = ck;
    if (!has || document.activeElement === el) return;
    const ty = (el as HTMLInputElement).type;
    if (ty === 'checkbox' || ty === 'radio' || ty === 'file') return;
    if (el.value !== v && el.value.replace(/,/g, '') !== v) el.value = v;
  }, [v, ck, has]);
  const dv = has ? { defaultValue: v } : {};
  if (as === 'textarea') return <textarea ref={ref} {...dv} {...(rest as Dict)} />;
  if (as === 'select')
    return (
      <select ref={ref} {...dv} {...(rest as Dict)}>
        {children}
      </select>
    );
  const ty = rest.type as string | undefined;
  if (ty === 'checkbox' || ty === 'radio') return <input ref={ref} defaultChecked={ck} {...(has ? { defaultValue: v } : {})} {...(rest as Dict)} />;
  if (ty === 'file') return <input ref={ref} {...(rest as Dict)} />;
  return <input ref={ref} {...dv} {...(rest as Dict)} />;
}

const optKV = (o: Opt): [string, string] => (Array.isArray(o) ? [String(o[0]), String(o[1])] : [String(o), String(o)]);

export function Options({ options }: { options: Opt[] }) {
  return (
    <>
      {options.map((o) => {
        const [k, l] = optKV(o);
        return (
          <option key={k} value={k}>
            {l}
          </option>
        );
      })}
    </>
  );
}

export type FieldOpt = { options?: any[]; area?: number; type?: string; ph?: string; hint?: string; r?: boolean | number; step?: string | number };

/** 이름표 + 입력칸. 값은 S.f[name]에 저장돼요. (프로토타입 fld()와 같아요) */
export function Field({ label, name, ...opt }: { label: ReactNode; name: string } & FieldOpt) {
  const v = S.f[name] ?? '';
  const common: Dict = { id: `f-${name}`, 'data-b': name };
  if (opt.r) common['data-r'] = '1';
  let c: ReactNode;
  if (opt.options)
    c = (
      <In as="select" {...common} value={v}>
        <Options options={opt.options} />
      </In>
    );
  else if (opt.area) c = <In as="textarea" {...common} rows={opt.area} placeholder={opt.ph || ''} value={v} />;
  else c = <In {...common} type={opt.type || 'text'} value={v} placeholder={opt.ph || ''} step={opt.step} />;
  return (
    <label className="field" htmlFor={`f-${name}`}>
      <span>{label}</span>
      {c}
      {opt.hint ? <small>{opt.hint}</small> : null}
    </label>
  );
}

/** 동작 버튼. a = actions.ts의 A 이름, x = 넘길 값 */
export function Btn({ a, x, className = 'btn', children, disabled, title, style, ...rest }: Dict & { a?: string; x?: unknown; className?: string; children?: ReactNode; disabled?: boolean; title?: string; style?: CSSProperties }) {
  return (
    <button type="button" className={className} data-a={a} data-x={x === undefined ? undefined : String(x)} disabled={disabled} title={title} style={style} {...dataProps(rest)}>
      {children}
    </button>
  );
}

/** 글자처럼 보이는 링크형 버튼 */
export function LinkBtn({ a, x, children, className = 'linkbtn', ...rest }: Dict & { a: string; x?: unknown; children?: ReactNode; className?: string }) {
  return (
    <button type="button" className={className} data-a={a} data-x={x === undefined ? undefined : String(x)} {...dataProps(rest)}>
      {children}
    </button>
  );
}

export function Chip({ kind = '', children, className = '', title }: { kind?: string; children?: ReactNode; className?: string; title?: string }) {
  return (
    <span className={`chip ${kind} ${className}`.trim()} title={title}>
      {children}
    </span>
  );
}

/** 여러 개 중 하나를 고르는 버튼 묶음 */
export function Seg({ items, cur, a, label, style, xOf }: { items: [string | number, ReactNode][]; cur: unknown; a: string; label: string; style?: CSSProperties; xOf?: (k: string | number) => string }) {
  return (
    <div className="seg" role="group" aria-label={label} style={style}>
      {items.map(([k, l]) => (
        <button key={String(k)} type="button" data-a={a} data-x={xOf ? xOf(k) : String(k)} aria-pressed={String(cur) === String(k)}>
          {l}
        </button>
      ))}
    </div>
  );
}

/** 왼쪽 메뉴·목록형 내비게이션 (구분선은 k='-') */
export function Nav({ items, cur, a }: { items: any[]; cur: string; a: string }) {
  return (
    <>
      {items.map(([k, l, extra], i) =>
        k === '-' ? (
          <div className="lab" key={'lab' + i}>
            {l}
          </div>
        ) : (
          <button key={k} type="button" data-a={a} data-x={k} aria-current={k === cur}>
            {l}
            {extra}
          </button>
        ),
      )}
    </>
  );
}

/** 증빙 O/X/진행 표시 */
export function OxChip({ s, label }: { s: string; label?: string }) {
  return (
    <span className={`oxb ${s}`}>
      <b>{s === 'O' ? 'O' : s === 'X' ? 'X' : s === 'P' ? '…' : '–'}</b>
      {label || ''}
    </span>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function OxSummary({ e }: { e: any }) {
  const s = evSum(e);
  return (
    <span className={`chip ${s.ok ? 'good' : 'bad'} num`}>
      <b>O {s.o}</b>&nbsp;·&nbsp;<b>X {s.x}</b>
    </span>
  );
}

export function Meter({ pct, color, style }: { pct: number; color?: string; style?: CSSProperties }) {
  return (
    <div className="meter" style={style}>
      <i style={{ width: `${Math.max(0, Math.min(100, pct))}%`, ...(color ? { background: color } : {}) }} />
    </div>
  );
}

/** 서식·도장처럼 미리 만든 HTML(A4 출력물 등)을 그대로 보여 줄 때만 써요. */
export function Html({ html, className, style, as = 'div' }: { html: string; className?: string; style?: CSSProperties; as?: 'div' | 'span' }) {
  if (as === 'span') return <span className={className} style={style} dangerouslySetInnerHTML={{ __html: html }} />;
  return <div className={className} style={style} dangerouslySetInnerHTML={{ __html: html }} />;
}

export function Notice({ kind = '', children, className = '', style }: { kind?: string; children?: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <div className={`notice ${kind} ${className}`.trim()} style={style}>
      {children}
    </div>
  );
}

export function PageHead({ title, sub, children }: { title: ReactNode; sub?: ReactNode; children?: ReactNode }) {
  return (
    <div className="page-head">
      <div>
        <h2>{title}</h2>
        {sub ? <p className="small muted">{sub}</p> : null}
      </div>
      {children}
    </div>
  );
}

export function Stats({ items }: { items: [ReactNode, ReactNode][] }) {
  return (
    <div className="stats">
      {items.map(([k, v], i) => (
        <div key={i}>
          <span>{k}</span>
          <strong>{v}</strong>
        </div>
      ))}
    </div>
  );
}

/** 숨김 라벨이 붙은 작은 선택칸 (표 안에서 많이 써요) */
export function MiniSelect({ label, id, value, options, style, ...rest }: Dict & { label: string; id: string; value: unknown; options: Opt[]; style?: CSSProperties }) {
  return (
    <label>
      <span hidden>{label}</span>
      <In as="select" id={id} value={value} style={{ width: 'auto', ...(style || {}) }} {...dataProps(rest)}>
        <Options options={options} />
      </In>
    </label>
  );
}

/** 숨김 라벨이 붙은 작은 입력칸 */
export function MiniInput({ label, id, value, style, type = 'text', ...rest }: Dict & { label: string; id: string; value: unknown; style?: CSSProperties; type?: string }) {
  return (
    <label>
      <span hidden>{label}</span>
      <In id={id} type={type} value={value} style={style} {...dataProps(rest)} placeholder={(rest.placeholder as string) || undefined} min={rest.min as string} max={rest.max as string} step={rest.step as string} />
    </label>
  );
}

/** 체크박스 (바깥 값이 바뀌면 맞춰 줘요) */
export function Check({ checked, ...rest }: Dict & { checked: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  useLayoutEffect(() => {
    if (ref.current && ref.current.checked !== !!checked) ref.current.checked = !!checked;
  }, [checked]);
  return <input ref={ref} type="checkbox" defaultChecked={!!checked} {...(rest as Dict)} />;
}

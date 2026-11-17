// JSX에서 쓰는 작은 도우미들
import { cloneElement, Fragment, isValidElement, type CSSProperties, type ReactElement, type ReactNode } from 'react';

const ATTR: Record<string, string> = {
  class: 'className',
  for: 'htmlFor',
  tabindex: 'tabIndex',
  colspan: 'colSpan',
  rowspan: 'rowSpan',
  readonly: 'readOnly',
  maxlength: 'maxLength',
  minlength: 'minLength',
  autocomplete: 'autoComplete',
  autofocus: 'autoFocus',
  novalidate: 'noValidate',
  inputmode: 'inputMode',
};

/** "a:b;c:d" 같은 CSS 글을 style 객체로 바꿔요. */
export function css(s: string | null | undefined): CSSProperties {
  const o: Record<string, string> = {};
  if (!s) return o;
  for (const d of s.split(';')) {
    const i = d.indexOf(':');
    if (i < 0) continue;
    const k = d.slice(0, i).trim();
    const v = d.slice(i + 1).trim();
    if (!k) continue;
    o[k.startsWith('--') ? k : k.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = v;
  }
  return o as CSSProperties;
}

/**
 * 조건에 따라 붙는 속성 글("disabled", 'data-r="1"', 'step="10"' 등)을 props로 바꿔요.
 * 예: <button {...ax(ok ? '' : 'disabled')}>
 */
export function ax(s: string | null | undefined | false): Record<string, unknown> {
  const o: Record<string, unknown> = {};
  if (!s) return o;
  const re = /([^\s=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"']+)))?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    const raw = m[1];
    const v = m[2] ?? m[3] ?? m[4];
    const k = raw.startsWith('data-') || raw.startsWith('aria-') ? raw : ATTR[raw.toLowerCase()] || raw;
    if (k === 'style') o.style = css(v);
    else o[k] = v === undefined ? (k.startsWith('data-') || k.startsWith('aria-') ? '' : true) : v;
  }
  return o;
}

/** 목록을 그릴 때 빈 항목을 빼고, 하나도 없으면 null을 돌려줘요 (예전 join('')이 빈 글이 되던 것과 같아요). */
export function jn(a: ReactNode[] | null | undefined): ReactNode[] | null {
  if (!a) return null;
  const r = a.filter((x) => x !== null && x !== undefined && x !== '' && x !== false);
  return r.length ? r : null;
}

/** 목록 사이사이에 구분 요소(예: <br />)를 끼워요. */
export function jb(a: ReactNode[], sep: ReactNode): ReactNode[] {
  const out: ReactNode[] = [];
  a.forEach((x, i) => {
    if (i) out.push(isValidElement(sep) ? cloneElement(sep as ReactElement, { key: 's' + i }) : sep);
    out.push(<Fragment key={i}>{x}</Fragment>);
  });
  return out;
}

/** 인쇄용 HTML 글(도장 SVG, A4 문서 등)을 감싸는 요소 없이 끼워 넣어요. */
export function Raw({ html }: { html: string }) {
  return <span style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: html || '' }} />;
}

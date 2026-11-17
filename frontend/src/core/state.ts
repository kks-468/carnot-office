// 화면 상태 S 하나를 모든 모듈이 함께 써요 (프로토타입과 같은 구조).
// S를 바꾼 뒤 render()를 부르면 React 화면이 다시 그려져요.
import { flushSync } from 'react-dom';
import { create } from 'zustand';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const S: any = {};

const useVersion = create<{ v: number }>(() => ({ v: 0 }));
const listeners = new Set<() => void>();

let mounted = false;
/** 첫 화면이 그려진 뒤부터 render()가 바로(동기) 그리도록 해요. */
export function markMounted(): void {
  mounted = true;
}

/**
 * 상태가 바뀌었음을 알려 화면을 다시 그려요.
 * 프로토타입처럼 render() 직후 새 화면의 요소를 바로 찾을 수 있게 동기로 그려요.
 */
export function render(): void {
  const bump = () => useVersion.setState((s) => ({ v: s.v + 1 }));
  if (mounted) flushSync(bump);
  else bump();
  listeners.forEach((f) => f());
}

/** render()가 불릴 때마다 실행할 함수를 등록해요 (서버 저장 등). */
export function onRender(f: () => void): () => void {
  listeners.add(f);
  return () => listeners.delete(f);
}

/** 컴포넌트에서 S를 읽을 때 써요. 상태가 바뀌면 컴포넌트가 다시 그려져요. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useS(): any {
  useVersion((s) => s.v);
  return S;
}

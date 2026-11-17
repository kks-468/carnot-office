// 화면을 다시 그릴 때 입력 중이던 칸의 포커스와 커서 위치를 지켜요.
import { onRender } from '../core/state';

let saved: { id: string; ss: number | null; se: number | null } | null = null;

onRender(() => {
  const ae = document.activeElement as HTMLInputElement | null;
  if (!ae || ae === document.body || !ae.id) {
    saved = null;
    return;
  }
  let ss: number | null = null;
  let se: number | null = null;
  try {
    ss = ae.selectionStart;
    se = ae.selectionEnd;
  } catch {
    /* 선택 범위가 없는 칸 */
  }
  saved = { id: ae.id, ss, se };
});

export function restoreFocus(): void {
  if (!saved) return;
  const { id, ss, se } = saved;
  saved = null;
  const el = document.getElementById(id) as HTMLInputElement | null;
  if (!el || document.activeElement === el) return;
  el.focus({ preventScroll: true });
  try {
    if (ss !== null && se !== null) el.setSelectionRange(ss, se);
  } catch {
    /* 무시 */
  }
}

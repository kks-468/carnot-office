// 서버 저장: 화면 상태 S의 데이터를 서버와 맞춰요.
// - 불러오기: GET /api/state → S의 데이터 키를 바꿔 끼워요 (메뉴·탭 같은 화면 상태는 그대로).
// - 저장: 화면을 다시 그릴 때마다(0.6초 모아서) 지난번 저장한 모습과 비교해 바뀐 문서만 POST /api/sync로 보내요.
import { S, render, onRender } from '../core/state';
import { toast } from '../core/runtime';
import { api, type ApiError } from './api';
import { canPay } from '../core/acl';

type Kind = { kind: string; key: string; map?: boolean };
/** 서버의 Kind와 같은 짝이에요 (backend store/Kind.java). */
export const KINDS: Kind[] = [
  { kind: 'org', key: 'orgs', map: true },
  { kind: 'person', key: 'people' },
  { kind: 'expert', key: 'experts' },
  { kind: 'project', key: 'projects' },
  { kind: 'collect', key: 'collect' },
  { kind: 'notice', key: 'notices' },
  { kind: 'cevent', key: 'cevents' },
  { kind: 'report', key: 'reports' },
  { kind: 'appr', key: 'appr' },
  { kind: 'meeting', key: 'meetings' },
  { kind: 'entry', key: 'entries' },
  { kind: 'receipt', key: 'receipts' },
  { kind: 'doc', key: 'docs' },
  { kind: 'sched', key: 'sched' },
  { kind: 'made', key: 'made', map: true },
  { kind: 'file', key: 'files', map: true },
];
/** 기관마다 통째로 저장하는 설정 (backend store/OrgDocKeys.java). */
export const DOC_KEYS = ['expGroups', 'pay', 'ins', 'rkind', 'raises', 'payFree', 'pgrade', 'grades', 'leaveAdj', 'leaveSet', 'stamps', 'orgSeal', 'docSeal', 'ls', 'docFooter', 'docSign', 'srcOv', 'rates', 'TPL'];
/** 급여 정보 묶음: 급여 열람 권한이 없으면 보내지 않아요 (서버 AccessRules.PAY_WRITE와 같아요). */
const PAY_KEYS = new Set(['pay', 'payFree', 'pgrade', 'raises', 'leaveAdj', 'grades', 'leaveSet', 'ins']);
const PRIVATE = new Set(['notice', 'cevent', 'report', 'appr', 'meeting', 'entry', 'receipt', 'doc', 'sched', 'made', 'file']);

export const server = { on: false, me: null as null | { personId: string; orgId: string; admin: boolean } };

let snap = new Map<string, Map<string, string>>();
let docSnap = new Map<string, string>();

/** 이 문서를 우리가 저장해도 되는지 (서버 규칙과 같아요. 안 되는 건 보내지 않아요). */
function writable(kind: string, id: string, x: any): boolean {
  const me = server.me;
  if (!me) return false;
  if (String(id).startsWith('agg:')) return false;
  if (PRIVATE.has(kind)) return !x || typeof x !== 'object' || ((!x.org || x.org === me.orgId) && !x.ext && !x.agg);
  switch (kind) {
    case 'org':
      return id === me.orgId && me.admin;
    case 'person':
      return x?.org === me.orgId && (me.admin || id === me.personId);
    case 'expert':
      return (!x?.xo || x.xo === me.orgId) && (me.admin || x?.by === me.personId || (!x?.by && (x?.share || 'org') === 'org'));
    case 'project':
      return !!x?.parts?.some((q: any) => q.org === me.orgId);
    case 'collect': {
      const p = S.projects.find((q: any) => q.id === x?.proj);
      return !!p?.parts?.some((q: any) => q.org === me.orgId && q.status === '수락');
    }
  }
  return false;
}

function entries(k: Kind): [string, any][] {
  const v = S[k.key];
  if (!v) return [];
  if (k.map) return Object.entries(v);
  return (v as any[]).filter((x) => x && x.id !== undefined && x.id !== null).map((x) => [String(x.id), x]);
}

function takeSnapshot(): void {
  snap = new Map();
  for (const k of KINDS) {
    const m = new Map<string, string>();
    for (const [id, x] of entries(k)) m.set(id, JSON.stringify(x));
    snap.set(k.kind, m);
  }
  docSnap = new Map(DOC_KEYS.map((key) => [key, JSON.stringify(S[key] ?? null)]));
}

/** 서버 데이터를 S에 넣어요. */
export function applyState(d: any): void {
  for (const k of KINDS) S[k.key] = d[k.key] ?? (k.map ? {} : []);
  for (const key of DOC_KEYS) if (key in d) S[key] = d[key];
  S.creds = {};
  S.temp = {};
  server.me = d.me || null;
  takeSnapshot();
}

/** 로그인 전·로그아웃 뒤: 데이터를 비워요. */
export function clearData(): void {
  for (const k of KINDS) S[k.key] = k.map ? {} : [];
  S.creds = {};
  S.temp = {};
  server.me = null;
  takeSnapshot();
}

export async function reload(): Promise<void> {
  const d = await api('/api/state');
  applyState(d);
  render();
}

/** 바뀐 문서 모으기 */
function collect(): { upserts: any[]; deletes: any[]; docs: Record<string, unknown>; marks: (() => void)[] } {
  const upserts: any[] = [];
  const deletes: any[] = [];
  const docs: Record<string, unknown> = {};
  const marks: (() => void)[] = [];
  for (const k of KINDS) {
    const old = snap.get(k.kind) || new Map();
    const seen = new Set<string>();
    for (const [id, x] of entries(k)) {
      seen.add(id);
      const j = JSON.stringify(x);
      if (old.get(id) === j) continue;
      if (writable(k.kind, id, x)) upserts.push({ kind: k.kind, id, data: x });
      marks.push(() => old.set(id, j));
    }
    for (const [id, j] of old) {
      if (seen.has(id)) continue;
      let x: any = null;
      try {
        x = JSON.parse(j);
      } catch {
        x = null;
      }
      if (writable(k.kind, id, x)) deletes.push({ kind: k.kind, id });
      marks.push(() => old.delete(id));
    }
  }
  for (const key of DOC_KEYS) {
    const j = JSON.stringify(S[key] ?? null);
    if (docSnap.get(key) === j) continue;
    if (!PAY_KEYS.has(key) || canPay()) docs[key] = S[key] ?? null;
    marks.push(() => docSnap.set(key, j));
  }
  return { upserts, deletes, docs, marks };
}

let timer: ReturnType<typeof setTimeout> | null = null;
let busy = false;
let again = false;
export const pending = () => !!timer || busy;

async function flush(): Promise<void> {
  timer = null;
  if (!server.on || !server.me) return;
  if (busy) {
    again = true;
    return;
  }
  const { upserts, deletes, docs, marks } = collect();
  if (!upserts.length && !deletes.length && !Object.keys(docs).length) {
    marks.forEach((f) => f());
    return;
  }
  busy = true;
  try {
    const r = await api<{ applied: number; rejected: { kind: string; id: string; message: string }[]; corrected: { kind: string; id: string; data: any }[] }>('/api/sync', {
      body: { upserts, deletes, docs },
    });
    // 보낸 모습을 '저장된 모습'으로 기억해요 (실패하면 그대로 두어 다음에 다시 보내요)
    marks.forEach((f) => f());
    if (r.corrected?.length) {
      for (const c of r.corrected) {
        const k = KINDS.find((z) => z.kind === c.kind);
        if (!k) continue;
        if (k.map) S[k.key][c.id] = c.data;
        else {
          const arr = S[k.key] as any[];
          const i = arr.findIndex((x) => String(x.id) === c.id);
          if (i >= 0) arr[i] = c.data;
          else arr.push(c.data);
        }
        snap.get(c.kind)?.set(c.id, JSON.stringify(c.data));
      }
      render();
    }
    if (r.rejected?.length) {
      toast(`저장하지 못한 항목이 있어요: ${r.rejected[0].message}`);
      await reload();
    }
  } catch (e) {
    const err = e as ApiError;
    if (err.status === 401) {
      toast('로그인이 끝났어요. 다시 로그인해 주세요.');
      S.auth = null;
      clearData();
      render();
    } else {
      toast(err.message || '저장하지 못했어요. 잠시 뒤 다시 저장할게요.');
      schedule(5000);
    }
  } finally {
    busy = false;
    if (again) {
      again = false;
      schedule(100);
    }
  }
}

function schedule(ms = 600): void {
  if (timer) clearTimeout(timer);
  timer = setTimeout(flush, ms);
}

/** 서버 모드에서 저장을 켜요. 다른 사람이 바꾼 내용은 창으로 돌아올 때와 1분마다 다시 불러와요. */
export function startSync(): void {
  if (!server.on) return;
  onRender(() => {
    if (server.me) schedule();
  });
  const refresh = () => {
    if (!server.me || pending() || S.modal || document.activeElement?.matches?.('input,textarea,select')) return;
    reload().catch(() => {});
  };
  window.addEventListener('focus', refresh);
  setInterval(refresh, 60_000);
  window.addEventListener('beforeunload', (e) => {
    if (pending()) {
      e.preventDefault();
      e.returnValue = '';
    }
  });
}

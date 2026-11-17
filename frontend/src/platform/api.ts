// 백엔드(/api) 호출. 세션 쿠키로 로그인하고, 바꾸는 요청에는 CSRF 토큰을 실어 보내요.

export type ApiError = { status: number; code: string; message: string };

function csrf(): string {
  const m = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/);
  return m ? decodeURIComponent(m[1]) : '';
}

export async function api<T = any>(path: string, opt: { method?: string; body?: unknown } = {}): Promise<T> {
  const method = opt.method || (opt.body === undefined ? 'GET' : 'POST');
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (opt.body !== undefined) headers['Content-Type'] = 'application/json';
  if (method !== 'GET') headers['X-XSRF-TOKEN'] = csrf();
  let res: Response;
  try {
    res = await fetch(path, { method, headers, credentials: 'include', body: opt.body === undefined ? undefined : JSON.stringify(opt.body) });
  } catch {
    throw { status: 0, code: 'network', message: '서버에 연결하지 못했어요. 인터넷 연결을 확인해 주세요.' } as ApiError;
  }
  const text = await res.text();
  let data: any = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }
  if (!res.ok) {
    throw {
      status: res.status,
      code: data?.code || (res.status === 401 ? 'unauthorized' : 'error'),
      message: data?.message || (res.status === 401 ? '로그인이 끝났어요. 다시 로그인해 주세요.' : res.status === 403 ? '권한이 없어요.' : '서버에서 오류가 났어요.'),
    } as ApiError;
  }
  return data as T;
}

/** 백엔드가 붙어 있는지 확인해요 (JSON으로 답하면 서버 모드). */
export async function probe(): Promise<{ personId?: string; orgId?: string; admin?: boolean } | null> {
  try {
    const res = await fetch('/api/auth/me', { credentials: 'include', headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    if (!(res.headers.get('content-type') || '').includes('json')) return null;
    return await res.json();
  } catch {
    return null;
  }
}

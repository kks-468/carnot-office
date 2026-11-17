// AI 연결: 백엔드의 /api/ai/stream, /api/ai/json (Anthropic API 프록시)을 불러요.
// 서버에 API 키가 없거나 연결이 안 되면 null을 돌려주고, 화면은 "예시 초안"으로 동작해요.
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

type AiError = { code: string; message: string };
const toError = (res: Response, body: { code?: string; message?: string } | null): AiError => ({
  code: body?.code || (res.status === 503 ? 'none' : 'unavailable'),
  message: body?.message || res.statusText,
});

async function streamText(prompt: string, opts: { modelTier?: string; onText?: (x: { text: string }) => void } = {}) {
  const res = await fetch('/api/ai/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ prompt, tier: opts.modelTier || 'default' }),
  });
  if (!res.ok) throw toError(res, await res.json().catch(() => null));
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let text = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    text += decoder.decode(value, { stream: true });
    opts.onText?.({ text });
  }
  return { text };
}

function imageToBase64(img: Blob | string): Promise<{ media_type: string; data: string }> {
  if (typeof img === 'string' && img.startsWith('data:')) {
    const [meta, data] = img.split(',');
    return Promise.resolve({ media_type: meta.slice(5, meta.indexOf(';')), data });
  }
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => {
      const s = String(fr.result);
      const type = (img as Blob).type;
      resolve({ media_type: type && IMAGE_TYPES.includes(type) ? type : 'image/jpeg', data: s.slice(s.indexOf(',') + 1) });
    };
    fr.onerror = reject;
    fr.readAsDataURL(img as Blob);
  });
}

async function json(prompt: string, opts: { images?: (Blob | string)[]; modelTier?: string } = {}) {
  const images = await Promise.all((opts.images || []).map(imageToBase64));
  const res = await fetch('/api/ai/json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ prompt, images, tier: opts.modelTier || 'default' }),
  });
  if (!res.ok) throw toError(res, await res.json().catch(() => null));
  return res.json();
}

let enabled: boolean | null = null;
/** AI를 쓸 수 있으면 sample(prompt, opts) 함수(+ .json, .limits)를, 아니면 null을 돌려줘요. */
export async function aiClient() {
  if (enabled === null) {
    try {
      const r = await fetch('/api/ai/status', { credentials: 'include' });
      enabled = r.ok && (await r.json()).enabled === true;
    } catch {
      enabled = false;
    }
  }
  if (!enabled) return null;
  const sample = (prompt: string, opts?: { modelTier?: string; onText?: (x: { text: string }) => void }) => streamText(prompt, opts);
  return Object.assign(sample, { json, limits: async () => ({ images: true }) });
}

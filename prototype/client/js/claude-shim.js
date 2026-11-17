/*
 * claude-shim.js
 * 프로토타입(Claude 아티팩트)에서 쓰던 window.claude.use('sample' | 'downloads')를
 * 로컬 개발 환경에 맞게 바꿔 주는 연결 코드예요.
 *
 *  - sample    → 우리 서버의 /api/ai/stream, /api/ai/json (Anthropic API 프록시)
 *  - downloads → 브라우저 기본 다운로드
 *
 * 서버에 ANTHROPIC_API_KEY가 없으면 sample은 null을 돌려주고,
 * 앱은 지금처럼 "예시 초안"으로 동작해요.
 */
(function () {
  const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  function toError(res, body) {
    return { code: (body && body.code) || (res.status === 503 ? 'none' : 'unavailable'), message: (body && body.message) || res.statusText };
  }

  // 글을 조금씩 받아 onText({text})로 넘겨요. 끝나면 {text}를 돌려줘요.
  async function streamText(prompt, opts = {}) {
    const res = await fetch('/api/ai/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, tier: opts.modelTier || 'default' }),
    });
    if (!res.ok) throw toError(res, await res.json().catch(() => null));
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let text = '';
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      text += decoder.decode(value, { stream: true });
      if (opts.onText) opts.onText({ text });
    }
    return { text };
  }

  function imageToBase64(img) {
    if (typeof img === 'string' && img.startsWith('data:')) {
      const [meta, data] = img.split(',');
      return Promise.resolve({ media_type: meta.slice(5, meta.indexOf(';')), data });
    }
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => {
        const s = String(fr.result);
        resolve({ media_type: img.type && IMAGE_TYPES.includes(img.type) ? img.type : 'image/jpeg', data: s.slice(s.indexOf(',') + 1) });
      };
      fr.onerror = reject;
      fr.readAsDataURL(img);
    });
  }

  // 영수증 사진처럼 이미지를 읽고 JSON으로 답을 받을 때 써요.
  async function json(prompt, opts = {}) {
    const images = await Promise.all((opts.images || []).map(imageToBase64));
    const res = await fetch('/api/ai/json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, images, tier: opts.modelTier || 'default' }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) throw toError(res, body);
    return body;
  }

  const sample = Object.assign(streamText, {
    limits: async () => ({ images: true }),
    json,
  });

  const downloads = {
    async save({ filename, data }) {
      const blob = data instanceof Blob ? data : new Blob([data]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      return { status: 'saved' };
    },
  };

  let aiEnabled = null;
  async function checkAi() {
    if (aiEnabled !== null) return aiEnabled;
    try {
      const res = await fetch('/api/ai/status');
      aiEnabled = res.ok && (await res.json()).enabled === true;
    } catch (e) {
      aiEnabled = false;
    }
    return aiEnabled;
  }

  window.claude = {
    async use(name) {
      if (name === 'downloads') return downloads;
      if (name === 'sample') return (await checkAi()) ? sample : null;
      return null;
    },
  };
})();

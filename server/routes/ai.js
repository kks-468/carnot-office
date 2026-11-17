// Anthropic API 프록시. API 키는 서버(.env)에만 두고 브라우저로 보내지 않아요.
import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';

const router = Router();
const client = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;

const MODEL = process.env.AI_MODEL || 'claude-sonnet-5-5';
const MODEL_QUICK = process.env.AI_MODEL_QUICK || 'claude-haiku-5-5';
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
const MAX_PROMPT = 200_000;

const pickModel = (tier) => (tier === 'quick' ? MODEL_QUICK : MODEL);

function checkPrompt(prompt) {
  return typeof prompt === 'string' && prompt.trim().length > 0 && prompt.length <= MAX_PROMPT;
}

router.get('/status', (req, res) => {
  res.json({ enabled: Boolean(client), model: client ? MODEL : null });
});

// 글 생성 (스트리밍): AI 회의록·자문의견서 초안
router.post('/stream', async (req, res) => {
  if (!client) return res.status(503).json({ code: 'none', message: 'ANTHROPIC_API_KEY가 설정되지 않았어요.' });
  const { prompt, tier } = req.body || {};
  if (!checkPrompt(prompt)) return res.status(400).json({ code: 'bad_request', message: '프롬프트를 확인해 주세요.' });

  let stream;
  try {
    stream = client.messages.stream({
      model: pickModel(tier),
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });
    // 브라우저가 중간에 연결을 끊으면 AI 호출도 멈춰요 (응답을 다 보낸 뒤에는 무시)
    res.on('close', () => { if (!res.writableFinished) stream.abort(); });
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-Accel-Buffering', 'no');
    stream.on('text', (delta) => res.write(delta));
    await stream.finalMessage();
    res.end();
  } catch (e) {
    console.error('[ai/stream]', e.message);
    if (!res.headersSent) res.status(502).json({ code: 'unavailable', message: e.message });
    else res.end();
  }
});

// JSON 응답: 영수증 사진 읽기, 제안서에서 월차별 추진 일정 뽑기
router.post('/json', async (req, res) => {
  if (!client) return res.status(503).json({ code: 'none', message: 'ANTHROPIC_API_KEY가 설정되지 않았어요.' });
  const { prompt, images = [], tier } = req.body || {};
  if (!checkPrompt(prompt)) return res.status(400).json({ code: 'bad_request', message: '프롬프트를 확인해 주세요.' });
  if (!Array.isArray(images) || images.length > 5 || images.some((i) => !IMAGE_TYPES.has(i?.media_type) || typeof i?.data !== 'string')) {
    return res.status(400).json({ code: 'bad_request', message: '이미지는 jpeg·png·gif·webp로 5장까지 보낼 수 있어요.' });
  }

  try {
    const msg = await client.messages.create({
      model: pickModel(tier),
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            ...images.map((i) => ({ type: 'image', source: { type: 'base64', media_type: i.media_type, data: i.data } })),
            { type: 'text', text: `${prompt}\n\n설명 없이 JSON만 출력하세요.` },
          ],
        },
      ],
    });
    const text = msg.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
    const found = text.match(/[\[{][\s\S]*[\]}]/);
    if (!found) return res.status(502).json({ code: 'bad_output', message: 'AI 응답에서 JSON을 찾지 못했어요.' });
    res.json(JSON.parse(found[0]));
  } catch (e) {
    console.error('[ai/json]', e.message);
    res.status(502).json({ code: 'unavailable', message: e.message });
  }
});

export default router;

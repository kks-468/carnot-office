import { Router } from 'express';
import { readState, writeState, clearState } from '../store.js';

const router = Router();

// 저장된 상태가 없으면 204 → 화면이 시연용 기본 데이터로 시작해요.
router.get('/', async (req, res, next) => {
  try {
    const state = await readState();
    if (!state) return res.status(204).end();
    res.json(state);
  } catch (e) {
    next(e);
  }
});

router.put('/', async (req, res, next) => {
  try {
    const body = req.body;
    if (!body || typeof body !== 'object' || !Array.isArray(body.projects)) {
      return res.status(400).json({ code: 'bad_request', message: 'projects 배열이 있는 상태 객체를 보내 주세요.' });
    }
    await writeState(body);
    res.json({ ok: true, savedAt: new Date().toISOString() });
  } catch (e) {
    next(e);
  }
});

// 시연 데이터로 되돌리기: DELETE /api/state 후 새로고침
router.delete('/', async (req, res, next) => {
  try {
    await clearState();
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;

// Carnot 연구행정 지원 플랫폼 · 로컬 개발 서버
// - client/ 폴더의 화면을 그대로 제공해요.
// - /api/state : 화면 상태 저장·불러오기 (data/state.json)
// - /api/ai    : Anthropic API 프록시 (AI 회의록, 영수증 읽기, 추진 일정 추출)
import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import stateRouter from './routes/state.js';
import aiRouter from './routes/ai.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '127.0.0.1';

app.disable('x-powered-by');
app.use(express.json({ limit: '50mb' }));

app.use('/api/state', stateRouter);
app.use('/api/ai', aiRouter);
app.get('/api/health', (req, res) => res.json({ ok: true }));

// 라이브러리는 npm으로 설치한 것을 그대로 내보내요 (인터넷 CDN 없이도 동작)
const nm = (...p) => path.join(__dirname, '..', 'node_modules', ...p);
app.get('/vendor/jszip.min.js', (req, res) => res.sendFile(nm('jszip', 'dist', 'jszip.min.js')));
app.get('/vendor/html2canvas.min.js', (req, res) => res.sendFile(nm('html2canvas', 'dist', 'html2canvas.min.js')));
app.get('/vendor/jspdf.umd.min.js', (req, res) => res.sendFile(nm('jspdf', 'dist', 'jspdf.umd.min.js')));
app.use('/vendor/pdfjs', express.static(nm('pdfjs-dist', 'build')));

app.use(express.static(path.join(__dirname, '..', 'client')));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ code: 'server_error', message: err.message });
});

app.listen(PORT, HOST, () => {
  console.log(`Carnot 개발 서버: http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
  console.log(process.env.ANTHROPIC_API_KEY ? 'AI 연결됨' : 'AI 미연결 (.env에 ANTHROPIC_API_KEY를 넣으면 켜져요)');
});

// 아주 단순한 파일 저장소예요. 실제 서비스에서는 PostgreSQL 같은 DB로 바꿔요 (docs/데이터모델.md 참고).
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const FILE = path.join(DATA_DIR, 'state.json');

export async function readState() {
  try {
    return JSON.parse(await fs.readFile(FILE, 'utf8'));
  } catch (e) {
    if (e.code === 'ENOENT') return null;
    throw e;
  }
}

export async function writeState(state) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(state), 'utf8');
  await fs.rename(tmp, FILE); // 쓰는 도중 꺼져도 파일이 깨지지 않게
}

export async function clearState() {
  await fs.rm(FILE, { force: true });
}

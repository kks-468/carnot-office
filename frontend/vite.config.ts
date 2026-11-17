import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 개발 중에는 /api 요청을 Spring Boot 백엔드(8080)로 넘겨요.
// 빌드 결과 미리보기(vite preview)는 CARNOT_API를 주면 그 주소로 넘기고, 없으면 시연 모드로 떠요.
const api = process.env.CARNOT_API;
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:8080' },
  },
  preview: { proxy: api ? { '/api': api } : {} },
});

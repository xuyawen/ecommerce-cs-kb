import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 开发时用 Vite 代理把 /api 转发到 Nest 后端 (localhost:3000)，
// 免去跨域配置；生产部署可由 Nginx 统一反代。
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});

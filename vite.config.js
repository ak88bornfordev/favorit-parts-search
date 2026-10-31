import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// API Favorit Parts не отдает CORS-заголовки и работает по http,
// поэтому в браузере ходим на свой адрес /api, а Vite проксирует запрос дальше.
// Ключ покупателя подставляется здесь, на стороне прокси, и не попадает в клиентский бандл.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiKey = env.FAVORIT_API_KEY || '';

  const proxy = {
    '/api': {
      target: 'http://api.favorit-parts.ru',
      changeOrigin: true,
      rewrite: (path) => {
        const url = path.replace(/^\/api/, '/hs');
        const sep = url.includes('?') ? '&' : '?';
        return `${url}${sep}key=${encodeURIComponent(apiKey)}`;
      },
    },
  };

  return {
    plugins: [react()],
    server: { proxy },
    preview: { proxy },
  };
});

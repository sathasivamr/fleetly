import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Traccar demo server (https://demo.traccar.org). Set VITE_TRACCAR_URL in .env / .env.local
// to use another instance (e.g. http://localhost:8082).
const DEFAULT_TRACCAR_URL = 'https://demo.traccar.org';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = env.VITE_TRACCAR_URL || DEFAULT_TRACCAR_URL;
  const wsTarget = target.replace(/^http/, 'ws');
  const baseRaw = env.VITE_BASE_PATH && String(env.VITE_BASE_PATH).trim();
  const base = baseRaw ? `${baseRaw.replace(/\/$/, '')}/` : '/';

  return {
    base,
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3001,
      proxy: {
        '/api/socket': {
          target: wsTarget,
          ws: true,
          changeOrigin: true,
          secure: true,
        },
        '/api': {
          target,
          changeOrigin: true,
          secure: true,
          cookieDomainRewrite: 'localhost',
        },
      },
    },
  };
});

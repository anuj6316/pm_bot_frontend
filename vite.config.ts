import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Proxy all API and WebSocket calls to the Dockerized Django backend.
      // This avoids CORS issues entirely in development.
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://localhost:8002',
          changeOrigin: true,
        },
        '/ws': {
          target: (env.VITE_WS_BASE_URL || 'ws://localhost:8002').replace('ws://', 'http://'),
          changeOrigin: true,
          ws: true,
        },
      },
    },
  };
});

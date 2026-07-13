import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      headers: {
        'Cross-Origin-Opener-Policy': 'unsafe-none',
        'Cross-Origin-Embedder-Policy': 'unsafe-none',
      },
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
        '/ws': {
          target: 'ws://localhost:3001',
          ws: true,
        },
      },
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        '@seesby/types': path.resolve(__dirname, './packages/types/src'),
        '@seesby/metrics': path.resolve(__dirname, './packages/metrics/src'),
        '@seesby/modes': path.resolve(__dirname, './packages/modes/src'),
        '@seesby/actions': path.resolve(__dirname, './packages/actions/src'),
        '@seesby/fingerprint': path.resolve(__dirname, './packages/fingerprint/src'),
        '@seesby/compute': path.resolve(__dirname, './packages/compute/src'),
      }
    },
    build: {
      rollupOptions: {}
    }
  };
});

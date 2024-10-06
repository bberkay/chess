import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
  resolve: {
    alias: {
      '@Chess': path.resolve(__dirname, 'src/Chess'),
      '@Platform': path.resolve(__dirname, 'src/Platform'),
      '@Services': path.resolve(__dirname, 'src/Services'),
    },
  },
});

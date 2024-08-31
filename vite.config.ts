import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@Chess': path.resolve(__dirname, 'src/Chess'),
      '@Platform': path.resolve(__dirname, 'src/Platform'),
      '@Services': path.resolve(__dirname, 'src/Services'),
    },
  },
});

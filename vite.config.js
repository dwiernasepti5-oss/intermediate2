import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.', 
  publicDir: 'public',
  base: '/intermediate_submission_2/',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});

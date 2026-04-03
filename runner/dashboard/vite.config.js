import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3700',
      '/ws': { target: 'ws://localhost:3700', ws: true },
    },
  },
  build: {
    outDir: 'dist',
  },
});

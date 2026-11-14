import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' keeps all asset and data URLs relative, so the built site
// works from any sub-path (GitHub Pages, a USB stick, a school server).
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { port: 5173, open: false },
  build: {
    chunkSizeWarningLimit: 2500,
  },
});

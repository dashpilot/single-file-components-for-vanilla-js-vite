import { defineConfig } from 'vite';
import sfcPlugin from './vite-plugin-sfc.js';

export default defineConfig({
  plugins: [sfcPlugin()],
  root: './public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: './public/index.html'
    }
  }
});


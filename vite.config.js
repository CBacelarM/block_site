import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  appType: 'mpa',
  server: {
    port: 3000,
    host: true
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        privacy: resolve(__dirname, 'privacy.html'),
        play: resolve(__dirname, 'play/index.html')
      }
    }
  }
});

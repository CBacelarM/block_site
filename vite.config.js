import { defineConfig } from 'vite';
import { resolve } from 'path';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  appType: 'mpa',
  server: {
    port: 3000,
    host: true
  },
  plugins: [
    {
      name: 'serve-play-static',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (!req.url) return next();
          const cleanUrl = decodeURIComponent(req.url.split('?')[0]);
          
          if (cleanUrl === '/play' || cleanUrl === '/play/') {
            const playHtml = path.resolve(process.cwd(), 'play/index.html');
            if (fs.existsSync(playHtml)) {
              res.setHeader('Content-Type', 'text/html');
              return fs.createReadStream(playHtml).pipe(res);
            }
          }

          if (cleanUrl.startsWith('/play/')) {
            const filePath = path.resolve(process.cwd(), cleanUrl.replace(/^\/+/, ''));
            if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
              const ext = path.extname(filePath).toLowerCase();
              const mimeMap = {
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.webp': 'image/webp',
                '.mp3': 'audio/mpeg',
                '.wav': 'audio/wav',
                '.ogg': 'audio/ogg',
                '.woff2': 'font/woff2',
                '.woff': 'font/woff',
                '.ttf': 'font/ttf',
                '.js': 'text/javascript',
                '.css': 'text/css',
                '.html': 'text/html',
                '.json': 'application/json'
              };
              if (mimeMap[ext]) {
                res.setHeader('Content-Type', mimeMap[ext]);
              }
              return fs.createReadStream(filePath).pipe(res);
            }
          }
          next();
        });
      },
      closeBundle() {
        const srcDir = path.resolve(process.cwd(), 'play/assets');
        const destDir = path.resolve(process.cwd(), 'dist/play/assets');
        if (fs.existsSync(srcDir)) {
          fs.cpSync(srcDir, destDir, { recursive: true });
        }
      }
    }
  ],
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

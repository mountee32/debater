import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import type { ViteDevServer } from 'vite';

// Custom plugin to serve and watch debug.log
const debugLogPlugin = () => ({
  name: 'debug-log',
  configureServer(server: ViteDevServer) {
    const logPath = path.resolve('debug.log');

    // Serve debug.log
    server.middlewares.use((req: any, res: any, next: () => void) => {
      if (req.url === '/debug.log') {
        res.setHeader('Content-Type', 'text/plain');
        fs.createReadStream(logPath).pipe(res);
      } else {
        next();
      }
    });

    // Watch debug.log for changes
    server.watcher.add(logPath);
  },
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), debugLogPlugin()],
});

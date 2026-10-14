import express from 'express';
import http from 'http';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './server/routes.ts';
import { liveQuiz } from './server/liveQuiz.ts';
import path from 'path';
import fs from 'fs';

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  const PORT = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  // Initialize Live Quiz WebSocket handler
  liveQuiz.initWebSocket(httpServer);

  // Support JSON bodies with up to 15MB for signature photo base64 uploads and bulk CSV
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // CORS middleware allowing public participant access across all domains
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-admin-token');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // Mount API router under /api
  app.use('/api', apiRouter);

  const distPath = path.resolve(process.cwd(), 'dist');
  const distIndex = path.join(distPath, 'index.html');
  const hasDist = fs.existsSync(distIndex);

  // Serve static assets or vite middlewares
  if (isProd && hasDist) {
    app.use(express.static(distPath));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(distIndex);
    });
  } else {
    // In dev mode or when dist isn't available, Vite middleware handles all modules and HMR/dev serving
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`CLW VAW 2026 Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

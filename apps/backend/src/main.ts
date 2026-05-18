import 'reflect-metadata';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { Express, NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  const config = app.get(ConfigService);
  const port = config.get<number>('port', 3010);
  const corsOrigin = config.get<string>('corsOrigin', '*');

  app.enableCors({
    origin: corsOrigin === '*' ? true : corsOrigin,
    // No cookies/session involved — credentials: true would block origin:'*' in browsers.
    credentials: false,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useWebSocketAdapter(new IoAdapter(app));

  // In single-origin deployments (Fly.io et al.) the backend serves the
  // Vite build as well. WEB_DIST_DIR is set by the Dockerfile; if it's
  // missing the backend behaves like a pure API server (dev mode runs
  // Vite separately on :5173).
  const webDist = process.env.WEB_DIST_DIR;
  const webIndex = webDist ? join(webDist, 'index.html') : null;
  const serveWeb = webIndex !== null && existsSync(webIndex);
  if (serveWeb && webDist) {
    app.useStaticAssets(webDist, { index: false, maxAge: '1h' });
    new Logger('Bootstrap').log(`Serving web bundle from ${webDist}`);
  }

  await app.init();

  if (serveWeb && webIndex) {
    // SPA fallback. Registered post-init so it sits after every controller
    // route — /health, /socket.io polling, the static middleware all win
    // first; only unmatched GETs (e.g. /r/abc) fall through to here.
    const express = app.getHttpAdapter().getInstance() as Express;
    express.get('*', (req: Request, res: Response, next: NextFunction) => {
      if (req.method !== 'GET') return next();
      if (req.path.startsWith('/socket.io')) return next();
      res.sendFile(webIndex);
    });
  }

  await app.listen(port, '0.0.0.0');
  new Logger('Bootstrap').log(`Durak backend listening on :${port}`);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Fatal bootstrap error', err);
  process.exit(1);
});

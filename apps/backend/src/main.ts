import 'reflect-metadata';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { NestFactory } from '@nestjs/core';
import {
  Catch,
  Logger,
  NotFoundException,
  ValidationPipe,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { AppModule } from './app.module';

// SPA fallback: when a GET request slips past every controller and the static
// middleware, Nest throws a NotFoundException — we intercept it and serve the
// Vite build's index.html so client-side routes like /r/abc resolve. Anything
// non-GET, or Socket.IO traffic, falls back to the standard JSON 404.
@Catch(NotFoundException)
class SpaFallbackFilter implements ExceptionFilter {
  constructor(private readonly indexFile: string) {}

  catch(exception: NotFoundException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    if (req.method === 'GET' && !req.path.startsWith('/socket.io')) {
      res.sendFile(this.indexFile);
      return;
    }

    res.status(exception.getStatus()).json(exception.getResponse());
  }
}

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
    app.useGlobalFilters(new SpaFallbackFilter(webIndex));
    new Logger('Bootstrap').log(`Serving web bundle from ${webDist}`);
  }

  await app.listen(port, '0.0.0.0');
  new Logger('Bootstrap').log(`Durak backend listening on :${port}`);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Fatal bootstrap error', err);
  process.exit(1);
});

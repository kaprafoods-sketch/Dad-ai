import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { json } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('v1');
  app.enableCors({ origin: (process.env.CORS_ORIGINS ?? 'http://localhost:3000').split(',') });
  // Keep the raw body around so webhook signatures can be verified over the
  // exact bytes the provider signed (Razorpay, etc.).
  app.use(
    json({
      verify: (req, _res, buf) => {
        (req as { rawBody?: Buffer }).rawBody = Buffer.from(buf);
      },
    }),
  );
  // TODO(phase-1): Redis rate limiter in the guard chain, @nestjs/swagger OpenAPI.
  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  console.log(`Dad AI API listening on :${port}`);
}

void bootstrap();

import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('v1');
  // TODO(phase-0): AuthGuard (Supabase JWT) → TenantResolver → RBAC Guard →
  // RateLimiter, global zod validation pipe, @nestjs/swagger OpenAPI.
  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  console.log(`Dad AI API listening on :${port}`);
}

void bootstrap();

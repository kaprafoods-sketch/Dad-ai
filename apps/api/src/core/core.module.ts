import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PrismaService } from './prisma.service';
import { QueueService } from './queue.service';
import { AuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';
import { FeatureGuard } from './feature.guard';

/**
 * Global request pipeline (docs/architecture.md §9):
 * AuthGuard → RolesGuard → FeatureGuard. Rate limiting (Redis) joins the
 * chain in Phase 1 once Upstash is configured.
 */
@Global()
@Module({
  providers: [
    PrismaService,
    QueueService,
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: FeatureGuard },
  ],
  exports: [PrismaService, QueueService],
})
export class CoreModule {}

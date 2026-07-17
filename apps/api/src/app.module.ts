import { Module } from '@nestjs/common';
import { CoreModule } from './core/core.module';
import { HealthController } from './health.controller';
import { AuthModule } from './modules/auth/auth.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { CrmModule } from './modules/crm/crm.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { AgentsModule } from './modules/agents/agents.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { WorkflowsModule } from './modules/workflows/workflows.module';
import { ConnectorsModule } from './modules/connectors/connectors.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { BillingModule } from './modules/billing/billing.module';
import { AdminModule } from './modules/admin/admin.module';

// One module per domain (docs/architecture.md §9).
@Module({
  imports: [
    CoreModule,
    AuthModule,
    TenantsModule,
    CrmModule,
    DocumentsModule,
    AgentsModule,
    ConversationsModule,
    WorkflowsModule,
    ConnectorsModule,
    WebhooksModule,
    BillingModule,
    AdminModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}

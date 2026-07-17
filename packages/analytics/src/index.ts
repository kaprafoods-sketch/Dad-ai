// Product analytics + usage aggregation (feeds the admin dashboard).

export interface AnalyticsEvent {
  tenantId: string;
  userId?: string;
  name: string; // e.g. "deal.created", "agent.replied", "document.uploaded"
  properties?: Record<string, unknown>;
  occurredAt?: Date;
}

export interface AnalyticsSink {
  track(event: AnalyticsEvent): Promise<void>;
}

/** No-op sink for local dev; swap for a real sink (PostHog/Axiom) in prod. */
export class ConsoleAnalyticsSink implements AnalyticsSink {
  async track(event: AnalyticsEvent): Promise<void> {
    console.log('[analytics]', event.name, event.tenantId, event.properties ?? {});
  }
}

import type { LlmCallRequest, LlmCallResult, ModelRouter, RoutingTier, UsageMeter } from './index';
import { MODEL_ROUTING } from './index';
import type { PromptRegistry } from './index';

interface OpenRouterMessage {
  role: string;
  content: string;
  tool_call_id?: string;
}

interface OpenRouterResponse {
  choices: Array<{
    message: { content: string | null; tool_calls?: unknown[] };
  }>;
  model: string;
  usage?: { prompt_tokens: number; completion_tokens: number; cost?: number };
}

export interface OpenRouterOptions {
  apiKey: string;
  baseUrl?: string;
  /** Called for budget checks + usage recording; optional in dev. */
  meter?: UsageMeter;
}

/**
 * The one place in the platform that talks to OpenRouter
 * (docs/architecture.md §6.1). Routes by tier, falls back on error, meters
 * every call per tenant + feature.
 */
export class OpenRouterModelRouter implements ModelRouter {
  constructor(
    private readonly prompts: PromptRegistry,
    private readonly opts: OpenRouterOptions,
  ) {}

  async call(req: LlmCallRequest, tier: RoutingTier = 'default'): Promise<LlmCallResult> {
    if (this.opts.meter) {
      const budget = await this.opts.meter.checkBudget(req.tenantId);
      if (budget.remainingUsd <= 0) {
        throw new Error(`AI budget exhausted for tenant ${req.tenantId} (plan hard cap)`);
      }
    }

    const system = this.prompts.render(req.promptKey, req.variables);
    const messages: OpenRouterMessage[] = [
      { role: 'system', content: system },
      ...(req.messages ?? []).map((m) => ({ role: m.role, content: m.content })),
    ];

    let result: LlmCallResult;
    try {
      result = await this.invoke(MODEL_ROUTING[tier], messages, req.tools);
    } catch (primaryError) {
      if (tier === 'fallback') throw primaryError;
      result = await this.invoke(MODEL_ROUTING.fallback, messages, req.tools);
    }

    await this.opts.meter?.record(req.tenantId, req.feature, result);
    return result;
  }

  private async invoke(
    model: string,
    messages: OpenRouterMessage[],
    tools?: unknown[],
  ): Promise<LlmCallResult> {
    const res = await fetch(
      `${this.opts.baseUrl ?? 'https://openrouter.ai/api/v1'}/chat/completions`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.opts.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          ...(tools?.length ? { tools } : {}),
          usage: { include: true },
        }),
      },
    );
    if (!res.ok) {
      throw new Error(`OpenRouter ${res.status}: ${(await res.text()).slice(0, 500)}`);
    }
    const data = (await res.json()) as OpenRouterResponse;
    const choice = data.choices[0];
    if (!choice) throw new Error('OpenRouter returned no choices');
    return {
      content: choice.message.content ?? '',
      toolCalls: choice.message.tool_calls,
      model: data.model,
      tokensIn: data.usage?.prompt_tokens ?? 0,
      tokensOut: data.usage?.completion_tokens ?? 0,
      costUsd: data.usage?.cost ?? 0,
    };
  }
}

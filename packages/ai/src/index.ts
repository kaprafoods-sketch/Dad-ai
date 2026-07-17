// AI layer: model router + prompt registry + usage metering.
// All LLM calls in the platform go through this package — nothing calls
// OpenRouter directly. See docs/architecture.md §6.

export type AiFeature = 'receptionist' | 'rag' | 'doc_ai' | 'workflow' | 'employee';

export interface LlmCallRequest {
  tenantId: string;
  feature: AiFeature;
  promptKey: string; // versioned key in the PromptRegistry, e.g. "receptionist.realestate.v1"
  variables: Record<string, string>;
  messages?: Array<{ role: 'user' | 'assistant' | 'tool'; content: string }>;
  tools?: unknown[]; // function-calling tool defs (agent runtime)
}

export interface LlmCallResult {
  content: string;
  toolCalls?: unknown[];
  model: string;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
}

/**
 * Routing policy (docs/architecture.md §6.1):
 * - default:   cheap fast model for simple completions
 * - reasoning: stronger model for agent loops / complex reasoning
 * - fallback:  used when the primary errors
 */
export const MODEL_ROUTING = {
  default: 'google/gemini-2.5-flash',
  reasoning: 'anthropic/claude-sonnet-4.5',
  fallback: 'openai/gpt-5',
} as const;
export type RoutingTier = keyof typeof MODEL_ROUTING;

export interface ModelRouter {
  call(req: LlmCallRequest, tier?: RoutingTier): Promise<LlmCallResult>;
}

/** Every prompt is versioned in code and referenced by key — no inline prompts. */
export interface PromptRegistry {
  get(key: string): { key: string; template: string };
  render(key: string, variables: Record<string, string>): string;
}

/** Logs tokens + cost per call to the AiUsage table; enforces per-tenant budgets. */
export interface UsageMeter {
  record(tenantId: string, feature: AiFeature, result: LlmCallResult): Promise<void>;
  /** Returns remaining monthly budget; router hard-caps at plan limit, soft-warns at 80%. */
  checkBudget(tenantId: string): Promise<{ remainingUsd: number; softWarn: boolean }>;
}

export { OpenRouterModelRouter, type OpenRouterOptions } from './openrouter';
export { InMemoryPromptRegistry } from './prompts';
export { runAgent, type AgentTool, type AgentRunInput, type AgentRunResult } from './runtime';

// TODO(phase-1): PrismaUsageMeter (AiUsage table) once migrations run.

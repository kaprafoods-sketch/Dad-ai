import type { LlmCallRequest, LlmCallResult, ModelRouter } from './index';

/**
 * Agent tools are function-calling tools. Every execution happens
 * tenant-scoped (the executor closes over the tenant context) and the caller
 * is responsible for writing an Activity record per tool call — every AI
 * action must land on the CRM timeline (docs/architecture.md §6.2).
 */
export interface AgentTool {
  name: string;
  description: string;
  /** JSON Schema for the tool's arguments (OpenAI function-calling format). */
  parameters: Record<string, unknown>;
  execute(args: Record<string, unknown>): Promise<unknown>;
}

export interface AgentRunInput {
  tenantId: string;
  promptKey: string;
  variables: Record<string, string>;
  /** Only tools on the agent's allowlist — enforced by the caller. */
  tools: AgentTool[];
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  maxIterations?: number;
  onToolCall?(name: string, args: Record<string, unknown>, result: unknown): Promise<void>;
}

export interface AgentRunResult {
  reply: string;
  iterations: number;
  toolCallsMade: number;
  usage: { tokensIn: number; tokensOut: number; costUsd: number };
}

interface RawToolCall {
  id: string;
  function: { name: string; arguments: string };
}

/** The loop: LLM → tool call → execute → feed result back → repeat. */
export async function runAgent(router: ModelRouter, input: AgentRunInput): Promise<AgentRunResult> {
  const maxIterations = input.maxIterations ?? 8;
  const toolDefs = input.tools.map((t) => ({
    type: 'function',
    function: { name: t.name, description: t.description, parameters: t.parameters },
  }));
  const toolsByName = new Map(input.tools.map((t) => [t.name, t]));

  const messages: NonNullable<LlmCallRequest['messages']> = [...input.history];
  const usage = { tokensIn: 0, tokensOut: 0, costUsd: 0 };
  let toolCallsMade = 0;

  for (let iteration = 1; iteration <= maxIterations; iteration++) {
    const result: LlmCallResult = await router.call(
      {
        tenantId: input.tenantId,
        feature: 'receptionist',
        promptKey: input.promptKey,
        variables: input.variables,
        messages,
        tools: toolDefs,
      },
      'reasoning',
    );
    usage.tokensIn += result.tokensIn;
    usage.tokensOut += result.tokensOut;
    usage.costUsd += result.costUsd;

    const toolCalls = (result.toolCalls ?? []) as RawToolCall[];
    if (toolCalls.length === 0) {
      return { reply: result.content, iterations: iteration, toolCallsMade, usage };
    }

    messages.push({ role: 'assistant', content: result.content || JSON.stringify(toolCalls) });
    for (const call of toolCalls) {
      const tool = toolsByName.get(call.function.name);
      let output: unknown;
      if (!tool) {
        output = { error: `Tool "${call.function.name}" is not on this agent's allowlist` };
      } else {
        let args: Record<string, unknown> = {};
        try {
          args = JSON.parse(call.function.arguments || '{}') as Record<string, unknown>;
          output = await tool.execute(args);
        } catch (error) {
          output = { error: error instanceof Error ? error.message : String(error) };
        }
        toolCallsMade += 1;
        await input.onToolCall?.(call.function.name, args, output);
      }
      messages.push({
        role: 'tool',
        content: JSON.stringify({ tool: call.function.name, output }),
      });
    }
  }

  return {
    reply: 'I could not complete that request — a team member will follow up shortly.',
    iterations: maxIterations,
    toolCallsMade,
    usage,
  };
}

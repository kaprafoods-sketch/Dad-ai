import { describe, expect, it } from 'vitest';
import { runAgent, type AgentTool } from './runtime';
import type { LlmCallResult, ModelRouter } from './index';

function router(responses: LlmCallResult[]): ModelRouter {
  let i = 0;
  return {
    call: async () => responses[Math.min(i++, responses.length - 1)]!,
  };
}

const usage = { model: 'test', tokensIn: 1, tokensOut: 1, costUsd: 0 };

describe('runAgent', () => {
  it('returns the reply when no tools are called', async () => {
    const result = await runAgent(router([{ content: 'Hello!', ...usage }]), {
      tenantId: 't1',
      promptKey: 'p',
      variables: {},
      tools: [],
      history: [{ role: 'user', content: 'hi' }],
    });
    expect(result.reply).toBe('Hello!');
    expect(result.toolCallsMade).toBe(0);
  });

  it('executes a tool then returns the follow-up reply', async () => {
    const calls: string[] = [];
    const tool: AgentTool = {
      name: 'crm.createLead',
      description: 'create a lead',
      parameters: { type: 'object', properties: {} },
      execute: async (args) => {
        calls.push(String(args.name));
        return { id: 'lead-1' };
      },
    };
    const result = await runAgent(
      router([
        {
          content: '',
          toolCalls: [
            { id: '1', function: { name: 'crm.createLead', arguments: '{"name":"Bob"}' } },
          ],
          ...usage,
        },
        { content: 'Created your lead.', ...usage },
      ]),
      {
        tenantId: 't1',
        promptKey: 'p',
        variables: {},
        tools: [tool],
        history: [{ role: 'user', content: 'add Bob' }],
      },
    );
    expect(calls).toEqual(['Bob']);
    expect(result.toolCallsMade).toBe(1);
    expect(result.reply).toBe('Created your lead.');
  });

  it('reports a tool not on the allowlist without crashing', async () => {
    const result = await runAgent(
      router([
        {
          content: '',
          toolCalls: [{ id: '1', function: { name: 'comms.sendSms', arguments: '{}' } }],
          ...usage,
        },
        { content: 'done', ...usage },
      ]),
      { tenantId: 't1', promptKey: 'p', variables: {}, tools: [], history: [] },
    );
    // Unknown tool does not count as a successful tool call.
    expect(result.toolCallsMade).toBe(0);
    expect(result.reply).toBe('done');
  });

  it('stops after maxIterations to avoid infinite loops', async () => {
    const loopingTool: AgentTool = {
      name: 'x',
      description: '',
      parameters: { type: 'object', properties: {} },
      execute: async () => ({ ok: true }),
    };
    const result = await runAgent(
      router([
        {
          content: '',
          toolCalls: [{ id: '1', function: { name: 'x', arguments: '{}' } }],
          ...usage,
        },
      ]),
      {
        tenantId: 't1',
        promptKey: 'p',
        variables: {},
        tools: [loopingTool],
        history: [],
        maxIterations: 3,
      },
    );
    expect(result.iterations).toBe(3);
  });
});

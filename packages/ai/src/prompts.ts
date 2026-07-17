import type { PromptRegistry } from './index';

/**
 * In-memory registry. Prompts are registered at boot — from code and from
 * industry pack bundles (key convention: `{agentType}.{packId}.v{n}`).
 * No inline prompts anywhere else in the codebase.
 */
export class InMemoryPromptRegistry implements PromptRegistry {
  private prompts = new Map<string, string>();

  register(key: string, template: string): void {
    if (this.prompts.has(key)) {
      throw new Error(`Prompt key already registered: ${key} — bump the version instead`);
    }
    this.prompts.set(key, template);
  }

  get(key: string): { key: string; template: string } {
    const template = this.prompts.get(key);
    if (template === undefined) throw new Error(`Unknown prompt key: ${key}`);
    return { key, template };
  }

  /** Replaces {{variable}} placeholders. Unknown placeholders are left intact. */
  render(key: string, variables: Record<string, string>): string {
    return this.get(key).template.replace(/\{\{(\w+)\}\}/g, (match, name: string) =>
      Object.prototype.hasOwnProperty.call(variables, name) ? String(variables[name]) : match,
    );
  }

  keys(): string[] {
    return [...this.prompts.keys()];
  }
}

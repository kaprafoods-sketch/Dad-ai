import { describe, expect, it } from 'vitest';
import { InMemoryPromptRegistry } from './prompts';

describe('InMemoryPromptRegistry', () => {
  it('renders variables', () => {
    const registry = new InMemoryPromptRegistry();
    registry.register('greet.v1', 'Hello {{name}}, welcome to {{tenant}}.');
    expect(registry.render('greet.v1', { name: 'Sam', tenant: 'Acme' })).toBe(
      'Hello Sam, welcome to Acme.',
    );
  });

  it('leaves unknown placeholders intact', () => {
    const registry = new InMemoryPromptRegistry();
    registry.register('p.v1', 'Hi {{name}} {{missing}}');
    expect(registry.render('p.v1', { name: 'X' })).toBe('Hi X {{missing}}');
  });

  it('rejects duplicate keys (force version bumps)', () => {
    const registry = new InMemoryPromptRegistry();
    registry.register('p.v1', 'a');
    expect(() => registry.register('p.v1', 'b')).toThrow(/already registered/);
  });

  it('throws on unknown key', () => {
    const registry = new InMemoryPromptRegistry();
    expect(() => registry.get('nope')).toThrow(/Unknown prompt key/);
  });
});

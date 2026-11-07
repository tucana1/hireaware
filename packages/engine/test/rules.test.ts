import { describe, expect, it } from 'vitest';
import { RULES, compiledRules, matchRules } from '../src/rules';

describe('rules compile', () => {
  it('every pattern is a valid unicode regex', () => {
    expect(() => compiledRules()).not.toThrow();
    expect(new Set(RULES.map((r) => r.id)).size).toBe(RULES.length);
  });
});

describe.each(RULES.filter((r) => r.examples).map((r) => [r.id, r] as const))('%s', (id, rule) => {
  it.each(rule.examples!.hit)('hits: %s', (text) => {
    expect(matchRules(text).map((h) => h.id)).toContain(id);
  });
  it.each(rule.examples!.miss)('misses: %s', (text) => {
    expect(matchRules(text).map((h) => h.id)).not.toContain(id);
  });
});

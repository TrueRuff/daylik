import { describe, it, expect } from 'vitest';
import { categorizeByRules } from '../src/core/categorize.js';

describe('categorizeByRules', () => {
  it('бытовое дело → группа Н, разовое', () => {
    const r = categorizeByRules('помыть пол');
    expect(r.kind).toBe('task');
    expect(r.group).toBe('Н');
    expect(r.durationMin).toBe(30);
    expect(r.confidence).toBeGreaterThanOrEqual(0.5);
  });

  it('«хочу научиться готовить» → предложение сферы', () => {
    const r = categorizeByRules('хочу научиться готовить');
    expect(r.kind).toBe('sphere');
    expect(r.title).toBe('готовить');
    expect(r.group).toBe('Ж');
  });

  it('«читать 20 страниц в день» → практика с повтором', () => {
    const r = categorizeByRules('читать 20 страниц в день');
    expect(r.kind).toBe('routine');
    expect(r.repeatRule).toBe('daily');
    expect(r.title).not.toContain('в день');
  });

  it('незнакомая формулировка → низкая уверенность (уйдёт в LLM-фолбэк)', () => {
    const r = categorizeByRules('что-то совсем странное');
    expect(r.confidence).toBeLessThan(0.5);
  });
});

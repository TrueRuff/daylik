import { describe, it, expect, vi, beforeEach } from 'vitest';
import { categorizeByRules, categorize } from '../src/core/categorize.js';
import { categorizeWithLlm } from '../src/ai/llmClient.js';

vi.mock('../src/ai/llmClient.js', () => ({
  categorizeWithLlm: vi.fn(),
}));

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

describe('categorize — гибрид правил и LLM', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('уверенное правило срабатывает без вызова LLM', async () => {
    const r = await categorize('помыть пол');
    expect(r.provider).toBe('rules');
    expect(categorizeWithLlm).not.toHaveBeenCalled();
  });

  it('низкая уверенность + LLM ответил → берётся ответ LLM', async () => {
    categorizeWithLlm.mockResolvedValueOnce({
      kind: 'task', title: 'Отсортировать книги', group: 'Ж', confidence: 0.6, provider: 'llm',
    });

    const r = await categorize('что-то совсем странное');
    expect(r.provider).toBe('llm');
    expect(r.title).toBe('Отсортировать книги');
  });

  it('LLM недоступен → остаёмся на правилах с пометкой llmFailed', async () => {
    categorizeWithLlm.mockResolvedValueOnce(null);

    const r = await categorize('что-то совсем странное');
    expect(r.provider).toBe('rules');
    expect(r.llmFailed).toBe(true);
  });

  it('LLM упал с ошибкой → деградация на правилах, а не отказ', async () => {
    categorizeWithLlm.mockRejectedValueOnce(new Error('network'));

    const r = await categorize('что-то совсем странное');
    expect(r.provider).toBe('rules');
    expect(r.llmFailed).toBe(true);
  });
});

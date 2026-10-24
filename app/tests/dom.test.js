import { describe, it, expect } from 'vitest';
import { escapeHtml } from '../src/ui/dom.js';

describe('escapeHtml', () => {
  it('экранирует все опасные символы', () => {
    expect(escapeHtml('<img src=x onerror="alert(1)">')).toBe(
      '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;'
    );
    expect(escapeHtml("a'b&c<d>e\"f")).toBe('a&#39;b&amp;c&lt;d&gt;e&quot;f');
  });

  it('обычный текст не меняет, числа приводит к строке', () => {
    expect(escapeHtml('позвонить маме')).toBe('позвонить маме');
    expect(escapeHtml(30)).toBe('30');
  });
});

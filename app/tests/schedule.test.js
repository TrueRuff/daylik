import { describe, it, expect } from 'vitest';
import { timeToMinutes, minutesToTime, practiceAppliesOn, formatDays } from '../src/core/schedule.js';

describe('schedule', () => {
  it('время в минуты и обратно', () => {
    expect(timeToMinutes('23:00')).toBe(1380);
    expect(timeToMinutes('00:45')).toBe(45);
    expect(minutesToTime(1380)).toBe('23:00');
    expect(minutesToTime(45)).toBe('00:45');
  });

  it('практика применяется по дням недели', () => {
    const p = { days: [1, 3, 5] }; // пн, ср, пт
    expect(practiceAppliesOn(p, 3)).toBe(true);
    expect(practiceAppliesOn(p, 6)).toBe(false);
  });

  it('формат дней: ежедневно или списком', () => {
    expect(formatDays([1, 2, 3, 4, 5, 6, 7])).toBe('ежедневно');
    expect(formatDays([5, 1])).toBe('пн, пт');
  });
});

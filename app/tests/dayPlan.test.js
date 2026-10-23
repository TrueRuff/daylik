import { describe, it, expect } from 'vitest';
import { buildDay, sortCandidates, findFreeWindow, computeFreeWindows } from '../src/core/dayPlan.js';
import { Task } from '../src/core/models.js';

const task = (id, group, durationMin) =>
  new Task({ id, title: `дело ${id}`, group, durationMin });

describe('sortCandidates', () => {
  it('сортирует по приоритету группы, внутри группы — короткие раньше', () => {
    const sorted = sortCandidates([
      task('a', 'П', 20),
      task('b', 'Н', 60),
      task('c', 'Н', 30),
      task('d', 'Ж', 40),
    ]);
    expect(sorted.map((t) => t.id)).toEqual(['c', 'b', 'd', 'a']);
  });
});

describe('findFreeWindow', () => {
  it('находит окно между рутинами', () => {
    const blocks = [
      { start: 0, end: 480 },      // сон до 8:00
      { start: 540, end: 600 },    // рутина 9:00–10:00
    ];
    // 30-минутное дело влезает в 8:00–9:00 (480–540)
    expect(findFreeWindow(blocks, 30)).toEqual([480, 510]);
  });

  it('возвращает null, если дело никуда не влезает', () => {
    const blocks = [{ start: 0, end: 1439 }];
    expect(findFreeWindow(blocks, 60)).toBeNull();
  });
});

describe('computeFreeWindows', () => {
  it('находит все свободные промежутки', () => {
    const w = computeFreeWindows([{ start: 0, end: 480 }, { start: 540, end: 600 }]);
    expect(w).toEqual([{ start: 480, end: 540 }, { start: 600, end: 1440 }]);
  });

  it('без блоков весь день свободен', () => {
    expect(computeFreeWindows([])).toEqual([{ start: 0, end: 1440 }]);
  });
});

describe('buildDay', () => {
  it('практика через полночь разбивается на два блока', () => {
    const plan = buildDay('2026-10-24', [{ start: 1380, end: 420, label: 'Сон' }], []);
    const routines = plan.blocks.filter((b) => b.kind === 'routine');
    expect(routines.length).toBe(2); // 23:00–24:00 и 00:00–07:00
  });

  it('раскладывает дела по окнам, невлезающее — postponed', () => {
    const routines = [
      { start: 0, end: 480, label: 'Сон' },
      { start: 840, end: 900, label: 'Обед' },
    ];
    const tasks = [
      task('t1', 'Н', 60),   // влезает в 8:00–9:00
      task('t2', 'Н', 600),  // 10 часов свободного времени минус обед — 600 минут целиком не влезает
      task('t3', 'Ж', 30),
    ];
    const plan = buildDay('2026-10-23', routines, tasks);

    const taskBlocks = plan.blocks.filter((b) => b.kind === 'task');
    expect(taskBlocks.length).toBe(2); // 60 + 30 влезли, 600 не влезло
    expect(plan.postponed).toContain('t2');
  });
});

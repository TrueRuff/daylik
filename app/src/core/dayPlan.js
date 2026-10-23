// Календарь дня: рутины занимают таймлайн, в свободные окна подбираются дела.
// Ключевая алгоритмическая часть темы: фильтрация + сортировка + упаковка по времени.
// Контракт: buildDay(date, routines, tasks) → DayPlan { date, blocks }

import { PlanBlock } from './models.js';

const MINUTES_IN_DAY = 24 * 60;

// Сортировка дел при подборе: группа Н важнее Ж, Ж важнее П; внутри группы — короткие раньше.
const GROUP_PRIORITY = { 'Н': 0, 'Ж': 1, 'П': 2 };

export function sortCandidates(tasks) {
  return [...tasks].sort((a, b) => {
    const g = GROUP_PRIORITY[a.group] - GROUP_PRIORITY[b.group];
    if (g !== 0) return g;
    return a.durationMin - b.durationMin;
  });
}

// Первый подходящий свободный интервал, куда влезает дело длительностью durationMin.
// Возвращает [start, end] или null.
export function findFreeWindow(blocks, durationMin) {
  const sorted = [...blocks].sort((a, b) => a.start - b.start);
  let cursor = 0;
  for (const b of sorted) {
    if (b.start - cursor >= durationMin) return [cursor, cursor + durationMin];
    cursor = Math.max(cursor, b.end);
  }
  if (MINUTES_IN_DAY - cursor >= durationMin) return [cursor, cursor + durationMin];
  return null;
}

/**
 * Собирает план дня.
 * @param {string} date 'YYYY-MM-DD'
 * @param {Array<{start:number,end:number,label:string}>} routines рутины из практик сфер
 * @param {Array<Task>} tasks дела со статусом 'todo'
 * @returns {{ date: string, blocks: PlanBlock[] }}
 */
export function buildDay(date, routines, tasks) {
  const blocks = [];

  for (const r of routines) {
    if (r.end <= r.start) {
      // практика через полночь (например, сон 23:00–07:00) — два блока
      blocks.push(new PlanBlock({ start: r.start, end: MINUTES_IN_DAY, kind: 'routine', label: r.label }));
      blocks.push(new PlanBlock({ start: 0, end: r.end, kind: 'routine', label: r.label }));
    } else {
      blocks.push(new PlanBlock({ start: r.start, end: r.end, kind: 'routine', label: r.label }));
    }
  }

  // Жадная упаковка: кандидаты по приоритету группы и длительности, каждый — в первое свободное окно
  const candidates = sortCandidates(tasks);
  const placedIds = new Set();

  for (const task of candidates) {
    const window = findFreeWindow(blocks, task.durationMin);
    if (window) {
      blocks.push(new PlanBlock({ start: window[0], end: window[1], kind: 'task', taskId: task.id, label: task.title }));
      placedIds.add(task.id);
    } else {
      task.status = 'postponed'; // не влезло — наглядно «на потом»
    }
  }

  blocks.sort((a, b) => a.start - b.start);
  return { date, blocks, postponed: candidates.filter((t) => !placedIds.has(t.id)).map((t) => t.id) };
}

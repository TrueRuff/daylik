// Аналитика дня: сводка по плану/факту/свободному времени поверх готовых алгоритмов.

import { computeFreeWindows, practicesToBlocks } from './dayPlan.js';
import { practiceAppliesOn, weekdayOf } from './schedule.js';

const h = (min) => `${Math.floor(min / 60)}ч ${String(min % 60).padStart(2, '0')}м`;

/**
 * Сводка дня.
 * @param {string} date 'YYYY-MM-DD'
 * @param {Array<Task>} todo дела со статусом todo
 * @param {Array<Task>} done завершённые
 * @param {Array<Practice>} practices практики (фильтруются по дню недели)
 */
export function dayStats(date, todo, done, practices) {
  const wd = weekdayOf(date);
  const routines = practicesToBlocks(practices.filter((p) => practiceAppliesOn(p, wd)));

  const scheduled = todo.filter((x) => x.scheduledDate === date && x.scheduledStart != null);
  const blocks = [
    ...routines,
    ...scheduled.map((x) => ({ start: x.scheduledStart, end: x.scheduledStart + x.durationMin })),
  ];
  const freeMin = computeFreeWindows(blocks).reduce((s, w) => s + (w.end - w.start), 0);

  const plannedMin = scheduled.reduce((s, x) => s + x.durationMin, 0);
  const doneMin = done.reduce((s, x) => s + x.durationMin, 0);
  // перегруз — только сегодняшняя гора: бездатные и «сегодня без времени»;
  // отложенные на завтра и хвосты прошлых дней сюда не входят
  const today = todo.filter((x) => !x.scheduledDate || (x.scheduledDate === date && x.scheduledStart == null));
  const remainingMin = today.reduce((s, x) => s + x.durationMin, 0);
  const overloadMin = Math.max(0, remainingMin - freeMin);

  return {
    plannedMin,
    doneMin,
    doneCount: done.length,
    freeMin,
    overloadMin,
    summary: `${plannedMin ? `план ${h(plannedMin)} · ` : ''}сделано ${h(doneMin)} · свободно ${h(freeMin)}`,
  };
}

// повторяющиеся дела: расчёт следующего вхождения по repeatRule.
// repeatRule: null | 'daily' | 'weekly' | 'every:N' (каждые N дней).

import { addDays } from './schedule.js';

const EVERY_RE = /^every:(\d+)$/;

// следующая дата 'YYYY-MM-DD' для повтора от базовой даты
export function nextDate(repeatRule, fromDate) {
  const daily = EVERY_RE.exec(repeatRule);
  if (repeatRule === 'daily') return addDays(fromDate, 1);
  if (repeatRule === 'weekly') return addDays(fromDate, 7);
  if (daily && Number(daily[1]) > 0) return addDays(fromDate, Number(daily[1]));
  return null; // не повторяется или неизвестный формат
}

export function isRepeatRule(v) {
  return v === null || v === 'daily' || v === 'weekly' || (typeof v === 'string' && EVERY_RE.test(v));
}

/**
 * следующее вхождение дела после завершения.
 * возвращает патч для новой задачи-вхождения или null, если дело не повторяется.
 */
export function nextOccurrence(task) {
  if (!task.repeatRule || !isRepeatRule(task.repeatRule)) return null;
  const base = task.scheduledDate || null;
  const date = nextDate(task.repeatRule, base || todayLocal());
  if (!date) return null;
  return {
    scheduledDate: task.scheduledDate != null ? date : null, // встречу в расписании переносим, свободную оставляем свободной
    scheduledStart: task.scheduledStart,
  };
}

function todayLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

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

// Уровень энергии пользователя меняет стратегию подбора дел:
// low — уставшему нужны лёгкие: первыми короткие (<=30 мин), затем важность группы;
// high — на подъёме берём большие дела: внутри группы длинные вперёд.
const LIGHT_MAX = 30;

export function adaptiveSort(tasks, energy) {
  if (energy === 'low') {
    return [...tasks].sort((a, b) => {
      const la = a.durationMin <= LIGHT_MAX ? 0 : 1;
      const lb = b.durationMin <= LIGHT_MAX ? 0 : 1;
      if (la !== lb) return la - lb;
      const g = GROUP_PRIORITY[a.group] - GROUP_PRIORITY[b.group];
      if (g !== 0) return g;
      return a.durationMin - b.durationMin;
    });
  }
  if (energy === 'high') {
    return [...tasks].sort((a, b) => {
      const g = GROUP_PRIORITY[a.group] - GROUP_PRIORITY[b.group];
      if (g !== 0) return g;
      return b.durationMin - a.durationMin;
    });
  }
  return sortCandidates(tasks);
}

// Сколько дел автоукладка ставит за раз: уставшему — не больше трёх,
// остальное подождёт и не давит
export function autoPlaceLimit(energy) {
  return energy === 'low' ? 3 : Infinity;
}

/**
 * Одна рекомендация «что сейчас»: свободное окно, содержащее текущую минуту
 * (или ближайшее впереди), и первое подходящее по длительности и энергии дело.
 */
export function recommendNow(windows, tasks, nowMin, energy) {
  const win = windows.find((w) => nowMin >= w.start && nowMin < w.end)
    || windows.find((w) => w.start > nowMin);
  if (!win) return null;

  const from = Math.max(win.start, nowMin);
  const available = win.end - from;
  const fitting = adaptiveSort(tasks.filter((x) => x.durationMin <= available), energy);
  const task = fitting[0];
  if (!task) return null;

  const start = Math.ceil(from / 5) * 5; // к пятиминутной сетке
  return { task, start, end: start + task.durationMin, window: win };
}

// Практики дня в блоки занятости; через полночь (end <= start) разбиваются на два
export function practicesToBlocks(practices) {
  const out = [];
  for (const p of practices) {
    if (p.end <= p.start) {
      out.push({ start: p.start, end: MINUTES_IN_DAY, label: p.title });
      out.push({ start: 0, end: p.end, label: p.title });
    } else {
      out.push({ start: p.start, end: p.end, label: p.title });
    }
  }
  return out;
}

// Все свободные промежутки между блоками
export function computeFreeWindows(blocks) {
  const sorted = [...blocks].sort((a, b) => a.start - b.start);
  const out = [];
  let cursor = 0;
  for (const b of sorted) {
    if (b.start - cursor > 0) out.push({ start: cursor, end: b.start });
    cursor = Math.max(cursor, b.end);
  }
  if (MINUTES_IN_DAY - cursor > 0) out.push({ start: cursor, end: MINUTES_IN_DAY });
  return out;
}

// Первое свободное окно, куда влезает дело длительностью durationMin: [start, end] или null
export function findFreeWindow(blocks, durationMin) {
  const w = computeFreeWindows(blocks).find((x) => x.end - x.start >= durationMin);
  return w ? [w.start, w.start + durationMin] : null;
}

// Можно ли поставить дело на start: без пересечений с занятостью и в пределах дня.
// ignoreTaskId — блок самого перетаскиваемого дела (себя не считаем)
export function canPlaceAt(occupancy, start, durationMin, ignoreTaskId = null) {
  const end = start + durationMin;
  if (start < 0 || end > MINUTES_IN_DAY) return false;
  return occupancy.every((b) => {
    if (ignoreTaskId != null && b.taskId === ignoreTaskId) return true;
    return end <= b.start || start >= b.end;
  });
}

/**
 * Собирает план дня.
 * @param {string} date 'YYYY-MM-DD'
 * @param {Array<{start:number,end:number,label:string}>} routines рутины из практик
 * @param {Array<Task>} tasks дела со статусом 'todo'
 * @param {Object} [opts] { sort } — стратегия сортировки кандидатов (adaptiveSort)
 * @returns {{ date: string, blocks: PlanBlock[] }}
 */
export function buildDay(date, routines, tasks, { sort = sortCandidates } = {}) {
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

  // Жадная упаковка: кандидаты по стратегии сортировки, каждый — в первое свободное окно
  const candidates = sort(tasks);
  const placedIds = new Set();

  for (const task of candidates) {
    const window = findFreeWindow(blocks, task.durationMin);
    if (window) {
      blocks.push(new PlanBlock({ start: window[0], end: window[1], kind: 'task', taskId: task.id, label: task.title }));
      placedIds.add(task.id);
    }
  }

  blocks.sort((a, b) => a.start - b.start);
  return { date, blocks, postponed: candidates.filter((t) => !placedIds.has(t.id)).map((t) => t.id) };
}

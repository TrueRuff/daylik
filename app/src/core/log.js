// Журнал событий: уровни debug/info/warn/error, кольцевой буфер в памяти
// и асинхронный sink в IndexedDB (ставится при инициализации хранения).
// Журналирование не должно ломать приложение: любые ошибки sink глотаются.

export const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };
const MEMORY_CAP = 500;

let buffer = [];
let sink = null; // async (entry) => void

function write(level, event, data) {
  const entry = { time: Date.now(), level, event, data: data ?? null };
  buffer.push(entry);
  if (buffer.length > MEMORY_CAP) buffer.shift();

  const fn = level === 'debug' ? 'log' : level;
  console[fn](`[${level}] ${event}`, data ?? '');

  if (sink) {
    try {
      sink(entry)?.catch(() => {});
    } catch {
      // журнал не ломает приложение
    }
  }
  return entry;
}

export const log = {
  debug: (event, data) => write('debug', event, data),
  info: (event, data) => write('info', event, data),
  warn: (event, data) => write('warn', event, data),
  error: (event, data) => write('error', event, data),
};

export function setSink(fn) {
  sink = fn;
}

// Последние записи: сначала новые, фильтр по минимальному уровню
export function getRecent({ limit = 200, minLevel = 'debug' } = {}) {
  const min = LEVELS[minLevel] ?? 0;
  return buffer
    .filter((x) => LEVELS[x.level] >= min)
    .slice(-limit)
    .reverse();
}

export function clearMemory() {
  buffer = [];
}

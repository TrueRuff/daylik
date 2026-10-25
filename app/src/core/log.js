// Журнал событий: уровни debug/info/warn/error, дублирование в консоль и
// асинхронный sink в IndexedDB (ставится при инициализации хранения).
// Журналирование не должно ломать приложение: ошибки sink глотаются.

export const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };

let sink = null; // async (entry) => void

function write(level, event, data) {
  const entry = { time: Date.now(), level, event, data: data ?? null };
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

import { describe, it, expect } from 'vitest';
import { log, getRecent, setSink, clearMemory, LEVELS } from '../src/core/log.js';

describe('log — журнал событий', () => {
  it('уровни имеют возрастающий порядок важности', () => {
    expect(LEVELS.debug).toBeLessThan(LEVELS.info);
    expect(LEVELS.info).toBeLessThan(LEVELS.warn);
    expect(LEVELS.warn).toBeLessThan(LEVELS.error);
  });

  it('запись содержит время, уровень, событие и данные', () => {
    clearMemory();
    log.info('test.event', { a: 1 });
    const [entry] = getRecent();
    expect(entry.level).toBe('info');
    expect(entry.event).toBe('test.event');
    expect(entry.data).toEqual({ a: 1 });
    expect(entry.time).toBeGreaterThan(0);
  });

  it('getRecent отдаёт сначала новые и фильтрует по уровню', () => {
    clearMemory();
    log.debug('one');
    log.warn('two');
    log.error('three');

    expect(getRecent().map((x) => x.event)).toEqual(['three', 'two', 'one']);
    expect(getRecent({ minLevel: 'warn' }).map((x) => x.event)).toEqual(['three', 'two']);
  });

  it('кольцевой буфер ограничен 500 записями', () => {
    clearMemory();
    for (let i = 0; i < 520; i++) log.debug(`e${i}`);
    const all = getRecent({ limit: 1000 });
    expect(all).toHaveLength(500);
    expect(all[0].event).toBe('e519'); // самая новая
  });

  it('падение sink не выбрасывает наружу', () => {
    setSink(() => { throw new Error('sink down'); });
    expect(() => log.info('still.works')).not.toThrow();
    expect(getRecent()[0].event).toBe('still.works');
    setSink(null);
  });

  it('sink получает записи асинхронно', async () => {
    const seen = [];
    setSink(async (entry) => seen.push(entry));
    log.warn('async.event');
    await new Promise((r) => setTimeout(r, 0));
    expect(seen.map((x) => x.event)).toEqual(['async.event']);
    setSink(null);
  });
});

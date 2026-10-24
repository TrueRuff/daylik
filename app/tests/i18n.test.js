import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { t, getLang, setLang, DICTS } from '../src/core/i18n.js';

describe('i18n — локализация', () => {
  beforeEach(() => setLang('ru'));
  afterEach(() => setLang('ru'));

  it('словари ru и en содержат одинаковый набор ключей', () => {
    const ru = Object.keys(DICTS.ru).sort();
    const en = Object.keys(DICTS.en).sort();
    expect(en).toEqual(ru);
  });

  it('t отдаёт перевод текущего языка и переключается', () => {
    expect(getLang()).toBe('ru');
    expect(t('nav.day')).toBe('День');
    setLang('en');
    expect(t('nav.day')).toBe('Day');
  });

  it('подстановка параметров {name}', () => {
    setLang('en');
    expect(t('task.saved', { title: 'Cook', group: 'Н' })).toBe('Task "Cook" saved, group Н.');
  });

  it('неизвестный ключ возвращается сам ключом', () => {
    expect(t('no.such.key')).toBe('no.such.key');
  });

  it('setLang игнорирует неизвестный язык', () => {
    setLang('de');
    expect(getLang()).toBe('ru');
  });

  it('массив dayNames доступен как обычный ключ', () => {
    setLang('en');
    expect(t('dayNames')[0]).toBe('Mo');
  });
});

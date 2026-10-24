// Локализация: словари ru/en, выбор языка сохраняется в localStorage.
// t(key, params) — перевод с подстановкой {параметров}; отсутствующий ключ
// отдаётся сам ключом (невозможно потерять кнопку из-за опечатки в словаре).

// экспортируется для теста полноты словарей (ru и en должны совпадать по ключам)
export const DICTS = {
  ru: {
    'app.name': 'Дейлик',
    'nav.day': 'День',
    'nav.spheres': 'Сферы',
    'nav.input': 'Ввод',
    'nav.log': 'Журнал',
    'bell.enable': 'Включить напоминания',

    'day.title': 'Сегодня',
    'day.autoPlace': 'Разложить автоматически',
    'day.tasks': 'Дела',
    'day.postponed': 'На потом',
    'day.done': 'Сделано',
    'day.noTasks': 'нет свободных дел',
    'day.fitsAll': 'всё помещается',
    'day.nothingDone': 'пока ничего',
    'day.window': 'Окно',
    'picker.noFit': 'Подходящих дел нет — все длиннее окна.',

    'common.close': 'Закрыть',
    'common.title': 'Название',
    'common.save': 'Сохранить',
    'common.delete': 'Удалить',
    'common.group': 'Группа',
    'common.sphere': 'Сфера',
    'common.start': 'Начало',
    'common.end': 'Конец',
    'task.edit': 'Редактирование дела',
    'task.duration': 'Длительность, мин',
    'task.minutes': 'мин',
    'task.noSphere': 'без сферы',
    'task.remind': 'Напомнить',
    'task.remindOptional': 'Напомнить (необязательно)',
    'task.deleteBtn': 'Удалить дело',
    'task.saved': 'Дело «{title}» сохранено, группа {group}.',
    'task.willRemind': 'Напомню в срок.',
    'task.putFirst': 'Поставить в первое подходящее окно',
    'task.removeFromDay': 'Клик — убрать из дня',
    'task.markDone': 'Отметить сделанным',
    'task.editTip': 'Редактировать',
    'task.return': 'Вернуть в дела',
    'task.putInto': 'Положить дело в окно {a}–{b}',

    'spheres.title': 'Сферы',
    'spheres.intro': 'Сфера — направление жизни, а не разовая задача: у неё краткое и полное описание, к ней крепятся регулярные практики и дела.',
    'spheres.empty': 'пусто',
    'spheres.new': 'Новая сфера',
    'spheres.briefLabel': 'Кратко (перечитывать каждый день)',
    'spheres.detailsLabel': 'Полностью (методы, рутина)',
    'spheres.deleteBtn': 'Удалить сферу',
    'spheres.practices': 'Практики',
    'spheres.noPractices': 'практик пока нет',
    'spheres.newPractice': 'Новая практика',
    'spheres.addPractice': 'Добавить практику',
    'spheres.saved': 'Сфера «{title}» сохранена. Описание можно заполнить в разделе «Сферы».',
    'routine.saved': 'Практика «{title}» сохранена, она появится в расписании дня.',

    'data.title': 'Данные',
    'data.exportJson': 'Экспорт JSON',
    'data.exportBin': 'Резервная копия (.daylik)',
    'data.import': 'Импорт',
    'data.saved': 'Файл сохранён.',
    'data.unreadable': 'Не удалось прочитать файл: формат не распознан.',
    'data.imported': 'Данные импортированы.',
    'data.confirm': 'Файл: {s} сфер, {t} дел, {p} практик.\nТекущие данные будут заменены. Продолжить?',

    'input.title': 'Ввод',
    'input.intro': 'Опиши задуманное своими словами — приложение предложит тип и группу, остаётся подтвердить.',
    'input.placeholder': 'например: хочу научиться готовить',
    'input.parse': 'Разобрать',
    'kind.sphere': 'Сфера',
    'kind.task': 'Дело',
    'kind.routine': 'Практика',
    'provider.rules': 'разобрано по словарю',
    'provider.llm': 'разобрано через API',
    'provider.llmFailed': 'по словарю — API недоступно',

    'log.title': 'Журнал',
    'log.level': 'Уровень',
    'log.event': 'Событие',
    'log.time': 'Время',
    'log.clear': 'Очистить',
    'log.empty': 'записей нет',
    'level.debug': 'отладка',
    'level.info': 'инфо',
    'level.warn': 'предупреждение',
    'level.error': 'ошибка',

    'group.Н': 'Необходимо',
    'group.Ж': 'Желательно',
    'group.П': 'Полезно',
    dayNames: ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'],
    'schedule.daily': 'ежедневно',
  },
  en: {
    'app.name': 'Daylik',
    'nav.day': 'Day',
    'nav.spheres': 'Spheres',
    'nav.input': 'Input',
    'nav.log': 'Log',
    'bell.enable': 'Enable notifications',

    'day.title': 'Today',
    'day.autoPlace': 'Auto-arrange',
    'day.tasks': 'Tasks',
    'day.postponed': 'Later',
    'day.done': 'Done',
    'day.noTasks': 'no free tasks',
    'day.fitsAll': 'everything fits',
    'day.nothingDone': 'nothing yet',
    'day.window': 'Window',
    'picker.noFit': 'No fitting tasks — all longer than the window.',

    'common.close': 'Close',
    'common.title': 'Title',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.group': 'Group',
    'common.sphere': 'Sphere',
    'common.start': 'Start',
    'common.end': 'End',
    'task.edit': 'Edit task',
    'task.duration': 'Duration, min',
    'task.minutes': 'min',
    'task.noSphere': 'no sphere',
    'task.remind': 'Remind',
    'task.remindOptional': 'Remind (optional)',
    'task.deleteBtn': 'Delete task',
    'task.saved': 'Task "{title}" saved, group {group}.',
    'task.willRemind': 'Will remind on time.',
    'task.putFirst': 'Put into the first fitting window',
    'task.removeFromDay': 'Click — remove from day',
    'task.markDone': 'Mark done',
    'task.editTip': 'Edit',
    'task.return': 'Return to tasks',
    'task.putInto': 'Put a task into {a}–{b}',

    'spheres.title': 'Spheres',
    'spheres.intro': 'A sphere is a life direction, not a one-off task: it has a brief and a full description, practices and tasks attach to it.',
    'spheres.empty': 'empty',
    'spheres.new': 'New sphere',
    'spheres.briefLabel': 'Brief (reread daily)',
    'spheres.detailsLabel': 'Full (methods, routine)',
    'spheres.deleteBtn': 'Delete sphere',
    'spheres.practices': 'Practices',
    'spheres.noPractices': 'no practices yet',
    'spheres.newPractice': 'New practice',
    'spheres.addPractice': 'Add practice',
    'spheres.saved': 'Sphere "{title}" saved. Fill in the description in the Spheres section.',
    'routine.saved': 'Practice "{title}" saved, it will appear in the day schedule.',

    'data.title': 'Data',
    'data.exportJson': 'Export JSON',
    'data.exportBin': 'Backup (.daylik)',
    'data.import': 'Import',
    'data.saved': 'File saved.',
    'data.unreadable': 'Could not read the file: unknown format.',
    'data.imported': 'Data imported.',
    'data.confirm': 'File: {s} spheres, {t} tasks, {p} practices.\nCurrent data will be replaced. Continue?',

    'input.title': 'Input',
    'input.intro': 'Describe what you have in mind in your own words — the app will suggest a type and a group, you just confirm.',
    'input.placeholder': 'e.g.: I want to learn cooking',
    'input.parse': 'Parse',
    'kind.sphere': 'Sphere',
    'kind.task': 'Task',
    'kind.routine': 'Practice',
    'provider.rules': 'parsed by rules',
    'provider.llm': 'parsed via API',
    'provider.llmFailed': 'by rules — API unavailable',

    'log.title': 'Log',
    'log.level': 'Level',
    'log.event': 'Event',
    'log.time': 'Time',
    'log.clear': 'Clear',
    'log.empty': 'no entries',
    'level.debug': 'debug',
    'level.info': 'info',
    'level.warn': 'warning',
    'level.error': 'error',

    'group.Н': 'Necessary',
    'group.Ж': 'Desired',
    'group.П': 'Useful',
    dayNames: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
    'schedule.daily': 'daily',
  },
};

const PARAM_RE = /\{(\w+)\}/g;
const LANG_KEY = 'daylik-lang';

let current = 'ru';
try {
  const saved = localStorage.getItem(LANG_KEY);
  if (saved && DICTS[saved]) current = saved;
} catch {
  // localStorage недоступен — язык по умолчанию
}

const listeners = new Set();

export function getLang() {
  return current;
}

export function setLang(lang) {
  if (!DICTS[lang] || lang === current) return;
  current = lang;
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    // сохранение не критично
  }
  if (typeof document !== 'undefined') document.documentElement.lang = lang;
  for (const fn of listeners) fn(lang);
}

export function onChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function t(key, params) {
  const val = DICTS[current]?.[key] ?? DICTS.ru[key] ?? key;
  if (typeof val === 'string' && params) {
    return val.replace(PARAM_RE, (_, name) => params[name] ?? '');
  }
  return val;
}

// Статические узлы index.html: data-i18n (текст), data-i18n-title, data-i18n-placeholder
export function applyStatic(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  root.querySelectorAll('[data-i18n-title]').forEach((el) => {
    el.title = t(el.dataset.i18nTitle);
  });
  root.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
}

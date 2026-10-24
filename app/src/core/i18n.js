// Локализация: словари ru/en, выбор языка сохраняется в localStorage.
// t(key, params) — перевод с подстановкой {параметров}; отсутствующий ключ
// отдаётся сам ключом (невозможно потерять кнопку из-за опечатки в словаре).

// экспортируется для теста полноты словарей (ru и en должны совпадать по ключам)
export const DICTS = {
  ru: {
    'app.name': 'Дейлик',
    'nav.day': 'День',
    'nav.spheres': 'Направления',
    'nav.input': 'Ввод',
    'nav.log': 'Журнал',
    'bell.enable': 'Включить напоминания',

    'day.title': 'Сегодня',
    'day.autoPlace': 'Разложить автоматически',
    'day.tasks': 'Дела',
    'day.doneCount': 'Сделано: {n}',
    'day.noTasks': 'нет свободных дел',
    'day.nothingDone': 'пока ничего',
    'day.window': 'Окно',
    'day.notFit': 'не помещается сегодня',
    'day.emptyHint': 'Свободный день. Опиши дела на вкладке «Ввод» — и разложи их здесь',
    'day.overload': 'Не помещается: ещё {time} — убери или перенеси лишнее',
    'day.overdue': 'Хвосты с прошлых дней: {n}',
    'day.overdueReturn': 'Вернуть в дела',
    'day.whatNow': 'Что сейчас?',
    'day.whatNowPlace': 'Поставить',
    'day.whatNowEmpty': 'Сейчас нет подходящего окна или дел — отдохни',
    'day.whatNowHint': 'Свободно до {b}: влезает «{title}» ({dur} мин)',
    'day.quickAdd': 'быстрое дело: «помыть пол на 20 минут» и Enter',
    'day.quickKindHint': 'Практики и направления создавай на вкладке «Ввод»',
    'task.tomorrow': 'Отложить на завтра',
    'task.breakdown': 'Разбить на шаги',
    'task.breakdownFailed': 'Не получилось разбить — API недоступно, попробуй ещё раз',
    'task.brokenInto': 'Разбито на {n} шагов',
    'day.addRoutine': '+ Блок дня',
    'routine.edit': 'Блок дня',
    'routine.hint': 'Регулярная необходимость дня: сон, еда, работа. Повторяется по выбранным дням недели и не относится к направлениям.',
    'energy.label': 'Силы',
    'energy.low': 'мало',
    'energy.normal': 'норм',
    'energy.high': 'много',
    'picker.noFit': 'Подходящих дел нет — все длиннее окна.',

    'common.type': 'Тип',
    'type.once': 'Разовое',
    'type.recurring': 'Регулярное',
    'type.sphere': 'Направление',
    'repeat.label': 'Повторять',
    'repeat.none': 'не повторяется',
    'repeat.daily': 'каждый день',
    'repeat.weekly': 'каждую неделю',
    'repeat.every': 'каждые N дней',
    'repeat.everyDays': 'N, дней',

    'common.close': 'Закрыть',
    'common.title': 'Название',
    'common.save': 'Сохранить',
    'common.delete': 'Удалить',
    'common.group': 'Группа',
    'common.sphere': 'Направление',
    'common.start': 'Начало',
    'common.end': 'Конец',
    'task.edit': 'Редактирование дела',
    'task.duration': 'Длительность, мин',
    'task.minutes': 'мин',
    'task.noSphere': 'без направления',
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
    'task.dropGroup': 'Перетащи дело на группу, чтобы сменить её',

    'spheres.title': 'Направления',
    'spheres.intro': 'Направление — область твоей жизни: сон, учёба, здоровье. У него есть короткое напоминание себе и полное описание, к нему крепятся регулярные практики и дела.',
    'spheres.legend': 'Н — быт и насущное · Ж — желания и отдых · П — развитие и практики',
    'spheres.empty': 'пусто',
    'spheres.examples': 'Быстрый старт — создать:',
    'spheres.new': 'Новое направление',
    'spheres.briefLabel': 'Кратко (перечитывать каждый день)',
    'spheres.detailsLabel': 'Полностью (методы, рутина)',
    'spheres.deleteBtn': 'Удалить направление',
    'spheres.practices': 'Практики',
    'spheres.noPractices': 'практик пока нет',
    'spheres.freePractices': 'Регулярные без направления',
    'spheres.newPractice': 'Новая практика',
    'spheres.addPractice': 'Добавить практику',
    'spheres.saved': 'Направление «{title}» сохранено. Описание можно заполнить в разделе «Направления».',
    'routine.saved': 'Практика «{title}» сохранена, она появится в расписании дня.',
    'spheres.dragHint': 'Карточку можно перетащить в другую колонку',

    'data.title': 'Данные',
    'data.exportJson': 'Экспорт JSON',
    'data.exportBin': 'Резервная копия (.daylik)',
    'data.exportIcs': 'Календарь (.ics)',
    'data.import': 'Импорт',
    'data.saved': 'Файл сохранён.',
    'data.unreadable': 'Не удалось прочитать файл: формат не распознан.',
    'data.imported': 'Данные импортированы.',
    'data.confirm': 'Файл: {s} сфер, {t} дел, {p} практик.\nТекущие данные будут заменены. Продолжить?',

    'input.title': 'Ввод',
    'input.intro': 'Опиши задуманное своими словами — приложение предложит тип и группу, остаётся подтвердить.',
    'input.placeholder': 'например: хочу научиться готовить',
    'input.parse': 'Разобрать',
    'kind.sphere': 'Направление',
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
    'nav.spheres': 'Areas',
    'nav.input': 'Input',
    'nav.log': 'Log',
    'bell.enable': 'Enable notifications',

    'day.title': 'Today',
    'day.autoPlace': 'Auto-arrange',
    'day.tasks': 'Tasks',
    'day.doneCount': 'Done: {n}',
    'day.noTasks': 'no free tasks',
    'day.nothingDone': 'nothing yet',
    'day.window': 'Window',
    'day.notFit': "doesn't fit today",
    'day.emptyHint': 'A free day. Describe tasks on the Input tab — and arrange them here',
    'day.overload': "Doesn't fit: {time} more — remove or move the excess",
    'day.overdue': 'Leftovers from past days: {n}',
    'day.overdueReturn': 'Return to tasks',
    'day.whatNow': "What now?",
    'day.whatNowPlace': 'Place',
    'day.whatNowEmpty': 'No fitting window or tasks right now — rest',
    'day.whatNowHint': 'Free until {b}: "{title}" fits ({dur} min)',
    'day.quickAdd': 'quick task: "wash the floor 20 min" and Enter',
    'day.quickKindHint': 'Create practices and areas on the Input tab',
    'task.tomorrow': 'Postpone to tomorrow',
    'task.breakdown': 'Break into steps',
    'task.breakdownFailed': 'Could not break down — API unavailable, try again',
    'task.brokenInto': 'Split into {n} steps',
    'day.addRoutine': '+ Day block',
    'routine.edit': 'Day block',
    'routine.hint': 'A recurring daily necessity: sleep, meals, work. Repeats on selected weekdays and is not tied to areas.',
    'energy.label': 'Energy',
    'energy.low': 'low',
    'energy.normal': 'ok',
    'energy.high': 'high',
    'picker.noFit': 'No fitting tasks — all longer than the window.',

    'common.type': 'Type',
    'type.once': 'One-off',
    'type.recurring': 'Recurring',
    'type.sphere': 'Area',
    'repeat.label': 'Repeat',
    'repeat.none': 'never',
    'repeat.daily': 'every day',
    'repeat.weekly': 'every week',
    'repeat.every': 'every N days',
    'repeat.everyDays': 'N, days',

    'common.close': 'Close',
    'common.title': 'Title',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.group': 'Group',
    'common.sphere': 'Area',
    'common.start': 'Start',
    'common.end': 'End',
    'task.edit': 'Edit task',
    'task.duration': 'Duration, min',
    'task.minutes': 'min',
    'task.noSphere': 'no area',
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
    'task.dropGroup': 'Drop the task on a group to change it',

    'spheres.title': 'Areas',
    'spheres.intro': 'An area is a part of your life: sleep, studies, health. It has a short daily reminder and a full description; recurring practices and tasks attach to it.',
    'spheres.legend': 'N — chores and essentials · D — desires and rest · U — growth and practices',
    'spheres.empty': 'empty',
    'spheres.examples': 'Quick start — create:',
    'spheres.new': 'New area',
    'spheres.briefLabel': 'Brief (reread daily)',
    'spheres.detailsLabel': 'Full (methods, routine)',
    'spheres.deleteBtn': 'Delete area',
    'spheres.practices': 'Practices',
    'spheres.noPractices': 'no practices yet',
    'spheres.freePractices': 'Recurring without an area',
    'spheres.newPractice': 'New practice',
    'spheres.addPractice': 'Add practice',
    'spheres.saved': 'Area "{title}" saved. Fill in the description in the Areas section.',
    'routine.saved': 'Practice "{title}" saved, it will appear in the day schedule.',
    'spheres.dragHint': 'Drag a card to another column to change its group',

    'data.title': 'Data',
    'data.exportJson': 'Export JSON',
    'data.exportBin': 'Backup (.daylik)',
    'data.exportIcs': 'Calendar (.ics)',
    'data.import': 'Import',
    'data.saved': 'File saved.',
    'data.unreadable': 'Could not read the file: unknown format.',
    'data.imported': 'Data imported.',
    'data.confirm': 'File: {s} spheres, {t} tasks, {p} practices.\nCurrent data will be replaced. Continue?',

    'input.title': 'Input',
    'input.intro': 'Describe what you have in mind in your own words — the app will suggest a type and a group, you just confirm.',
    'input.placeholder': 'e.g.: I want to learn cooking',
    'input.parse': 'Parse',
    'kind.sphere': 'Area',
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

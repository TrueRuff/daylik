// Локализация: словари ru/en, выбор языка сохраняется в localStorage.
// t(key, params) — перевод с подстановкой {параметров}; отсутствующий ключ
// отдаётся сам ключом (невозможно потерять кнопку из-за опечатки в словаре).

// экспортируется для теста полноты словарей (ru и en должны совпадать по ключам)
export const DICTS = {
  ru: {
    'app.name': 'Дейлик',
    'nav.day': 'День',
    'nav.calendar': 'Календарь',
    'nav.spheres': 'Направления',
    'nav.log': 'Журнал',
    'bell.enable': 'Включить напоминания',

    'auth.enter': 'Вход',
    'auth.register': 'Регистрация',
    'auth.loginLabel': 'Логин',
    'auth.passwordLabel': 'Пароль',
    'auth.loginBtn': 'Войти',
    'auth.registerBtn': 'Создать аккаунт',
    'auth.toRegister': 'Нет аккаунта? Создать',
    'auth.toLogin': 'Уже есть аккаунт? Войти',
    'auth.wrong': 'Неверный логин или пароль',
    'auth.taken': 'Такой логин уже занят',
    'auth.empty': 'Заполни логин и пароль',
    'auth.short': 'Пароль — минимум 3 символа',
    'auth.logout': 'Выйти',
    'theme.toggle': 'Сменить тему',

    'day.title': 'Сегодня',
    'day.autoPlace': 'Разложить автоматически',
    'day.tasks': 'Дела',
    'day.doneCount': 'Сделано: {n}',
    'day.noTasks': 'нет свободных дел',
    'day.nothingDone': 'пока ничего',
    'day.notFit': 'длиннее окон — поставится с перекрытием',
    'day.emptyHint': 'Свободный день. Добавь дело в поле выше — и оно появится в расписании',
    'day.overload': 'Не помещается: ещё {time} — убери или перенеси лишнее',
    'day.overdue': 'Хвосты с прошлых дней: {n}',
    'day.overdueReturn': 'Вернуть в дела',
    'day.whatNow': 'Что сейчас?',
    'day.whatNowPlace': 'Поставить',
    'day.whatNowEmpty': 'Сейчас нет подходящего окна или дел — отдохни',
    'day.whatNowHint': 'Свободно до {b}: влезает «{title}» ({dur} мин)',
    'day.quickAdd': 'быстрое дело: «помыть пол на 20 минут» и Enter',
    'day.quickKindHint': 'Регулярные задачи и направления добавляй через кнопку «+»',
    'welcome.title': 'Как пользоваться Дейликом',
    'welcome.step1': 'Пиши дела своими словами в поле ниже — приложение само определит длительность и подберёт время.',
    'welcome.step2': 'Не знаешь, за что взяться? Нажми «Что сейчас?» — подскажу одно дело под твои силы.',
    'welcome.step3': 'Рутины и направления — потом, когда захочешь: без них всё работает.',
    'welcome.ok': 'Понятно, поехали',
    'task.tomorrow': 'Отложить на завтра',
    'task.breakdown': 'Разбить на шаги',
    'task.breakdownFailed': 'Не получилось разбить — API недоступно, попробуй ещё раз',
    'task.brokenInto': 'Разбито на {n} шагов',
    'day.addRoutine': '+ Блок дня',
    'task.startTime': 'Время начала (сегодня)',
    'task.startTimeHint': 'оставь пустым — дело вернётся в колонку дел',
    'routine.edit': 'Блок дня',
    'routine.hint': 'Регулярная необходимость дня: сон, еда, работа. Повторяется по выбранным дням недели и не относится к направлениям.',
    'energy.label': 'Силы',
    'energy.low': 'мало',
    'energy.normal': 'норм',
    'energy.high': 'много',

    'common.type': 'Тип',
    'type.task': 'Разовое',
    'type.routine': 'Регулярное',
    'type.sphere': 'Направление',
    'type.hint.task': 'Разовое — сделать один раз и забыть: «помыть пол», «позвонить».',
    'type.hint.routine': 'Регулярное — повторяется по расписанию и занимает время в дне: сон, учёба, тренировки.',
    'type.hint.sphere': 'Направление — область жизни (не дело!): внутри собираются связанные дела и регулярные задачи.',
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
    'task.putOverlap': 'Поставить в первое окно (с перекрытием)',
    'task.markDone': 'Отметить сделанным',
    'task.editTip': 'Редактировать',
    'task.return': 'Вернуть в дела',
    'spheres.dragHint': 'Карточку можно перетащить в другую колонку',

    'spheres.title': 'Направления',
    'spheres.intro': 'Направление — область твоей жизни: сон, учёба, здоровье. У него есть короткое напоминание себе и полное описание, к нему крепятся регулярные задачи и дела.',
    'spheres.legend': 'Н — быт и насущное · Ж — желания и отдых · П — развитие и задачи',
    'spheres.empty': 'пусто',
    'spheres.examples': 'Быстрый старт — создать:',
    'spheres.new': 'Новое направление',
    'spheres.briefLabel': 'Кратко (перечитывать каждый день)',
    'spheres.detailsLabel': 'Полностью (методы, рутина)',
    'spheres.deleteBtn': 'Удалить направление',
    'spheres.practices': 'Задачи',
    'spheres.noPractices': 'задач пока нет',
    'spheres.tasks': 'Дела этого направления',
    'spheres.noTasks': 'активных дел нет',
    'spheres.freePractices': 'Регулярные без направления',
    'spheres.newPractice': 'Новая задача',
    'spheres.addPractice': 'Добавить задачу',
    'spheres.saved': 'Направление «{title}» сохранено. Описание можно заполнить в разделе «Направления».',
    'routine.saved': 'Задача «{title}» сохранена, она появится в расписании дня.',
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

    'input.title': 'Добавить',
    'input.intro': 'Опиши задуманное своими словами — приложение предложит тип и группу, остаётся подтвердить.',
    'input.placeholder': 'например: хочу научиться готовить',
    'input.parse': 'Разобрать',
    'kind.sphere': 'Направление',
    'kind.task': 'Дело',
    'kind.routine': 'Задача',
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
    'nav.calendar': 'Calendar',
    'nav.spheres': 'Areas',
    'nav.log': 'Log',
    'bell.enable': 'Enable notifications',

    'auth.enter': 'Sign in',
    'auth.register': 'Sign up',
    'auth.loginLabel': 'Login',
    'auth.passwordLabel': 'Password',
    'auth.loginBtn': 'Sign in',
    'auth.registerBtn': 'Create account',
    'auth.toRegister': 'No account? Create one',
    'auth.toLogin': 'Have an account? Sign in',
    'auth.wrong': 'Wrong login or password',
    'auth.taken': 'This login is already taken',
    'auth.empty': 'Fill in login and password',
    'auth.short': 'Password must be at least 3 characters',
    'auth.logout': 'Sign out',
    'theme.toggle': 'Toggle theme',

    'day.title': 'Today',
    'day.autoPlace': 'Auto-arrange',
    'day.tasks': 'Tasks',
    'day.doneCount': 'Done: {n}',
    'day.noTasks': 'no free tasks',
    'day.nothingDone': 'nothing yet',
    "day.notFit": "doesn't fit — will be placed with overlap",
    'day.emptyHint': 'A free day. Add a task in the field above and it will appear in the schedule',
    'day.overload': "Doesn't fit: {time} more — remove or move the excess",
    'day.overdue': 'Leftovers from past days: {n}',
    'day.overdueReturn': 'Return to tasks',
    'day.whatNow': "What now?",
    'day.whatNowPlace': 'Place',
    'day.whatNowEmpty': 'No fitting window or tasks right now — rest',
    'day.whatNowHint': 'Free until {b}: "{title}" fits ({dur} min)',
    'day.quickAdd': 'quick task: "wash the floor 20 min" and Enter',
    'day.quickKindHint': 'Add recurring tasks and areas via the "+" button',
    'welcome.title': 'How Daylik works',
    'welcome.step1': 'Describe tasks in your own words in the field below — the app will estimate the time and find a slot.',
    'welcome.step2': "Don't know where to start? Tap \"What now?\" — I'll suggest one task to match your energy.",
    'welcome.step3': 'Routines and areas can wait — everything works without them.',
    'welcome.ok': "Got it, let's go",
    'task.tomorrow': 'Postpone to tomorrow',
    'task.breakdown': 'Break into steps',
    'task.breakdownFailed': 'Could not break down — API unavailable, try again',
    'task.brokenInto': 'Split into {n} steps',
    'day.addRoutine': '+ Day block',
    'task.startTime': 'Start time (today)',
    'task.startTimeHint': 'leave empty to return the task to the list',
    'routine.edit': 'Day block',
    'routine.hint': 'A recurring daily necessity: sleep, meals, work. Repeats on selected weekdays and is not tied to areas.',
    'energy.label': 'Energy',
    'energy.low': 'low',
    'energy.normal': 'ok',
    'energy.high': 'high',

    'common.type': 'Type',
    'type.task': 'One-off',
    'type.routine': 'Recurring',
    'type.sphere': 'Area',
    'type.hint.task': 'One-off — do it once and forget: "wash the floor", "call mom".',
    'type.hint.routine': 'Recurring — repeats on a schedule and takes time in your day: sleep, studies, workouts.',
    'type.hint.sphere': 'Area — a part of life (not a task!): related tasks and recurring tasks live inside it.',
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
    'task.putOverlap': 'Put into the first window (with overlap)',
    'task.markDone': 'Mark done',
    'task.editTip': 'Edit',
    'task.return': 'Return to tasks',

    'spheres.title': 'Areas',
    'spheres.intro': 'An area is a part of your life: sleep, studies, health. It has a short daily reminder and a full description; recurring tasks and to-dos attach to it.',
    'spheres.legend': 'N — chores and essentials · D — desires and rest · U — growth and tasks',
    'spheres.empty': 'empty',
    'spheres.examples': 'Quick start — create:',
    'spheres.new': 'New area',
    'spheres.briefLabel': 'Brief (reread daily)',
    'spheres.detailsLabel': 'Full (methods, routine)',
    'spheres.deleteBtn': 'Delete area',
    'spheres.practices': 'Tasks',
    'spheres.noPractices': 'no tasks yet',
    'spheres.tasks': 'Tasks in this area',
    'spheres.noTasks': 'no active tasks',
    'spheres.freePractices': 'Recurring without an area',
    'spheres.newPractice': 'New task',
    'spheres.addPractice': 'Add task',
    'spheres.saved': 'Area "{title}" saved. Fill in the description in the Areas section.',
    'routine.saved': 'Task "{title}" saved, it will appear in the day schedule.',
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

    'input.title': 'Add',
    'input.intro': 'Describe what you have in mind in your own words — the app will suggest a type and a group, you just confirm.',
    'input.placeholder': 'e.g.: I want to learn cooking',
    'input.parse': 'Parse',
    'kind.sphere': 'Area',
    'kind.task': 'Task',
    'kind.routine': 'Recurring task',
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

// локализация: словари ru/en, выбор языка сохраняется в localStorage.
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
    'day.quickRoutineHint': 'Рутины создаются на вкладке «Направления»',
        'day.quickSphereHint': 'Направления создаются через «+»',
    'welcome.title': 'Как пользоваться Дейликом',
    'welcome.step1': 'Пиши дела своими словами в поле ниже — приложение само определит длительность и подберёт время.',
    'welcome.step2': 'Не знаешь, за что взяться? Нажми «Что сейчас?» — подскажу одно дело под твои силы.',
    'welcome.step3': 'Рутины и направления — потом, когда захочешь: без них всё работает.',
    'welcome.ok': 'Понятно, поехали',
    'task.tomorrow': 'Отложить на завтра',
    'task.breakdown': 'Разбить на шаги',
    'task.breakdownFailed': 'Не получилось разбить — API недоступно, попробуй ещё раз',
    'task.brokenInto': 'Разбито на {n} шагов',
    'day.addRoutine': '+ Рутина',
    'day.placeAt': 'Поставить на {time}',
    'day.pickEmpty': 'свободных дел нет — добавь в поле выше',
    'day.tapHint': 'Нажми на пустое время, чтобы поставить дело',
    'day.free': 'свободно {time}',
    'day.backToTasks': 'вернуть в дела',
    'task.remindTomorrow': 'Завтра',
    'task.remindDayAfter': 'Послезавтра',
    'task.remindWeek': 'Через неделю',
    'task.pickDate': 'Дата…',
    'task.remindDate': 'Выбрать дату',
    'task.remindTime': 'Время',
    'cal.empty': 'ничего не запланировано',

    // обзор приложения
    'onb.title': 'Обзор Дейлика',
    'onb.intro': 'Короткий тур по четырём экранам. Листай вниз.',
    'onb.day.title': 'Главный экран — день',
    'onb.day.input': 'Пиши дело своими словами — разберёт длительность и создаст',
    'onb.day.card': 'Поставленное дело: время слева, длительность на карточке',
    'onb.day.free': 'Свободное окно: «+» поставит сюда любое дело',
    'onb.day.side': 'Дела без времени: клик — в первое свободное окно',

    'onb.add.title': 'Кнопка «+» — полное добавление',
    'onb.add.parse': 'Опиши задуманное — тип и группа предложатся сами',
    'onb.add.types': 'Три типа: разовое, продолжительное, направление',
    'onb.add.chips': 'Длительность в один клик',
    'onb.add.remind': 'Напоминание: завтра, послезавтра, через неделю или любая дата',

    'onb.areas.title': 'Направления — порядок в жизни',
    'onb.areas.cols': 'Три группы: Н — быт, Ж — отдых, П — развитие',
    'onb.areas.leaf': 'Счётчик показывает, что внутри направления',
    'onb.areas.block': 'Рутины дня: сон, готовка, дорога',

    'onb.cal.title': 'Календарь на месяц',
    'onb.cal.dots': 'Точки — загруженность дня',
    'onb.cal.modal': 'Клик по дню — его рутины и дела',
    'task.startTime': 'Время начала (сегодня)',
    'task.startTimeHint': 'оставь пустым — дело вернётся в колонку дел',
    'routine.edit': 'Рутина',
    'routine.hint': 'Рутина — регулярная необходимость дня: сон, еда, работа. Повторяется по выбранным дням недели и не относится к направлениям.',
    'energy.label': 'Силы',
    'energy.low': 'мало',
    'energy.normal': 'норм',
    'energy.high': 'много',

    'common.type': 'Тип',
    'type.task': 'Разовое',
    'type.ongoing': 'Продолжительное',
    'type.sphere': 'Направление',
    'type.hint.task': 'Разовое — сделать один раз и забыть: «помыть пол», «позвонить».',
    'type.hint.ongoing': 'Продолжительное — дело, которое делаешь понемногу каждый день или через день: проект, курс. Отметь сделанным — вернётся по расписанию.',
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
    'task.deleteBtn': 'Удалить дело',
    'task.saved': 'Дело «{title}» сохранено, группа {group}.',
    'task.moreParamsHint': 'напоминание, повтор и направление — по желанию',
    'task.willRemind': 'Напомню в срок.',
    'task.putFirst': 'Поставить в первое подходящее окно',
    'task.putOverlap': 'Поставить в первое окно (с перекрытием)',
    'task.markDone': 'Отметить сделанным',
    'task.editTip': 'Редактировать',
    'task.return': 'Вернуть в дела',
    'spheres.dragHint': 'Карточку можно перетащить в другую колонку',

    'spheres.title': 'Направления',
    'spheres.intro': 'Направление — область твоей жизни: сон, учёба, здоровье. Внутри карточки направления видны его дела и рутины.',
    'spheres.legend': 'Н — быт и насущное · Ж — желания и отдых · П — развитие и задачи',
    'spheres.empty': 'пусто',
    'spheres.examples': 'Быстрый старт — создать:',
    'spheres.new': 'Новое направление',
    'spheres.briefLabel': 'Кратко (перечитывать каждый день)',
    'spheres.detailsLabel': 'Полностью (методы, рутина)',
    'spheres.deleteBtn': 'Удалить направление',
    'spheres.practices': 'Рутины',
    'spheres.noPractices': 'пока нет рутин',
    'spheres.tasks': 'Дела направления',
    'spheres.noTasks': 'активных дел нет',
    'spheres.freePractices': 'Блоки дня (рутины без направления)',
    'spheres.newPractice': 'Новая рутина',
    'spheres.addPractice': 'Добавить рутину',
    'spheres.meta': '{n} дел · {m} рут.',
    'spheres.quickKindHint': 'Это не разовое дело. Рутину можно добавить в блоке «Рутины» ниже.',
    'spheres.saved': 'Направление «{title}» сохранено. Описание можно заполнить в разделе «Направления».',
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
    'data.demoReset': 'Убрать тестовые данные',
    'data.demoConfirm': 'Убрать тестовое расписание и примеры дел?\nСвои данные останутся.',
    'data.demoRemoved': 'Тестовые данные убраны.',

    'input.title': 'Добавить',
    'input.intro': 'Опиши задуманное своими словами — приложение предложит тип и группу, остаётся подтвердить.',
    'input.placeholder': 'например: полить цветы на 15 минут',
    'input.parse': 'Разобрать',
    'kind.sphere': 'Направление',
    'kind.task': 'Дело',
    'kind.ongoing': 'Продолжительное',
    'task.moreParams': 'Ещё параметры',
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
    'day.quickRoutineHint': 'Routines are created on the Areas tab',
        'day.quickSphereHint': 'Areas are created via the "+" button',
    'welcome.title': 'How Daylik works',
    'welcome.step1': 'Describe tasks in your own words in the field below — the app will estimate the time and find a slot.',
    'welcome.step2': "Don't know where to start? Tap \"What now?\" — I'll suggest one task to match your energy.",
    'welcome.step3': 'Routines and areas can wait — everything works without them.',
    'welcome.ok': "Got it, let's go",
    'task.tomorrow': 'Postpone to tomorrow',
    'task.breakdown': 'Break into steps',
    'task.breakdownFailed': 'Could not break down — API unavailable, try again',
    'task.brokenInto': 'Split into {n} steps',
    'day.addRoutine': '+ Routine',
    'day.placeAt': 'Place at {time}',
    'day.pickEmpty': 'no free tasks — add one in the field above',
    'day.tapHint': 'Tap empty time to place a task',
    'day.free': 'free {time}',
    'day.backToTasks': 'back to tasks',
    'task.remindTomorrow': 'Tomorrow',
    'task.remindDayAfter': 'In 2 days',
    'task.remindWeek': 'In a week',
    'task.pickDate': 'Pick a date',
    'task.remindDate': 'Pick a date',
    'task.remindTime': 'Time',
    'cal.empty': 'nothing planned',

    // app tour
    'onb.title': 'Daylik tour',
    'onb.intro': 'A short tour of four screens. Scroll down.',
    'onb.day.title': 'Main screen — the day',
    'onb.day.input': 'Type a task in plain words — Daylik parses the duration and creates it',
    'onb.day.card': 'A scheduled task: time on the left, duration on the card',
    'onb.day.free': 'Free slot: tap "+" to place any task here',
    'onb.day.side': 'Tasks without time: tap to put them in the first free slot',

    'onb.add.title': 'The "+" button — full add',
    'onb.add.parse': 'Describe what you have in mind — the type and group will be suggested',
    'onb.add.types': 'Three types: one-off, ongoing, area',
    'onb.add.chips': 'Duration in one tap',
    'onb.add.remind': 'Reminder: tomorrow, in 2 days, in a week or any date',

    'onb.areas.title': 'Areas keep life organized',
    'onb.areas.cols': 'Three groups: N — chores, D — rest, U — growth',
    'onb.areas.leaf': 'The counter shows what is inside the area',
    'onb.areas.block': 'Day routines: sleep, cooking, commute',

    'onb.cal.title': 'Month calendar',
    'onb.cal.dots': 'Dots show how busy a day is',
    'onb.cal.modal': 'Tap a day to see its routines and tasks',
    'task.startTime': 'Start time (today)',
    'task.startTimeHint': 'leave empty to return the task to the list',
    'routine.edit': 'Routine',
    'routine.hint': 'A routine is a recurring daily necessity: sleep, meals, work. Repeats on selected weekdays and is not tied to areas.',
    'energy.label': 'Energy',
    'energy.low': 'low',
    'energy.normal': 'ok',
    'energy.high': 'high',

    'common.type': 'Type',
    'type.task': 'One-off',
    'type.ongoing': 'Ongoing',
    'type.sphere': 'Area',
    'type.hint.task': 'One-off — do it once and forget: "wash the floor", "call mom".',
    'type.hint.ongoing': 'Ongoing — a task you chip away at daily or every few days: a project, a course. Mark it done and it returns on schedule.',
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
    'task.deleteBtn': 'Delete task',
    'task.saved': 'Task "{title}" saved, group {group}.',
    'task.moreParamsHint': 'reminder, repeat and area are optional',
    'task.willRemind': 'Will remind on time.',
    'task.putFirst': 'Put into the first fitting window',
    'task.putOverlap': 'Put into the first window (with overlap)',
    'task.markDone': 'Mark done',
    'task.editTip': 'Edit',
    'task.return': 'Return to tasks',

    'spheres.title': 'Areas',
    'spheres.intro': 'An area is a part of your life: sleep, studies, health. Its tasks and routines are visible inside the area card.',
    'spheres.legend': 'N — chores and essentials · D — desires and rest · U — growth and tasks',
    'spheres.empty': 'empty',
    'spheres.examples': 'Quick start — create:',
    'spheres.new': 'New area',
    'spheres.briefLabel': 'Brief (reread daily)',
    'spheres.detailsLabel': 'Full (methods, routine)',
    'spheres.deleteBtn': 'Delete area',
    'spheres.practices': 'Routines',
    'spheres.noPractices': 'no routines yet',
    'spheres.tasks': 'Area tasks',
    'spheres.noTasks': 'no active tasks',
    'spheres.freePractices': 'Day blocks (recurring without an area)',
    'spheres.newPractice': 'New routine',
    'spheres.addPractice': 'Add routine',
    'spheres.meta': '{n} tasks · {m} rout.',
    'spheres.quickKindHint': "This isn't a one-off task. Add routines in the Routines section below.",
    'spheres.saved': 'Area "{title}" saved. Fill in the description in the Areas section.',
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
    'data.demoReset': 'Remove sample data',
    'data.demoConfirm': 'Remove the sample schedule and example tasks?\nYour own data stays.',
    'data.demoRemoved': 'Sample data removed.',

    'input.title': 'Add',
    'input.intro': 'Describe what you have in mind in your own words — the app will suggest a type and a group, you just confirm.',
    'input.placeholder': 'e.g.: water the plants, 15 min',
    'input.parse': 'Parse',
    'kind.sphere': 'Area',
    'kind.task': 'Task',
    'kind.ongoing': 'Ongoing',
    'task.moreParams': 'More options',
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

// статические узлы index.html: data-i18n (текст), data-i18n-title, data-i18n-placeholder
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

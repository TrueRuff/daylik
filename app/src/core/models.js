// Модели данных (см. проектирование.md, раздел 2)

export const GROUPS = ['Н', 'Ж', 'П']; // Необходимо / Желательно / Полезно
// названия групп — в словаре локализации (i18n.js), ключи group.Н / group.Ж / group.П

export class Sphere {
  constructor({ id, name, group, brief = '', details = '', createdAt = Date.now() }) {
    this.id = id;
    this.name = name;
    this.group = group;
    this.brief = brief;   // краткий текст — перечитывается каждый день
    this.details = details; // полный текст: методы, рутина
    this.createdAt = createdAt;
  }
}

export class Task {
  constructor({
    id,
    sphereId = null,
    rawText = '',
    title,
    group,
    durationMin = 30,
    status = 'todo', // todo | done
    scheduledDate = null, // 'YYYY-MM-DD' — день на таймлайне
    scheduledStart = null, // минуты от 00:00
    dueAt = null,
    repeatRule = null,
    notes = '',
    createdAt = Date.now(),
    source = 'manual', // rules | llm | manual
  }) {
    this.id = id;
    this.sphereId = sphereId;
    this.rawText = rawText;
    this.title = title;
    this.group = group;
    this.durationMin = durationMin;
    this.status = status;
    this.scheduledDate = scheduledDate;
    this.scheduledStart = scheduledStart;
    this.dueAt = dueAt;
    this.repeatRule = repeatRule;
    this.notes = notes;
    this.createdAt = createdAt;
    this.source = source;
  }
}

// Регулярная практика направления (сон, тренировки, пары); в интерфейсе Sphere — «Направление»
export class Practice {
  constructor({ id, sphereId = null, title, days = [1, 2, 3, 4, 5, 6, 7], start = 540, end = 600 }) {
    this.id = id;
    this.sphereId = sphereId;
    this.title = title;
    this.days = days;   // дни недели 1..7, 1 = понедельник
    this.start = start; // минуты от 00:00
    this.end = end;     // может быть меньше start — практика через полночь
  }
}

// Блок таймлайна дня
export class PlanBlock {
  constructor({ id, start, end, kind = 'free', label = null, taskId = null }) {
    this.id = id;
    this.start = start; // минуты от 00:00
    this.end = end;
    this.kind = kind;   // routine | task | free
    this.label = label;
    this.taskId = taskId;
  }

  get durationMin() {
    return this.end - this.start;
  }
}

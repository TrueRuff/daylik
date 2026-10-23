// Модели данных (см. проектирование.md, раздел 2)

export const GROUPS = ['Н', 'Ж', 'П']; // Необходимо / Желательно / Полезно

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
    status = 'inbox', // inbox | todo | doing | done | postponed
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
    this.dueAt = dueAt;
    this.repeatRule = repeatRule;
    this.notes = notes;
    this.createdAt = createdAt;
    this.source = source;
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

// сериализация данных приложения: JSON (читаемый) и собственный двоичный
// формат .daylik (компактный резервный). Плюс normalizeImport — проверка и
// чистка данных перед записью в базу.

import { Sphere, Task, Practice, GROUPS } from './models.js';
import { isRepeatRule } from './recurring.js';

const FORMAT = 'daylik';
const FORMAT_VERSION = 1;
const MAGIC = 'DAYL'; // сигнатура двоичного файла

// поля сущностей для двоичного формата: [имя, тип]
// str / u32 / f64, суффикс ? — nullable, u32[] — массив чисел
const SCHEMAS = {
  spheres: [
    ['id', 'str'], ['name', 'str'], ['group', 'str'],
    ['brief', 'str'], ['details', 'str'], ['createdAt', 'f64'],
  ],
  tasks: [
    ['id', 'str'], ['sphereId', 'str?'], ['rawText', 'str'], ['title', 'str'],
    ['group', 'str'], ['durationMin', 'u32'], ['status', 'str'],
    ['scheduledDate', 'str?'], ['scheduledStart', 'u32?'], ['dueAt', 'f64?'],
    ['repeatRule', 'str?'], ['notes', 'str'], ['createdAt', 'f64'], ['source', 'str'],
  ],
  practices: [
    ['id', 'str'], ['sphereId', 'str?'], ['title', 'str'],
    ['days', 'u32[]'], ['start', 'u32'], ['end', 'u32'],
  ],
};

export function serializeJson(data) {
  return JSON.stringify({
    format: FORMAT,
    version: FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    spheres: data.spheres,
    tasks: data.tasks,
    practices: data.practices,
  });
}

export function parseJson(text) {
  let obj;
  try {
    obj = JSON.parse(text);
  } catch {
    return null;
  }
  if (!obj || obj.format !== FORMAT) return null;
  return obj;
}

const ENCODER = new TextEncoder();
const DECODER = new TextDecoder();

class Writer {
  constructor() {
    this.chunks = [];
    this.size = 0;
  }

  push(bytes) {
    this.chunks.push(bytes);
    this.size += bytes.length;
  }

  u8(v) {
    this.push(new Uint8Array([v & 0xff]));
  }

  u32(v) {
    const b = new Uint8Array(4);
    new DataView(b.buffer).setUint32(0, v >>> 0, true);
    this.push(b);
  }

  f64(v) {
    const b = new Uint8Array(8);
    new DataView(b.buffer).setFloat64(0, Number(v) || 0, true);
    this.push(b);
  }

  str(s) {
    const b = ENCODER.encode(String(s ?? ''));
    this.u32(b.length);
    this.push(b);
  }

  result() {
    const out = new Uint8Array(this.size);
    let pos = 0;
    for (const c of this.chunks) {
      out.set(c, pos);
      pos += c.length;
    }
    return out;
  }
}

class Reader {
  constructor(buffer) {
    this.view = new DataView(buffer);
    this.offset = 0;
  }

  u8() {
    return this.view.getUint8(this.offset++);
  }

  u32() {
    const v = this.view.getUint32(this.offset, true);
    this.offset += 4;
    return v;
  }

  f64() {
    const v = this.view.getFloat64(this.offset, true);
    this.offset += 8;
    return v;
  }

  str() {
    const len = this.u32();
    const s = DECODER.decode(new Uint8Array(this.view.buffer, this.offset, len));
    this.offset += len;
    return s;
  }
}

function writeValue(writer, type, value) {
  if (type.endsWith('?')) {
    if (value == null) {
      writer.u8(0);
    } else {
      writer.u8(1);
      writeValue(writer, type.slice(0, -1), value);
    }
    return;
  }
  switch (type) {
    case 'str': writer.str(value); break;
    case 'u32': writer.u32(value); break;
    case 'f64': writer.f64(value); break;
    case 'u32[]': {
      const arr = Array.isArray(value) ? value : [];
      writer.u32(arr.length);
      for (const v of arr) writer.u32(v);
      break;
    }
  }
}

function readValue(reader, type) {
  if (type.endsWith('?')) {
    return reader.u8() === 1 ? readValue(reader, type.slice(0, -1)) : null;
  }
  switch (type) {
    case 'str': return reader.str();
    case 'u32': return reader.u32();
    case 'f64': return reader.f64();
    case 'u32[]': {
      const count = reader.u32();
      const arr = [];
      for (let i = 0; i < count; i++) arr.push(reader.u32());
      return arr;
    }
  }
}

export function serializeBinary(data) {
  const w = new Writer();
  for (const ch of MAGIC) w.u8(ch.charCodeAt(0));
  w.u8(FORMAT_VERSION);

  for (const [key, fields] of Object.entries(SCHEMAS)) {
    const list = Array.isArray(data[key]) ? data[key] : [];
    w.u32(list.length);
    for (const item of list) {
      for (const [name, type] of fields) writeValue(w, type, item[name]);
    }
  }
  return w.result();
}

// битый файл (обрыв, мусор) даёт null, а не исключение
export function parseBinary(buffer) {
  try {
    const r = new Reader(buffer);
    for (const ch of MAGIC) {
      if (r.u8() !== ch.charCodeAt(0)) return null;
    }
    if (r.u8() !== FORMAT_VERSION) return null;

    const data = {};
    for (const [key, fields] of Object.entries(SCHEMAS)) {
      const count = r.u32();
      const list = [];
      for (let i = 0; i < count; i++) {
        const item = {};
        for (const [name, type] of fields) item[name] = readValue(r, type);
        list.push(item);
      }
      data[key] = list;
    }
    return data;
  } catch {
    return null;
  }
}

// проверка импортируемых данных: отбрасываем записи без обязательных полей,
// ссылки на несуществующие сферы обнуляем (сфера могла быть удалена),
// мусорные числа и группы заменяем безопасными значениями — иначе
// чужой файл сломал бы таймлайн (NaN в стиле блоков) и сортировку
export function normalizeImport(obj) {
  const arr = (v) => (Array.isArray(v) ? v : []);

  const safeGroup = (g) => (GROUPS.includes(g) ? g : 'П');
  const safeInt = (v, fallback, min, max) => {
    const n = Math.round(Number(v));
    return Number.isFinite(n) ? Math.min(Math.max(n, min), max) : fallback;
  };
  // id попадает в html-атрибуты (data-id, value) и в UID ics — оставляем
  // только безопасные токены; записи с кавычками, скобками или чрезмерной
  // длиной отбрасываем целиком
  const safeId = (v) => (typeof v === 'string' && /^[\w.-]{1,64}$/.test(v) ? v : null);

  const spheres = arr(obj?.spheres)
    .filter((s) => s && safeId(s.id) && s.name)
    .map((s) => {
      const sphere = new Sphere({ ...s, id: safeId(s.id) });
      sphere.group = safeGroup(sphere.group);
      return sphere;
    });
  const sphereIds = new Set(spheres.map((s) => s.id));
  const refOrphan = (id) => (id && sphereIds.has(id) ? id : null);

  const tasks = arr(obj?.tasks)
    .filter((t) => t && safeId(t.id) && t.title)
    .map((t) => {
      const task = new Task({ ...t, id: safeId(t.id) });
      task.sphereId = refOrphan(task.sphereId);
      task.group = safeGroup(task.group);
      task.durationMin = safeInt(task.durationMin, 30, 5, 480);
      if (!isRepeatRule(task.repeatRule)) task.repeatRule = null;
      return task;
    });

  const practices = arr(obj?.practices)
    .filter((p) => p && safeId(p.id) && p.title)
    .map((p) => {
      const practice = new Practice({ ...p, id: safeId(p.id) });
      practice.sphereId = refOrphan(practice.sphereId);
      practice.start = safeInt(practice.start, 0, 0, 1440);
      practice.end = safeInt(practice.end, practice.start || 0, 0, 1440);
      practice.days = (practice.days || []).filter((d) => d >= 1 && d <= 7);
      return practice;
    });

  return { spheres, tasks, practices };
}

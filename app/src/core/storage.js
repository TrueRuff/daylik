// слой хранения: IndexedDB через Dexie.
// единственная точка доступа к данным — всё остальное работает через этот модуль.

import Dexie from 'dexie';
import { Sphere, Task, Practice } from './models.js';
import { normalizeImport } from './serialization.js';
import { log, setSink, LEVELS } from './log.js';
import { nextOccurrence } from './recurring.js';

const db = new Dexie('daylik');

db.version(1).stores({
  spheres: 'id, name, group',
  tasks: 'id, sphereId, group, status, dueAt',
});

db.version(2).stores({
  practices: 'id, sphereId',
});

db.version(3).stores({
  logs: '++id, time, level',
});

// v4: аккаунты + владелец у данных (разделение по учётным записям).
// существующие записи достаются встроенному админу — данные автора не теряются.
db.version(4).stores({
  accounts: 'login',
  spheres: 'id, name, group, owner',
  tasks: 'id, sphereId, group, status, dueAt, owner',
  practices: 'id, sphereId, owner',
}).upgrade(async (tx) => {
  for (const name of ['spheres', 'tasks', 'practices']) {
    await tx.table(name).toCollection().modify((row) => { row.owner = 'админ'; });
  }
});

// логин вошедшего аккаунта; null — фильтр выключен (до входа и в тестах)
let dataOwner = null;

export function setDataOwner(login) {
  dataOwner = login;
}

// записи видимого владельца; без владельца (null) видно всё
function isOwned(row) {
  return dataOwner == null || row.owner === dataOwner;
}

function stampOwner(row) {
  if (dataOwner != null) row.owner = dataOwner;
  return row;
}

// аккаунты

export async function getAccount(login) {
  return db.accounts.get(login);
}

export async function putAccount(account) {
  await db.accounts.put(account);
  return account;
}

export async function saveSphere(sphere) {
  await db.spheres.put(stampOwner(sphere));
  return sphere;
}

export async function saveTask(task) {
  await db.tasks.put(stampOwner(task));
  return task;
}

export async function getAllSpheres() {
  const rows = await db.spheres.filter(isOwned).toArray();
  return rows.map((r) => new Sphere(r));
}

export async function getTasks({ status = null, group = null } = {}) {
  const rows = await db.tasks
    .filter((t) => isOwned(t) && (!status || t.status === status) && (!group || t.group === group))
    .toArray();
  return rows.map((r) => new Task(r));
}

export async function updateTask(id, patch) {
  await db.tasks.update(id, patch);
}

export async function deleteTask(id) {
  await db.tasks.delete(id);
}

// завершение дела: обычное — просто done; повторяющееся — done + создаётся
// следующее вхождение (та же длительность/группа/повтор, место в расписании —
// на следующую дату). Возвращает созданное вхождение или null.
export async function completeTask(task) {
  await updateTask(task.id, { status: 'done', scheduledDate: null, scheduledStart: null });
  const patch = nextOccurrence(task);
  if (!patch) return null;

  const next = new Task({
    ...task,
    id: crypto.randomUUID(),
    status: 'todo',
    createdAt: Date.now(),
    dueAt: null,
    ...patch,
  });
  await db.tasks.put(next);
  log.info('task.recurring.next', { title: next.title, rule: next.repeatRule, date: next.scheduledDate });
  return next;
}

// задачи с наступившим временем напоминания.
// фильтр по месту: в IndexedDB null меньше числа и попал бы в выборку belowThanOrEqual.
export async function getDueReminders(now) {
  const rows = await db.tasks.filter((t) => isOwned(t) && t.dueAt && t.dueAt <= now && t.status !== 'done').toArray();
  return rows.map((r) => new Task(r));
}

export async function savePractice(practice) {
  await db.practices.put(stampOwner(practice));
  return practice;
}

export async function getPractices() {
  const rows = await db.practices.filter(isOwned).toArray();
  return rows.map((r) => new Practice(r));
}

export async function deletePractice(id) {
  await db.practices.delete(id);
}

// сфера удаляется вместе со своими практиками
export async function deleteSphere(id) {
  await db.spheres.delete(id);
  await db.practices.where('sphereId').equals(id).delete();
}

// экспорт/импорт данных (см. serialization.js); без владельца — все записи,
// после входа — только данные текущего аккаунта
export async function exportAll() {
  const data = {
    spheres: (await db.spheres.toArray()).filter(isOwned),
    tasks: (await db.tasks.toArray()).filter(isOwned),
    practices: (await db.practices.toArray()).filter(isOwned),
  };
  log.info('storage.export', { spheres: data.spheres.length, tasks: data.tasks.length, practices: data.practices.length });
  return data;
}

// импорт с заменой данных текущего владельца (или всех, пока входа не было);
// возвращает очищенные записи
export async function importAll(data) {
  const clean = normalizeImport(data);
  const stamp = (rows) => rows.map((r) => stampOwner({ ...r }));
  await db.transaction('rw', db.spheres, db.tasks, db.practices, async () => {
    if (dataOwner != null) {
      await db.spheres.where('owner').equals(dataOwner).delete();
      await db.tasks.where('owner').equals(dataOwner).delete();
      await db.practices.where('owner').equals(dataOwner).delete();
    } else {
      await db.spheres.clear();
      await db.tasks.clear();
      await db.practices.clear();
    }
    await db.spheres.bulkAdd(stamp(clean.spheres));
    await db.tasks.bulkAdd(stamp(clean.tasks));
    await db.practices.bulkAdd(stamp(clean.practices));
  });
  log.info('storage.import', { spheres: clean.spheres.length, tasks: clean.tasks.length, practices: clean.practices.length });
  return clean;
}

// тестовая утилита: полная очистка таблиц (используется только из storage.test.js)
export async function __clearForTests() {
  await db.spheres.clear();
  await db.tasks.clear();
  await db.practices.clear();
  await db.logs.clear();
  await db.accounts.clear();
}

// журнал: записи пишутся в таблицу logs, хвост длиннее LOG_CAP подрезается
const LOG_CAP = 1000;

export function initLog() {
  setSink(async (entry) => {
    await db.logs.add(entry);
    const count = await db.logs.count();
    if (count > LOG_CAP) {
      const excess = await db.logs.orderBy('id').limit(count - LOG_CAP).primaryKeys();
      await db.logs.bulkDelete(excess);
    }
  });
}

// последние записи журнала из базы (переживают перезапуск), сначала новые
export async function getLogs({ limit = 200, minLevel = null } = {}) {
  let rows = await db.logs.orderBy('time').reverse().limit(1000).toArray();
  if (minLevel) {
    const min = LEVELS[minLevel] ?? 0;
    rows = rows.filter((r) => (LEVELS[r.level] ?? 0) >= min);
  }
  return rows.slice(0, limit);
}

export async function clearLogs() {
  await db.logs.clear();
  log.info('log.cleared');
}

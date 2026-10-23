// Слой хранения: IndexedDB через Dexie.
// Единственная точка доступа к данным — всё остальное работает через этот модуль.

import Dexie from 'dexie';
import { Sphere, Task } from './models.js';

const db = new Dexie('daylik');

db.version(1).stores({
  spheres: 'id, name, group',
  tasks: 'id, sphereId, group, status, dueAt',
});

export async function saveSphere(sphere) {
  await db.spheres.put(sphere);
  return sphere;
}

export async function saveTask(task) {
  await db.tasks.put(task);
  return task;
}

export async function getAllSpheres() {
  const rows = await db.spheres.toArray();
  return rows.map((r) => new Sphere(r));
}

export async function getTasks({ status = null, group = null } = {}) {
  let col = db.tasks;
  if (status) col = col.where('status').equals(status);
  if (group) col = col.and((t) => t.group === group); // Dexie не умеет два where подряд — второе условие фильтруем вручную
  const rows = await col.toArray();
  return rows.map((r) => new Task(r));
}

export async function updateTask(id, patch) {
  await db.tasks.update(id, patch);
}

export async function deleteTask(id) {
  await db.tasks.delete(id);
}

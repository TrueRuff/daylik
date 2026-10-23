// Слой хранения: IndexedDB через Dexie.
// Единственная точка доступа к данным — всё остальное работает через этот модуль.

import Dexie from 'dexie';
import { Sphere, Task, Practice } from './models.js';

const db = new Dexie('daylik');

db.version(1).stores({
  spheres: 'id, name, group',
  tasks: 'id, sphereId, group, status, dueAt',
});

db.version(2).stores({
  practices: 'id, sphereId',
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

export async function savePractice(practice) {
  await db.practices.put(practice);
  return practice;
}

export async function getPractices() {
  const rows = await db.practices.toArray();
  return rows.map((r) => new Practice(r));
}

export async function deletePractice(id) {
  await db.practices.delete(id);
}

// Сфера удаляется вместе со своими практиками
export async function deleteSphere(id) {
  await db.spheres.delete(id);
  await db.practices.where('sphereId').equals(id).delete();
}

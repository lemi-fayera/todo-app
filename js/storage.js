// ============================================================
//  storage.js — LocalStorage persistence
// ============================================================
import { state } from './data.js';

const KEY = 'taskflow-v1';

export function saveToStorage() {
  try {
    const payload = {
      tasks: state.tasks,
      theme: state.theme,
      sortBy: state.sortBy,
    };
    localStorage.setItem(KEY, JSON.stringify(payload));
  } catch (e) {
    console.warn('Storage save failed:', e);
  }
}

export function loadFromStorage() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return false;
    const saved = JSON.parse(raw);
    if (Array.isArray(saved.tasks)) state.tasks = saved.tasks;
    if (saved.theme)  state.theme  = saved.theme;
    if (saved.sortBy) state.sortBy = saved.sortBy;
    return true;
  } catch (e) {
    console.warn('Storage load failed — resetting:', e);
    localStorage.removeItem(KEY);
    return false;
  }
}

export function clearStorage() {
  localStorage.removeItem(KEY);
}

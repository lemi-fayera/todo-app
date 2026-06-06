// ============================================================
//  data.js — Single source of truth: state + task operations
// ============================================================

export const state = {
  tasks: [],
  filter: 'all',         // 'all' | 'active' | 'completed'
  searchQuery: '',
  theme: 'light',
  sortBy: 'order',       // 'order' | 'priority' | 'dueDate' | 'created'
  draggedTaskId: null,
};

// -------- Task factory --------
export function createTask({ text, priority = 'medium', category = 'personal', dueDate = null }) {
  return {
    id: crypto.randomUUID(),
    text: text.trim(),
    completed: false,
    priority,
    category,
    dueDate: dueDate || null,
    createdAt: Date.now(),
    order: state.tasks.length,
  };
}

// -------- CRUD --------
export function addTask(taskData) {
  const task = createTask(taskData);
  state.tasks.push(task);
  return task;
}

export function deleteTask(id) {
  state.tasks = state.tasks.filter(t => t.id !== id);
  normalizeOrder();
}

export function deleteCompletedTasks() {
  state.tasks = state.tasks.filter(t => !t.completed);
  normalizeOrder();
}

export function deleteAllTasks() {
  state.tasks = [];
}

export function toggleTask(id) {
  state.tasks = state.tasks.map(t =>
    t.id === id ? { ...t, completed: !t.completed } : t
  );
}

export function updateTask(id, changes) {
  state.tasks = state.tasks.map(t =>
    t.id === id ? { ...t, ...changes } : t
  );
}

export function reorderTasks(fromId, toId) {
  const from = state.tasks.findIndex(t => t.id === fromId);
  const to   = state.tasks.findIndex(t => t.id === toId);
  if (from === -1 || to === -1 || from === to) return;
  const copy = [...state.tasks];
  const [moved] = copy.splice(from, 1);
  copy.splice(to, 0, moved);
  state.tasks = copy;
  normalizeOrder();
}

function normalizeOrder() {
  state.tasks.forEach((t, i) => { t.order = i; });
}

// -------- Computed --------
export function getActiveCount()    { return state.tasks.filter(t => !t.completed).length; }
export function getCompletedCount() { return state.tasks.filter(t => t.completed).length;  }
export function getTotalCount()     { return state.tasks.length; }
export function getCompletionPct() {
  if (!state.tasks.length) return 0;
  return Math.round((getCompletedCount() / getTotalCount()) * 100);
}

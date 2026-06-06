// ============================================================
//  filters.js — Pure data transformation: filter + sort
// ============================================================
import { state } from './data.js';

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

export function getFilteredTasks() {
  let tasks = [...state.tasks];

  // 1. Filter tab
  if (state.filter === 'active')    tasks = tasks.filter(t => !t.completed);
  if (state.filter === 'completed') tasks = tasks.filter(t => t.completed);

  // 2. Search query
  if (state.searchQuery.trim()) {
    const q = state.searchQuery.toLowerCase();
    tasks = tasks.filter(t =>
      t.text.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      t.priority.toLowerCase().includes(q)
    );
  }

  // 3. Sort
  tasks.sort((a, b) => {
    // Always push completed tasks to bottom
    if (a.completed !== b.completed) return a.completed ? 1 : -1;

    switch (state.sortBy) {
      case 'priority':
        return (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1);
      case 'dueDate': {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      case 'created':
        return b.createdAt - a.createdAt;
      case 'order':
      default:
        return a.order - b.order;
    }
  });

  return tasks;
}

// ============================================================
//  render.js — DOM rendering engine
// ============================================================
import { state, getActiveCount, getCompletedCount, getTotalCount, getCompletionPct } from './data.js';
import { getFilteredTasks } from './filters.js';

// -------- Security --------
function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}

// -------- Date helpers --------
function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function getDueStatus(iso) {
  if (!iso) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  const due   = new Date(iso + 'T00:00:00');
  if (due < today)  return 'overdue';
  if (due.getTime() === today.getTime()) return 'today';
  return 'upcoming';
}

// -------- Single task DOM node --------
function createTaskElement(task) {
  const li = document.createElement('li');
  li.className = `task-item priority-${task.priority}${task.completed ? ' completed' : ''}`;
  li.dataset.id = task.id;
  li.setAttribute('draggable', 'true');

  const dueStatus = getDueStatus(task.dueDate);
  const dueBadge = task.dueDate
    ? `<span class="badge badge-due ${dueStatus === 'overdue' ? 'overdue' : dueStatus === 'today' ? 'today' : ''}">
         ${dueStatus === 'overdue' ? '🔴' : dueStatus === 'today' ? '🟡' : '📅'} ${formatDate(task.dueDate)}
       </span>`
    : '';

  li.innerHTML = `
    <span class="drag-handle" aria-hidden="true">⠿</span>
    <input
      type="checkbox"
      class="task-checkbox"
      ${task.completed ? 'checked' : ''}
      aria-label="Mark task as ${task.completed ? 'incomplete' : 'complete'}"
    >
    <div class="task-content">
      <span class="task-text-main">${escapeHTML(task.text)}</span>
      <div class="task-meta-row">
        <span class="badge badge-priority-${task.priority}">${task.priority}</span>
        <span class="badge badge-cat-${task.category}">${task.category}</span>
        ${dueBadge}
      </div>
    </div>
    <div class="task-actions">
      <button class="btn btn-icon btn-sm edit-btn" title="Edit task (E)" aria-label="Edit task">✏️</button>
      <button class="btn btn-icon btn-sm delete-btn" title="Delete task (Del)" aria-label="Delete task">🗑️</button>
    </div>
  `;

  return li;
}

// -------- Render the list --------
export function renderAll() {
  const list = document.getElementById('task-list');
  const empty = document.getElementById('empty-state');
  const visible = getFilteredTasks();

  // Animate items out fast, then replace
  const fragment = document.createDocumentFragment();

  if (visible.length === 0) {
    list.innerHTML = '';
    renderEmptyState(empty);
    empty.removeAttribute('hidden');
  } else {
    empty.setAttribute('hidden', '');
    visible.forEach((task, i) => {
      const el = createTaskElement(task);
      // Stagger entrance
      el.style.animationDelay = `${i * 30}ms`;
      el.classList.add('animating');
      fragment.appendChild(el);
    });
    list.innerHTML = '';
    list.appendChild(fragment);
  }

  renderStats();
  renderProgress();
  renderSortBar(visible.length);
}

// -------- Empty state variants --------
function renderEmptyState(el) {
  const msgs = {
    all:       { icon: '📋', title: 'No tasks yet', desc: 'Add your first task above and start getting things done!' },
    active:    { icon: '🎉', title: 'All caught up!', desc: 'No active tasks. You\'re on top of everything.' },
    completed: { icon: '📭', title: 'Nothing completed yet', desc: 'Complete some tasks and they\'ll show up here.' },
    search:    { icon: '🔍', title: 'No results found', desc: `No tasks match "${escapeHTML(state.searchQuery)}"` },
  };
  const key = state.searchQuery.trim() ? 'search'
    : state.filter === 'active' ? 'active'
    : state.filter === 'completed' ? 'completed'
    : 'all';
  const m = msgs[key];
  el.innerHTML = `
    <div class="empty-state-icon">${m.icon}</div>
    <p class="empty-state-title">${m.title}</p>
    <p class="empty-state-desc">${m.desc}</p>
  `;
}

// -------- Stats bar --------
function renderStats() {
  const el = document.getElementById('task-count');
  if (!el) return;
  const active = getActiveCount();
  el.textContent = `${active} task${active !== 1 ? 's' : ''} remaining`;
}

// -------- Progress bar --------
function renderProgress() {
  const fill  = document.getElementById('progress-fill');
  const pctEl = document.getElementById('progress-pct');
  const lbl   = document.getElementById('progress-label');
  if (!fill) return;
  const pct = getCompletionPct();
  const done = getCompletedCount();
  const total = getTotalCount();
  fill.style.width = pct + '%';
  if (pctEl) pctEl.textContent = pct + '%';
  if (lbl)   lbl.textContent = `${done} of ${total} completed`;
}

// -------- Sort bar --------
function renderSortBar(count) {
  const el = document.getElementById('sort-count');
  if (el) el.textContent = `${count} task${count !== 1 ? 's' : ''}`;
}

// -------- Theme --------
export function applyTheme() {
  document.documentElement.setAttribute('data-theme', state.theme);
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.setAttribute('aria-label', state.theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
}

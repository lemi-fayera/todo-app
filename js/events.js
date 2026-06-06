// ============================================================
//  events.js — All event listeners and handlers
// ============================================================
import { state, addTask, deleteTask, deleteCompletedTasks, deleteAllTasks,
         toggleTask, updateTask, reorderTasks } from './data.js';
import { saveToStorage, clearStorage } from './storage.js';
import { renderAll, applyTheme } from './render.js';
import { showToast } from './notifications.js';

// ============================================================
//  ADD TASK
// ============================================================
export function setupAddTask() {
  const form = document.getElementById('add-task-form');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const input = document.getElementById('task-input');
    const text  = input.value.trim();
    if (!text) {
      input.focus();
      input.classList.add('shake');
      setTimeout(() => input.classList.remove('shake'), 400);
      return;
    }
    addTask({
      text,
      priority: document.getElementById('priority-select').value,
      category: document.getElementById('category-select').value,
      dueDate:  document.getElementById('due-date-input').value || null,
    });
    saveToStorage();
    renderAll();
    showToast('Task added!', 'success');
    form.reset();
    input.focus();
  });
}

// ============================================================
//  TASK LIST (delegation)
// ============================================================
export function setupTaskList() {
  const list = document.getElementById('task-list');

  list.addEventListener('click', e => {
    const li = e.target.closest('li[data-id]');
    if (!li) return;
    const id = li.dataset.id;

    if (e.target.closest('.delete-btn')) {
      showConfirm('Delete this task?', 'This action cannot be undone.', '🗑️', () => {
        deleteTask(id);
        saveToStorage();
        renderAll();
        showToast('Task deleted', 'danger');
      });
      return;
    }

    if (e.target.closest('.edit-btn')) {
      startInlineEdit(id, li);
      return;
    }

    if (e.target.closest('.task-checkbox')) {
      toggleTask(id);
      saveToStorage();
      renderAll();
      const task = state.tasks.find(t => t.id === id);
      if (task?.completed) showToast('Task completed! 🎉', 'success');
    }
  });

  // Double-click to edit
  list.addEventListener('dblclick', e => {
    const li = e.target.closest('li[data-id]');
    if (!li || e.target.closest('.task-actions') || e.target.tagName === 'INPUT') return;
    startInlineEdit(li.dataset.id, li);
  });
}

// ============================================================
//  INLINE EDIT
// ============================================================
function startInlineEdit(id, li) {
  const task = state.tasks.find(t => t.id === id);
  if (!task) return;
  const span = li.querySelector('.task-text-main');
  if (!span) return;

  // Replace span with input
  const inp = document.createElement('input');
  inp.type = 'text';
  inp.className = 'task-edit-input';
  inp.value = task.text;
  span.replaceWith(inp);
  inp.focus();
  inp.select();

  let saved = false;

  function save() {
    if (saved) return;
    saved = true;
    const newText = inp.value.trim();
    if (newText && newText !== task.text) {
      updateTask(id, { text: newText });
      saveToStorage();
      showToast('Task updated', 'info');
    }
    renderAll();
  }

  inp.addEventListener('blur', save);
  inp.addEventListener('keydown', e => {
    if (e.key === 'Enter')  { e.preventDefault(); save(); }
    if (e.key === 'Escape') { saved = true; renderAll(); }
  });
}

// ============================================================
//  FILTERS & SEARCH
// ============================================================
export function setupFilters() {
  // Filter tabs
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.filter = btn.dataset.filter;
      renderAll();
    });
  });

  // Search with debounce
  const searchInp = document.getElementById('search-input');
  const clearBtn  = document.getElementById('search-clear');
  let debounce;

  searchInp.addEventListener('input', e => {
    clearTimeout(debounce);
    state.searchQuery = e.target.value;
    clearBtn.classList.toggle('visible', !!e.target.value);
    debounce = setTimeout(renderAll, 180);
  });

  clearBtn.addEventListener('click', () => {
    searchInp.value = '';
    state.searchQuery = '';
    clearBtn.classList.remove('visible');
    renderAll();
    searchInp.focus();
  });

  // Sort dropdown
  const sortSel = document.getElementById('sort-select');
  if (sortSel) {
    sortSel.addEventListener('change', () => {
      state.sortBy = sortSel.value;
      saveToStorage();
      renderAll();
    });
    sortSel.value = state.sortBy;
  }
}

// ============================================================
//  BULK ACTIONS
// ============================================================
export function setupBulkActions() {
  document.getElementById('clear-completed-btn')?.addEventListener('click', () => {
    const n = state.tasks.filter(t => t.completed).length;
    if (!n) { showToast('No completed tasks', 'info'); return; }
    showConfirm(
      `Clear ${n} completed task${n !== 1 ? 's' : ''}?`,
      'Completed tasks will be permanently removed.',
      '✅',
      () => {
        deleteCompletedTasks();
        saveToStorage();
        renderAll();
        showToast(`${n} task${n !== 1 ? 's' : ''} cleared`, 'success');
      }
    );
  });

  document.getElementById('clear-all-btn')?.addEventListener('click', () => {
    const n = state.tasks.length;
    if (!n) { showToast('No tasks to clear', 'info'); return; }
    showConfirm(
      'Clear ALL tasks?',
      'Every task will be permanently deleted. This cannot be undone.',
      '⚠️',
      () => {
        deleteAllTasks();
        clearStorage();
        renderAll();
        showToast('All tasks cleared', 'warning');
      }
    );
  });
}

// ============================================================
//  THEME TOGGLE
// ============================================================
export function setupThemeToggle() {
  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    applyTheme();
    saveToStorage();
    showToast(state.theme === 'dark' ? 'Dark mode on 🌙' : 'Light mode on ☀️', 'info', 1800);
  });
}

// ============================================================
//  KEYBOARD SHORTCUTS
// ============================================================
export function setupKeyboardShortcuts() {
  document.addEventListener('keydown', e => {
    const inInput = e.target.matches('input, textarea, select');

    // Shortcut: ? → open shortcuts modal
    if (e.key === '?' && !inInput) {
      e.preventDefault();
      document.getElementById('shortcuts-dialog')?.showModal();
      return;
    }
    // Shortcut: Escape → close modals
    if (e.key === 'Escape') {
      document.getElementById('shortcuts-dialog')?.close();
      document.getElementById('confirm-dialog')?.close();
      return;
    }
    if (inInput) return;

    switch (e.key) {
      case 'n': case 'a':
        e.preventDefault();
        document.getElementById('task-input')?.focus();
        break;
      case '/':
        e.preventDefault();
        document.getElementById('search-input')?.focus();
        break;
      case 'd':
        state.theme = state.theme === 'light' ? 'dark' : 'light';
        applyTheme(); saveToStorage();
        break;
      case '1':
        document.querySelector('[data-filter="all"]')?.click(); break;
      case '2':
        document.querySelector('[data-filter="active"]')?.click(); break;
      case '3':
        document.querySelector('[data-filter="completed"]')?.click(); break;
    }
  });

  // Close shortcuts dialog
  document.getElementById('shortcuts-close')?.addEventListener('click', () => {
    document.getElementById('shortcuts-dialog')?.close();
  });
  document.getElementById('shortcuts-dialog')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) e.currentTarget.close();
  });
}

// ============================================================
//  DRAG AND DROP
// ============================================================
export function setupDragAndDrop() {
  const list = document.getElementById('task-list');

  list.addEventListener('dragstart', e => {
    const li = e.target.closest('li[data-id]');
    if (!li) return;
    state.draggedTaskId = li.dataset.id;
    requestAnimationFrame(() => li.classList.add('dragging'));
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', li.dataset.id);
  });

  list.addEventListener('dragend', () => {
    list.querySelectorAll('.dragging, .drag-over').forEach(el => {
      el.classList.remove('dragging', 'drag-over');
    });
    state.draggedTaskId = null;
  });

  list.addEventListener('dragover', e => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const target = e.target.closest('li[data-id]');
    if (!target || target.dataset.id === state.draggedTaskId) return;
    list.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    target.classList.add('drag-over');
  });

  list.addEventListener('dragleave', e => {
    if (!list.contains(e.relatedTarget)) {
      list.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    }
  });

  list.addEventListener('drop', e => {
    e.preventDefault();
    const targetLi = e.target.closest('li[data-id]');
    if (!targetLi || !state.draggedTaskId) return;
    reorderTasks(state.draggedTaskId, targetLi.dataset.id);
    saveToStorage();
    renderAll();
  });
}

// ============================================================
//  CONFIRM DIALOG (native <dialog>)
// ============================================================
export function showConfirm(title, message, icon = '⚠️', onYes) {
  const dialog  = document.getElementById('confirm-dialog');
  const titleEl = document.getElementById('confirm-title');
  const msgEl   = document.getElementById('confirm-message');
  const iconEl  = document.getElementById('confirm-icon');

  if (titleEl)  titleEl.textContent = title;
  if (msgEl)    msgEl.textContent   = message;
  if (iconEl)   iconEl.textContent  = icon;

  dialog.showModal();

  const yesBtn = document.getElementById('confirm-yes');
  const noBtn  = document.getElementById('confirm-no');

  // Replace to clear old listeners
  const newYes = yesBtn.cloneNode(true);
  const newNo  = noBtn.cloneNode(true);
  yesBtn.replaceWith(newYes);
  noBtn.replaceWith(newNo);

  newYes.addEventListener('click', () => { dialog.close(); onYes(); });
  newNo.addEventListener('click',  () => dialog.close());
  dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); }, { once: true });
}

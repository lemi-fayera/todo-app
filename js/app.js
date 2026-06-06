// ============================================================
//  app.js — Entry point. Wires everything together.
// ============================================================
import { state } from './data.js';
import { loadFromStorage } from './storage.js';
import { renderAll, applyTheme } from './render.js';
import {
  setupAddTask, setupTaskList, setupFilters,
  setupBulkActions, setupThemeToggle,
  setupKeyboardShortcuts, setupDragAndDrop
} from './events.js';

function init() {
  // 1. Detect system color scheme preference (first visit)
  if (!localStorage.getItem('taskflow-v1')) {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      state.theme = 'dark';
    }
  }

  // 2. Load persisted state
  loadFromStorage();

  // 3. Apply theme before any render (avoid flash)
  applyTheme();

  // 4. Set sort select to saved value
  const sortSel = document.getElementById('sort-select');
  if (sortSel) sortSel.value = state.sortBy;

  // 5. First render
  renderAll();

  // 6. Wire all events
  setupAddTask();
  setupTaskList();
  setupFilters();
  setupBulkActions();
  setupThemeToggle();
  setupKeyboardShortcuts();
  setupDragAndDrop();

  // 7. Focus the task input on load (desktop only)
  if (window.innerWidth > 640) {
    document.getElementById('task-input')?.focus();
  }

  // 8. Add shake keyframe dynamically (CSS-in-JS for animation)
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shake {
      0%,100%{transform:translateX(0)}
      20%{transform:translateX(-6px)}
      40%{transform:translateX(6px)}
      60%{transform:translateX(-4px)}
      80%{transform:translateX(4px)}
    }
    .shake { animation: shake 350ms ease; }
  `;
  document.head.appendChild(style);
}

document.addEventListener('DOMContentLoaded', init);

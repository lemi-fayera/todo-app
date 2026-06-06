// ============================================================
//  notifications.js — Toast notification system
// ============================================================

const ICONS = {
  success: '✅',
  danger:  '🗑️',
  warning: '⚠️',
  info:    'ℹ️',
};

export function showToast(message, type = 'success', duration = 3200) {
  const container = document.getElementById('toast-container');

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.innerHTML = `
    <span class="toast-icon" aria-hidden="true">${ICONS[type] ?? 'ℹ️'}</span>
    <span class="toast-text">${escapeHTML(message)}</span>
  `;

  toast.addEventListener('click', () => dismiss(toast));

  container.appendChild(toast);

  // Trigger enter (double rAF so initial state is painted first)
  requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('visible')));

  const timer = setTimeout(() => dismiss(toast), duration);
  toast._timer = timer;
}

function dismiss(toast) {
  clearTimeout(toast._timer);
  toast.classList.remove('visible');
  toast.classList.add('hiding');
  toast.addEventListener('transitionend', () => toast.remove(), { once: true });
}

function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}

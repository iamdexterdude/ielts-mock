export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export const esc = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Inline markup from test-data: **bold**. Other HTML in the data (e.g. <i>) is trusted.
export const md = (s) => String(s ?? '').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

// Build an element from an HTML string (single root).
export function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

export function clock(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
}

export function minutesLeft(ms) {
  const m = Math.ceil(ms / 60000);
  return m <= 1 ? 'less than a minute' : `${m} minutes`;
}

export const wordCount = (text) => {
  const t = String(text ?? '').trim();
  return t ? t.split(/\s+/).length : 0;
};

export function randomId(len = 16) {
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  return [...bytes].map((b) => b.toString(36).padStart(2, '0')).join('').slice(0, len);
}

export function debounce(fn, ms) {
  let t;
  const wrapped = (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
  wrapped.flush = (...args) => {
    clearTimeout(t);
    fn(...args);
  };
  return wrapped;
}

// Toast messages (top of screen). kind: 'info' | 'warn' | 'alert'
export function toast(message, { kind = 'info', ms = 4200 } = {}) {
  const host = document.getElementById('toasts');
  if (!host) return;
  const node = el(`<div class="toast toast-${kind}" role="status"></div>`);
  node.textContent = message;
  host.append(node);
  requestAnimationFrame(() => node.classList.add('in'));
  setTimeout(() => {
    node.classList.remove('in');
    setTimeout(() => node.remove(), 300);
  }, ms);
}

// Modal dialog. Resolves with the value of the clicked button.
export function dialog({ title, body, actions }) {
  return new Promise((resolve) => {
    const node = el(`<div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div class="modal-card">
        <h2 id="modal-title"></h2>
        <div class="modal-body"></div>
        <div class="modal-actions"></div>
      </div>
    </div>`);
    $('#modal-title', node).textContent = title;
    $('.modal-body', node).innerHTML = body;
    const row = $('.modal-actions', node);
    for (const a of actions) {
      const b = el(`<button type="button" class="btn ${a.primary ? 'btn-primary' : 'btn-quiet'}"></button>`);
      b.textContent = a.label;
      b.addEventListener('click', () => {
        node.remove();
        resolve(a.value);
      });
      row.append(b);
    }
    document.body.append(node);
    const primary = $('.btn-primary', row) || $('button', row);
    primary?.focus();
    node.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const cancel = actions.find((a) => a.cancel);
        if (cancel) {
          node.remove();
          resolve(cancel.value);
        }
      }
    });
  });
}

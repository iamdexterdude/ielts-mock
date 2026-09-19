// Drag-and-drop matching (options box → answer slots), as in the computer
// test. Also works by tapping: pick an option, then a slot (or the reverse),
// and from the keyboard (Enter to pick/place, Delete to clear a slot).
import { md, esc } from './util.js';

export function attachMatching(node, g, ctx) {
  const pool = node.querySelector('.pool');
  const chips = [...pool.querySelectorAll('.chip')];
  const slots = [...node.querySelectorAll('.slot')];
  const text = Object.fromEntries(g.options);
  const summary = Boolean(g.summary);
  let armed = null; // { kind: 'chip', key } | { kind: 'slot', q }
  let drag = null;
  let suppressClick = false;

  for (const s of slots) s.dataset.key = ctx.answers[Number(s.dataset.q)] || '';

  function render() {
    const used = new Set(slots.map((s) => s.dataset.key).filter(Boolean));
    for (const chip of chips) {
      chip.classList.toggle('used', used.has(chip.dataset.key));
      chip.classList.toggle('armed', armed?.kind === 'chip' && armed.key === chip.dataset.key);
      chip.setAttribute('aria-pressed', String(armed?.kind === 'chip' && armed.key === chip.dataset.key));
    }
    for (const s of slots) {
      const k = s.dataset.key;
      const q = s.dataset.q;
      s.classList.toggle('filled', Boolean(k));
      s.classList.toggle('armed', armed?.kind === 'slot' && armed.q === q);
      if (k) {
        const label = summary ? `<span class="slot-text">${md(text[k])}</span>` : `<span class="chip-key">${k}</span><span class="slot-text">${md(text[k])}</span>`;
        s.innerHTML = `${label}<span class="slot-clear" title="Clear">×</span>`;
        s.setAttribute('aria-label', `Question ${q}: ${k}, ${esc(text[k])}. Press Delete to clear.`);
      } else {
        s.innerHTML = `<span class="slot-num">${q}</span>`;
        s.setAttribute('aria-label', `Question ${q}: no answer yet`);
      }
    }
    node.classList.toggle('has-armed', Boolean(armed));
  }

  function assign(q, key) {
    q = String(q);
    for (const s of slots) {
      if (key && s.dataset.key === key && s.dataset.q !== q) {
        s.dataset.key = '';
        ctx.onAnswer(Number(s.dataset.q), '');
      }
    }
    const slot = slots.find((s) => s.dataset.q === q);
    if (!slot) return;
    slot.dataset.key = key || '';
    ctx.onAnswer(Number(q), key || '');
    render();
  }

  // ---- tap / keyboard ----
  node.addEventListener('click', (e) => {
    if (suppressClick) return;
    const clear = e.target.closest('.slot-clear');
    const chip = e.target.closest('.chip');
    const slot = e.target.closest('.slot');
    if (clear && slot) {
      assign(slot.dataset.q, '');
      armed = null;
      render();
      return;
    }
    if (chip && pool.contains(chip)) {
      if (armed?.kind === 'slot') {
        const q = armed.q;
        armed = null;
        assign(q, chip.dataset.key);
        slots.find((s) => s.dataset.q === q)?.focus();
        return;
      }
      armed = armed?.kind === 'chip' && armed.key === chip.dataset.key ? null : { kind: 'chip', key: chip.dataset.key };
      render();
      return;
    }
    if (slot) {
      if (armed?.kind === 'chip') {
        const key = armed.key;
        armed = null;
        assign(slot.dataset.q, key);
        return;
      }
      armed = armed?.kind === 'slot' && armed.q === slot.dataset.q ? null : { kind: 'slot', q: slot.dataset.q };
      render();
    }
  });

  node.addEventListener('keydown', (e) => {
    const slot = e.target.closest('.slot');
    if (slot && (e.key === 'Delete' || e.key === 'Backspace') && slot.dataset.key) {
      e.preventDefault();
      assign(slot.dataset.q, '');
    } else if (e.key === 'Escape' && armed) {
      armed = null;
      render();
    }
  });

  // ---- pointer drag ----
  node.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || node.closest('[inert]')) return;
    const chip = e.target.closest('.chip');
    const slot = e.target.closest('.slot');
    let key = null;
    let fromQ = null;
    if (chip && pool.contains(chip)) key = chip.dataset.key;
    else if (slot && slot.dataset.key && !e.target.closest('.slot-clear')) {
      key = slot.dataset.key;
      fromQ = slot.dataset.q;
    }
    if (!key) return;
    drag = { key, fromQ, x: e.clientX, y: e.clientY, id: e.pointerId, moved: false, ghost: null, over: null };
  });

  const move = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    if (!drag.moved) {
      if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 6) return;
      drag.moved = true;
      drag.ghost = document.createElement('div');
      drag.ghost.className = 'drag-ghost';
      drag.ghost.innerHTML = `<span class="chip-key">${drag.key}</span><span>${md(text[drag.key])}</span>`;
      document.body.append(drag.ghost);
      document.body.classList.add('is-dragging');
      armed = null;
      render();
    }
    e.preventDefault();
    drag.ghost.style.transform = `translate(${e.clientX + 10}px, ${e.clientY + 12}px)`;
    const hit = document.elementFromPoint(e.clientX, e.clientY);
    const over = hit && hit.closest('.slot');
    const target = over && node.contains(over) ? over : null;
    if (target !== drag.over) {
      drag.over?.classList.remove('drop-hover');
      target?.classList.add('drop-hover');
      drag.over = target;
    }
  };

  const end = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag;
    drag = null;
    if (!d.moved) return;
    d.ghost.remove();
    d.over?.classList.remove('drop-hover');
    document.body.classList.remove('is-dragging');
    if (e.type === 'pointerup') {
      if (d.over) assign(d.over.dataset.q, d.key);
      else if (d.fromQ) assign(d.fromQ, ''); // dragged out of a slot: back to the box
    }
    suppressClick = true;
    setTimeout(() => (suppressClick = false), 0);
  };

  window.addEventListener('pointermove', move, { passive: false });
  window.addEventListener('pointerup', end);
  window.addEventListener('pointercancel', end);

  render();
}

// Test controls, only with ?debug=ielts-dev in the URL. Moves the clock of
// the current step forward so a full run can be checked in minutes.
import { store } from './store.js';
import { el } from './util.js';

export function mountDebug({ player }) {
  const panel = el(`<div class="debug" aria-hidden="true">
    <strong>debug</strong>
    <button data-skip="60">+1 min</button>
    <button data-skip="300">+5 min</button>
    <button data-left="12">12 s left</button>
    <button data-reset>reset</button>
  </div>`);
  const shift = (ms) => {
    const s = store.state;
    if (!s) return;
    if (s.phase.startsWith('break:')) s.breakEndsAt -= ms;
    const sec = s.sections[s.phase];
    if (sec) {
      sec.startedAt -= ms;
      sec.endsAt -= ms;
      if (sec.audioEndsAt) sec.audioEndsAt -= ms;
    }
    store.saveNow();
  };
  panel.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const s = store.state;
    if (b.dataset.skip) shift(Number(b.dataset.skip) * 1000);
    if (b.dataset.left && s) {
      const sec = s.sections[s.phase];
      const end = sec ? (sec.audioEndsAt && Date.now() < sec.audioEndsAt ? sec.audioEndsAt : sec.endsAt) : s.breakEndsAt;
      shift(end - Date.now() - Number(b.dataset.left) * 1000);
    }
    if (b.dataset.reset !== undefined) {
      store.state = null;
      store.clear();
      location.href = location.pathname + location.search;
    }
  });
  document.body.append(panel);
  window.__ielts = { store, player };
}

// The exam frame shared by all three sections, modelled on the computer-
// delivered IELTS screen: candidate + timer bar on top, the part's
// instructions under it, and the question navigator along the bottom.
import { el, $, $$, clock, esc } from './util.js';
import { store } from './store.js';
import { questionTarget } from './questions.js';

export const ICONS = {
  volume: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 9v6h4l5 4V5L8 9zm12.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z"/></svg>',
  flag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6 3h2v18H6zM9 4h10l-2.5 4L19 12H9z"/></svg>',
  prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M15.4 5.4 14 4l-8 8 8 8 1.4-1.4L8.8 12z"/></svg>',
  next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="m8.6 5.4 1.4-1.4 8 8-8 8-1.4-1.4 6.6-6.6z"/></svg>',
};

export function applySettings() {
  const { size, contrast } = store.state?.settings || {};
  document.documentElement.dataset.size = size || 'standard';
  document.documentElement.dataset.contrast = contrast || 'default';
}

export function createShell(opts) {
  const s = store.state;
  const root = el(`<div class="exam" data-section="${opts.section}">
    <header class="topbar">
      <div class="tb-cand">
        <span class="wordmark" aria-hidden="true">IELTS<span>mock</span></span>
        <div class="tb-who"><strong class="tb-name"></strong><span>Candidate no. ${esc(s.candidate.number)}</span></div>
      </div>
      <button type="button" class="timer" title="Hide or show the time">
        <span class="timer-sec">${esc(opts.sectionLabel)}</span>
        <span class="timer-val" role="timer" aria-live="off">--:--</span>
        <span class="timer-left">left</span>
        <span class="timer-hidden">Show time</span>
      </button>
      <div class="tb-tools">
        ${opts.volume ? `<label class="vol" title="Volume">${ICONS.volume}<input type="range" min="0" max="1" step="0.05" aria-label="Volume"></label>` : ''}
        <button type="button" class="icon-btn settings-btn" aria-haspopup="dialog" aria-expanded="false" aria-label="Text size and colours"><span aria-hidden="true">Aa</span></button>
        <button type="button" class="btn btn-finish">${esc(opts.submitLabel)}</button>
      </div>
      <div class="settings-pop" role="dialog" aria-label="Display settings" hidden>
        <fieldset><legend>Text size</legend>
          <label><input type="radio" name="set-size" value="standard"> Standard</label>
          <label><input type="radio" name="set-size" value="large"> Large</label>
          <label><input type="radio" name="set-size" value="xlarge"> Extra large</label>
        </fieldset>
        <fieldset><legend>Colours</legend>
          <label><input type="radio" name="set-contrast" value="default"> Black on white</label>
          <label><input type="radio" name="set-contrast" value="wob"> White on black</label>
          <label><input type="radio" name="set-contrast" value="yob"> Yellow on black</label>
        </fieldset>
      </div>
    </header>
    <div class="partbar"><strong class="pb-label"></strong><span class="pb-intro"></span></div>
    <div class="notebar" hidden></div>
    <main class="stage"></main>
    <nav class="qnav" aria-label="Question navigator">
      <div class="qnav-parts"></div>
      <div class="qnav-tools">
        ${opts.navMode === 'questions' ? `<button type="button" class="flag-btn" aria-pressed="false" title="Mark this question to review later">${ICONS.flag}<span>Review</span></button>` : ''}
        <button type="button" class="arrow prev" aria-label="Previous">${ICONS.prev}</button>
        <button type="button" class="arrow next" aria-label="Next">${ICONS.next}</button>
      </div>
    </nav>
  </div>`);

  $('.tb-name', root).textContent = s.candidate.name;
  const stage = $('.stage', root);
  const partsEl = $('.qnav-parts', root);
  const timerBtn = $('.timer', root);
  const timerVal = $('.timer-val', root);
  const note = $('.notebar', root);
  const flagBtn = $('.flag-btn', root);
  const finishBtn = $('.btn-finish', root);
  const pop = $('.settings-pop', root);
  const setBtn = $('.settings-btn', root);

  const api = {
    root,
    stage,
    part: 0,
    current: opts.parts[0].qs ? opts.parts[0].qs[0] : null,
    locked: false,
  };

  // ---- settings ----
  for (const r of $$('input[name=set-size]', pop)) r.checked = r.value === s.settings.size;
  for (const r of $$('input[name=set-contrast]', pop)) r.checked = r.value === s.settings.contrast;
  pop.addEventListener('change', (e) => {
    if (e.target.name === 'set-size') s.settings.size = e.target.value;
    if (e.target.name === 'set-contrast') s.settings.contrast = e.target.value;
    applySettings();
    store.save();
  });
  setBtn.addEventListener('click', () => {
    pop.hidden = !pop.hidden;
    setBtn.setAttribute('aria-expanded', String(!pop.hidden));
  });
  document.addEventListener('mousedown', (e) => {
    if (!pop.hidden && !pop.contains(e.target) && !setBtn.contains(e.target)) {
      pop.hidden = true;
      setBtn.setAttribute('aria-expanded', 'false');
    }
  });

  // ---- volume ----
  if (opts.volume) {
    const range = $('.vol input', root);
    range.value = String(s.settings.volume ?? 0.85);
    range.addEventListener('input', () => {
      s.settings.volume = Number(range.value);
      opts.volume(Number(range.value));
      store.save();
    });
  }

  // ---- timer ----
  timerBtn.addEventListener('click', () => timerBtn.classList.toggle('is-hidden'));
  api.setTime = (ms) => {
    timerVal.textContent = clock(ms);
    timerBtn.classList.toggle('is-warn', ms <= 5 * 60000);
    timerBtn.classList.toggle('is-final', ms <= 60000);
    if (ms <= 60000) timerBtn.classList.remove('is-hidden');
  };

  api.setNote = (html, kind = 'info') => {
    note.hidden = !html;
    note.className = `notebar notebar-${kind}`;
    note.innerHTML = html || '';
  };

  api.setFinishEnabled = (on) => {
    finishBtn.disabled = !on;
  };
  finishBtn.addEventListener('click', () => opts.onSubmit());

  // ---- navigation ----
  function partOf(q) {
    return opts.parts.findIndex((p) => p.qs && p.qs.includes(q));
  }

  api.refresh = () => {
    partsEl.innerHTML = opts.parts
      .map((p, i) => {
        const active = i === api.part;
        const cls = `qnav-part${active ? ' is-active' : ''}`;
        if (opts.navMode === 'tasks') {
          return `<div class="${cls}"><button type="button" class="qnav-label" data-part="${i}" aria-current="${active}">${esc(p.label)}</button><span class="qnav-count">${opts.words(i)} words</span></div>`;
        }
        const answered = p.qs.filter((q) => opts.isAnswered(q)).length;
        const inner = active
          ? `<div class="qnav-nums">${p.qs
              .map((q) => {
                const a = opts.isAnswered(q);
                const f = opts.isFlagged(q);
                const c = `qn-btn${a ? ' is-answered' : ''}${f ? ' is-flagged' : ''}${q === api.current ? ' is-current' : ''}`;
                return `<button type="button" class="${c}" data-q="${q}" aria-label="Question ${q}${a ? ', answered' : ''}${f ? ', marked for review' : ''}">${q}</button>`;
              })
              .join('')}</div>`
          : `<span class="qnav-count">${answered} of ${p.qs.length}</span>`;
        return `<div class="${cls}"><button type="button" class="qnav-label" data-part="${i}" aria-current="${active}">${esc(p.label)}</button>${inner}</div>`;
      })
      .join('');
    if (flagBtn) {
      const f = api.current != null && opts.isFlagged(api.current);
      flagBtn.setAttribute('aria-pressed', String(Boolean(f)));
      flagBtn.classList.toggle('on', Boolean(f));
    }
  };

  api.setPart = (i, { focus = false } = {}) => {
    i = Math.max(0, Math.min(opts.parts.length - 1, i));
    const changed = i !== api.part;
    api.part = i;
    for (const node of stage.querySelectorAll(':scope > [data-part]')) node.hidden = Number(node.dataset.part) !== i;
    $('.pb-label', root).textContent = opts.parts[i].label;
    $('.pb-intro', root).textContent = opts.parts[i].intro;
    if (changed && opts.parts[i].qs && !opts.parts[i].qs.includes(api.current)) api.current = opts.parts[i].qs[0];
    api.refresh();
    opts.onPart?.(i);
    if (focus && opts.navMode === 'tasks') opts.focusTask?.(i);
  };

  api.goTo = (q) => {
    const p = partOf(q);
    if (p < 0) return;
    api.current = q;
    api.setPart(p);
    const container = stage.querySelector(`:scope > [data-part="${p}"]`);
    const target = questionTarget(container, q);
    if (target && container.showPane && target.closest('.pane-right')) container.showPane('right');
    if (target) {
      target.scrollIntoView({ block: 'center', behavior: 'smooth' });
      target.focus({ preventScroll: true });
    }
    api.refresh();
  };

  api.setCurrent = (q) => {
    if (q == null || q === api.current) return;
    api.current = q;
    api.refresh();
  };

  partsEl.addEventListener('click', (e) => {
    const qb = e.target.closest('.qn-btn');
    const pb = e.target.closest('.qnav-label');
    if (qb) api.goTo(Number(qb.dataset.q));
    else if (pb) {
      const i = Number(pb.dataset.part);
      if (opts.navMode === 'tasks') api.setPart(i, { focus: true });
      else api.goTo(opts.parts[i].qs[0]);
    }
  });

  const step = (dir) => {
    if (opts.navMode === 'tasks') return api.setPart(api.part + dir, { focus: true });
    const all = opts.parts.flatMap((p) => p.qs);
    const idx = all.indexOf(api.current);
    const next = all[Math.max(0, Math.min(all.length - 1, idx + dir))];
    if (next != null) api.goTo(next);
  };
  $('.arrow.prev', root).addEventListener('click', () => step(-1));
  $('.arrow.next', root).addEventListener('click', () => step(1));
  flagBtn?.addEventListener('click', () => {
    if (api.current == null) return;
    opts.onToggleFlag(api.current);
    api.refresh();
  });

  // Track the question the candidate is working on.
  stage.addEventListener('focusin', (e) => {
    const host = e.target.closest('[data-q]');
    if (host) api.setCurrent(Number(host.dataset.q));
  });

  api.lock = () => {
    api.locked = true;
    root.classList.add('is-locked');
    stage.inert = true;
    $('.qnav', root).inert = true;
    finishBtn.disabled = true;
    if (document.activeElement && root.contains(document.activeElement)) document.activeElement.blur();
  };

  return api;
}

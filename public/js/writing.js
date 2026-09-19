// Writing section: two tasks, 60 minutes, live word count. Text can be moved
// around inside an answer, but pasting from outside the test is blocked.
import { TEST } from './test-data.js';
import { store } from './store.js';
import { createShell } from './shell.js';
import { createSplit } from './split.js';
import { PLAN_1950, PLAN_TODAY } from './maps.js';
import { el, md, toast, dialog, wordCount, debounce } from './util.js';

const NO_ASSIST = 'autocomplete="off" autocorrect="off" autocapitalize="sentences" spellcheck="false" data-gramm="false" data-gramm_editor="false" data-enable-grammarly="false"';

const pair = (cls = '') => `<div class="plans-pair ${cls}">
  <div class="plan"><span class="plan-year">1950</span>${PLAN_1950}</div>
  <div class="plan"><span class="plan-year">Today</span>${PLAN_TODAY}</div>
</div>`;

// The time and word guidance sits in the part bar above, as in the computer test.
function taskHtml(t) {
  const lines = (arr) => (arr || []).map((p) => `<p>${md(p)}</p>`).join('');
  const box = t.topic ? `${lines(t.prompt)}<div class="task-box">${lines(t.topic)}</div>${lines(t.after)}` : `<div class="task-box">${lines(t.prompt)}</div>`;
  const figure =
    t.figure === 'beechwood'
      ? `<figure class="plans">
          <figcaption><span>Beechwood Farm</span><button type="button" class="btn btn-quiet plans-zoom">View larger</button></figcaption>
          ${pair()}
        </figure>`
      : '';
  return `<div class="task">${box}${figure}</div>`;
}

function openViewer() {
  const node = el(`<div class="viewer" role="dialog" aria-modal="true" aria-label="Beechwood Farm plans">
    <div class="viewer-top"><strong>Beechwood Farm</strong><button type="button" class="btn btn-quiet viewer-close">Close</button></div>
    ${pair('plans-pair-lg')}
  </div>`);
  const close = () => {
    node.remove();
    document.removeEventListener('keydown', onKey);
  };
  const onKey = (e) => {
    if (e.key === 'Escape') close();
  };
  node.querySelector('.viewer-close').addEventListener('click', close);
  node.addEventListener('click', (e) => {
    if (e.target === node) close();
  });
  document.addEventListener('keydown', onKey);
  document.body.append(node);
  node.querySelector('.viewer-close').focus();
}

export function mountWriting({ onDone }) {
  const s = store.state;
  const sec = s.sections.writing;
  const W = TEST.writing;
  let finished = false;
  const warned = new Set();
  const areas = [];

  const shell = createShell({
    section: 'writing',
    sectionLabel: 'Writing',
    navMode: 'tasks',
    parts: W.tasks.map((t) => ({ label: t.label, intro: t.intro, qs: null })),
    words: (i) => wordCount(sec.texts[i + 1]),
    focusTask: (i) => areas[i]?.focus({ preventScroll: true }),
    submitLabel: 'Finish writing',
    onSubmit: async () => {
      const w1 = wordCount(sec.texts[1]);
      const w2 = wordCount(sec.texts[2]);
      const ok = await dialog({
        title: 'Finish the test?',
        body: `<p>Task 1: <strong>${w1}</strong> words. Task 2: <strong>${w2}</strong> words.</p><p>Your essays will be sent to your teacher and you won’t be able to change them.</p>`,
        actions: [
          { label: 'Keep writing', value: false, cancel: true },
          { label: 'Finish and send', value: true, primary: true },
        ],
      });
      if (ok) finish('early');
    },
  });

  const refreshNav = debounce(() => shell.refresh(), 300);
  let internalClip = '';

  W.tasks.forEach((t, i) => {
    const n = i + 1;
    const left = el(`<div class="pane-inner pane-task">${taskHtml(t)}</div>`);
    const right = el(`<div class="answer">
      <textarea class="essay" aria-label="Your answer for Writing ${t.label}" ${NO_ASSIST}></textarea>
      <div class="answer-foot"><span class="wc"><strong>0</strong> words</span><span class="wc-target">at least ${t.minWords}</span></div>
    </div>`);
    const area = right.querySelector('textarea');
    const wc = right.querySelector('.wc strong');
    const foot = right.querySelector('.answer-foot');
    areas.push(area);
    area.value = sec.texts[n] || '';

    const count = () => {
      const c = wordCount(area.value);
      wc.textContent = String(c);
      foot.classList.toggle('met', c >= t.minWords);
    };
    count();
    area.addEventListener('input', () => {
      sec.texts[n] = area.value;
      store.save();
      count();
      refreshNav();
    });
    const remember = () => {
      internalClip = area.value.slice(area.selectionStart, area.selectionEnd);
    };
    area.addEventListener('copy', remember);
    area.addEventListener('cut', remember);
    area.addEventListener('paste', (e) => {
      const text = e.clipboardData?.getData('text/plain') ?? '';
      if (text && text === internalClip) return;
      e.preventDefault();
      sec.pasteBlocked = (sec.pasteBlocked || 0) + 1;
      store.save();
      toast('Pasting text from outside the test is turned off. Type your answer instead.', { kind: 'warn' });
    });
    area.addEventListener('drop', (e) => {
      const text = e.dataTransfer?.getData('text/plain') ?? '';
      if (text && text === internalClip) return;
      e.preventDefault();
    });

    const split = createSplit({ part: i, left, right, leftLabel: 'Task', rightLabel: 'Your answer', ratio: n === 1 ? 0.62 : 0.46 });
    shell.stage.append(split);
    left.querySelector('.plans-zoom')?.addEventListener('click', openViewer);
    left.querySelector('.plans-pair')?.addEventListener('click', openViewer);
  });

  function finish(reason) {
    if (finished) return;
    finished = true;
    clearInterval(tick);
    areas.forEach((a, i) => (sec.texts[i + 1] = a.value));
    sec.submittedAt = reason === 'time' ? Math.min(Date.now(), sec.endsAt) : Date.now();
    sec.endReason = reason;
    shell.lock();
    for (const a of areas) a.readOnly = true;
    store.saveNow();
    onDone(reason);
  }

  const tick = setInterval(update, 250);
  function update() {
    const left = sec.endsAt - Date.now();
    shell.setTime(left);
    if (left <= 0) return finish('time');
    for (const [min, text] of [[10, '10 minutes left.'], [5, '5 minutes left.'], [1, '1 minute left. Your essays are saved automatically.']]) {
      if (left <= min * 60000 && left > min * 60000 - 5000 && !warned.has(min)) {
        warned.add(min);
        toast(text, { kind: min === 1 ? 'alert' : 'warn', ms: 6000 });
      }
    }
  }

  shell.setPart(0);
  update();
  return { root: shell.root, shell, finish };
}

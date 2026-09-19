// Reading section: passage and questions side by side, 60 minutes.
import { TEST, questionNumbers } from './test-data.js';
import { store } from './store.js';
import { createShell } from './shell.js';
import { renderGroups } from './questions.js';
import { enableHighlighting } from './highlight.js';
import { createSplit } from './split.js';
import { el, esc, toast, dialog } from './util.js';

const LETTERS = 'ABCDEFGHIJ';

function passageHtml(p, n) {
  const paras = p.paragraphs
    .map((text, i) => (p.lettered ? `<p class="lettered"><span class="para-letter">${LETTERS[i]}</span>${text}</p>` : `<p>${text}</p>`))
    .join('');
  return `<article class="passage">
    <p class="passage-kicker">Reading Passage ${n}</p>
    <h2>${esc(p.title)}</h2>
    ${p.subtitle ? `<p class="passage-sub">${esc(p.subtitle)}</p>` : ''}
    ${paras}
    ${p.footnote ? `<p class="passage-foot">${esc(p.footnote)}</p>` : ''}
  </article>`;
}

export function mountReading({ onDone }) {
  const s = store.state;
  const sec = s.sections.reading;
  const R = TEST.reading;
  let finished = false;
  const warned = new Set();

  const shell = createShell({
    section: 'reading',
    sectionLabel: 'Reading',
    navMode: 'questions',
    parts: R.parts.map((p) => ({ label: p.label, intro: p.intro, qs: questionNumbers(p) })),
    submitLabel: 'Finish reading',
    isAnswered: (q) => Boolean(String(sec.answers[q] || '').trim()),
    isFlagged: (q) => sec.flags.includes(q),
    onToggleFlag: (q) => {
      sec.flags = sec.flags.includes(q) ? sec.flags.filter((x) => x !== q) : [...sec.flags, q];
      store.save();
    },
    onSubmit: async () => {
      const unanswered = R.parts.flatMap(questionNumbers).filter((q) => !String(sec.answers[q] || '').trim()).length;
      const ok = await dialog({
        title: 'Finish the Reading section?',
        body: `<p>${unanswered ? `You have <strong>${unanswered}</strong> unanswered question${unanswered === 1 ? '' : 's'}. ` : ''}You won’t be able to return to this section.</p>`,
        actions: [
          { label: 'Keep working', value: false, cancel: true },
          { label: 'Finish reading', value: true, primary: true },
        ],
      });
      if (ok) finish('early');
    },
  });

  const ctx = {
    answers: sec.answers,
    onAnswer: (q, v) => {
      sec.answers[q] = v;
      store.save();
      shell.refresh();
    },
    onNotice: (m) => toast(m, { kind: 'warn' }),
  };

  R.parts.forEach((part, i) => {
    const passage = el(`<div class="pane-inner">${passageHtml(part.passage, i + 1)}</div>`);
    const questions = el(`<div class="pane-inner"></div>`);
    questions.append(renderGroups(part.groups, ctx));
    const split = createSplit({ part: i, left: passage, right: questions, leftLabel: 'Passage', rightLabel: 'Questions', ratio: 0.5 });
    shell.stage.append(split);
    enableHighlighting(passage.querySelector('.passage'));
  });

  // When a question is chosen from the navigator on a narrow screen, show the questions.
  shell.stage.addEventListener('focusin', (e) => {
    const split = e.target.closest('.split');
    if (split && e.target.closest('.pane-right') && split.dataset.show !== 'right') split.showPane('right');
  });

  function finish(reason) {
    if (finished) return;
    finished = true;
    clearInterval(tick);
    sec.submittedAt = reason === 'time' ? Math.min(Date.now(), sec.endsAt) : Date.now();
    sec.endReason = reason;
    shell.lock();
    store.saveNow();
    onDone(reason);
  }

  const tick = setInterval(update, 250);
  function update() {
    const left = sec.endsAt - Date.now();
    shell.setTime(left);
    if (left <= 0) return finish('time');
    for (const [min, text] of [[10, '10 minutes left.'], [5, '5 minutes left.'], [1, '1 minute left. Your answers are saved automatically.']]) {
      if (left <= min * 60000 && left > (min * 60000 - 5000) && !warned.has(min)) {
        warned.add(min);
        toast(text, { kind: min === 1 ? 'alert' : 'warn', ms: 6000 });
      }
    }
  }

  shell.setPart(0);
  update();
  return { root: shell.root, shell, finish };
}

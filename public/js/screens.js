// Screens around the exam: welcome, the pause between sections, "time is
// up", and the finish screen.
import { TEST, questionNumbers } from './test-data.js';
import { store } from './store.js';
import { onOutboxChange, flush } from './api.js';
import { playTestSound } from './audio.js';
import { el, $, esc, clock } from './util.js';
import { ICONS } from './shell.js';

const listeningMinutes = () =>
  Math.round((TEST.listening.tracks.reduce((a, t) => a + t.duration, 0) + TEST.listening.reviewSeconds) / 60);

// ---- welcome ----------------------------------------------------------------

export function welcomeScreen({ player, onStart }) {
  const lm = listeningMinutes();
  const totalMin = lm + TEST.reading.minutes + TEST.writing.minutes + 2;
  const node = el(`<div class="screen welcome">
    <header class="wl-bar">
      <span class="wordmark">IELTS<span>mock</span></span>
      <span class="wl-source">${esc(TEST.source)}</span>
    </header>
    <main class="wl-main">
      <section class="wl-lead">
        <h1>Academic mock test</h1>
        <p class="wl-sub">Listening, Reading and Writing in one sitting, timed like the computer-delivered IELTS. When you finish, your answers go straight to your teacher.</p>
        <div class="namecard">
          <label for="cand-name">Candidate name</label>
          <input id="cand-name" class="name-boxes" maxlength="26" autocomplete="name" autocapitalize="characters" spellcheck="false" data-gramm="false">
          <p class="namecard-hint">Write your full name. Your teacher sees it on your results.</p>
        </div>
        <div class="start-row">
          <button type="button" class="btn btn-start" disabled>Start the test</button>
          <p class="start-note" aria-live="polite"></p>
        </div>
      </section>
      <aside class="wl-side">
        <section class="card plan">
          <h2>The test</h2>
          <ol class="plan-list">
            <li><span class="plan-n">1</span><div><strong>Listening</strong><span>4 parts, 40 questions. The recording plays once.</span></div><span class="plan-t">${lm} min</span></li>
            <li><span class="plan-n">2</span><div><strong>Reading</strong><span>3 passages, 40 questions.</span></div><span class="plan-t">${TEST.reading.minutes} min</span></li>
            <li><span class="plan-n">3</span><div><strong>Writing</strong><span>Task 1 report and Task 2 essay.</span></div><span class="plan-t">${TEST.writing.minutes} min</span></li>
          </ol>
          <p class="plan-total">About ${Math.floor(totalMin / 60)} hours ${totalMin % 60} minutes in total, with a one-minute pause between sections.</p>
        </section>
        <section class="card soundcheck">
          <h2>Sound check</h2>
          <p>Put on your headphones, play the sound and set a comfortable volume.</p>
          <div class="sc-row">
            <button type="button" class="btn btn-quiet sc-play">Play test sound</button>
            <label class="vol">${ICONS.volume}<input type="range" min="0" max="1" step="0.05" value="0.85" aria-label="Volume"></label>
          </div>
          <div class="sc-load"><div class="sc-meter"><span></span></div><p class="sc-status">Loading the recording…</p></div>
        </section>
        <section class="card rules">
          <h2>Rules</h2>
          <ul>
            <li>The recording can’t be paused, rewound or replayed.</li>
            <li>Each section closes when its time runs out, and you can’t go back to it.</li>
            <li>Stay on this page. Leaving it is recorded in your results.</li>
            <li>Pasting text into your essays is turned off.</li>
          </ul>
        </section>
      </aside>
    </main>
  </div>`);

  const input = $('#cand-name', node);
  const start = $('.btn-start', node);
  const note = $('.start-note', node);
  const meter = $('.sc-meter span', node);
  const status = $('.sc-status', node);
  const vol = $('.vol input', node);
  let loaded = player.ready;
  let failed = false;

  const nameOk = () => input.value.trim().replace(/\s+/g, ' ').length >= 2;
  const refresh = () => {
    const ok = nameOk() && loaded;
    start.disabled = !ok;
    if (failed) note.textContent = 'The recording didn’t load. Check your internet connection, then reload the page.';
    else if (!nameOk()) note.textContent = 'Write your name to begin.';
    else if (!loaded) note.textContent = 'Waiting for the recording to finish loading…';
    else note.textContent = 'The recording and the timer start as soon as you press Start.';
  };

  input.addEventListener('input', refresh);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !start.disabled) start.click();
  });
  $('.sc-play', node).addEventListener('click', () => playTestSound(Number(vol.value)));
  start.addEventListener('click', () => {
    if (start.disabled) return;
    start.disabled = true;
    onStart(input.value.trim().replace(/\s+/g, ' '), Number(vol.value));
  });

  const done = () => {
    loaded = true;
    meter.style.width = '100%';
    node.querySelector('.sc-load').classList.add('ok');
    status.textContent = 'Recording loaded';
    refresh();
  };
  if (player.ready) done();
  else {
    player
      .preload((f) => {
        meter.style.width = `${Math.round(f * 100)}%`;
        status.textContent = `Loading the recording… ${Math.round(f * 100)}%`;
      })
      .then(done)
      .catch(() => {
        failed = true;
        status.textContent = 'Couldn’t load the recording.';
        refresh();
      });
  }
  refresh();
  setTimeout(() => input.focus(), 50);
  return node;
}

// ---- pause between sections -----------------------------------------------

const NEXT = {
  reading: { title: 'Reading', what: `3 passages, 40 questions, ${TEST.reading.minutes} minutes.`, prev: 'Listening' },
  writing: { title: 'Writing', what: `2 tasks, ${TEST.writing.minutes} minutes. Spend about 20 minutes on Task 1 and 40 on Task 2.`, prev: 'Reading' },
};

export function interludeScreen({ next, onGo }) {
  const s = store.state;
  const info = NEXT[next];
  const prevKey = info.prev.toLowerCase();
  const answered = Object.values(s.sections[prevKey].answers).filter((v) => String(v || '').trim()).length;
  const total = TEST[prevKey].parts.flatMap(questionNumbers).length;
  const node = el(`<div class="screen interlude">
    <div class="il-card">
      <p class="il-done"><span class="tick" aria-hidden="true"></span>${info.prev} finished. You answered ${answered} of ${total} questions.</p>
      <h1>Next: ${info.title}</h1>
      <p class="il-what">${info.what}</p>
      <div class="il-count"><span class="il-num">1:00</span><span>until ${info.title} starts</span></div>
      <button type="button" class="btn btn-start">Start ${info.title} now</button>
    </div>
  </div>`);
  const num = $('.il-num', node);
  let gone = false;
  const go = () => {
    if (gone) return;
    gone = true;
    clearInterval(t);
    onGo();
  };
  const t = setInterval(() => {
    const left = s.breakEndsAt - Date.now();
    num.textContent = clock(left);
    if (left <= 0) go();
  }, 250);
  num.textContent = clock(s.breakEndsAt - Date.now());
  $('.btn-start', node).addEventListener('click', go);
  setTimeout(() => $('.btn-start', node).focus(), 50);
  return node;
}

// ---- time up ------------------------------------------------------------------

export function timeUpOverlay(section, reason) {
  const node = el(`<div class="timeup" role="alertdialog" aria-live="assertive">
    <div class="timeup-card">
      <h2>${reason === 'time' ? 'Time is up' : `${section} finished`}</h2>
      <p>Your ${section} answers have been saved. You can’t change them now.</p>
    </div>
  </div>`);
  document.body.append(node);
  return () => node.remove();
}

// ---- finish -------------------------------------------------------------------

const DELIVERY = [
  ['listening', 'Listening answers'],
  ['reading', 'Reading answers'],
  ['final', 'Writing and full report'],
];

export function doneScreen() {
  const s = store.state;
  const first = s.candidate.name.split(' ')[0];
  const node = el(`<div class="screen done">
    <div class="done-card">
      <svg class="done-mark" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24"/><path d="M15 27l7 7 15-16"/></svg>
      <h1>Test complete</h1>
      <p class="done-lead">Well done, ${esc(first)}. Your answers are going to your teacher.</p>
      <ul class="delivery">${DELIVERY.map(([k, label]) => `<li data-type="${k}"><span>${label}</span><span class="st">Waiting</span></li>`).join('')}</ul>
      <p class="done-note"></p>
      <button type="button" class="btn btn-quiet dl" hidden>Download a copy of my answers</button>
    </div>
  </div>`);

  const noteEl = $('.done-note', node);
  const dl = $('.dl', node);
  const firstShown = Date.now();

  const render = () => {
    const box = s.outbox;
    let allSent = true;
    let trouble = false;
    for (const [k] of DELIVERY) {
      const item = box.find((i) => i.type === k);
      const li = node.querySelector(`[data-type="${k}"]`);
      const st = li.querySelector('.st');
      li.className = '';
      if (item?.sent && !item.failed) {
        st.textContent = 'Sent';
        li.classList.add('ok');
      } else if (item?.failed) {
        st.textContent = 'Not accepted';
        li.classList.add('bad');
        allSent = false;
        trouble = true;
      } else {
        st.textContent = item && item.tries ? 'Retrying…' : 'Sending…';
        li.classList.add('wait');
        allSent = false;
        if (item && item.tries >= 2) trouble = true;
      }
    }
    node.querySelector('.done-lead').textContent = allSent
      ? `Well done, ${first}. Your answers have been sent to your teacher.`
      : `Well done, ${first}. Your answers are on their way to your teacher.`;
    if (allSent) noteEl.textContent = 'Everything has been delivered. You can close this page.';
    else if (trouble) noteEl.textContent = 'We’re having trouble reaching the server. Keep this page open and connected; it keeps trying. If it doesn’t work, download a copy and send it to your teacher.';
    else noteEl.textContent = 'Keep this page open until everything shows Sent.';
    dl.hidden = !(trouble || (!allSent && Date.now() - firstShown > 45000));
  };

  dl.addEventListener('click', () => {
    const data = {
      candidate: s.candidate,
      attemptId: s.attemptId,
      test: TEST.source,
      listening: s.sections.listening.answers,
      reading: s.sections.reading.answers,
      writing: s.sections.writing.texts,
      timing: Object.fromEntries(Object.entries(s.sections).map(([k, v]) => [k, { startedAt: v.startedAt, submittedAt: v.submittedAt, endReason: v.endReason }])),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ielts-mock-${s.candidate.name.replace(/\s+/g, '-')}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  });

  onOutboxChange(render);
  setInterval(render, 5000);
  render();
  flush();
  return node;
}

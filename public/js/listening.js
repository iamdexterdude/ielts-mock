// Listening section: the recording drives the parts; when it ends there are
// two minutes to check answers, then the section locks.
import { TEST, questionNumbers } from './test-data.js';
import { store } from './store.js';
import { createShell } from './shell.js';
import { renderGroups } from './questions.js';
import { el, toast, dialog, clock } from './util.js';

export function mountListening({ player, fresh, onDone }) {
  const s = store.state;
  const sec = s.sections.listening;
  const L = TEST.listening;
  let finished = false;
  let phase = 'audio';
  let lastSync = 0;
  let warned30 = false;

  const shell = createShell({
    section: 'listening',
    sectionLabel: 'Listening',
    navMode: 'questions',
    parts: L.parts.map((p) => ({ label: p.label, intro: p.intro, qs: questionNumbers(p) })),
    submitLabel: 'Finish listening',
    isAnswered: (q) => Boolean(String(sec.answers[q] || '').trim()),
    isFlagged: (q) => sec.flags.includes(q),
    onToggleFlag: (q) => {
      sec.flags = sec.flags.includes(q) ? sec.flags.filter((x) => x !== q) : [...sec.flags, q];
      store.save();
    },
    volume: (v) => player.setVolume(v),
    onSubmit: async () => {
      if (phase !== 'review') return;
      const ok = await dialog({
        title: 'Finish the Listening section?',
        body: '<p>You won’t be able to return to these questions.</p>',
        actions: [
          { label: 'Keep checking', value: false, cancel: true },
          { label: 'Finish listening', value: true, primary: true },
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

  L.parts.forEach((part, i) => {
    const pane = el(`<div class="pane pane-single" data-part="${i}" hidden><div class="pane-inner"></div></div>`);
    pane.firstElementChild.append(renderGroups(part.groups, ctx));
    shell.stage.append(pane);
  });

  player.setVolume(s.settings.volume ?? 0.85);
  player.onTrackChange = (i) => {
    if (i !== shell.part) {
      shell.setPart(i);
      shell.stage.querySelector(`[data-part="${i}"]`)?.scrollTo({ top: 0 });
      if (!fresh || i > 0) toast(`${L.parts[i].label} is starting.`);
    }
  };
  player.onEnded = () => enterReview();
  player.onNeedsGesture = () => askToContinue();

  function enterReview() {
    if (phase === 'review' || finished) return;
    phase = 'review';
    player.stop();
    shell.setFinishEnabled(true);
    shell.setNote(`<strong>The recording has finished.</strong> Check your answers. The Listening section closes when the timer reaches zero.`, 'info');
  }

  let continueOpen = false;
  function askToContinue() {
    if (continueOpen || finished) return;
    continueOpen = true;
    const node = el(`<div class="modal"><div class="modal-card">
      <h2>The recording is still playing</h2>
      <p>You were away from the test, and the recording kept going, just as it does in the exam room. Continue to rejoin it where it is now.</p>
      <div class="modal-actions"><button type="button" class="btn btn-primary">Continue listening</button></div>
    </div></div>`);
    const btn = node.querySelector('button');
    if (!player.ready) {
      btn.disabled = true;
      btn.textContent = 'Loading the recording…';
      const wait = setInterval(() => {
        if (!player.ready) return;
        clearInterval(wait);
        btn.disabled = false;
        btn.textContent = 'Continue listening';
        btn.focus();
      }, 300);
    }
    btn.addEventListener('click', () => {
      node.remove();
      continueOpen = false;
      const pos = (Date.now() - sec.startedAt) / 1000;
      if (!player.active) player.startAt(pos);
      else player.syncTo(pos);
    });
    document.body.append(node);
    btn.focus();
  }

  function finish(reason) {
    if (finished) return;
    finished = true;
    clearInterval(tick);
    player.stop();
    sec.submittedAt = reason === 'time' ? Math.min(Date.now(), sec.endsAt) : Date.now();
    sec.endReason = reason;
    shell.lock();
    store.saveNow();
    onDone(reason);
  }

  const tick = setInterval(update, 250);
  function update() {
    const now = Date.now();
    const left = sec.endsAt - now;
    shell.setTime(left);
    if (left <= 0) return finish('time');
    if (phase === 'audio') {
      if (now >= sec.audioEndsAt) return enterReview();
      // Keep the recording in step with the exam clock.
      if (player.active && now - lastSync > 1000) {
        lastSync = now;
        const expected = (now - sec.startedAt) / 1000;
        if (Math.abs(player.position() - expected) > 3) player.syncTo(expected);
      }
    } else if (!warned30 && left <= 30000) {
      warned30 = true;
      toast('30 seconds left to check your Listening answers.', { kind: 'warn' });
    }
    if (phase === 'review') {
      shell.setNote(`<strong>The recording has finished.</strong> Check your answers. The section closes in ${clock(left)}.`, 'info');
    }
  }

  // Start or rejoin the recording.
  const now = Date.now();
  if (now < sec.audioEndsAt) {
    const pos = (now - sec.startedAt) / 1000;
    shell.setPart(player.locate(pos).index);
    shell.setFinishEnabled(false);
    if (fresh) player.startAt(pos);
    else askToContinue();
  } else {
    shell.setPart(0);
    enterReview();
  }
  update();

  return {
    root: shell.root,
    shell,
    finish,
    get phase() {
      return phase;
    },
  };
}

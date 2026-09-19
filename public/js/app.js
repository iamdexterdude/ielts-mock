// Flow: welcome → Listening → pause → Reading → pause → Writing → done.
// Every step is saved, so a reload lands the candidate back in the same place
// with the clock still running.
import { TEST } from './test-data.js';
import { store, newState } from './store.js';
import { sendEvent, flush } from './api.js';
import { ListeningPlayer } from './audio.js';
import { applySettings } from './shell.js';
import { mountListening } from './listening.js';
import { mountReading } from './reading.js';
import { mountWriting } from './writing.js';
import { welcomeScreen, interludeScreen, timeUpOverlay, doneScreen } from './screens.js';
import { toast } from './util.js';
import { mountDebug } from './debug.js';

const app = document.getElementById('app');
const player = new ListeningPlayer(TEST.listening.tracks);
const BREAK_MS = 60_000;
const ACTIVE = new Set(['listening', 'reading', 'writing']);
let section = null; // the mounted section controller

function show(node) {
  app.replaceChildren(node);
  window.scrollTo(0, 0);
}

// ---- starting --------------------------------------------------------------

function begin(name, volume) {
  const s = (store.state = newState(name));
  s.settings.volume = volume;
  const now = Date.now();
  const L = s.sections.listening;
  L.startedAt = now;
  L.audioEndsAt = now + Math.round(player.total * 1000);
  L.endsAt = L.audioEndsAt + TEST.listening.reviewSeconds * 1000;
  s.phase = 'listening';
  store.saveNow();
  applySettings();
  openListening(true); // starts the recording inside the click
  document.documentElement.requestFullscreen?.().catch(() => {});
  sendEvent('start');
}

function openListening(fresh) {
  section = mountListening({ player, fresh, onDone: (reason) => closeSection('listening', reason) });
  show(section.root);
}

function openReading() {
  section = mountReading({ onDone: (reason) => closeSection('reading', reason) });
  show(section.root);
}

function openWriting() {
  section = mountWriting({ onDone: (reason) => closeSection('writing', reason) });
  show(section.root);
}

function startSection(name) {
  const s = store.state;
  const sec = s.sections[name];
  sec.startedAt = Date.now();
  sec.endsAt = sec.startedAt + TEST[name].minutes * 60_000;
  s.phase = name;
  store.saveNow();
  name === 'reading' ? openReading() : openWriting();
}

// ---- finishing a section ------------------------------------------------------

const NEXT = { listening: 'reading', reading: 'writing' };
const LABEL = { listening: 'Listening', reading: 'Reading', writing: 'Writing' };

function closeSection(name, reason, { quiet = false } = {}) {
  const s = store.state;
  section = null;
  endAway();
  sendEvent(name === 'writing' ? 'final' : name);
  const next = NEXT[name];
  if (next) {
    s.phase = `break:${next}`;
    s.breakEndsAt = Date.now() + BREAK_MS;
  } else {
    s.phase = 'done';
  }
  store.saveNow();
  const proceed = () => (next ? openBreak(next) : show(doneScreen()));
  if (quiet) return proceed();
  const hide = timeUpOverlay(LABEL[name], reason);
  setTimeout(() => {
    hide();
    proceed();
  }, 2600);
}

function openBreak(next) {
  show(interludeScreen({ next, onGo: () => startSection(next) }));
}

// Called on load when a section's time ran out while the page was closed.
function expire(name) {
  const sec = store.state.sections[name];
  sec.submittedAt = sec.endsAt;
  sec.endReason = 'time';
  closeSection(name, 'time', { quiet: true });
}

// ---- resuming after a reload ------------------------------------------------------

function resume() {
  const s = store.state;
  const now = Date.now();
  applySettings();
  if (ACTIVE.has(s.phase) || s.phase.startsWith('break:')) {
    s.integrity.reloads += 1;
    store.saveNow();
  }
  switch (s.phase) {
    case 'listening': {
      const L = s.sections.listening;
      if (now >= L.endsAt) return expire('listening');
      if (now < L.audioEndsAt) player.preload().catch(() => toast('The recording could not load. Check your connection and reload.', { kind: 'alert', ms: 10000 }));
      return openListening(false);
    }
    case 'reading':
      if (now >= s.sections.reading.endsAt) return expire('reading');
      return openReading();
    case 'writing':
      if (now >= s.sections.writing.endsAt) return expire('writing');
      return openWriting();
    case 'break:reading':
    case 'break:writing': {
      const next = s.phase.split(':')[1];
      // A pause that ran out while the page was closed restarts, rather than
      // starting a section the candidate isn't looking at.
      if (now >= s.breakEndsAt) s.breakEndsAt = now + BREAK_MS;
      store.saveNow();
      return openBreak(next);
    }
    case 'done':
      return show(doneScreen());
    default:
      store.clear();
      store.state = null;
      return show(welcomeScreen({ player, onStart: begin }));
  }
}

// ---- leaving the page ----------------------------------------------------------------

let awayAt = 0;
function startAway() {
  const s = store.state;
  if (!s || !ACTIVE.has(s.phase) || awayAt) return;
  awayAt = Date.now();
}
function endAway() {
  const s = store.state;
  if (!awayAt || !s) return;
  const ms = Date.now() - awayAt;
  awayAt = 0;
  if (!ACTIVE.has(s.phase) || ms < 1500) return;
  const away = s.sections[s.phase].away;
  away.count += 1;
  away.ms += ms;
  store.saveNow();
  toast('You left the test page. This is recorded in your results.', { kind: 'warn', ms: 5000 });
}
document.addEventListener('visibilitychange', () => (document.hidden ? startAway() : endAway()));
window.addEventListener('blur', startAway);
window.addEventListener('focus', endAway);

window.addEventListener('beforeunload', (e) => {
  const s = store.state;
  store.saveNow();
  if (s && s.phase !== 'done') {
    e.preventDefault();
    e.returnValue = '';
  }
});

// ---- boot --------------------------------------------------------------------------

const saved = store.load();
if (saved) {
  store.state = saved;
  resume();
  flush();
} else {
  show(welcomeScreen({ player, onStart: begin }));
}

// Test controls exist only on a local dev server, never on the live site.
const local = ['localhost', '127.0.0.1'].includes(location.hostname);
if (local && new URLSearchParams(location.search).get('debug') === 'ielts-dev') {
  mountDebug({ player, getSection: () => section });
}

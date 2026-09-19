// Attempt state, persisted to localStorage so a reload resumes the test
// exactly where it was (with the clock still running).
import { TEST } from './test-data.js';
import { debounce, randomId } from './util.js';

const KEY = `ielts-mock:${TEST.id}`;

function emptySection() {
  return { startedAt: 0, endsAt: 0, submittedAt: 0, endReason: '', answers: {}, flags: [], away: { count: 0, ms: 0 } };
}

export function newState(name) {
  const attemptId = randomId(16);
  const number = String(100000 + (parseInt(attemptId.slice(0, 6), 36) % 900000));
  return {
    v: 1,
    testId: TEST.id,
    attemptId,
    candidate: { name, number },
    createdAt: Date.now(),
    phase: 'welcome',
    breakEndsAt: 0,
    sections: {
      listening: { ...emptySection(), audioEndsAt: 0 },
      reading: emptySection(),
      writing: { ...emptySection(), texts: { 1: '', 2: '' }, pasteBlocked: 0 },
    },
    integrity: { reloads: 0 },
    settings: { size: 'standard', contrast: 'default', volume: 0.85 },
    outbox: [],
  };
}

export const store = {
  state: null,

  load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const s = JSON.parse(raw);
      return s && s.v === 1 && s.testId === TEST.id ? s : null;
    } catch {
      return null;
    }
  },

  saveNow() {
    if (!this.state) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(this.state));
    } catch {
      // Storage full or blocked: the test still works, it just can't resume after a reload.
    }
  },

  clear() {
    try {
      localStorage.removeItem(KEY);
    } catch {}
  },
};

store.save = debounce(() => store.saveNow(), 250);

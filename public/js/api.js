// Outbox for results. Every event is stored with the attempt before it is
// sent, and retried with backoff until the server accepts it — so a flaky
// connection or a reload never loses a section's answers.
import { store } from './store.js';
import { randomId } from './util.js';

const listeners = new Set();
let timer = 0;
let flushing = false;

export const onOutboxChange = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
const notify = () => listeners.forEach((fn) => fn(store.state.outbox));

function snapshot(type) {
  const s = store.state;
  const sec = (name) => {
    const x = s.sections[name];
    const base = {
      startedAt: x.startedAt,
      submittedAt: x.submittedAt,
      endReason: x.endReason,
      away: { ...x.away },
    };
    if (name === 'writing') return { ...base, texts: { ...x.texts }, pasteBlocked: x.pasteBlocked };
    return { ...base, answers: { ...x.answers } };
  };
  return {
    type,
    eventId: randomId(12),
    attemptId: s.attemptId,
    candidate: { ...s.candidate },
    client: { ua: navigator.userAgent, tz: Intl.DateTimeFormat().resolvedOptions().timeZone || '' },
    sections: { listening: sec('listening'), reading: sec('reading'), writing: sec('writing') },
    integrity: { ...s.integrity },
  };
}

export function sendEvent(type) {
  const s = store.state;
  if (s.outbox.some((e) => e.type === type)) return;
  s.outbox.push({ type, body: snapshot(type), tries: 0, sent: false, failed: false, nextAt: 0 });
  store.saveNow();
  notify();
  flush();
}

export async function flush() {
  if (flushing || !store.state) return;
  flushing = true;
  try {
    for (const item of store.state.outbox) {
      if (item.sent) continue;
      if (Date.now() < item.nextAt) break; // keep events in order
      const json = JSON.stringify(item.body);
      try {
        const res = await fetch('/api/event', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: json,
          keepalive: json.length < 60000,
        });
        if (res.ok) {
          item.sent = true;
          item.sentAt = Date.now();
        } else if (res.status >= 400 && res.status < 500 && res.status !== 408 && res.status !== 429) {
          item.sent = true; // the server rejected it; retrying won't help
          item.failed = true;
        } else {
          throw new Error(`HTTP ${res.status}`);
        }
      } catch {
        item.tries += 1;
        item.nextAt = Date.now() + Math.min(60000, 2000 * 2 ** Math.min(item.tries, 5));
        store.saveNow();
        notify();
        break;
      }
      store.saveNow();
      notify();
    }
  } finally {
    flushing = false;
  }
  const pending = store.state.outbox.filter((i) => !i.sent);
  clearTimeout(timer);
  if (pending.length) {
    const wait = Math.max(1000, Math.min(...pending.map((i) => i.nextAt)) - Date.now());
    timer = setTimeout(flush, wait);
  }
}

window.addEventListener('online', () => flush());

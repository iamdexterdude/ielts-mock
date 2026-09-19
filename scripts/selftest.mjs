// Offline checks for scoring, reports and the /api/event handler.
//   node scripts/selftest.mjs
process.env.DRY_RUN = '1';
import assert from 'node:assert/strict';
import { KEY } from '../lib/answer-key.js';
import { band, scoreSection, normText } from '../lib/scoring.js';
import { reportHtml, finalSummary, sectionMessage } from '../lib/report.js';
import { QUESTIONS } from '../lib/questions.js';
import { POST } from '../api/event.js';

const perfect = (section) => {
  const a = {};
  for (const [k, v] of Object.entries(KEY[section])) {
    if (k.includes('-')) { const [x, y] = k.split('-'); a[x] = v[1]; a[y] = v[0]; }
    else a[k] = Array.isArray(v) ? v[0].toUpperCase() + '.' : v.toLowerCase();
  }
  return a;
};

for (const s of ['listening', 'reading']) {
  const r = scoreSection(s, perfect(s));
  assert.equal(r.total, 40, `${s} has 40 questions`);
  assert.equal(r.raw, 40, `${s} perfect answers score 40`);
  assert.equal(r.band, 9);
  assert.equal(scoreSection(s, {}).raw, 0);
  assert.equal(Object.keys(QUESTIONS[s]).length, 40, `${s} question index covers 40`);
}

// pairs: one right, one wrong; duplicates can't double-count
assert.equal(scoreSection('reading', { 23: 'A', 24: 'B' }).raw, 1);
assert.equal(scoreSection('reading', { 23: 'C', 24: 'C' }).raw, 1);
assert.equal(scoreSection('reading', { 25: 'E', 26: 'A' }).raw, 2);
// alternatives and normalisation
assert.equal(scoreSection('listening', { 31: ' Photographs ' }).raw, 1);
assert.equal(scoreSection('listening', { 8: 'a taxi' }).raw, 0, 'extra words are wrong');
assert.equal(scoreSection('reading', { 3: 'Hairs' }).raw, 1);
assert.equal(normText('“Guilt.”'), 'guilt');
// bands
assert.equal(band('listening', 31), 7);
assert.equal(band('listening', 30), 7);
assert.equal(band('listening', 29), 6.5);
assert.equal(band('reading', 30), 7);
assert.equal(band('reading', 33), 7.5);
assert.equal(band('reading', 26), 6);

const payload = {
  type: 'final', attemptId: 'test-attempt', candidate: { name: 'Test <Student>', number: '123456' },
  client: { ua: 'Mozilla/5.0 (Windows NT 10.0) Chrome/140.0', tz: 'Asia/Tashkent' },
  sections: {
    listening: { answers: perfect('listening'), startedAt: Date.now() - 3 * 3600e3, submittedAt: Date.now() - 2.4 * 3600e3, endReason: 'time', away: { count: 0, ms: 0 } },
    reading: { answers: { 1: 'tail', 7: 'TRUE', 23: 'A', 24: 'B' }, startedAt: Date.now() - 2.3 * 3600e3, submittedAt: Date.now() - 1.3 * 3600e3, endReason: 'early', away: { count: 2, ms: 65000 } },
    writing: { texts: { 1: 'The plans show a farm.\n\nIt changed a lot.', 2: 'Long holidays are valuable. '.repeat(60) }, startedAt: Date.now() - 3600e3, submittedAt: Date.now(), endReason: 'time', away: { count: 0, ms: 0 }, pasteBlocked: 1 },
  },
  integrity: { reloads: 1 },
};
const html = reportHtml(payload, { listening: scoreSection('listening', payload.sections.listening.answers), reading: scoreSection('reading', payload.sections.reading.answers) }, Date.now());
assert.ok(html.includes('Test &lt;Student&gt;'), 'name is escaped in report');
assert.ok(!html.includes('<Student>'));
console.log(sectionMessage('reading', payload, scoreSection('reading', payload.sections.reading.answers)));

const req = (body) => new Request('http://x/api/event', { method: 'POST', body: JSON.stringify(body) });
let res = await POST(req(payload));
assert.equal(res.status, 200);
res = await POST(req({ ...payload, type: 'start' }));
assert.equal(res.status, 200);
res = await POST(req({ ...payload, type: 'nope' }));
assert.equal(res.status, 400);
res = await POST(new Request('http://x/api/event', { method: 'POST', body: '{bad' }));
assert.equal(res.status, 400);

console.log('\nall checks passed');

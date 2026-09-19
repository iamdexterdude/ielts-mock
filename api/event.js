// POST /api/event — progress and results from the exam page.
//
//   start      candidate pressed "Start the test"
//   listening  Listening section closed → scored and sent to the teacher
//   reading    Reading section closed  → scored and sent to the teacher
//   final      Writing closed          → summary, both essays, full HTML report
//
// Scoring happens here so the answer key never ships to the browser.
import { scoreSection } from '../lib/scoring.js';
import { essayMessage, finalSummary, reportFilename, reportHtml, sectionMessage, startMessage } from '../lib/report.js';
import { sendDocument, sendMessage } from '../lib/telegram.js';

const TYPES = new Set(['start', 'listening', 'reading', 'final']);
const MAX_BYTES = 300_000;

const bad = (status, error) => Response.json({ ok: false, error }, { status });

function clean(p) {
  const str = (v, max) => String(v ?? '').slice(0, max);
  const answers = (a) => {
    const out = {};
    if (a && typeof a === 'object') {
      for (const [k, v] of Object.entries(a)) {
        const q = Number(k);
        if (Number.isInteger(q) && q >= 1 && q <= 40) out[q] = str(v, 60);
      }
    }
    return out;
  };
  const meta = (m = {}) => ({
    startedAt: Number(m.startedAt) || 0,
    submittedAt: Number(m.submittedAt) || 0,
    endReason: m.endReason === 'time' ? 'time' : m.endReason === 'early' ? 'early' : '',
    away: { count: Number(m.away?.count) || 0, ms: Number(m.away?.ms) || 0 },
  });
  const s = p.sections || {};
  return {
    type: p.type,
    attemptId: str(p.attemptId, 64),
    candidate: { name: str(p.candidate?.name, 80).trim(), number: str(p.candidate?.number, 20) },
    client: { ua: str(p.client?.ua, 300), tz: str(p.client?.tz, 60) },
    sections: {
      listening: { ...meta(s.listening), answers: answers(s.listening?.answers) },
      reading: { ...meta(s.reading), answers: answers(s.reading?.answers) },
      writing: {
        ...meta(s.writing),
        texts: { 1: str(s.writing?.texts?.[1], 40_000), 2: str(s.writing?.texts?.[2], 40_000) },
        pasteBlocked: Number(s.writing?.pasteBlocked) || 0,
      },
    },
    integrity: { reloads: Number(p.integrity?.reloads) || 0 },
  };
}

export async function POST(request) {
  const raw = await request.text();
  if (raw.length > MAX_BYTES) return bad(413, 'too large');
  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return bad(400, 'invalid json');
  }
  if (!body || !TYPES.has(body.type)) return bad(400, 'unknown type');
  if (!body.attemptId || !body.candidate?.name) return bad(400, 'missing candidate');

  const p = clean(body);
  const now = Date.now();

  try {
    if (p.type === 'start') {
      await sendMessage(startMessage(p, now));
    } else if (p.type === 'listening' || p.type === 'reading') {
      const score = scoreSection(p.type, p.sections[p.type].answers);
      await sendMessage(sectionMessage(p.type, p, score));
    } else {
      const scores = {
        listening: scoreSection('listening', p.sections.listening.answers),
        reading: scoreSection('reading', p.sections.reading.answers),
      };
      await sendMessage(finalSummary(p, scores));
      await sendMessage(essayMessage(1, p));
      await sendMessage(essayMessage(2, p));
      await sendDocument(reportFilename(p, now), reportHtml(p, scores, now), `📄 Full report for <b>${p.candidate.name.replace(/[<>&]/g, '')}</b>: every answer, timing and both essays. Open it in a browser.`);
    }
  } catch (err) {
    console.error(`[event:${p.type}]`, err);
    return bad(502, 'could not deliver to Telegram');
  }

  return Response.json({ ok: true });
}

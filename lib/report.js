// Text for the Telegram messages and the standalone HTML report the teacher
// receives when the candidate finishes.
import { countWords, formatBand } from './scoring.js';
import { QUESTIONS, TEST } from './questions.js';
import { escapeHtml as esc } from './telegram.js';

const TZ = process.env.REPORT_TZ || 'Asia/Tashkent';
const SECTION_NAMES = { listening: 'Listening', reading: 'Reading', writing: 'Writing' };

export function formatTime(ms, withDate = false) {
  if (!ms) return '—';
  const opts = { timeZone: TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' };
  if (withDate) Object.assign(opts, { day: 'numeric', month: 'short', year: 'numeric' });
  return new Intl.DateTimeFormat('en-GB', opts).format(new Date(ms));
}

export function formatDuration(ms) {
  if (!Number.isFinite(ms) || ms < 0) return '—';
  const s = Math.round(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h) return m ? `${h} h ${m} min` : `${h} h`;
  if (m) return sec ? `${m} min ${sec} s` : `${m} min`;
  return `${sec} s`;
}

function describeDevice(ua = '') {
  const browser = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'a browser';
  const os = /Windows/.test(ua) ? 'Windows' : /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Mac OS X/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : 'unknown system';
  return `${browser} on ${os}`;
}

function endLine(meta) {
  if (!meta?.submittedAt) return 'not finished';
  const used = formatDuration(meta.submittedAt - meta.startedAt);
  return meta.endReason === 'time' ? `time ran out (${used})` : `submitted early after ${used}`;
}

function awayLine(meta) {
  const a = meta?.away;
  if (!a || !a.count) return 'stayed on the test page';
  return `left the test page ${a.count} time${a.count === 1 ? '' : 's'} (${formatDuration(a.ms)} in total)`;
}

const who = (p) => `${esc(p.candidate?.name || 'Unnamed candidate')} <i>(no. ${esc(p.candidate?.number || '—')})</i>`;

// ---- Telegram messages -----------------------------------------------------

export function startMessage(p, now) {
  return [
    `🟢 ${who(p)} started the mock test`,
    `${esc(TEST.source)}`,
    `Started ${formatTime(now, true)} · ${esc(describeDevice(p.client?.ua))}`,
    p.client?.tz ? `Their time zone: ${esc(p.client.tz)}` : '',
  ].filter(Boolean).join('\n');
}

function wrongList(score) {
  const wrong = score.items.filter((i) => !i.ok).map((i) => i.q);
  if (!wrong.length) return 'All correct.';
  return `Wrong or blank: ${wrong.join(', ')}`;
}

function partBreakdown(section, score) {
  const parts = TEST[section].parts;
  return parts
    .map((part, i) => {
      const qs = score.items.filter((it) => it.q >= part.range[0] && it.q <= part.range[1]);
      return `${part.label}: ${qs.filter((x) => x.ok).length}/${qs.length}`;
    })
    .join(' · ');
}

export function sectionMessage(section, p, score) {
  const meta = p.sections?.[section];
  const icon = section === 'listening' ? '🎧' : '📖';
  return [
    `${icon} <b>${SECTION_NAMES[section]} finished</b> · ${who(p)}`,
    `<b>${score.raw}/40</b> → band <b>${formatBand(score.band)}</b>`,
    partBreakdown(section, score),
    wrongList(score),
    `Ended: ${endLine(meta)}; ${awayLine(meta)}.`,
  ].join('\n');
}

export function finalSummary(p, scores) {
  const w = p.sections?.writing || {};
  const t1 = countWords(w.texts?.[1]);
  const t2 = countWords(w.texts?.[2]);
  const lines = [
    `✅ <b>Test complete</b> · ${who(p)}`,
    '',
    `🎧 Listening  <b>${scores.listening.raw}/40</b> → band <b>${formatBand(scores.listening.band)}</b>`,
    `📖 Reading    <b>${scores.reading.raw}/40</b> → band <b>${formatBand(scores.reading.band)}</b>`,
    `✍️ Writing    Task 1: ${t1} words · Task 2: ${t2} words (for you to mark)`,
    '',
    `Writing ${endLine(w)}; ${awayLine(w)}.`,
  ];
  if (w.pasteBlocked) lines.push(`Blocked ${w.pasteBlocked} attempt${w.pasteBlocked === 1 ? '' : 's'} to paste text from outside the test.`);
  if (p.integrity?.reloads) lines.push(`Reloaded the page ${p.integrity.reloads} time${p.integrity.reloads === 1 ? '' : 's'} during the test.`);
  lines.push('', 'Both essays follow, then the full report as a file.');
  return lines.join('\n');
}

export function essayMessage(n, p) {
  const task = TEST.writing.tasks[n - 1];
  const text = String(p.sections?.writing?.texts?.[n] || '').trim();
  const words = countWords(text);
  const short = words < task.minWords ? ` ⚠️ under ${task.minWords}` : '';
  return [
    `✍️ <b>Writing Task ${n}</b> · ${words} words${short} · ${who(p)}`,
    '',
    text ? esc(text) : '<i>(nothing written)</i>',
  ].join('\n');
}

// ---- HTML report -------------------------------------------------------------

function answerRows(section, score) {
  const qi = QUESTIONS[section];
  const parts = TEST[section].parts;
  return parts
    .map((part, pi) => {
      const rows = score.items
        .filter((it) => it.q >= part.range[0] && it.q <= part.range[1])
        .map((it) => {
          const info = qi[it.q] || {};
          const opt = (v) => (info.options && info.options[v] ? ` <span class="opt">${esc(info.options[v])}</span>` : '');
          const given = it.given ? `${esc(it.given)}${opt(String(it.given).toUpperCase())}` : '<span class="blank">no answer</span>';
          const expected = it.expected.split(' / ').map((e) => esc(e)).join(' / ');
          const expOpt = /^[A-I]$/.test(it.expected) ? opt(it.expected) : '';
          return `<tr class="${it.ok ? 'ok' : 'no'}"><td class="n">${it.q}</td><td class="q">${esc(info.prompt || '')}</td><td>${given}</td><td>${expected}${expOpt}</td><td class="m">${it.ok ? '✓' : '✗'}</td></tr>`;
        })
        .join('');
      const got = score.items.filter((it) => it.q >= part.range[0] && it.q <= part.range[1] && it.ok).length;
      const title = section === 'reading' ? `${part.label}: ${esc(part.passage.title)}` : part.label;
      return `<h3>${title} <span class="count">${got}/${part.range[1] - part.range[0] + 1}</span></h3>
      <table><thead><tr><th>#</th><th>Question</th><th>Answer given</th><th>Correct answer</th><th></th></tr></thead><tbody>${rows}</tbody></table>`;
    })
    .join('');
}

function essayBlock(n, p) {
  const task = TEST.writing.tasks[n - 1];
  const text = String(p.sections?.writing?.texts?.[n] || '').trim();
  const words = countWords(text);
  const prompt = [...task.prompt, ...(task.topic || []), ...(task.after || [])].map((l) => `<p>${esc(l)}</p>`).join('');
  const body = text
    ? text.split(/\n{2,}|\r\n\r\n/).map((para) => `<p>${esc(para).replace(/\n/g, '<br>')}</p>`).join('')
    : '<p class="blank">Nothing was written for this task.</p>';
  return `<section class="essay">
    <h3>Task ${n} <span class="count ${words < task.minWords ? 'short' : ''}">${words} words · minimum ${task.minWords}</span></h3>
    <div class="prompt">${prompt}</div>
    <div class="text">${body}</div>
  </section>`;
}

function pasteLine(n = 0) {
  if (!n) return 'No attempts to paste text from outside the test.';
  return `Pasting text from outside the test was blocked ${n} time${n === 1 ? '' : 's'}.`;
}

function sectionTiming(name, meta) {
  if (!meta?.startedAt) return `<tr><td>${name}</td><td colspan="3">not started</td></tr>`;
  return `<tr><td>${name}</td><td>${formatTime(meta.startedAt)}</td><td>${esc(endLine(meta))}</td><td>${esc(awayLine(meta))}</td></tr>`;
}

export function reportHtml(p, scores, now) {
  const name = p.candidate?.name || 'Unnamed candidate';
  const w = p.sections?.writing || {};
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>IELTS mock results — ${esc(name)}</title>
<style>
  :root{--ink:#1e2126;--muted:#62666e;--rule:#dcddd6;--paper:#f6f6f2;--ok:#2e6b4a;--no:#b3261e;--pencil:#f2b01e}
  *{box-sizing:border-box}
  body{margin:0;background:var(--paper);color:var(--ink);font:15px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif}
  main{max-width:960px;margin:0 auto;padding:32px 20px 64px}
  h1{font-size:28px;line-height:1.2;margin:0 0 4px}
  h2{font-size:20px;margin:40px 0 12px;padding-bottom:6px;border-bottom:2px solid var(--ink)}
  h3{font-size:16px;margin:24px 0 8px;display:flex;gap:10px;align-items:baseline}
  .sub{color:var(--muted);margin:0}
  .scores{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-top:24px}
  .score{background:#fff;border:1px solid var(--rule);border-radius:10px;padding:14px 16px}
  .score b{display:block;font-size:30px;line-height:1.1}
  .score span{color:var(--muted)}
  .score .band{display:inline-block;margin-top:6px;background:var(--pencil);color:var(--ink);font-weight:700;border-radius:6px;padding:1px 8px}
  table{width:100%;border-collapse:collapse;background:#fff;border:1px solid var(--rule);font-size:14px}
  th,td{text-align:left;padding:7px 10px;border-bottom:1px solid var(--rule);vertical-align:top}
  th{background:#eeefe9;font-weight:600}
  td.n{width:36px;font-weight:700}
  td.q{color:var(--muted);width:38%}
  td.m{width:28px;font-weight:700;text-align:center}
  tr.ok td.m{color:var(--ok)} tr.no td.m{color:var(--no)}
  tr.no td:nth-child(3){color:var(--no)}
  .opt{color:var(--muted)}
  .blank{color:var(--muted);font-style:italic}
  .count{font-size:13px;font-weight:600;color:var(--muted)}
  .count.short{color:var(--no)}
  .essay .prompt{background:#fff;border-left:4px solid var(--pencil);padding:8px 14px;color:var(--muted);font-size:14px}
  .essay .prompt p{margin:4px 0}
  .essay .text{background:#fff;border:1px solid var(--rule);border-radius:8px;padding:12px 18px;margin-top:10px;font-size:16px;line-height:1.7}
  footer{margin-top:40px;color:var(--muted);font-size:13px}
  @media print{body{background:#fff}.score,table,.essay .text{break-inside:avoid}}
</style></head>
<body><main>
  <h1>${esc(name)}</h1>
  <p class="sub">Candidate no. ${esc(p.candidate?.number || '—')} · ${esc(TEST.title)} · ${esc(TEST.source)}</p>
  <p class="sub">Started ${formatTime(p.sections?.listening?.startedAt, true)}, report made ${formatTime(now, true)} (${esc(TZ)} time)</p>

  <div class="scores">
    <div class="score"><span>Listening</span><b>${scores.listening.raw}/40</b><span class="band">Band ${formatBand(scores.listening.band)}</span></div>
    <div class="score"><span>Reading</span><b>${scores.reading.raw}/40</b><span class="band">Band ${formatBand(scores.reading.band)}</span></div>
    <div class="score"><span>Writing</span><b>${countWords(w.texts?.[1])} + ${countWords(w.texts?.[2])}</b><span>words in Task 1 + Task 2 — for you to mark</span></div>
  </div>

  <h2>Timing and conduct</h2>
  <table><thead><tr><th>Section</th><th>Started</th><th>Ended</th><th>Focus</th></tr></thead><tbody>
    ${sectionTiming('Listening', p.sections?.listening)}
    ${sectionTiming('Reading', p.sections?.reading)}
    ${sectionTiming('Writing', w)}
  </tbody></table>
  <p class="sub" style="margin-top:8px">${pasteLine(w.pasteBlocked)} Page reloads during the test: ${p.integrity?.reloads || 0}. Device: ${esc(describeDevice(p.client?.ua))}${p.client?.tz ? `, time zone ${esc(p.client.tz)}` : ''}.</p>

  <h2>Writing</h2>
  ${essayBlock(1, p)}
  ${essayBlock(2, p)}

  <h2>Listening answers</h2>
  ${answerRows('listening', scores.listening)}

  <h2>Reading answers</h2>
  ${answerRows('reading', scores.reading)}

  <footer>Bands for Listening and Reading use the standard IELTS raw-score conversion. Typed answers are marked against the answer key, including accepted alternative spellings; check any near-misses in the tables above.</footer>
</main></body></html>`;
}

export function reportFilename(p, now) {
  const safe = String(p.candidate?.name || 'candidate').normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 40) || 'candidate';
  const d = new Date(now).toISOString().slice(0, 10);
  return `IELTS-mock-${safe}-${d}.html`;
}

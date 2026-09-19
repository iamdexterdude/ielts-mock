// Builds, from the public test content, a short prompt for every question
// number plus the option texts, so reports can show answers in context.
import { TEST } from '../public/js/test-data.js';

const plain = (s) => String(s).replace(/\*\*(.+?)\*\*/g, '$1').replace(/<[^>]+>/g, '');

function aroundGap(text, n) {
  const sentences = text.split(/(?<=[.?!])\s+/);
  const hit = sentences.find((s) => s.includes(`{{${n}}}`)) || text;
  return plain(hit)
    .replace(/^(#+|-)\s*/, '')
    .replace(/\{\{(\d+)\}\}/g, (_, k) => (Number(k) === n ? '_____' : '…'));
}

function build(section) {
  const index = {};
  const parts = section === 'writing' ? [] : TEST[section].parts;
  parts.forEach((part, p) => {
    for (const g of part.groups) {
      const options = g.options ? Object.fromEntries(g.options) : null;
      const base = { part: p + 1, type: g.type };
      if (g.type === 'gaps') {
        for (const line of g.lines) {
          for (const m of line.matchAll(/\{\{(\d+)\}\}/g)) {
            const n = Number(m[1]);
            index[n] = { ...base, prompt: aroundGap(line, n) };
          }
        }
      } else if (g.type === 'match' && g.summary) {
        for (const para of g.text) {
          for (const m of para.matchAll(/\{\{(\d+)\}\}/g)) {
            const n = Number(m[1]);
            index[n] = { ...base, prompt: aroundGap(para, n), options };
          }
        }
      } else if (g.type === 'match') {
        for (const [n, text] of g.items) index[n] = { ...base, prompt: plain(text), options };
      } else if (g.type === 'multi') {
        for (let n = g.range[0]; n <= g.range[1]; n++) index[n] = { ...base, prompt: plain(g.stem), options };
      } else {
        for (const q of g.questions) {
          index[q.n] = { ...base, prompt: plain(q.stem), options: q.options ? Object.fromEntries(q.options) : null };
        }
      }
    }
  });
  return index;
}

export const QUESTIONS = { listening: build('listening'), reading: build('reading') };
export { TEST };

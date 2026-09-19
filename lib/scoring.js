import { KEY } from './answer-key.js';

// Raw score → band, from the published IELTS conversion tables
// (Academic Reading uses its own table; Listening is shared by both modules).
const LISTENING_BANDS = [[39, 9], [37, 8.5], [35, 8], [32, 7.5], [30, 7], [26, 6.5], [23, 6], [18, 5.5], [16, 5], [13, 4.5], [10, 4], [8, 3.5], [6, 3], [4, 2.5], [3, 2], [1, 1]];
const READING_BANDS = [[39, 9], [37, 8.5], [35, 8], [33, 7.5], [30, 7], [27, 6.5], [23, 6], [19, 5.5], [15, 5], [13, 4.5], [10, 4], [8, 3.5], [6, 3], [4, 2.5], [3, 2], [1, 1]];

export function band(section, raw) {
  const table = section === 'listening' ? LISTENING_BANDS : READING_BANDS;
  for (const [min, b] of table) if (raw >= min) return b;
  return 0;
}

export const formatBand = (b) => (Number.isInteger(b) ? `${b}.0` : String(b));

export function normText(s) {
  return String(s ?? '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[‘’ʼ`´]/g, "'")
    .replace(/[“”„«»]/g, '"')
    .replace(/[‐-―]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[.,;:!?"'()[\]]+|[.,;:!?"'()[\]]+$/g, '')
    .trim();
}

const normChoice = (s) => String(s ?? '').trim().toUpperCase();

// answers: { "1": "break", "11": "D", "23": "A", "24": "C", ... }
// Returns { raw, total, band, items: [{ q, given, expected, ok }] } in question order.
export function scoreSection(section, answers = {}) {
  const key = KEY[section];
  const items = [];
  let raw = 0;

  for (const [k, expected] of Object.entries(key)) {
    if (k.includes('-')) {
      const qs = k.split('-').map(Number);
      const chosen = qs.map((q) => normChoice(answers[q])).filter(Boolean);
      const seen = new Set();
      qs.forEach((q, i) => {
        const given = chosen[i] || '';
        const ok = Boolean(given) && expected.includes(given) && !seen.has(given);
        if (given) seen.add(given);
        if (ok) raw++;
        items.push({ q, given, expected: `${expected.join(' and ')} (either order)`, ok });
      });
      continue;
    }
    const q = Number(k);
    const given = answers[q] ?? '';
    let ok;
    let shown;
    if (Array.isArray(expected)) {
      ok = normText(given) !== '' && expected.includes(normText(given));
      shown = expected.join(' / ');
    } else {
      ok = normChoice(given) === expected;
      shown = expected;
    }
    if (ok) raw++;
    items.push({ q, given: String(given ?? ''), expected: shown, ok });
  }

  items.sort((a, b) => a.q - b.q);
  return { raw, total: items.length, band: band(section, raw), items };
}

export function countWords(text) {
  const t = String(text ?? '').trim();
  return t ? t.split(/\s+/).length : 0;
}

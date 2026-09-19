// Generates public/js/maps.js — vector redraws of the Writing Task 1 plans
// (Beechwood Farm, 1950 and today). Both plans share one set of base
// coordinates (road, river, fields, farm roads) traced from the source image,
// so the only differences between them are the real changes.
//
//   node scripts/build-maps.mjs

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const W = 955;
const H = 830;
const f = (n) => Math.round(n * 10) / 10;

// Catmull-Rom spline through the points, as cubic Béziers.
function smooth(pts) {
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d;
}
const line = (pts) => 'M' + pts.map((p) => `${f(p[0])} ${f(p[1])}`).join(' L');

const C = {
  ink: '#1f2124',
  line: '#3a3d42',
  road: '#2b2d31',
  river: '#9cc0d6',
  riverInk: '#2f5870',
  trackEdge: '#6b6252',
  trackFill: '#efe5cc',
  roadEdge: '#55585e',
  roadFill: '#f6f6f3',
  building: '#ffffff',
  panel: '#5d7690',
  canopy: '#b9cfa6',
  trunk: '#8a6f55',
};

const FONT = `font-family="'Atkinson Hyperlegible Next', Arial, Helvetica, sans-serif"`;

// ---- base geometry (traced) ------------------------------------------------
const ROAD = [[-40, 322], [0, 297], [29, 279], [104, 233], [179, 193], [254, 150], [329, 102], [404, 49], [454, 12], [500, -24]];
const RIVER = [[-24, 104], [30, 183], [104, 291], [154, 364], [204, 436], [254, 510], [304, 581], [354, 652], [404, 707], [454, 745], [504, 771], [554, 789], [604, 798], [654, 799], [704, 792], [754, 775], [804, 746], [854, 704], [904, 645], [929, 608], [955, 565], [976, 527]];
const BRIDGE = [76, 250];
const DIAG = [[310, 128], [521, 409]];
const EAST = [[515, 408], [962, 371]];
const TRI_L = [548, 406];
const TRI_R = [688, 394];
const TRI_B = [611, 545];
const FIELD_LINES = [
  [[198, 427], [406, 251]], // fruit trees | soft fruits
  [[298, 558], [503, 373]], // soft fruits | vegetables
  [[401, 696], [594, 515]], // vegetables | open land
];

function text(x, y, lines, { size = 33, weight = 600, fill = C.ink, rotate = 0, italic = false, spacing = 0 } = {}) {
  const arr = Array.isArray(lines) ? lines : [lines];
  const lh = size * 1.12;
  const y0 = y - ((arr.length - 1) * lh) / 2;
  const tr = rotate ? ` transform="rotate(${f(rotate)} ${f(x)} ${f(y)})"` : '';
  const st = italic ? ' font-style="italic"' : '';
  const ls = spacing ? ` letter-spacing="${spacing}"` : '';
  const spans = arr
    .map((t, i) => `<tspan x="${f(x)}" y="${f(y0 + i * lh)}">${t}</tspan>`)
    .join('');
  return `<text ${FONT} font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="middle" dominant-baseline="central"${st}${ls}${tr}>${spans}</text>`;
}

function rect(x1, y1, x2, y2, { dashed = false, fill = C.building, sw = 3 } = {}) {
  const dash = dashed ? ' stroke-dasharray="12 8"' : '';
  const fl = dashed ? 'none' : fill;
  return `<rect x="${x1}" y="${y1}" width="${x2 - x1}" height="${y2 - y1}" fill="${fl}" stroke="${C.ink}" stroke-width="${sw}"${dash}/>`;
}

// A rectangle centred on (cx, cy), rotated by `deg`.
function rotRect(cx, cy, w, h, deg, label, labelSize = 26) {
  return `<g transform="rotate(${deg} ${cx} ${cy})">
    <rect x="${f(cx - w / 2)}" y="${f(cy - h / 2)}" width="${w}" height="${h}" fill="${C.building}" stroke="${C.ink}" stroke-width="3"/>
  </g>${label ? text(cx, cy, label, { size: labelSize }) : ''}`;
}

function ground() {
  return `
  <rect x="0" y="0" width="${W}" height="${H}" fill="#fff"/>
  <g stroke="${C.line}" stroke-width="2" fill="none" stroke-linecap="round">
    ${FIELD_LINES.map((l) => `<path d="${line(l)}"/>`).join('')}
  </g>
  <path d="${smooth(RIVER)}" fill="none" stroke="${C.river}" stroke-width="32" stroke-linecap="butt"/>
  ${text(300, 575, 'River', { size: 27, fill: C.riverInk, rotate: 55.6, italic: true, spacing: 1 })}
  ${text(702, 793, 'River', { size: 27, fill: C.riverInk, rotate: -8.5, italic: true, spacing: 1 })}`;
}

// Drawn after the farm roads and buildings so it sits on top of their ends.
function mainRoad() {
  return `
  <circle cx="${BRIDGE[0]}" cy="${BRIDGE[1]}" r="45" fill="${C.road}"/>
  <path d="${smooth(ROAD)}" fill="none" stroke="${C.road}" stroke-width="62"/>
  <path d="${smooth(ROAD)}" fill="none" stroke="#fff" stroke-width="4.5" stroke-dasharray="20 15"/>`;
}

// Farm roads: a dark edge stroke under a lighter inner stroke, so junctions merge.
function farmRoads(paths, { edge, fill, width = 30, inner = 24, miter = false }) {
  const join = miter ? 'miter' : 'round';
  const attrs = `fill="none" stroke-linejoin="${join}" stroke-miterlimit="6"`;
  return `
  <g ${attrs} stroke="${edge}" stroke-width="${width}">${paths.map((d) => `<path d="${d}"/>`).join('')}</g>
  <g ${attrs} stroke="${fill}" stroke-width="${inner}">${paths.map((d) => `<path d="${d}"/>`).join('')}</g>`;
}

const triPath = line([TRI_L, TRI_B, TRI_R]);
const roadLabels = (word, color) => `
  ${text(446, 283, word, { size: 25, weight: 700, fill: color, rotate: 53.2, spacing: 0.5 })}
  ${text(760, 387, word, { size: 25, weight: 700, fill: color, rotate: -4.8, spacing: 0.5 })}
  ${text(575, 470, word, { size: 25, weight: 700, fill: color, rotate: 65.6, spacing: 0.5 })}
  ${text(649, 462, word, { size: 25, weight: 700, fill: color, rotate: -64, spacing: 0.5 })}`;

function frame(inner, title) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${title}">
  <title>${title}</title>
  <defs>
    <clipPath id="clip-${title.replace(/\W+/g, '')}"><rect x="0" y="0" width="${W}" height="${H}"/></clipPath>
    <pattern id="sand" width="14" height="14" patternUnits="userSpaceOnUse">
      <rect width="14" height="14" fill="${C.trackFill}"/>
      <circle cx="3" cy="4" r="1.3" fill="#9b8a63"/>
      <circle cx="10" cy="10" r="1.1" fill="#9b8a63"/>
    </pattern>
  </defs>
  <g clip-path="url(#clip-${title.replace(/\W+/g, '')})">${inner}</g>
  <rect x="1.5" y="1.5" width="${W - 3}" height="${H - 3}" fill="none" stroke="${C.ink}" stroke-width="3"/>
</svg>`;
}

// ---- 1950 ------------------------------------------------------------------
const plan1950 = frame(
  `${ground()}
  ${farmRoads([line(DIAG), line(EAST)], { edge: C.trackEdge, fill: 'url(#sand)' })}
  ${farmRoads([triPath], { edge: C.trackEdge, fill: 'url(#sand)', miter: true })}
  ${mainRoad()}
  ${roadLabels('Track', '#4d4331')}
  ${text(250, 278, ['Fruit', 'trees'])}
  ${text(357, 395, ['Soft', 'fruits'])}
  ${text(466, 515, 'Vegetables')}
  ${text(712, 178, 'Sheep', { size: 38 })}
  ${rect(727, 418, 939, 500)}${text(833, 459, 'Barn', { size: 34 })}
  ${rect(669, 531, 877, 597)}${text(773, 564, 'Farmhouse', { size: 31 })}
  ${rect(669, 628, 785, 718, { dashed: true })}${text(727, 673, 'Chickens', { size: 27 })}`,
  'Beechwood Farm in 1950'
);

// ---- today -------------------------------------------------------------------
function tent(x, y) {
  return `<g stroke="${C.ink}" stroke-width="2.6" stroke-linejoin="round" fill="#fff">
    <path d="M${x - 40} ${y + 24} L${x - 18} ${y - 24} L${x + 30} ${y - 12} L${x + 40} ${y + 24} Z"/>
    <path d="M${x - 40} ${y + 24} L${x - 18} ${y - 24} L${x + 2} ${y + 24} Z"/>
    <path d="M${x - 18} ${y - 24} L${x - 18} ${y + 24}" stroke-width="3.4"/>
  </g>`;
}

function panel(cx, cy) {
  // a tilted solar panel on two legs
  const p = [[cx - 38, cy + 22], [cx - 22, cy - 24], [cx + 34, cy - 24], [cx + 20, cy + 22]];
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  let grid = '';
  for (const t of [1 / 3, 2 / 3]) {
    const a = lerp(p[0], p[1], t);
    const b = lerp(p[3], p[2], t);
    grid += `<path d="M${f(a[0])} ${f(a[1])} L${f(b[0])} ${f(b[1])}"/>`;
  }
  for (const t of [0.25, 0.5, 0.75]) {
    const a = lerp(p[0], p[3], t);
    const b = lerp(p[1], p[2], t);
    grid += `<path d="M${f(a[0])} ${f(a[1])} L${f(b[0])} ${f(b[1])}"/>`;
  }
  return `<g>
    <path d="M${cx + 26} ${cy - 10} L${cx + 26} ${cy + 30} M${cx - 30} ${cy + 22} L${cx - 30} ${cy + 30}" stroke="${C.ink}" stroke-width="3"/>
    <path d="${line(p)} Z" fill="${C.panel}" stroke="${C.ink}" stroke-width="2.6" stroke-linejoin="round"/>
    <g stroke="#c9d6e3" stroke-width="1.4">${grid}</g>
  </g>`;
}

function tree(x, y) {
  return `<g>
    <path d="M${x - 7} ${y + 88} L${x - 4} ${y + 20} L${x + 5} ${y + 20} L${x + 9} ${y + 88} Z" fill="${C.trunk}" stroke="${C.ink}" stroke-width="2.4" stroke-linejoin="round"/>
    <g fill="${C.canopy}" stroke="${C.ink}" stroke-width="2.4">
      <path d="M${x - 40} ${y + 18} C${x - 62} ${y + 10} ${x - 52} ${y - 22} ${x - 30} ${y - 20} C${x - 30} ${y - 46} ${x + 2} ${y - 52} ${x + 12} ${y - 34} C${x + 34} ${y - 44} ${x + 56} ${y - 20} ${x + 42} ${y - 2} C${x + 60} ${y + 12} ${x + 40} ${y + 36} ${x + 22} ${y + 26} C${x + 10} ${y + 40} ${x - 20} ${y + 40} ${x - 26} ${y + 26} C${x - 34} ${y + 30} ${x - 42} ${y + 26} ${x - 40} ${y + 18} Z"/>
    </g>
  </g>`;
}

const STUB = line([[611, 530], [611, 582]]);

const planToday = frame(
  `${ground()}
  <path d="M614 -6 L792 372" stroke="${C.line}" stroke-width="2" fill="none"/>
  ${farmRoads([line(DIAG), line(EAST), triPath, STUB], { edge: C.roadEdge, fill: C.roadFill })}
  ${roadLabels('Road', '#3c3f45')}
  ${text(206, 318, ['Fruit', 'trees'])}
  ${text(357, 395, ['Soft', 'fruits'])}
  ${text(466, 515, 'Vegetables')}
  ${rotRect(311, 232, 90, 90, 53.2, ['Farm', 'shop'], 27)}
  ${rotRect(418, 136, 134, 88, -36.8, 'Parking', 29)}
  ${mainRoad()}
  ${tree(566, 76)}
  ${text(606, 205, ['Camping', 'field'])}
  ${tent(532, 266)}
  ${tent(660, 266)}
  ${text(834, 50, ['Solar', 'panels'])}
  ${panel(782, 132)}${panel(870, 132)}${panel(804, 210)}${panel(892, 210)}
  ${rect(806, 292, 931, 360)}${text(868, 326, 'Parking', { size: 29 })}
  ${rect(727, 418, 939, 500)}
  <path d="M798 418 V500 M868 418 V500" stroke="${C.ink}" stroke-width="3"/>
  ${text(833, 459, ['Holiday', 'cottages'], { size: 28 })}
  ${rect(669, 531, 877, 597)}${text(773, 564, 'Farmhouse', { size: 31 })}
  ${rect(669, 628, 785, 718, { dashed: true })}${text(727, 673, 'Chickens', { size: 27 })}
  ${rect(574, 580, 648, 660)}${text(611, 620, 'Barn', { size: 27 })}`,
  'Beechwood Farm today'
);

const out = `// Generated by scripts/build-maps.mjs — do not edit by hand.
export const PLAN_1950 = ${JSON.stringify(plan1950)};
export const PLAN_TODAY = ${JSON.stringify(planToday)};
`;
const target = fileURLToPath(new URL('../public/js/maps.js', import.meta.url));
writeFileSync(target, out);
writeFileSync(fileURLToPath(new URL('../scripts/.maps-preview.html', import.meta.url)),
  `<!doctype html><meta charset="utf-8"><style>body{margin:0;display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:16px;background:#eee}svg{width:100%;height:auto;background:#fff}</style>${plan1950}${planToday}`);
console.log('wrote', target);

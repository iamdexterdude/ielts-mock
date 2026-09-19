// Renders question groups from test-data into DOM and wires answers to the
// section's answer map. `ctx` = { answers, onAnswer(q, value) }.
import { esc, md, el, $$ } from './util.js';
import { attachMatching } from './dnd.js';

const NO_ASSIST = 'autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" data-gramm="false" data-gramm_editor="false" data-enable-grammarly="false"';

const rangeLabel = (r) => (r[0] === r[1] ? `Question ${r[0]}` : `Questions ${r[0]}–${r[1]}`);

function gap(n) {
  return `<input class="gap" type="text" data-q="${n}" aria-label="Question ${n}" placeholder="${n}" maxlength="40" ${NO_ASSIST}>`;
}

function inline(text) {
  return md(text).replace(/\{\{(\d+)\}\}/g, (_, n) => gap(Number(n)));
}

function renderLines(lines) {
  let html = '';
  let list = [];
  const flush = () => {
    if (list.length) html += `<ul>${list.map((li) => `<li>${li}</li>`).join('')}</ul>`;
    list = [];
  };
  for (const raw of lines) {
    if (raw.startsWith('- ')) {
      list.push(inline(raw.slice(2)));
      continue;
    }
    flush();
    if (raw.startsWith('## ')) html += `<h5 class="notes-sub">${inline(raw.slice(3))}</h5>`;
    else if (raw.startsWith('# ')) html += `<h4 class="notes-head">${inline(raw.slice(2))}</h4>`;
    else html += `<p>${inline(raw)}</p>`;
  }
  flush();
  return html;
}

function groupHead(g) {
  const lines = g.instructions.map((l) => `<p>${md(l)}</p>`).join('');
  return `<header class="group-head"><h3>${rangeLabel(g.range)}</h3>${lines}</header>`;
}

function renderGaps(g) {
  const cls = g.flow ? 'notes notes-flow' : 'notes';
  const title = g.title ? `<h4 class="notes-title">${md(g.title)}</h4>` : '';
  return `${groupHead(g)}<div class="${cls}">${title}${renderLines(g.lines)}</div>`;
}

function optionRow(name, value, key, text, type = 'radio') {
  const keyHtml = key ? `<span class="opt-key">${esc(key)}</span>` : '';
  return `<label class="opt">
    <input type="${type}" name="${name}" value="${esc(value)}">
    <span class="opt-mark" aria-hidden="true"></span>${keyHtml}<span class="opt-text">${md(text)}</span>
  </label>`;
}

function renderChoice(g) {
  const qs = g.questions
    .map(
      (q) => `<div class="q q-choice" data-q="${q.n}" role="radiogroup" aria-labelledby="q${q.n}-stem">
        <p class="q-stem" id="q${q.n}-stem"><span class="qn">${q.n}</span> ${md(q.stem)}</p>
        <div class="opts">${q.options.map(([k, t]) => optionRow(`q${q.n}`, k, k, t)).join('')}</div>
      </div>`
    )
    .join('');
  return `${groupHead(g)}${qs}`;
}

function renderJudge(g) {
  const qs = g.questions
    .map(
      (q) => `<div class="q q-judge" data-q="${q.n}" role="radiogroup" aria-labelledby="q${q.n}-stem">
        <p class="q-stem" id="q${q.n}-stem"><span class="qn">${q.n}</span> ${md(q.stem)}</p>
        <div class="opts opts-inline">${g.scale.map((v) => optionRow(`q${q.n}`, v, '', v)).join('')}</div>
      </div>`
    )
    .join('');
  return `${groupHead(g)}${qs}`;
}

function renderGrid(g) {
  const head = `<div class="grid-row grid-head"><span></span>${g.letters.map((l) => `<span>${l}</span>`).join('')}</div>`;
  const rows = g.questions
    .map(
      (q) => `<div class="grid-row q" data-q="${q.n}" role="radiogroup" aria-labelledby="q${q.n}-stem">
        <p class="q-stem" id="q${q.n}-stem"><span class="qn">${q.n}</span> ${md(q.stem)}</p>
        ${g.letters
          .map(
            (l) => `<label class="cell"><input type="radio" name="q${q.n}" value="${l}" aria-label="Paragraph ${l}"><span aria-hidden="true">${l}</span></label>`
          )
          .join('')}
      </div>`
    )
    .join('');
  return `${groupHead(g)}<div class="grid" style="--cols:${g.letters.length}">${head}${rows}</div>`;
}

function renderMulti(g) {
  const [a, b] = g.range;
  return `${groupHead(g)}<div class="q q-multi" data-q="${a}" data-q2="${b}" data-pick="${g.pick}">
    <p class="q-stem"><span class="qn">${a}–${b}</span> ${md(g.stem)}</p>
    <div class="opts">${g.options.map(([k, t]) => optionRow(`q${a}-${b}`, k, k, t, 'checkbox')).join('')}</div>
  </div>`;
}

function renderMatch(g) {
  const options = g.options
    .map(([k, t]) => `<button type="button" class="chip" data-key="${k}"><span class="chip-key">${k}</span><span class="chip-text">${md(t)}</span></button>`)
    .join('');
  const pool = `<div class="match-options"><h4>${esc(g.optionsTitle)}</h4><div class="pool">${options}</div></div>`;
  if (g.summary) {
    const text = g.text
      .map((p) => `<p>${md(p).replace(/\{\{(\d+)\}\}/g, (_, n) => `<button type="button" class="slot slot-inline" data-q="${n}" aria-label="Question ${n}"><span class="slot-num">${n}</span></button>`)}</p>`)
      .join('');
    return `${groupHead(g)}<div class="match match-summary" data-group="${g.range.join('-')}">
      <div class="notes notes-flow">${g.title ? `<h4 class="notes-title">${md(g.title)}</h4>` : ''}${text}</div>${pool}</div>`;
  }
  const items = g.items
    .map(
      ([n, t]) => `<div class="match-row" data-q="${n}">
        <span class="qn">${n}</span><span class="match-item">${md(t)}</span>
        <button type="button" class="slot" data-q="${n}" aria-label="Question ${n}"><span class="slot-num">${n}</span></button>
      </div>`
    )
    .join('');
  return `${groupHead(g)}<div class="match" data-group="${g.range.join('-')}">
    <div class="match-items"><h4>${esc(g.itemsTitle)}</h4>${items}</div>${pool}</div>`;
}

const RENDERERS = { gaps: renderGaps, choice: renderChoice, judge: renderJudge, grid: renderGrid, multi: renderMulti, match: renderMatch };

// Render all groups of one part. Returns the container element.
export function renderGroups(groups, ctx) {
  const root = el(`<div class="groups"></div>`);
  for (const g of groups) {
    const node = el(`<section class="group group-${g.type}"></section>`);
    node.innerHTML = RENDERERS[g.type](g);
    root.append(node);
    bindGroup(node, g, ctx);
  }
  return root;
}

function bindGroup(node, g, ctx) {
  const { answers } = ctx;

  for (const input of $$('input.gap', node)) {
    const q = Number(input.dataset.q);
    input.value = answers[q] || '';
    input.classList.toggle('filled', Boolean(input.value.trim()));
    input.addEventListener('input', () => {
      input.classList.toggle('filled', Boolean(input.value.trim()));
      ctx.onAnswer(q, input.value);
    });
  }

  if (g.type === 'choice' || g.type === 'judge' || g.type === 'grid') {
    for (const input of $$('input[type=radio]', node)) {
      const q = Number(input.name.slice(1));
      input.checked = answers[q] === input.value;
      input.addEventListener('change', () => {
        if (input.checked) ctx.onAnswer(q, input.value);
      });
    }
  }

  if (g.type === 'multi') {
    const [a, b] = g.range;
    const boxes = $$('input[type=checkbox]', node);
    const current = [answers[a], answers[b]].filter(Boolean);
    for (const box of boxes) box.checked = current.includes(box.value);
    const sync = () => {
      const chosen = boxes.filter((x) => x.checked).map((x) => x.value).sort();
      ctx.onAnswer(a, chosen[0] || '');
      ctx.onAnswer(b, chosen[1] || '');
    };
    for (const box of boxes) {
      box.addEventListener('change', () => {
        if (box.checked && boxes.filter((x) => x.checked).length > g.pick) {
          box.checked = false;
          const q = box.closest('.q-multi');
          q.classList.remove('shake');
          void q.offsetWidth;
          q.classList.add('shake');
          ctx.onNotice?.(`Choose only ${g.pick} answers. Untick one to change your choice.`);
          return;
        }
        sync();
      });
    }
  }

  if (g.type === 'match') attachMatching(node, g, ctx);
}

// Focusable target for a question number inside a rendered part.
export function questionTarget(root, q) {
  return (
    root.querySelector(`input.gap[data-q="${q}"]`) ||
    root.querySelector(`.slot[data-q="${q}"]`) ||
    root.querySelector(`.q[data-q="${q}"] input`) ||
    root.querySelector(`.q-multi[data-q2="${q}"] input`) ||
    root.querySelector(`[data-q="${q}"]`)
  );
}

// Question number for an element that received focus.
export function questionOf(elm) {
  const host = elm.closest('[data-q]');
  if (!host) return null;
  return Number(host.dataset.q);
}

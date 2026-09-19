// Highlighting in reading passages: select text, then choose "Highlight"
// (or right-click the selection, as in the computer test). Click a highlight
// to remove it.
import { el } from './util.js';

let seq = 0;

export function enableHighlighting(container) {
  const tip = el(`<div class="hl-tip" role="toolbar" aria-label="Highlight" hidden>
    <button type="button" data-act="add">Highlight</button>
    <button type="button" data-act="remove">Remove highlight</button>
  </div>`);
  document.body.append(tip);
  let range = null;
  let target = null;

  const hide = () => {
    tip.hidden = true;
    range = null;
    target = null;
  };

  function show(rect, mode) {
    tip.dataset.mode = mode;
    tip.hidden = false;
    const w = tip.offsetWidth;
    const x = Math.min(window.innerWidth - w - 8, Math.max(8, rect.left + rect.width / 2 - w / 2));
    const above = rect.top - tip.offsetHeight - 10;
    const y = above > 60 ? above : rect.bottom + 10;
    tip.style.left = `${x}px`;
    tip.style.top = `${y}px`;
  }

  function selectionInside() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null;
    const r = sel.getRangeAt(0);
    if (!container.contains(r.commonAncestorContainer)) return null;
    if (!r.toString().trim()) return null;
    return r;
  }

  function check() {
    const r = selectionInside();
    if (!r) return;
    range = r.cloneRange();
    target = null;
    show(r.getBoundingClientRect(), 'add');
  }

  container.addEventListener('mouseup', () => setTimeout(check, 0));
  container.addEventListener('keyup', (e) => {
    if (e.shiftKey) check();
  });
  container.addEventListener('touchend', () => setTimeout(check, 350));
  container.addEventListener('contextmenu', (e) => {
    const r = selectionInside();
    const mark = e.target.closest('mark.hl');
    if (r) {
      e.preventDefault();
      check();
    } else if (mark) {
      e.preventDefault();
      target = mark;
      show(mark.getBoundingClientRect(), 'remove');
    }
  });
  container.addEventListener('click', (e) => {
    const mark = e.target.closest('mark.hl');
    const sel = window.getSelection();
    if (mark && (!sel || sel.isCollapsed)) {
      target = mark;
      range = null;
      show(mark.getBoundingClientRect(), 'remove');
    }
  });

  tip.addEventListener('mousedown', (e) => e.preventDefault()); // keep the selection alive
  tip.addEventListener('click', (e) => {
    const act = e.target.closest('button')?.dataset.act;
    if (act === 'add' && range) {
      wrap(range);
      window.getSelection()?.removeAllRanges();
    } else if (act === 'remove' && target) {
      unwrap(container, target.dataset.hl);
    }
    hide();
  });

  document.addEventListener('mousedown', (e) => {
    if (!tip.contains(e.target)) hide();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hide();
  });
  container.closest('.pane')?.addEventListener('scroll', hide, { passive: true });
  return { hide };
}

function textNodesIn(range) {
  const root = range.commonAncestorContainer;
  if (root.nodeType === Node.TEXT_NODE) return [root];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (range.intersectsNode(n) && n.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
  });
  const out = [];
  while (walker.nextNode()) out.push(walker.currentNode);
  return out;
}

function wrap(range) {
  const id = String(++seq);
  const nodes = textNodesIn(range);
  for (const node of nodes) {
    let start = 0;
    let end = node.nodeValue.length;
    if (node === range.startContainer) start = range.startOffset;
    if (node === range.endContainer) end = range.endOffset;
    if (start >= end) continue;
    const middle = node.splitText(start);
    middle.splitText(end - start);
    const mark = document.createElement('mark');
    mark.className = 'hl';
    mark.dataset.hl = id;
    middle.parentNode.insertBefore(mark, middle);
    mark.append(middle);
  }
}

function unwrap(container, id) {
  for (const mark of container.querySelectorAll(`mark.hl[data-hl="${id}"]`)) {
    const parent = mark.parentNode;
    while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
    mark.remove();
    parent.normalize();
  }
}

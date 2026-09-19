// Two resizable panes side by side (passage | questions, task | answer).
// On narrow screens the panes stack and a switch chooses which one shows.
import { el } from './util.js';

export function createSplit({ part, left, right, leftLabel, rightLabel, ratio = 0.5 }) {
  const node = el(`<div class="split" data-part="${part}" hidden style="--left:${ratio * 100}%">
    <div class="split-switch" role="tablist">
      <button type="button" role="tab" class="on" aria-selected="true" data-show="left"></button>
      <button type="button" role="tab" aria-selected="false" data-show="right"></button>
    </div>
    <div class="pane pane-left"></div>
    <div class="divider" role="separator" aria-orientation="vertical" aria-label="Resize" tabindex="0"><span></span></div>
    <div class="pane pane-right"></div>
  </div>`);
  const [bL, bR] = node.querySelectorAll('.split-switch button');
  bL.textContent = leftLabel;
  bR.textContent = rightLabel;
  node.querySelector('.pane-left').append(left);
  node.querySelector('.pane-right').append(right);
  node.dataset.show = 'left';

  node.querySelector('.split-switch').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    node.dataset.show = b.dataset.show;
    for (const x of [bL, bR]) {
      const on = x === b;
      x.classList.toggle('on', on);
      x.setAttribute('aria-selected', String(on));
    }
  });

  const divider = node.querySelector('.divider');
  const set = (frac) => {
    const f = Math.max(0.25, Math.min(0.75, frac));
    node.style.setProperty('--left', `${f * 100}%`);
  };
  divider.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    divider.setPointerCapture(e.pointerId);
    node.classList.add('resizing');
    const rect = node.getBoundingClientRect();
    const moveTo = (ev) => set((ev.clientX - rect.left) / rect.width);
    const up = () => {
      node.classList.remove('resizing');
      divider.removeEventListener('pointermove', moveTo);
      divider.removeEventListener('pointerup', up);
      divider.removeEventListener('pointercancel', up);
    };
    divider.addEventListener('pointermove', moveTo);
    divider.addEventListener('pointerup', up);
    divider.addEventListener('pointercancel', up);
  });
  divider.addEventListener('keydown', (e) => {
    const cur = parseFloat(node.style.getPropertyValue('--left')) / 100 || ratio;
    if (e.key === 'ArrowLeft') set(cur - 0.03);
    if (e.key === 'ArrowRight') set(cur + 0.03);
  });

  // Let the caller switch the narrow-screen view (e.g. to the question pane).
  node.showPane = (which) => node.querySelector(`.split-switch [data-show="${which}"]`)?.click();
  return node;
}

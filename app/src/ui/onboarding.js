// обзор приложения (кнопка «?»): кусочки интерфейса со стрелками-подписями.
// скриншоты-вырезки сняты с реального интерфейса и лежат в public/onboarding;
// показываются в натуральном размере, подпись — под вырезкой со стрелкой.

import { t, onChange } from '../core/i18n.js';

let root = null;

// структура строится при отрисовке: подписи зависят от текущего языка
function buildSections() {
  return [
    {
      title: t('onb.day.title'),
      pieces: [
        { img: 'onboarding/day-input.png', label: t('onb.day.input') },
        { img: 'onboarding/day-card.png', label: t('onb.day.card') },
        { img: 'onboarding/day-free.png', label: t('onb.day.free') },
        { img: 'onboarding/day-side.png', label: t('onb.day.side') },
      ],
    },
    {
      title: t('onb.add.title'),
      pieces: [
        { img: 'onboarding/add-parse.png', label: t('onb.add.parse') },
        { img: 'onboarding/add-types.png', label: t('onb.add.types') },
        { img: 'onboarding/add-chips.png', label: t('onb.add.chips') },
        { img: 'onboarding/add-remind.png', label: t('onb.add.remind') },
      ],
    },
    {
      title: t('onb.areas.title'),
      pieces: [
        { img: 'onboarding/areas-cols.png', label: t('onb.areas.cols') },
        { img: 'onboarding/areas-leaf.png', label: t('onb.areas.leaf') },
        { img: 'onboarding/areas-block.png', label: t('onb.areas.block') },
      ],
    },
    {
      title: t('onb.cal.title'),
      pieces: [
        { img: 'onboarding/cal-dots.png', label: t('onb.cal.dots') },
        { img: 'onboarding/cal-modal.png', label: t('onb.cal.modal') },
      ],
    },
  ];
}

function render() {
  const sections = buildSections()
    .map((s) => `
      <h3>${s.title}</h3>
      ${s.pieces.map((p) => `
        <figure class="onb-piece">
          <div class="onb-shot"><img src="${p.img}" alt="" loading="lazy"></div>
          <svg class="onb-arrow" viewBox="0 0 16 14" aria-hidden="true"><path d="M8 13V4M3.5 7.5 8 3l4.5 4.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <figcaption>${p.label}</figcaption>
        </figure>`).join('')}`)
    .join('');
  root.innerHTML = `
    <div class="modal-overlay">
      <div class="modal-card onb-card">
        <div class="row between modal-head">
          <strong>${t('onb.title')}</strong>
          <button id="onb-close" class="icon-btn" title="${t('common.close')}">✕</button>
        </div>
        <p class="muted">${t('onb.intro')}</p>
        ${sections}
      </div>
    </div>`;
}

export function openOnboarding() {
  if (!root) {
    root = document.createElement('div');
    root.id = 'onb-modal';
    document.body.appendChild(root);
    root.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-overlay') || e.target.closest('#onb-close')) {
        root.innerHTML = '';
      }
    });
    onChange(() => {
      if (root.innerHTML) render();
    });
  }
  render();
}

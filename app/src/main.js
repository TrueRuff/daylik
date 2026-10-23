// Точка входа: вкладки и экраны

import './styles.css';
import { initDayScreen } from './ui/dayScreen.js';
import { initSpheresScreen } from './ui/spheresScreen.js';
import { initInputScreen } from './ui/inputScreen.js';

const screens = {
  day: document.getElementById('tab-day'),
  spheres: document.getElementById('tab-spheres'),
  input: document.getElementById('tab-input'),
};

initDayScreen(screens.day);
initSpheresScreen(screens.spheres);
initInputScreen(screens.input);

const buttons = document.querySelectorAll('nav button');

function showTab(name) {
  for (const [key, el] of Object.entries(screens)) el.hidden = key !== name;
  buttons.forEach((b) => b.classList.toggle('active', b.dataset.tab === name));
  document.dispatchEvent(new CustomEvent('tab-shown', { detail: name }));
}

buttons.forEach((b) => b.addEventListener('click', () => showTab(b.dataset.tab)));
showTab('day');

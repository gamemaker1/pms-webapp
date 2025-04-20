import { fetchSlots, fetchSessions, fetchAnalysis } from './api.js';
import { showLogin, showDashboard, bindAdminForm, bindSlotFilters, renderSlots, renderSessions, renderAnalysis } from './ui.js';

let secret = null;

async function loadSlots(avail = '') {
  try {
    const slots = await fetchSlots(secret, avail);
    renderSlots(slots);
  } catch (e) {
    console.error(e);
    alert(e.message);
  }
}

async function loadSessions() {
  try {
    const sessions = await fetchSessions(secret);
    renderSessions(sessions);
  } catch (err) {
    console.error('Error loading sessions', err);
  }
}

async function loadAnalysis() {
  try {
    const data = await fetchAnalysis(secret);
    renderAnalysis(data);
  } catch (e) {
    console.error(e);
    alert(e.message);
  }
}

async function init() {
  bindAdminForm(s => {
    secret = s;
    localStorage.setItem('secret', s);
    showDashboard(); loadAnalysis();
    loadSlots(); loadSessions();

    refreshData('sessions', loadSessions);
    refreshData('slots', loadSlots);
    refreshData('analysis', loadAnalysis);
  });

  bindSlotFilters(loadSlots);

  const saved = localStorage.getItem('secret');
  if (saved) {
    secret = saved;
    showDashboard(); loadAnalysis();
    loadSlots(); loadSessions();

    refreshData('sessions', loadSessions);
    refreshData('slots', loadSlots);
    refreshData('analysis', loadAnalysis);
  } else showLogin();
}

function refreshData(timerId, fetchFn, ...args) {
  let seconds = 0;
  const fill = document.getElementById(timerId + '-spinner');
  const count = document.getElementById(timerId + '-count');
  const button = document.getElementById(timerId + '-refresh');

  const updateTimer = () => {
    const progress = (seconds / 300) * 100;
    fill.setAttribute('stroke-dasharray', `${progress}, 100`);
    count.textContent = 30 - Math.floor(seconds / 10);
    if (seconds >= 300) {
      fetchFn(...args); seconds = 0;
    } else seconds++;
  };

  setInterval(updateTimer, 100);
  button.addEventListener('click', () => {
    fetchFn(...args); seconds = 0;
    fill.setAttribute('stroke-dasharray', `0, 100`);
    count.textContent = 30;
  });
}

window.addEventListener('DOMContentLoaded', init);

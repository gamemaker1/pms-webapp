// js/payment.js
import { fetchSession, deleteSession, fetchRates } from './api.js';

const timeEl   = document.getElementById('time-stayed');
const rateEl   = document.getElementById('rate');
const totalEl  = document.getElementById('total');
const payBtn   = document.getElementById('pay-btn');
const cancelBtn= document.getElementById('cancel-btn');

let sessionData, sessionToken;

async function init() {
  const token = localStorage.getItem('token');
  if (!token) return location.replace('index.html');
  try {
    const data = await fetchSession(null, token);
    sessionData  = data;
    sessionToken = token;

    const parked = Date.parse(sessionData.parked_at);
    const left = Date.parse(sessionData.left_at);
    const hrs = (left - parked) / 36e5;
    timeEl.textContent = `Time Stayed: ${hrs.toFixed(2)} hour(s)`;

    const rates = await fetchRates();
    const rateObj = rates.find(r => r.type === sessionData.vehicle);
    const rateVal = rateObj?.rate ?? 0;
    rateEl.textContent = `Rate: ${rateVal / 100} rs/hour`;

    const total = sessionData.amount_paid / 100;
    totalEl.textContent = `Total: ${total.toFixed(2)}`;

    if (isNaN(total) || isNaN(hrs)) location.replace('index.html');
  } catch (error) {
    console.error(error)
  }
}

payBtn.addEventListener('click', async () => {
  try {
    await deleteSession('G23H98ASDKFJ22J2', sessionToken);
    alert('Payment successful');
    localStorage.removeItem('token');
    location.replace('index.html');
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
});

cancelBtn.addEventListener('click', () => {
  location.replace('index.html');
});

window.addEventListener('DOMContentLoaded', init);

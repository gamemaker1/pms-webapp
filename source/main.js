import { fetchSession } from './api.js';
import { showForm, hideForm, hideRoutes, displayResult, bindOtpForm } from './ui.js';

async function init() {
  hideRoutes();
  
  bindOtpForm(async otp => {
    try {
      const data = await fetchSession(otp, null);
      if (data.token) localStorage.setItem('token', data.token);
      hideForm(); displayResult(data);
    } catch (err) {
      if (err.code === 401) {
        localStorage.removeItem('token');
        showForm();
      }

      console.error(err);
      alert(err.message);
    }
  });

  const token = localStorage.getItem('token');
  if (token) {
    try {
      const data = await fetchSession(null, token);
      hideForm(); displayResult(data);
    } catch (error) {
      console.error(error); showForm();
    }
  } else showForm();
}

window.addEventListener('DOMContentLoaded', init);


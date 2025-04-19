const SESSION_URL  = 'http://192.168.12.1:4242/api/sessions/me';
const SESSIONS_URL = 'http://192.168.12.1:4242/api/sessions';
const RATES_URL    = 'http://192.168.12.1:4242/api/rates';
const SLOTS_URL    = 'http://192.168.12.1:4242/api/slots';
const ANALYSIS_URL = 'http://192.168.12.1:4242/api/analysis';

export async function fetchSession(otp = null, token = null) {
  const method = token && !otp ? 'GET' : 'POST';
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = 'session ' + token;
  const body = otp ? JSON.stringify({ symbol: otp }) : undefined;

  const response = await fetch(SESSION_URL, { method, headers, body });
  if (response.status === 401) {
    const err = new Error('Unauthorized — please enter your OTP.');
    err.code = 401;
    throw err;
  }
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return data.data
}

export async function deleteSession(transactionId, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = 'session ' + token;
  const res = await fetch(SESSION_URL, {
    method: 'DELETE',
    headers,
    body: JSON.stringify({ transaction: transactionId })
  });
  if (!res.ok) throw new Error('Payment failed');
  const data = await res.json();
  return data.data
}

export async function fetchRates() {
  const res = await fetch(RATES_URL);
  if (!res.ok) throw new Error('Could not load rates');
  const data = await res.json();
  return data.data;
}

export async function fetchSessions(secret) {
  const res = await fetch(SESSIONS_URL, {   
    headers: { 'Authorization': 'admin ' + secret }
  });
  if (!res.ok) throw new Error('Could not load sessions');
  const data = await res.json();
  return data.data;
}

export async function fetchSlots(secret, available) {
  available = available === '' ? document.getElementById('slot-filters')
              .querySelector('.active')?.dataset.available : available;
  const q = available === '' ? '' : `?available=${available}`;
  const res = await fetch(`${SLOTS_URL}${q}`, {
    headers: { 'Authorization': 'admin ' + secret }
  });
  if (!res.ok) throw new Error('Could not load slots');
  const data = await res.json();
  return data.data
}

export async function fetchAnalysis(secret) {
  const res = await fetch(ANALYSIS_URL, {
    headers: { 'Authorization': 'admin ' + secret }
  });
  if (!res.ok) throw new Error('Could not load analysis');
  const data = await res.json();
  return data.data
}

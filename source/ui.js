export function showForm() {
  document.getElementById('form').style.display = 'block';
  document.getElementById('result').style.display = 'none';
}

export function hideForm() {
  document.getElementById('form').style.display = 'none';
  document.getElementById('result').style.display = 'block';
}

export function displayResult(data) {
  const s = data.session ?? data
  const lines = [
    '<h2>Parking Session Details</h2>',
    `<p><strong>Slot:</strong> ${data.slot?.location ?? s.slot ?? '-'}</p>`,
    `<p><strong>Vehicle:</strong> ${s.vehicle}</p>`,
    `<p><strong>Entry:</strong> ${new Date(s.entry_at).toLocaleString('IN')}</p>`,
    `<p><strong>Parked:</strong> ${s.parked_at ? new Date(s.parked_at).toLocaleString('IN') : '-'}</p>`,
    `<p><strong>Left:</strong> ${s.left_at ? new Date(s.left_at).toLocaleString('IN') : '-'}</p>`,
    `<p><strong>Amount:</strong> ${formatAmount(s.amount_paid)}</p>`
  ];
  document.getElementById('result').innerHTML = lines.join('\n');
}

export function bindOtpForm(onSubmit) {
  const form = document.getElementById('otp-form');
  const input = document.getElementById('otp-input');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const otp = input.value.trim();
    if (!otp) return alert('Please enter an OTP.');
    onSubmit(otp);
  });
}

export function showLogin() {
  document.getElementById('admin-login').style.display = 'block';
  document.getElementById('dashboard').style.display   = 'none';
}

export function showDashboard() {
  document.getElementById('admin-login').style.display = 'none';
  document.getElementById('dashboard').style.display   = 'block';
}

export function bindAdminForm(onSubmit) {
  const form   = document.getElementById('admin-form');
  const secret = document.getElementById('admin-secret');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const s = secret.value.trim();
    if (!s) return alert('Enter your admin secret');
    onSubmit(s);
  });
}

function setActiveFilter(button) {
  document
    .querySelectorAll('#slot-filters button')
    .forEach(btn => btn.classList.remove('active'));
  button.classList.add('active');
}

export function bindSlotFilters(onFilter) {
  document.getElementById('slot-filters')
    .addEventListener('click', e => {
      if (e.target.tagName === 'BUTTON') {
        setActiveFilter(e.target);
        onFilter(e.target.dataset.available);
      }
    });
}

export function renderSlots(slots) {
  const tbody = document.querySelector('#slots-table tbody');
  tbody.innerHTML = slots.map(s => `
    <tr>
      <td>${s.location}</td>
      <td>${s.type}</td>
      <td>${s.occupied_by && 'yes' || 'no'}</td>
    </tr>
  `).join('');
}

function formatDate(d) {
  return d ? new Date(d).toLocaleString('IN') : '-';
}

function getDuration(start, end) {
  if (!start || !end) return '-';
  const ms = new Date(end) - new Date(start);
  const minutes = Math.floor(ms / 60000);
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hrs}h ${mins}m`;
}

function formatAmount(amount) {
  if (typeof amount !== 'number') return '-';
  return (amount / 100).toFixed(2) + ' rs';
}

function getStatus(sess) {
  const { entry_at, auth_at, parked_at, paid_at, left_at } = sess;
  const now = Date.now();
  const FIVE_MIN = 5 * 60 * 1000;

  const ts = s => !!s ? Date.parse(s) : null;
  const entry  = ts(entry_at);
  const auth   = ts(auth_at);
  const park   = ts(parked_at);
  const paid   = ts(paid_at);

  if (entry && !auth) {
    if (now - entry > FIVE_MIN) return '<strong>lost</strong>';
    return 'entered';
  }
  if (entry && auth && !park) {
    if (now - auth > FIVE_MIN) return '<strong>lost</strong>';
    return 'searching';
  }
  if (entry && auth && park && !paid) {
    return 'parked';
  }
  if (entry && auth && park && paid && !left_at) {
    if (now - paid > FIVE_MIN) return '<strong>lost</strong>';
    return 'exiting';
  }
  if (entry && auth && park && paid && left_at) {
    return 'completed';
  }

  return 'invalid';
}

export function renderSessions(sessions) {
  const tbody = document.querySelector('#sessions-table tbody');
  tbody.innerHTML = '';

  sessions.forEach(sess => {
    const tr = document.createElement('tr');
    const duration = getDuration(sess.parked_at, sess.left_at);

    tr.innerHTML = `
      <td>${sess.slot ?? '-'}</td>
      <td>${sess.vehicle}</td>
      <td>${getStatus(sess)}</td>
      <td>${formatDate(sess.entry_at)}</td>
      <td>${duration}</td>
      <td>${formatAmount(sess.amount_paid)}</td>
      <td>${sess.transaction_id ?? '-'}</td>
    `;
    tbody.appendChild(tr);
  });
}

let charts = {}

function renderBarChart(canvasId, labels, data, seriesLabel) {
  const ctx = document.getElementById(canvasId).getContext('2d');

  if (charts[canvasId]) {
    charts[canvasId].data.labels = labels;
    charts[canvasId].data.datasets[0].label = seriesLabel;
    charts[canvasId].data.datasets[0].data = data;
    charts[canvasId].update('active');
  } else {
    charts[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: seriesLabel,
          data,
          backgroundColor: window.matchMedia?.('(prefers-color-scheme: dark)').matches
              ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.8)',
        }]
      },
      options: {
        scales: { y: { beginAtZero: true } },
        plugins: { legend: { display: false } }
      }
    });
  }
}

function renderLineChart(canvasId, labels, datasets) {
  const ctx = document.getElementById(canvasId).getContext('2d');

  if (charts[canvasId]) {
    charts[canvasId].data.labels = labels;
    charts[canvasId].data.datasets = datasets.map(ds => ({
      label: ds.label,
      data: ds.data,
      fill: false,
      tension: 0.2
    }));
    charts[canvasId].update('active');
  } else {
    charts[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: datasets.map(ds => ({
          label: ds.label,
          data: ds.data,
          fill: false,
          tension: 0.2
        }))
      },
      options: {
        scales: { y: { beginAtZero: true } },
        plugins: { legend: { position: 'bottom' } }
      }
    });
  }
}

export function renderAnalysis(data) {
  const labels = data.sessions.map(d => d.name);
  const counts = data.sessions.map(d => d.count);
  renderBarChart('sessionsChart', labels, counts, 'sessions');

  const revenues = data.revenue.map(d => +(d.revenue / 100).toFixed(2));
  renderBarChart('revenueChart', labels, revenues, 'revenue');

  const means   = data.durations.map(d => d.mean);
  const medians = data.durations.map(d => d.median);
  renderLineChart('durationsChart', labels, [
    { label: 'mean duration (hrs)',    data: means    },
    { label: 'median duration (hrs)',  data: medians  }
  ]);

  const avgRevenue = data.revenue.map((d, i) => {
    const sessions = data.sessions[i].count || 1;
    return +((d.revenue / 100) / sessions).toFixed(2);
  });
  renderBarChart('avgRevenueChart', labels, avgRevenue, 'average revenue');
}

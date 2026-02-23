const apiBaseUrlPrincipal = '/api';

function pqs(sel) {
  return document.querySelector(sel);
}

function principalHeaders() {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
}

let collegeStatusChart;

document.addEventListener('DOMContentLoaded', () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');
  if (!token || !user || user.role !== 'PRINCIPAL') {
    window.location.href = 'index.html';
    return;
  }

  pqs('#principal-name').textContent = `${user.name}`;
  pqs('#logout-btn').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'index.html';
  });

  pqs('#export-college-csv').addEventListener('click', async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${apiBaseUrlPrincipal}/reports/college/csv`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        alert('Failed to download CSV');
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'college-report.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Error downloading CSV');
    }
  });

  loadCollegeReport();
});

async function loadCollegeReport() {
  try {
    const res = await fetch(`${apiBaseUrlPrincipal}/reports/college`, { headers: principalHeaders() });
    const data = await res.json();
    if (!res.ok) {
      return;
    }
    renderCollegeTable(data.students, data.latestInternships || {});
    renderCollegeChart(data.statusCounts || {});
  } catch (e) {
    // ignore
  }
}

function renderCollegeTable(students, latestInternships) {
  const tbody = pqs('#college-table tbody');
  tbody.innerHTML = '';
  students.forEach((s) => {
    const latest = latestInternships[s.id] || {};
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${s.name}</td>
      <td>${s.email}</td>
      <td>${s.department || ''}</td>
      <td>${s.class_label || ''}</td>
      <td>${latest.status || 'None'}</td>
      <td>${latest.company_name || ''}</td>
      <td>${latest.role || ''}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderCollegeChart(statusCounts) {
  const ctx = pqs('#collegeStatusChart');
  const labels = Object.keys(statusCounts);
  const data = Object.values(statusCounts);
  if (collegeStatusChart) {
    collegeStatusChart.destroy();
  }
  collegeStatusChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: ['#4f46e5', '#22d3ee', '#06b6d4', '#0ea5e9', '#22c55e', '#eab308', '#f97316', '#ef4444'],
        },
      ],
    },
    options: {
      plugins: {
        legend: { labels: { color: '#e5e7eb' } },
      },
    },
  });
}


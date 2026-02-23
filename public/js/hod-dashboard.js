const apiBaseUrlHod = '/api';

function hqs(sel) {
  return document.querySelector(sel);
}

function hqsa(sel) {
  return Array.from(document.querySelectorAll(sel));
}

function hodHeaders() {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
}

let deptStatusChart;

document.addEventListener('DOMContentLoaded', () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');
  if (!token || !user || user.role !== 'HOD') {
    window.location.href = 'index.html';
    return;
  }

  hqs('#hod-name').textContent = `${user.name} • ${user.department}`;
  hqs('#logout-btn').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'index.html';
  });

  hqs('#export-dept-csv').addEventListener('click', async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${apiBaseUrlHod}/reports/department/csv`, {
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
      a.download = 'department-report.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Error downloading CSV');
    }
  });

  hqs('#edit-modal-close').addEventListener('click', () => {
    hqs('#edit-student-modal').classList.add('hidden');
  });

  hqs('#edit-student-form').addEventListener('submit', saveDeptStudentEdit);

  loadDeptReport();
});

async function loadDeptReport() {
  try {
    const res = await fetch(`${apiBaseUrlHod}/reports/department`, { headers: hodHeaders() });
    const data = await res.json();
    if (!res.ok) {
      return;
    }
    renderDeptTable(data.students, data.latestInternships || {});
    renderDeptChart(data.statusCounts || {});
  } catch (e) {
    // ignore
  }
}

function renderDeptTable(students, latestInternships) {
  const tbody = hqs('#dept-table tbody');
  tbody.innerHTML = '';
  students.forEach((s) => {
    const latest = latestInternships[s.id] || {};
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${s.name}</td>
      <td>${s.email}</td>
      <td>${s.class_label || ''}</td>
      <td>${latest.status || 'None'}</td>
      <td>${latest.company_name || ''}</td>
      <td>${latest.role || ''}</td>
      <td><button class="btn ghost btn-small" data-id="${s.id}">Edit</button></td>
    `;
    tbody.appendChild(tr);
  });

  hqsa('#dept-table .btn-small').forEach((btn) => {
    btn.addEventListener('click', () => openDeptEditModal(btn.dataset.id));
  });
}

function renderDeptChart(statusCounts) {
  const ctx = hqs('#deptStatusChart');
  const labels = Object.keys(statusCounts);
  const data = Object.values(statusCounts);
  if (deptStatusChart) {
    deptStatusChart.destroy();
  }
  deptStatusChart = new Chart(ctx, {
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

async function openDeptEditModal(studentId) {
  try {
    const res = await fetch(`${apiBaseUrlHod}/users/department-students`, { headers: hodHeaders() });
    const students = await res.json();
    const s = students.find((st) => String(st.id) === String(studentId));
    if (!s) return;
    hqs('#edit-student-id').value = s.id;
    hqs('#edit-student-name').value = s.name;
    hqs('#edit-student-email').value = s.email;
    hqs('#edit-student-dept').value = s.department || 'CSE';
    hqs('#edit-student-year').value = s.class_year || '1st Year';
    hqs('#edit-student-modal').classList.remove('hidden');
  } catch (e) {
    // ignore
  }
}

async function saveDeptStudentEdit(e) {
  e.preventDefault();
  const id = hqs('#edit-student-id').value;
  const name = hqs('#edit-student-name').value.trim();
  const email = hqs('#edit-student-email').value.trim();
  const department = hqs('#edit-student-dept').value;
  const classYear = hqs('#edit-student-year').value;
  const classLabel = `${department}-${classYear}`;
  const msgEl = hqs('#edit-modal-message');
  msgEl.classList.add('hidden');

  try {
    const res = await fetch(`${apiBaseUrlHod}/users/students/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...hodHeaders() },
      body: JSON.stringify({ name, email, department, classYear, classLabel }),
    });
    const data = await res.json();
    if (!res.ok) {
      msgEl.textContent = data.message || 'Failed to save';
      msgEl.classList.remove('hidden');
      msgEl.classList.add('error', 'message');
      return;
    }
    hqs('#edit-student-modal').classList.add('hidden');
    loadDeptReport();
  } catch (e) {
    msgEl.textContent = 'Error saving student.';
    msgEl.classList.remove('hidden');
    msgEl.classList.add('error', 'message');
  }
}


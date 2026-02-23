const apiBase = '/api';

function tqs(sel) {
  return document.querySelector(sel);
}

function tqsa(sel) {
  return Array.from(document.querySelectorAll(sel));
}

function getHeaders() {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
}

let classStatusChart;

document.addEventListener('DOMContentLoaded', () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');
  if (!token || !user || user.role !== 'CLASS_TEACHER') {
    window.location.href = 'index.html';
    return;
  }

  tqs('#teacher-name').textContent = `${user.name} • ${user.classLabel || ''}`;
  tqs('#logout-btn').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'index.html';
  });

  tqs('#export-class-csv').addEventListener('click', async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${apiBase}/reports/class/csv`, {
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
      a.download = 'class-report.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Error downloading CSV');
    }
  });

  tqs('#edit-modal-close').addEventListener('click', () => {
    tqs('#edit-student-modal').classList.add('hidden');
  });

  tqs('#edit-student-form').addEventListener('submit', saveStudentEdit);

  loadClassReport();
});

async function loadClassReport() {
  try {
    const res = await fetch(`${apiBase}/reports/class`, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) {
      return;
    }
    renderClassTable(data.students, data.latestInternships || {});
    renderClassChart(data.statusCounts || {});
  } catch (e) {
    // ignore
  }
}

function renderClassTable(students, latestInternships) {
  const tbody = tqs('#class-table tbody');
  tbody.innerHTML = '';
  students.forEach((s) => {
    const latest = latestInternships[s.id] || {};
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${s.name}</td>
      <td>${s.email}</td>
      <td>${latest.status || 'None'}</td>
      <td>${latest.company_name || ''}</td>
      <td>${latest.role || ''}</td>
      <td><button class="btn ghost btn-small" data-id="${s.id}">Edit</button></td>
    `;
    tbody.appendChild(tr);
  });

  tqsa('#class-table .btn-small').forEach((btn) => {
    btn.addEventListener('click', () => openEditModal(btn.dataset.id));
  });
}

function renderClassChart(statusCounts) {
  const ctx = tqs('#classStatusChart');
  const labels = Object.keys(statusCounts);
  const data = Object.values(statusCounts);
  if (classStatusChart) {
    classStatusChart.destroy();
  }
  classStatusChart = new Chart(ctx, {
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

async function openEditModal(studentId) {
  try {
    const res = await fetch(`${apiBase}/users/class-students`, { headers: getHeaders() });
    const students = await res.json();
    const s = students.find((st) => String(st.id) === String(studentId));
    if (!s) return;
    tqs('#edit-student-id').value = s.id;
    tqs('#edit-student-name').value = s.name;
    tqs('#edit-student-email').value = s.email;
    tqs('#edit-student-dept').value = s.department || 'CSE';
    tqs('#edit-student-year').value = s.class_year || '1st Year';
    tqs('#edit-student-modal').classList.remove('hidden');
  } catch (e) {
    // ignore
  }
}

async function saveStudentEdit(e) {
  e.preventDefault();
  const id = tqs('#edit-student-id').value;
  const name = tqs('#edit-student-name').value.trim();
  const email = tqs('#edit-student-email').value.trim();
  const department = tqs('#edit-student-dept').value;
  const classYear = tqs('#edit-student-year').value;
  const classLabel = `${department}-${classYear}`;
  const msgEl = tqs('#edit-modal-message');
  msgEl.classList.add('hidden');

  try {
    const res = await fetch(`${apiBase}/users/students/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getHeaders() },
      body: JSON.stringify({ name, email, department, classYear, classLabel }),
    });
    const data = await res.json();
    if (!res.ok) {
      msgEl.textContent = data.message || 'Failed to save';
      msgEl.classList.remove('hidden');
      msgEl.classList.add('error', 'message');
      return;
    }
    tqs('#edit-student-modal').classList.add('hidden');
    loadClassReport();
  } catch (e) {
    msgEl.textContent = 'Error saving student.';
    msgEl.classList.remove('hidden');
    msgEl.classList.add('error', 'message');
  }
}


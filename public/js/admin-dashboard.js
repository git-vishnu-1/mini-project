const apiBaseAdmin = '/api';

function aqs(sel) {
  return document.querySelector(sel);
}

function adminHeaders() {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
}

document.addEventListener('DOMContentLoaded', () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');
  if (!token || !user || user.role !== 'SYSTEM_ADMIN') {
    window.location.href = 'index.html';
    return;
  }

  aqs('#admin-name').textContent = `${user.name}`;
  aqs('#logout-btn').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'index.html';
  });

  aqs('#create-staff-form').addEventListener('submit', createStaffUser);

  loadPendingStudents();
});

async function loadPendingStudents() {
  try {
    const res = await fetch(`${apiBaseAdmin}/admin/students/pending`, { headers: adminHeaders() });
    const data = await res.json();
    if (!res.ok) {
      return;
    }
    renderPendingTable(data);
  } catch (e) {
    // ignore
  }
}

function renderPendingTable(students) {
  const tbody = aqs('#pending-table tbody');
  tbody.innerHTML = '';
  students.forEach((s) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${s.name}</td>
      <td>${s.email}</td>
      <td>${s.department || ''}</td>
      <td>${s.class_label || ''}</td>
      <td>
        <button class="btn primary btn-small" data-action="approve" data-id="${s.id}">Approve</button>
        <button class="btn danger btn-small" data-action="reject" data-id="${s.id}">Reject</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => handleApproval(btn.dataset.id, btn.dataset.action));
  });
}

async function handleApproval(id, action) {
  const endpoint = action === 'approve' ? 'approve' : 'reject';
  try {
    await fetch(`${apiBaseAdmin}/admin/students/${id}/${endpoint}`, {
      method: 'POST',
      headers: adminHeaders(),
    });
    loadPendingStudents();
  } catch (e) {
    // ignore
  }
}

async function createStaffUser(e) {
  e.preventDefault();
  const name = aqs('#staff-name').value.trim();
  const email = aqs('#staff-email').value.trim();
  const passwordHash = aqs('#staff-password').value.trim();
  const role = aqs('#staff-role').value;
  const department = aqs('#staff-dept').value || null;
  const classYear = aqs('#staff-year').value || null;
  const classLabel = department && classYear ? `${department}-${classYear}` : null;
  const msgEl = aqs('#staff-message');
  msgEl.classList.add('hidden');

  try {
    const res = await fetch(`${apiBaseAdmin}/admin/staff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...adminHeaders() },
      body: JSON.stringify({ name, email, passwordHash, role, department, classYear, classLabel }),
    });
    const data = await res.json();
    if (!res.ok) {
      msgEl.textContent = data.message || 'Failed to create staff user';
      msgEl.classList.remove('hidden');
      msgEl.classList.add('error', 'message');
      return;
    }
    msgEl.textContent = 'Staff user created successfully';
    msgEl.classList.remove('hidden');
    msgEl.classList.add('success', 'message');
    aqs('#create-staff-form').reset();
  } catch (e) {
    msgEl.textContent = 'Error creating staff user.';
    msgEl.classList.remove('hidden');
    msgEl.classList.add('error', 'message');
  }
}


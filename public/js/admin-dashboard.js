document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('logout-btn');
  const statusContainer = document.getElementById('global-status-counts');
  const studentsBody = document.querySelector('#students-table tbody');

  function requireAuth() {
    if (!getToken()) {
      window.location.href = 'login.html';
    }
  }

  requireAuth();

  logoutBtn.addEventListener('click', () => {
    clearToken();
    window.location.href = 'index.html';
  });

  async function loadStatusCounts() {
    try {
      const rows = await apiRequest('/admin/analytics/status-counts');
      statusContainer.innerHTML = '';
      const map = {};
      rows.forEach((r) => {
        map[r.status] = r.count;
      });
      const statuses = ['Pending', 'Applied', 'Interviewing', 'Accepted', 'Rejected'];
      statuses.forEach((s) => {
        const div = document.createElement('div');
        div.className = 'status-pill';
        div.innerHTML = `<span>${s}</span><strong>${map[s] || 0}</strong>`;
        statusContainer.appendChild(div);
      });
    } catch (err) {
      console.error(err);
    }
  }

  async function loadStudents() {
    try {
      const students = await apiRequest('/admin/students');
      studentsBody.innerHTML = '';
      students.forEach((s) => {
        const tr = document.createElement('tr');
        const joined = s.created_at ? new Date(s.created_at).toLocaleDateString() : '-';
        tr.innerHTML = `
          <td>${s.name}</td>
          <td>${s.email}</td>
          <td>${joined}</td>
        `;
        studentsBody.appendChild(tr);
      });
    } catch (err) {
      alert(err.message);
    }
  }

  loadStatusCounts();
  loadStudents();
});


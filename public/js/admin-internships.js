document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('logout-btn');
  const tableBody = document.querySelector('#admin-internships-table tbody');

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

  async function loadAdminInternships() {
    try {
      const internships = await apiRequest('/admin-internships');
      tableBody.innerHTML = '';
      internships.forEach((i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${i.title}</td>
          <td>${i.company_name}</td>
          <td>${i.location || '-'}</td>
          <td>${i.application_deadline || '-'}</td>
          <td>
            <button class="btn small primary" data-id="${i.id}">Add to my tracker</button>
          </td>
        `;
        tableBody.appendChild(tr);
      });
    } catch (err) {
      alert(err.message);
    }
  }

  tableBody.addEventListener('click', async (e) => {
    if (e.target.matches('button[data-id]')) {
      const id = e.target.getAttribute('data-id');
      try {
        await apiRequest(`/admin-internships/${id}/add-to-tracker`, {
          method: 'POST',
        });
        alert('Added to your tracker.');
      } catch (err) {
        alert(err.message);
      }
    }
  });

  loadAdminInternships();
});


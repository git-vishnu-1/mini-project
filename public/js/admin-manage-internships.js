document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('logout-btn');
  const addBtn = document.getElementById('add-admin-internship-btn');
  const tableBody = document.querySelector('#admin-internships-table tbody');
  const modal = document.getElementById('admin-internship-modal');
  const modalTitle = document.getElementById('admin-modal-title');
  const cancelModalBtn = document.getElementById('admin-cancel-modal');
  const form = document.getElementById('admin-internship-form');

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

  function openModal(internship) {
    modal.classList.remove('hidden');
    if (internship) {
      modalTitle.textContent = 'Edit Admin Internship';
      document.getElementById('admin-internship-id').value = internship.id;
      document.getElementById('title').value = internship.title || '';
      document.getElementById('company_name').value = internship.company_name || '';
      document.getElementById('location').value = internship.location || '';
      document.getElementById('application_deadline').value = internship.application_deadline
        ? internship.application_deadline.substring(0, 10)
        : '';
      document.getElementById('offer_deadline').value = internship.offer_deadline
        ? internship.offer_deadline.substring(0, 10)
        : '';
    } else {
      modalTitle.textContent = 'Add Admin Internship';
      form.reset();
      document.getElementById('admin-internship-id').value = '';
    }
  }

  function closeModal() {
    modal.classList.add('hidden');
  }

  cancelModalBtn.addEventListener('click', () => {
    closeModal();
  });

  addBtn.addEventListener('click', () => {
    openModal(null);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('admin-internship-id').value;
    const payload = {
      title: document.getElementById('title').value.trim(),
      company_name: document.getElementById('company_name').value.trim(),
      location: document.getElementById('location').value.trim() || null,
      application_deadline: document.getElementById('application_deadline').value || null,
      offer_deadline: document.getElementById('offer_deadline').value || null,
    };

    try {
      if (id) {
        await apiRequest(`/admin-internships/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest('/admin-internships', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      closeModal();
      await loadAdminInternships();
    } catch (err) {
      alert(err.message);
    }
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
            <button class="btn small secondary" data-action="edit" data-id="${i.id}">Edit</button>
            <button class="btn small secondary" data-action="delete" data-id="${i.id}">Delete</button>
          </td>
        `;
        tableBody.appendChild(tr);
      });
    } catch (err) {
      alert(err.message);
    }
  }

  tableBody.addEventListener('click', async (e) => {
    if (e.target.matches('button[data-action]')) {
      const action = e.target.getAttribute('data-action');
      const id = e.target.getAttribute('data-id');
      if (action === 'edit') {
        try {
          const internship = await apiRequest(`/admin-internships/${id}`);
          openModal(internship);
        } catch (err) {
          alert(err.message);
        }
      } else if (action === 'delete') {
        if (confirm('Delete this admin internship?')) {
          try {
            await apiRequest(`/admin-internships/${id}`, { method: 'DELETE' });
            await loadAdminInternships();
          } catch (err) {
            alert(err.message);
          }
        }
      }
    }
  });

  loadAdminInternships();
});


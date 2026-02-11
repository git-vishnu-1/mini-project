document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('logout-btn');
  const addBtn = document.getElementById('add-internship-btn');
  const tableBody = document.querySelector('#internships-table tbody');
  const statusContainer = document.getElementById('status-counts');
  const modal = document.getElementById('internship-modal');
  const modalTitle = document.getElementById('modal-title');
  const cancelModalBtn = document.getElementById('cancel-modal');
  const form = document.getElementById('internship-form');

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
      modalTitle.textContent = 'Edit Internship';
      document.getElementById('internship-id').value = internship.id;
      document.getElementById('title').value = internship.title || '';
      document.getElementById('company_name').value = internship.company_name || '';
      document.getElementById('status').value = internship.status || 'Pending';
      document.getElementById('application_deadline').value = internship.application_deadline
        ? internship.application_deadline.substring(0, 10)
        : '';
      document.getElementById('offer_deadline').value = internship.offer_deadline
        ? internship.offer_deadline.substring(0, 10)
        : '';
      document.getElementById('notes').value = internship.notes || '';
    } else {
      modalTitle.textContent = 'Add Internship';
      form.reset();
      document.getElementById('internship-id').value = '';
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
    const id = document.getElementById('internship-id').value;
    const payload = {
      title: document.getElementById('title').value.trim(),
      company_name: document.getElementById('company_name').value.trim(),
      status: document.getElementById('status').value,
      application_deadline: document.getElementById('application_deadline').value || null,
      offer_deadline: document.getElementById('offer_deadline').value || null,
      notes: document.getElementById('notes').value.trim() || null,
    };

    try {
      if (id) {
        await apiRequest(`/student-internships/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest('/student-internships', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      closeModal();
      await loadInternships();
      await loadStatusCounts();
    } catch (err) {
      alert(err.message);
    }
  });

  async function loadInternships() {
    try {
      const internships = await apiRequest('/student-internships');
      tableBody.innerHTML = '';
      internships.forEach((i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${i.title}</td>
          <td>${i.company_name}</td>
          <td>${i.status}</td>
          <td>${i.application_deadline || '-'}</td>
          <td>${i.offer_deadline || '-'}</td>
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

  async function loadStatusCounts() {
    try {
      const rows = await apiRequest('/student-internships/analytics/status-counts');
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
      // Non-critical
      console.error(err);
    }
  }

  tableBody.addEventListener('click', async (e) => {
    if (e.target.matches('button[data-action]')) {
      const action = e.target.getAttribute('data-action');
      const id = e.target.getAttribute('data-id');
      if (action === 'edit') {
        try {
          const internship = await apiRequest(`/student-internships/${id}`);
          openModal(internship);
        } catch (err) {
          alert(err.message);
        }
      } else if (action === 'delete') {
        if (confirm('Delete this internship?')) {
          try {
            await apiRequest(`/student-internships/${id}`, { method: 'DELETE' });
            await loadInternships();
            await loadStatusCounts();
          } catch (err) {
            alert(err.message);
          }
        }
      }
    }
  });

  loadInternships();
  loadStatusCounts();
});


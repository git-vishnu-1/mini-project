const apiBaseUrl = '/api';

function qs(selector) {
  return document.querySelector(selector);
}

function qsa(selector) {
  return Array.from(document.querySelectorAll(selector));
}

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    Authorization: `Bearer ${token}`,
  };
}

let applications = [];
let statusChart;

document.addEventListener('DOMContentLoaded', () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');
  if (!token || !user || !user.role || user.role !== 'STUDENT') {
    window.location.href = 'index.html';
    return;
  }

  qs('#student-name').textContent = `${user.name} • ${user.department}-${user.classYear}`;

  qs('#logout-btn').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
  });

  qs('#new-application-btn').addEventListener('click', () => openModal());
  qs('#modal-close').addEventListener('click', closeModal);

  qs('#application-form').addEventListener('submit', handleSaveApplication);
  qs('#delete-btn').addEventListener('click', handleDeleteApplication);

  fetchApplications();
});

async function fetchApplications() {
  try {
    const res = await fetch(`${apiBaseUrl}/internships`, {
      headers: {
        ...getAuthHeaders(),
      },
    });
    const data = await res.json();
    if (!res.ok) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch internships', data);
      return;
    }
    applications = data;
    renderPipeline();
    renderChart();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching internships', err);
  }
}

function renderPipeline() {
  const containers = qsa('.column-body');
  containers.forEach((c) => {
    c.innerHTML = '';
  });

  applications.forEach((app) => {
    const card = document.createElement('div');
    card.className = 'card-application';
    card.dataset.id = app.id;
    const formattedDeadline = app.deadline ? new Date(app.deadline).toLocaleDateString() : 'No deadline';
    card.innerHTML = `
      <div class="card-application-title">${app.company_name}</div>
      <div class="card-application-role">${app.role}</div>
      <div class="card-application-meta">
        <span>${formattedDeadline}</span>
        <span class="badge">${app.status}</span>
      </div>
    `;
    card.addEventListener('click', () => openModal(app));

    const containersForStatus = containers.filter((c) => c.dataset.status === app.status);
    if (containersForStatus.length > 0) {
      containersForStatus[0].appendChild(card);
    }
  });
}

function renderChart() {
  const ctx = qs('#statusChart');
  const counts = {};
  applications.forEach((app) => {
    counts[app.status] = (counts[app.status] || 0) + 1;
  });

  const labels = Object.keys(counts);
  const values = Object.values(counts);

  if (statusChart) {
    statusChart.destroy();
  }

  statusChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: [
            '#4f46e5',
            '#22d3ee',
            '#06b6d4',
            '#0ea5e9',
            '#22c55e',
            '#eab308',
            '#f97316',
            '#ef4444',
          ],
        },
      ],
    },
    options: {
      plugins: {
        legend: {
          labels: {
            color: '#e5e7eb',
          },
        },
      },
    },
  });
}

function openModal(app) {
  const modal = qs('#application-modal');
  const form = qs('#application-form');
  const deleteBtn = qs('#delete-btn');
  const modalTitle = qs('#modal-title');

  clearModalMessage();
  form.reset();

  if (app) {
    modalTitle.textContent = 'Edit Application';
    qs('#app-id').value = app.id;
    qs('#company-name').value = app.company_name || '';
    qs('#role').value = app.role || '';
    qs('#location').value = app.location || '';
    qs('#stipend').value = app.stipend || '';
    qs('#application-link').value = app.application_link || '';
    qs('#deadline').value = app.deadline ? app.deadline.substring(0, 10) : '';
    qs('#status').value = app.status || 'Planned';
    qs('#applied-date').value = app.applied_date ? app.applied_date.substring(0, 10) : '';
    qs('#round1-date').value = app.interview_round1_date ? app.interview_round1_date.substring(0, 10) : '';
    qs('#round2-date').value = app.interview_round2_date ? app.interview_round2_date.substring(0, 10) : '';
    qs('#offer-details').value = app.offer_details || '';
    qs('#notes').value = app.notes || '';
    deleteBtn.classList.remove('hidden');
  } else {
    modalTitle.textContent = 'New Application';
    qs('#app-id').value = '';
    deleteBtn.classList.add('hidden');
  }

  modal.classList.remove('hidden');
}

function closeModal() {
  qs('#application-modal').classList.add('hidden');
}

async function handleSaveApplication(e) {
  e.preventDefault();
  const id = qs('#app-id').value;

  const body = {
    companyName: qs('#company-name').value.trim(),
    role: qs('#role').value.trim(),
    location: qs('#location').value.trim(),
    stipend: qs('#stipend').value.trim(),
    applicationLink: qs('#application-link').value.trim(),
    deadline: qs('#deadline').value || null,
    status: qs('#status').value,
    appliedDate: qs('#applied-date').value || null,
    interviewRound1Date: qs('#round1-date').value || null,
    interviewRound2Date: qs('#round2-date').value || null,
    offerDetails: qs('#offer-details').value.trim(),
    notes: qs('#notes').value.trim(),
  };

  try {
    const url = id ? `${apiBaseUrl}/internships/${id}` : `${apiBaseUrl}/internships`;
    const method = id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      showModalMessage(data.message || 'Failed to save application');
      return;
    }

    const resumeFile = qs('#resume').files[0];
    const certificateFile = qs('#certificate').files[0];
    if (resumeFile || certificateFile) {
      const appId = id || (await fetchLatestApplicationId());
      await uploadFiles(appId, resumeFile, certificateFile);
    }

    closeModal();
    fetchApplications();
  } catch (err) {
    showModalMessage('Error saving application.');
  }
}

async function fetchLatestApplicationId() {
  let latestId = null;
  try {
    const res = await fetch(`${apiBaseUrl}/internships`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      latestId = data[data.length - 1].id;
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to refetch internships', err);
  }
  return latestId;
}

async function uploadFiles(id, resumeFile, certificateFile) {
  const formData = new FormData();
  if (resumeFile) {
    formData.append('resume', resumeFile);
  }
  if (certificateFile) {
    formData.append('completionCertificate', certificateFile);
  }

  try {
    await fetch(`${apiBaseUrl}/internships/${id}/upload`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('File upload failed', err);
  }
}

async function handleDeleteApplication() {
  const id = qs('#app-id').value;
  if (!id) return;
  if (!window.confirm('Delete this application?')) return;

  try {
    const res = await fetch(`${apiBaseUrl}/internships/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      showModalMessage(data.message || 'Failed to delete');
      return;
    }
    closeModal();
    fetchApplications();
  } catch (err) {
    showModalMessage('Error deleting application.');
  }
}

function showModalMessage(text) {
  const el = document.getElementById('modal-message');
  el.textContent = text;
  el.classList.remove('hidden');
  el.classList.add('error', 'message');
}

function clearModalMessage() {
  const el = document.getElementById('modal-message');
  el.textContent = '';
  el.classList.add('hidden');
  el.classList.remove('error', 'success');
}


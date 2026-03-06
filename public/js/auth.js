const apiBase = '/api';

function $(selector) {
  return document.querySelector(selector);
}

function showMessage(element, text, type = 'error') {
  element.textContent = text;
  element.classList.remove('hidden', 'error', 'success');
  element.classList.add(type === 'success' ? 'success' : 'error', 'message');
}

function clearMessage(element) {
  element.textContent = '';
  element.classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelectorAll('.tab');
  const loginTab = $('#login-tab');
  const registerTab = $('#register-tab');
  const registerForm = $('#register-form');
  const loginForm = $('#login-form');
  const authMessage = $('#auth-message');

  const savedToken = localStorage.getItem('token');
  const savedUser = localStorage.getItem('user');
  if (savedToken && savedUser) {
    const user = JSON.parse(savedUser);
    redirectByRole(user.role);
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      if (tab.dataset.tab === 'login') {
        loginTab.classList.remove('hidden');
        registerTab.classList.add('hidden');
      } else {
        registerTab.classList.remove('hidden');
        loginTab.classList.add('hidden');
      }
      clearMessage(authMessage);
    });
  });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearMessage(authMessage);
    const email = $('#login-email').value.trim();
    const password = $('#login-password').value;

    try {
      const res = await fetch(`${apiBase}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        showMessage(authMessage, data.message || 'Login failed');
        return;
      }
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      redirectByRole(data.user.role);
    } catch (err) {
      showMessage(authMessage, 'Unable to login. Please try again.');
    }
  });

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearMessage(authMessage);
    const name = $('#reg-name').value.trim();
    const email = $('#reg-email').value.trim();
    const password = $('#reg-password').value;
    const department = $('#reg-dept').value;
    const classYear = $('#reg-year').value;
    const classLabel = `${department}-${classYear}`;

    try {
      const res = await fetch(`${apiBase}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, department, classYear, classLabel }),
      });
      const data = await res.json();
      if (!res.ok) {
        showMessage(authMessage, data.message || 'Registration failed');
        return;
      }
      registerForm.reset();
      showMessage(authMessage, data.message || 'Registration successful! Awaiting admin approval.', 'success');
      setTimeout(() => {
        loginTab.classList.remove('hidden');
        registerTab.classList.add('hidden');
        clearMessage(authMessage);
      }, 3000);
    } catch (err) {
      showMessage(authMessage, 'Unable to register. Please try again.');
    }
  });
});

function redirectByRole(role) {
  if (role === 'STUDENT') {
    window.location.href = 'student-dashboard.html';
  } else if (role === 'CLASS_TEACHER') {
    window.location.href = 'teacher-dashboard.html';
  } else if (role === 'HOD') {
    window.location.href = 'hod-dashboard.html';
  } else if (role === 'PRINCIPAL') {
    window.location.href = 'principal-dashboard.html';
  } else if (role === 'SYSTEM_ADMIN') {
    window.location.href = 'admin-dashboard.html';
  } else {
    window.location.href = 'student-dashboard.html';
  }
}


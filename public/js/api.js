const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('token');
}

function setToken(token) {
  localStorage.setItem('token', token);
}

function clearToken() {
  localStorage.removeItem('token');
}

async function apiRequest(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorText = 'Request failed';
    try {
      const data = await res.json();
      errorText = data.message || errorText;
    } catch (e) {
      // ignore parse error
    }
    throw new Error(errorText);
  }

  // No content
  if (res.status === 204) return null;

  return res.json();
}


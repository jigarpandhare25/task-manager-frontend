/**
 * Centralised API client for TaskFlow.
 *
 * All components receive a `token` prop and call these helpers instead of
 * writing raw fetch() calls.  This keeps auth headers, base URL, and error
 * normalisation in one place — if the backend moves or the auth scheme
 * changes, only this file needs updating.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Build shared request headers. JSON body requests also get Content-Type.
 */
const authHeaders = (token, withBody = false) => ({
  Authorization: `Bearer ${token}`,
  ...(withBody && { 'Content-Type': 'application/json' }),
});

/**
 * Parse the response and throw a meaningful error if the server signals
 * failure. Using the server's `message` field keeps errors domain-specific
 * rather than generic HTTP status strings.
 */
const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || `Request failed with status ${res.status}`);
  }
  return data;
};

// ─── Auth ────────────────────────────────────────────────────────────────────

export const authApi = {
  login: (credentials) =>
    fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: authHeaders(null, true),
      body: JSON.stringify(credentials),
    }).then(handleResponse),

  register: (userData) =>
    fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: authHeaders(null, true),
      body: JSON.stringify(userData),
    }).then(handleResponse),

  getMe: (token) =>
    fetch(`${BASE_URL}/auth/me`, { headers: authHeaders(token) }).then(handleResponse),
};

// ─── Tasks ───────────────────────────────────────────────────────────────────

export const tasksApi = {
  /** Fetch tasks with optional filter params (status, priority, teamId, search, dueDate). */
  getAll: (token, filters = {}) => {
    const params = new URLSearchParams(
      Object.entries(filters).filter(([, v]) => v !== '' && v != null)
    );
    return fetch(`${BASE_URL}/tasks?${params}`, { headers: authHeaders(token) }).then(handleResponse);
  },

  create: (token, taskData) =>
    fetch(`${BASE_URL}/tasks`, {
      method: 'POST',
      headers: authHeaders(token, true),
      body: JSON.stringify(taskData),
    }).then(handleResponse),

  update: (token, id, taskData) =>
    fetch(`${BASE_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: authHeaders(token, true),
      body: JSON.stringify(taskData),
    }).then(handleResponse),

  delete: (token, id) =>
    fetch(`${BASE_URL}/tasks/${id}`, {
      method: 'DELETE',
      headers: authHeaders(token),
    }).then(handleResponse),
};

// ─── Teams ───────────────────────────────────────────────────────────────────

export const teamsApi = {
  getAll: (token) =>
    fetch(`${BASE_URL}/teams`, { headers: authHeaders(token) }).then(handleResponse),

  create: (token, name) =>
    fetch(`${BASE_URL}/teams`, {
      method: 'POST',
      headers: authHeaders(token, true),
      body: JSON.stringify({ name }),
    }).then(handleResponse),

  getMembers: (token, teamId) =>
    fetch(`${BASE_URL}/teams/${teamId}/members`, { headers: authHeaders(token) }).then(handleResponse),

  addMember: (token, teamId, identifier) =>
    fetch(`${BASE_URL}/teams/${teamId}/members`, {
      method: 'POST',
      headers: authHeaders(token, true),
      body: JSON.stringify({ identifier }),
    }).then(handleResponse),

  removeMember: (token, teamId, userId) =>
    fetch(`${BASE_URL}/teams/${teamId}/members/${userId}`, {
      method: 'DELETE',
      headers: authHeaders(token),
    }).then(handleResponse),
};

// ─── Dashboard ───────────────────────────────────────────────────────────────

export const dashboardApi = {
  getStats: (token) =>
    fetch(`${BASE_URL}/dashboard`, { headers: authHeaders(token) }).then(handleResponse),
};

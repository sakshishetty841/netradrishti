const API_BASE = '/api';

export const getAuthToken = () => localStorage.getItem('dr_auth_token');
export const setAuthToken = (token) => localStorage.setItem('dr_auth_token', token);
export const removeAuthToken = () => localStorage.removeItem('dr_auth_token');

export async function fetchApi(endpoint, options = {}) {
  const token = getAuthToken();
  
  const headers = {
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Don't set Content-Type for FormData
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || data.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

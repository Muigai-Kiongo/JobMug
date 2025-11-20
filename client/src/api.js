import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://job-mug-api.vercel.app'
  // When using the Vite proxy, baseURL can be empty and /api/... will be proxied.
});

// Attach token when available
api.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem('jobmug_auth');
    if (raw) {
      const { token } = JSON.parse(raw);
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch (e) {
    // ignore parse errors
  }
  return config;
});

export default api;
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token automatically to every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Centralized response error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const backendError = error.response?.data?.error;
    const errorData = {
      message:
        backendError?.message ||
        error.response?.data?.message ||
        error.message ||
        'An unexpected error occurred',
      code:
        backendError?.code || (error.response?.status === 401 ? 'UNAUTHORIZED' : 'UNKNOWN_ERROR'),
      details: backendError?.details || null,
      status: error.response?.status,
    };
    return Promise.reject(errorData);
  }
);

export default api;

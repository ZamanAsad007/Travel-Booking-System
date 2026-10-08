import api from './client.js';

export const authApi = {
  login: async (credentials) => {
    return api.post('/auth/login', credentials);
  },
  register: async (data) => {
    return api.post('/auth/register', data);
  },
  getMe: async () => {
    return api.get('/auth/me');
  },
};

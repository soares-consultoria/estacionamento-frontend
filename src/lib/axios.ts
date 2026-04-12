import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8181/estacionamento-api';

const api = axios.create({
  baseURL: BASE_URL,
});

// Injeta instituicaoId para SUPER_ADMIN em chamadas ao dashboard e importação
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const auth = localStorage.getItem('auth');
  if (auth) {
    try {
      const user = JSON.parse(auth) as { role: string };
      if (user.role === 'SUPER_ADMIN') {
        const selectedId = localStorage.getItem('selectedInstituicaoId');
        if (selectedId && config.url && (config.url.includes('/api/dashboard') || config.url.includes('/api/importacao'))) {
          config.params = { ...config.params, instituicaoId: selectedId };
        }
      }
    } catch {
      // ignora
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('auth');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

import axios from 'axios';
import { API_BASE_URL, STORE_HEADER_KEY } from '@/constants';
import toast from 'react-hot-toast';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
  timeout: 30000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const storeId = localStorage.getItem('active_store_id');
  if (storeId && storeId !== 'all') config.headers[STORE_HEADER_KEY] = storeId;
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      if (!isLoginRequest) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        if (window.location.pathname !== '/login') window.location.href = '/login';
      }
    }
    const msg = error.response?.data?.message || error.message || 'Something went wrong';
    if (error.response?.status !== 401 && error.response?.status !== 422) toast.error(msg);
    return Promise.reject(error);
  }
);

export default apiClient;

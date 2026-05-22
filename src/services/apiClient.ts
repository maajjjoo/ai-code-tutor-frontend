import axios from 'axios';
import { tokenRef } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL;
if (!API_URL) throw new Error('VITE_API_URL environment variable is not set');

const client = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use(config => {
  if (tokenRef.current) {
    config.headers.Authorization = `Bearer ${tokenRef.current}`;
  }
  return config;
});

client.interceptors.response.use(
  r => r,
  err => {
    if (err?.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default client;

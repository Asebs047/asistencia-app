import axios from "axios";
import { useAuthStore } from "../store/authStore";

export const reportsApi = axios.create({
  baseURL: import.meta.env.VITE_REPORTS_API_URL,
});

reportsApi.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

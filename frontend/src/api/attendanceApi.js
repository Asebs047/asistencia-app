import axios from "axios";
import { useAuthStore } from "../store/authStore";

export const attendanceApi = axios.create({
  baseURL: import.meta.env.VITE_ATTENDANCE_API_URL,
});

attendanceApi.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

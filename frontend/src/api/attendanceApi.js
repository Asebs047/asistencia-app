import axios from "axios";

export const attendanceApi = axios.create({
  baseURL: import.meta.env.VITE_ATTENDANCE_API_URL,
});

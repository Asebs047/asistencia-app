import axios from "axios";

const baseURL = process.env.ATTENDANCE_SERVICE_URL || "http://localhost:4001";

// Reenvía el token del usuario que hizo la solicitud original, para que
// service-attendance aplique sus propias reglas de autorización por rol.
export function attendanceClientFor(token) {
  return axios.create({
    baseURL,
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getGroupById(token, groupId) {
  const client = attendanceClientFor(token);
  const { data } = await client.get(`/groups/${groupId}`);
  return data;
}

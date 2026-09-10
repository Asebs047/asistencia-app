import { useEffect, useState } from "react";
import { attendanceApi } from "../api/attendanceApi";
import { reportsApi } from "../api/reportsApi";

export default function TeacherPanel() {
  const [groups, setGroups] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [error, setError] = useState(null);

  async function loadAll() {
    try {
      const [groupsRes, attendanceRes, permissionsRes] = await Promise.all([
        attendanceApi.get("/groups"),
        attendanceApi.get("/attendance"),
        reportsApi.get("/permissions"),
      ]);
      setGroups(groupsRes.data);
      setAttendance(attendanceRes.data);
      setPermissions(permissionsRes.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function resolvePermission(id, action) {
    try {
      await reportsApi.patch(`/permissions/${id}/${action}`);
      loadAll();
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo actualizar el permiso");
    }
  }

  return (
    <section className="page">
      <h1>Panel del Maestro</h1>
      {error && <p className="error">{error}</p>}

      <h2>Mis grupos</h2>
      <ul className="group-list">
        {groups.map((g) => (
          <li key={g._id} className="group-card">
            <h2>{g.name}</h2>
            <p>Alumnos: {g.studentIds?.map((s) => s.name).join(", ") || "Sin alumnos"}</p>
          </li>
        ))}
      </ul>

      <h2>Permisos pendientes</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Alumno</th>
            <th>Estado</th>
            <th>Solicitado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {permissions.map((p) => (
            <tr key={p._id}>
              <td>{p.studentId}</td>
              <td>{p.status}</td>
              <td>{new Date(p.requestedAt).toLocaleTimeString()}</td>
              <td>
                {p.status === "solicitado" && (
                  <>
                    <button onClick={() => resolvePermission(p._id, "authorize")}>Autorizar</button>
                    <button onClick={() => resolvePermission(p._id, "reject")}>Rechazar</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Marcaciones recientes</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Alumno</th>
            <th>Método</th>
            <th>Hora</th>
          </tr>
        </thead>
        <tbody>
          {attendance.map((a) => (
            <tr key={a._id}>
              <td>{a.studentId}</td>
              <td>{a.method}</td>
              <td>{new Date(a.markedAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

import { useEffect, useState } from "react";
import { startRegistration, startAuthentication } from "@simplewebauthn/browser";
import { attendanceApi } from "../api/attendanceApi";
import { reportsApi } from "../api/reportsApi";
import { useAuthStore } from "../store/authStore";

export default function StudentPanel() {
  const user = useAuthStore((s) => s.user);
  const [attendance, setAttendance] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [carnetCode, setCarnetCode] = useState(user.carnetCode || "");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  async function loadAll() {
    try {
      const [attendanceRes, permissionsRes] = await Promise.all([
        attendanceApi.get("/attendance"),
        reportsApi.get("/permissions"),
      ]);
      setAttendance(attendanceRes.data);
      setPermissions(permissionsRes.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function markByCard(e) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      await attendanceApi.post("/attendance/card", { carnetCode });
      setMessage("Asistencia marcada por carnet.");
      loadAll();
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo marcar asistencia");
    }
  }

  async function enrollBiometric() {
    setError(null);
    setMessage(null);
    try {
      const { data: optionsJSON } = await attendanceApi.post("/webauthn/register/options");
      const registrationResponse = await startRegistration({ optionsJSON });
      await attendanceApi.post("/webauthn/register/verify", registrationResponse);
      setMessage("Autenticador biométrico registrado correctamente.");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "No se pudo registrar el autenticador");
    }
  }

  async function markByBiometric() {
    setError(null);
    setMessage(null);
    try {
      const { data: optionsJSON } = await attendanceApi.post("/webauthn/attendance/options");
      const authResponse = await startAuthentication({ optionsJSON });
      await attendanceApi.post("/attendance/biometric", authResponse);
      setMessage("Asistencia marcada con biometría.");
      loadAll();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "No se pudo marcar asistencia biométrica");
    }
  }

  async function requestPermission() {
    setError(null);
    setMessage(null);
    try {
      await reportsApi.post("/permissions", {});
      setMessage("Permiso solicitado.");
      loadAll();
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo solicitar el permiso");
    }
  }

  async function advancePermission(id, action) {
    try {
      await reportsApi.patch(`/permissions/${id}/${action}`);
      loadAll();
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo actualizar el permiso");
    }
  }

  return (
    <section className="page">
      <h1>Panel del Alumno</h1>
      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}

      <h2>Marcar asistencia</h2>
      <form onSubmit={markByCard} className="form form-inline">
        <input
          placeholder="Código de carnet"
          value={carnetCode}
          onChange={(e) => setCarnetCode(e.target.value)}
          required
        />
        <button type="submit">Marcar por carnet</button>
      </form>
      <div className="form-inline">
        <button onClick={enrollBiometric}>Registrar biometría</button>
        <button onClick={markByBiometric}>Marcar con biometría</button>
      </div>

      <h2>Permisos</h2>
      <button onClick={requestPermission}>Solicitar permiso para ir al baño</button>
      <table className="table">
        <thead>
          <tr>
            <th>Estado</th>
            <th>Solicitado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {permissions.map((p) => (
            <tr key={p._id}>
              <td>{p.status}</td>
              <td>{new Date(p.requestedAt).toLocaleTimeString()}</td>
              <td>
                {p.status === "autorizado" && (
                  <button onClick={() => advancePermission(p._id, "start")}>Registrar salida</button>
                )}
                {p.status === "iniciado" && (
                  <button onClick={() => advancePermission(p._id, "finish")}>Registrar regreso</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Historial de asistencia</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Método</th>
            <th>Hora</th>
          </tr>
        </thead>
        <tbody>
          {attendance.map((a) => (
            <tr key={a._id}>
              <td>{a.method}</td>
              <td>{new Date(a.markedAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

import { useEffect, useState } from "react";
import { startRegistration, startAuthentication } from "@simplewebauthn/browser";
import { attendanceApi } from "../../api/attendanceApi";
import { useAuthStore } from "../../store/authStore";

export default function AttendanceTab() {
  const user = useAuthStore((s) => s.user);
  const [attendance, setAttendance] = useState([]);
  const [carnetCode, setCarnetCode] = useState(user.carnetCode || "");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  async function load() {
    const { data } = await attendanceApi.get("/attendance");
    setAttendance(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function markByCard(type) {
    setError(null);
    setMessage(null);
    try {
      await attendanceApi.post("/attendance/card", { carnetCode, type });
      setMessage(`${type === "entrada" ? "Entrada" : "Salida"} marcada por carnet.`);
      load();
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

  async function markByBiometric(type) {
    setError(null);
    setMessage(null);
    try {
      const { data: optionsJSON } = await attendanceApi.post("/webauthn/attendance/options");
      const authResponse = await startAuthentication({ optionsJSON });
      await attendanceApi.post(`/attendance/biometric?type=${type}`, authResponse);
      setMessage(`${type === "entrada" ? "Entrada" : "Salida"} marcada con biometría.`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "No se pudo marcar asistencia biométrica");
    }
  }

  return (
    <div>
      <div className="section">
        <h2>Marcar por carnet</h2>
        {error && <p className="error">{error}</p>}
        {message && <p className="success">{message}</p>}
        <div className="form-inline">
          <input
            placeholder="Código de carnet"
            value={carnetCode}
            onChange={(e) => setCarnetCode(e.target.value)}
          />
          <button onClick={() => markByCard("entrada")}>Marcar entrada</button>
          <button className="secondary" onClick={() => markByCard("salida")}>
            Marcar salida
          </button>
        </div>
      </div>

      <div className="section">
        <h2>Marcar con biometría</h2>
        <div className="form-inline">
          <button className="secondary" onClick={enrollBiometric}>
            Registrar biometría
          </button>
          <button onClick={() => markByBiometric("entrada")}>Marcar entrada</button>
          <button className="secondary" onClick={() => markByBiometric("salida")}>
            Marcar salida
          </button>
        </div>
      </div>

      <div className="section">
        <h2>Historial</h2>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Método</th>
                <th>Fecha y hora</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((a) => (
                <tr key={a._id}>
                  <td>
                    <span className={`badge ${a.type === "entrada" ? "badge-success" : "badge-warning"}`}>
                      {a.type}
                    </span>
                  </td>
                  <td>{a.method}</td>
                  <td>{new Date(a.markedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

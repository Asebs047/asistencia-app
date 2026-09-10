import { useEffect, useState } from "react";
import { reportsApi } from "../../api/reportsApi";
import { useUserDirectory } from "../../hooks/useUserDirectory";
import { IconStudents, IconAttendance, IconPermissions, IconClock } from "../../components/icons";

function formatDuration(ms) {
  if (ms == null) return "—";
  const minutes = Math.round(ms / 60000);
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}

function formatPercent(rate) {
  if (rate == null) return "—";
  return `${Math.round(rate * 100)}%`;
}

export default function ReportsTab() {
  const [summary, setSummary] = useState(null);
  const [punctuality, setPunctuality] = useState(null);
  const [absences, setAbsences] = useState(null);
  const [permissionStats, setPermissionStats] = useState(null);
  const { nameOf } = useUserDirectory();

  useEffect(() => {
    reportsApi.get("/statistics/summary").then(({ data }) => setSummary(data));
    reportsApi.get("/statistics/punctuality").then(({ data }) => setPunctuality(data));
    reportsApi.get("/statistics/absences").then(({ data }) => setAbsences(data));
    reportsApi.get("/reports/permissions").then(({ data }) => setPermissionStats(data));
  }, []);

  return (
    <div>
      <div className="stat-grid">
        <StatCard icon={IconStudents} value={summary?.activeStudents ?? "—"} label="Alumnos activos" />
        <StatCard icon={IconAttendance} value={summary?.attendanceToday ?? "—"} label="Entradas hoy" />
        <StatCard icon={IconPermissions} value={summary?.activePermissions ?? "—"} label="Permisos activos" />
        <StatCard
          icon={IconClock}
          value={formatDuration(summary?.avgPermissionDurationMs)}
          label="Duración promedio de permiso"
        />
      </div>

      <div className="section">
        <h2>Puntualidad por alumno</h2>
        <p className="hint">Entrada puntual hasta las 7:15 a.m.</p>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Alumno</th>
                <th>Entradas</th>
                <th>Puntuales</th>
                <th>% Puntualidad</th>
              </tr>
            </thead>
            <tbody>
              {punctuality?.byStudent?.map((s) => (
                <tr key={s.studentId}>
                  <td>{nameOf(s.studentId)}</td>
                  <td>{s.total}</td>
                  <td>{s.onTime}</td>
                  <td>{formatPercent(s.onTimeRate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="section">
        <h2>Ausencias (últimos {absences?.days ?? 7} días)</h2>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Alumno</th>
                <th>Días ausente</th>
              </tr>
            </thead>
            <tbody>
              {absences?.students?.map((s) => (
                <tr key={s.studentId}>
                  <td>{s.name}</td>
                  <td>
                    <span className={`badge ${s.absences > 0 ? "badge-warning" : "badge-success"}`}>
                      {s.absences}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="section">
        <h2>Permisos por alumno</h2>
        <p className="hint">Cantidad, duración promedio y frecuencia semanal.</p>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Alumno</th>
                <th>Cantidad</th>
                <th>Duración promedio</th>
                <th>Frecuencia/semana</th>
              </tr>
            </thead>
            <tbody>
              {permissionStats?.byStudent?.map((s) => (
                <tr key={s.key}>
                  <td>{nameOf(s.key)}</td>
                  <td>{s.count}</td>
                  <td>{formatDuration(s.avgDurationMs)}</td>
                  <td>{s.frequencyPerWeek.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, value, label }) {
  return (
    <div className="stat-card">
      <div className="stat-card-icon">
        <Icon />
      </div>
      <div>
        <div className="stat-card-value">{value}</div>
        <div className="stat-card-label">{label}</div>
      </div>
    </div>
  );
}

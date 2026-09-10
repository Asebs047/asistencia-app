import { useEffect, useState } from "react";
import { attendanceApi } from "../../api/attendanceApi";
import { useUserDirectory } from "../../hooks/useUserDirectory";

export default function AttendanceTab() {
  const [attendance, setAttendance] = useState([]);
  const { nameOf } = useUserDirectory();

  useEffect(() => {
    attendanceApi.get("/attendance").then(({ data }) => setAttendance(data));
  }, []);

  return (
    <div className="section">
      <h2>Asistencia general ({attendance.length})</h2>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Alumno</th>
              <th>Tipo</th>
              <th>Método</th>
              <th>Fecha y hora</th>
            </tr>
          </thead>
          <tbody>
            {attendance.map((a) => (
              <tr key={a._id}>
                <td>{nameOf(a.studentId)}</td>
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
  );
}

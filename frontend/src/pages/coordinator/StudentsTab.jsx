import { useEffect, useState } from "react";
import { attendanceApi } from "../../api/attendanceApi";

const emptyForm = { name: "", email: "", password: "", carnetCode: "" };

export default function StudentsTab() {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState(null);

  async function load() {
    const { data } = await attendanceApi.get("/users", { params: { role: "alumno" } });
    setStudents(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError(null);
    try {
      await attendanceApi.post("/users", { ...form, role: "alumno" });
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo crear el alumno");
    }
  }

  async function toggleActive(user) {
    await attendanceApi.put(`/users/${user._id}`, { active: !user.active });
    load();
  }

  return (
    <div>
      <div className="section">
        <h2>Nuevo alumno</h2>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleCreate} className="form-row">
          <input
            placeholder="Nombre"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <input
            placeholder="Carnet (7 dígitos, ej. 2024047)"
            value={form.carnetCode}
            onChange={(e) => setForm({ ...form, carnetCode: e.target.value })}
            pattern="\d{7}"
            title="7 dígitos: AAAA (año de inscripción) + NNN"
            required
          />
          <button type="submit">Crear alumno</button>
        </form>
      </div>

      <div className="section">
        <h2>Alumnos ({students.length})</h2>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Carnet</th>
                <th>Email</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s._id}>
                  <td>{s.name}</td>
                  <td>{s.carnetCode}</td>
                  <td>{s.email}</td>
                  <td>
                    <span className={`badge ${s.active ? "badge-success" : "badge-danger"}`}>
                      {s.active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>
                    <button className="secondary" onClick={() => toggleActive(s)}>
                      {s.active ? "Desactivar" : "Activar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

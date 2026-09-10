import { useEffect, useState } from "react";
import { attendanceApi } from "../../api/attendanceApi";

const emptyForm = { firstName: "", lastName: "", carnetCode: "" };

export default function StudentsTab() {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

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
    setMessage(null);
    try {
      const { data } = await attendanceApi.post("/users", { ...form, role: "alumno" });
      setForm(emptyForm);
      setFormOpen(false);
      setMessage(
        `Alumno "${data.name}" creado. Contraseña temporal: ${data.temporaryPassword} (deberá cambiarla al iniciar sesión).`
      );
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
      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}

      <div className="section">
        <div className="panel-header">
          <h2>Alumnos ({students.length})</h2>
          <button className="secondary" onClick={() => setFormOpen((v) => !v)}>
            {formOpen ? "Cancelar" : "+ Nuevo alumno"}
          </button>
        </div>

        {formOpen && (
          <form onSubmit={handleCreate} className="field-grid">
            <label>
              Nombre
              <input
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                required
              />
            </label>
            <label>
              Apellido
              <input
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                required
              />
            </label>
            <label>
              Carnet
              <input
                value={form.carnetCode}
                onChange={(e) => setForm({ ...form, carnetCode: e.target.value })}
                pattern="\d{7}"
                placeholder="7 dígitos, ej. 2024047"
                title="7 dígitos: AAAA (año de inscripción) + NNN"
                required
              />
            </label>
            <p className="hint field-grid-span">
              El email se genera automáticamente a partir del nombre y el carnet, con una
              contraseña temporal que el alumno deberá cambiar en su primer inicio de sesión.
            </p>
            <div className="field-grid-span">
              <button type="submit">Crear alumno</button>
            </div>
          </form>
        )}
      </div>

      <div className="section">
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

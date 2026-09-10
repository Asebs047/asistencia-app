import { useEffect, useState } from "react";
import { attendanceApi } from "../../api/attendanceApi";

const emptyForm = { name: "", email: "", password: "" };

// Formulario y listado compartido para maestro/coordinador: solo nombre, email
// y contraseña (sin carnet, a diferencia de los alumnos).
export default function StaffTab({ role, label }) {
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState(null);

  async function load() {
    const { data } = await attendanceApi.get("/users", { params: { role } });
    setStaff(data);
  }

  useEffect(() => {
    load();
  }, [role]);

  async function handleCreate(e) {
    e.preventDefault();
    setError(null);
    try {
      await attendanceApi.post("/users", { ...form, role });
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err.response?.data?.message || `No se pudo crear el ${label.toLowerCase()}`);
    }
  }

  async function toggleActive(user) {
    await attendanceApi.put(`/users/${user._id}`, { active: !user.active });
    load();
  }

  return (
    <div>
      <div className="section">
        <h2>Nuevo {label.toLowerCase()}</h2>
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
          <button type="submit">Crear {label.toLowerCase()}</button>
        </form>
      </div>

      <div className="section">
        <h2>
          {label}s ({staff.length})
        </h2>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s._id}>
                  <td>{s.name}</td>
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

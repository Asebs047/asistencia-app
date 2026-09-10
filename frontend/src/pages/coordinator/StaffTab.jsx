import { useEffect, useState } from "react";
import { attendanceApi } from "../../api/attendanceApi";

const emptyForm = { firstName: "", lastName: "", email: "" };

// Formulario y listado compartido para maestro/coordinador: solo nombre, apellido y
// email (sin carnet ni contraseña — la contraseña temporal se asigna automáticamente).
export default function StaffTab({ role, label }) {
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

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
    setMessage(null);
    try {
      const { data } = await attendanceApi.post("/users", { ...form, role });
      setForm(emptyForm);
      setFormOpen(false);
      setMessage(
        `${label} "${data.name}" creado. Contraseña temporal: ${data.temporaryPassword} (deberá cambiarla al iniciar sesión).`
      );
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
      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}

      <div className="section">
        <div className="panel-header">
          <h2>
            {label}s ({staff.length})
          </h2>
          <button className="secondary" onClick={() => setFormOpen((v) => !v)}>
            {formOpen ? "Cancelar" : `+ Nuevo ${label.toLowerCase()}`}
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
              Email
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </label>
            <p className="hint field-grid-span">
              Se asigna una contraseña temporal que deberá cambiar en su primer inicio de sesión.
            </p>
            <div className="field-grid-span">
              <button type="submit">Crear {label.toLowerCase()}</button>
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

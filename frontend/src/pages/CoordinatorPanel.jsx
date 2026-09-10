import { useEffect, useState } from "react";
import { attendanceApi } from "../api/attendanceApi";

export default function CoordinatorPanel() {
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [error, setError] = useState(null);

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "alumno",
    carnetCode: "",
  });
  const [newGroup, setNewGroup] = useState({ name: "", teacherId: "" });

  async function loadAll() {
    try {
      const [usersRes, groupsRes] = await Promise.all([
        attendanceApi.get("/users"),
        attendanceApi.get("/groups"),
      ]);
      setUsers(usersRes.data);
      setGroups(groupsRes.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleCreateUser(e) {
    e.preventDefault();
    setError(null);
    try {
      await attendanceApi.post("/users", newUser);
      setNewUser({ name: "", email: "", password: "", role: "alumno", carnetCode: "" });
      loadAll();
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo crear el usuario");
    }
  }

  async function handleCreateGroup(e) {
    e.preventDefault();
    setError(null);
    try {
      await attendanceApi.post("/groups", {
        name: newGroup.name,
        teacherId: newGroup.teacherId || null,
      });
      setNewGroup({ name: "", teacherId: "" });
      loadAll();
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo crear el grupo");
    }
  }

  async function toggleActive(user) {
    await attendanceApi.put(`/users/${user._id}`, { active: !user.active });
    loadAll();
  }

  const teachers = users.filter((u) => u.role === "maestro");

  return (
    <section className="page">
      <h1>Panel del Coordinador</h1>
      {error && <p className="error">{error}</p>}

      <h2>Usuarios</h2>
      <form onSubmit={handleCreateUser} className="form form-inline">
        <input
          placeholder="Nombre"
          value={newUser.name}
          onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={newUser.email}
          onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={newUser.password}
          onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
          required
        />
        <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
          <option value="alumno">Alumno</option>
          <option value="maestro">Maestro</option>
          <option value="coordinador">Coordinador</option>
        </select>
        <input
          placeholder="Carnet (opcional)"
          value={newUser.carnetCode}
          onChange={(e) => setNewUser({ ...newUser, carnetCode: e.target.value })}
        />
        <button type="submit">Crear usuario</button>
      </form>

      <table className="table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>Rol</th>
            <th>Activo</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u._id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>{u.active ? "Sí" : "No"}</td>
              <td>
                <button onClick={() => toggleActive(u)}>{u.active ? "Desactivar" : "Activar"}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Grupos</h2>
      <form onSubmit={handleCreateGroup} className="form form-inline">
        <input
          placeholder="Nombre del grupo"
          value={newGroup.name}
          onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
          required
        />
        <select
          value={newGroup.teacherId}
          onChange={(e) => setNewGroup({ ...newGroup, teacherId: e.target.value })}
        >
          <option value="">Sin maestro asignado</option>
          {teachers.map((t) => (
            <option key={t._id} value={t._id}>
              {t.name}
            </option>
          ))}
        </select>
        <button type="submit">Crear grupo</button>
      </form>

      <ul className="group-list">
        {groups.map((g) => (
          <li key={g._id} className="group-card">
            <h2>{g.name}</h2>
            <p>Maestro: {g.teacherId?.name ?? "Sin asignar"}</p>
            <p>Alumnos: {g.studentIds?.length ?? 0}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

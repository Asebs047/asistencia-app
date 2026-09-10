import { useEffect, useState } from "react";
import { attendanceApi } from "../../api/attendanceApi";

export default function GroupsTab() {
  const [groups, setGroups] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [newGroup, setNewGroup] = useState({ name: "", teacherId: "" });
  const [selections, setSelections] = useState({});
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  async function load() {
    const [groupsRes, teachersRes, studentsRes] = await Promise.all([
      attendanceApi.get("/groups"),
      attendanceApi.get("/users", { params: { role: "maestro" } }),
      attendanceApi.get("/users", { params: { role: "alumno" } }),
    ]);
    setGroups(groupsRes.data);
    setTeachers(teachersRes.data);
    setStudents(studentsRes.data);
    setSelections(
      Object.fromEntries(
        groupsRes.data.map((g) => [g._id, g.studentIds?.map((s) => s._id) || []])
      )
    );
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreateGroup(e) {
    e.preventDefault();
    setError(null);
    try {
      await attendanceApi.post("/groups", {
        name: newGroup.name,
        teacherId: newGroup.teacherId || null,
      });
      setNewGroup({ name: "", teacherId: "" });
      load();
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo crear el grupo");
    }
  }

  function toggleStudent(groupId, studentId) {
    setSelections((prev) => {
      const current = prev[groupId] || [];
      const next = current.includes(studentId)
        ? current.filter((id) => id !== studentId)
        : [...current, studentId];
      return { ...prev, [groupId]: next };
    });
  }

  async function saveAssignments(groupId) {
    setError(null);
    setMessage(null);
    try {
      await attendanceApi.put(`/groups/${groupId}`, { studentIds: selections[groupId] || [] });
      setMessage("Alumnos asignados correctamente.");
      load();
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo asignar a los alumnos");
    }
  }

  return (
    <div>
      <div className="section">
        <h2>Nuevo grupo</h2>
        {error && <p className="error">{error}</p>}
        {message && <p className="success">{message}</p>}
        <form onSubmit={handleCreateGroup} className="form-row">
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
      </div>

      {groups.map((g) => (
        <div className="section" key={g._id}>
          <h2>{g.name}</h2>
          <p className="hint">Maestro: {g.teacherId?.name ?? "Sin asignar"}</p>
          <p className="hint">
            Un alumno solo puede pertenecer a un grupo: marcarlo aquí lo mueve desde su grupo
            anterior.
          </p>

          <div className="table-wrap" style={{ margin: "0.75rem 0" }}>
            <table className="table">
              <thead>
                <tr>
                  <th></th>
                  <th>Alumno</th>
                  <th>Carnet</th>
                  <th>Grupo actual</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => {
                  const currentGroup = groups.find((og) => og._id === s.groupId);
                  return (
                    <tr key={s._id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={(selections[g._id] || []).includes(s._id)}
                          onChange={() => toggleStudent(g._id, s._id)}
                        />
                      </td>
                      <td>{s.name}</td>
                      <td>{s.carnetCode}</td>
                      <td>
                        {currentGroup && currentGroup._id !== g._id ? currentGroup.name : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <button onClick={() => saveAssignments(g._id)}>Guardar alumnos asignados</button>
        </div>
      ))}
    </div>
  );
}

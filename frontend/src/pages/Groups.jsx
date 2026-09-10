import { useEffect, useState } from "react";
import { attendanceApi } from "../api/attendanceApi";

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    attendanceApi
      .get("/groups")
      .then((res) => setGroups(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <section className="page">Cargando grupos...</section>;
  if (error)
    return (
      <section className="page">
        <p className="error">
          No se pudo conectar con el Servicio A ({error}). Verifica que esté
          corriendo en el puerto 4001.
        </p>
      </section>
    );

  return (
    <section className="page">
      <h1>Grupos</h1>
      {groups.length === 0 && <p>No hay grupos registrados todavía.</p>}
      <ul className="group-list">
        {groups.map((group) => (
          <li key={group._id} className="group-card">
            <h2>{group.name}</h2>
            <p>Maestro: {group.teacherId?.name ?? "Sin asignar"}</p>
            <p>Alumnos: {group.studentIds?.length ?? 0}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

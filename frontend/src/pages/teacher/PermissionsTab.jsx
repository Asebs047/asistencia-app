import { useEffect, useState } from "react";
import { reportsApi } from "../../api/reportsApi";
import { useUserDirectory } from "../../hooks/useUserDirectory";

export default function PermissionsTab() {
  const [permissions, setPermissions] = useState([]);
  const [error, setError] = useState(null);
  const { nameOf } = useUserDirectory();

  async function load() {
    const { data } = await reportsApi.get("/permissions");
    setPermissions(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function resolvePermission(id, action) {
    setError(null);
    try {
      await reportsApi.patch(`/permissions/${id}/${action}`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo actualizar el permiso");
    }
  }

  return (
    <div className="section">
      <h2>Permisos de mis grupos</h2>
      {error && <p className="error">{error}</p>}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Alumno</th>
              <th>Estado</th>
              <th>Solicitado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {permissions.map((p) => (
              <tr key={p._id}>
                <td>{nameOf(p.studentId)}</td>
                <td>
                  <span className="badge">{p.status}</span>
                </td>
                <td>{new Date(p.requestedAt).toLocaleTimeString()}</td>
                <td>
                  {p.status === "solicitado" && (
                    <div className="form-inline">
                      <button onClick={() => resolvePermission(p._id, "authorize")}>Autorizar</button>
                      <button className="danger" onClick={() => resolvePermission(p._id, "reject")}>
                        Rechazar
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

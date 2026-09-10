import { useEffect, useState } from "react";
import { reportsApi } from "../../api/reportsApi";

export default function PermissionsTab() {
  const [permissions, setPermissions] = useState([]);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  async function load() {
    const { data } = await reportsApi.get("/permissions");
    setPermissions(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function requestPermission() {
    setError(null);
    setMessage(null);
    try {
      await reportsApi.post("/permissions", {});
      setMessage("Permiso solicitado.");
      load();
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo solicitar el permiso");
    }
  }

  async function advance(id, action) {
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
      <h2>Permisos para ir al baño</h2>
      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}
      <button onClick={requestPermission}>Solicitar permiso</button>

      <div className="table-wrap" style={{ marginTop: "1rem" }}>
        <table className="table">
          <thead>
            <tr>
              <th>Estado</th>
              <th>Solicitado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {permissions.map((p) => (
              <tr key={p._id}>
                <td>
                  <span className="badge">{p.status}</span>
                </td>
                <td>{new Date(p.requestedAt).toLocaleTimeString()}</td>
                <td>
                  {p.status === "autorizado" && (
                    <button onClick={() => advance(p._id, "start")}>Registrar salida</button>
                  )}
                  {p.status === "iniciado" && (
                    <button onClick={() => advance(p._id, "finish")}>Registrar regreso</button>
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

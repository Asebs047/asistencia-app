import { useEffect, useState } from "react";
import { attendanceApi } from "../api/attendanceApi";

// Trae los usuarios visibles para el rol actual y arma un mapa id -> usuario,
// para poder mostrar nombres en vez de ObjectIds en tablas de asistencia/permisos.
export function useUserDirectory() {
  const [byId, setById] = useState({});

  useEffect(() => {
    attendanceApi.get("/users").then(({ data }) => {
      const map = {};
      for (const user of data) map[user._id] = user;
      setById(map);
    });
  }, []);

  function nameOf(id) {
    return byId[id]?.name || id;
  }

  return { byId, nameOf };
}

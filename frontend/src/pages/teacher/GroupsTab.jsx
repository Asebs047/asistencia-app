import { useEffect, useState } from "react";
import { attendanceApi } from "../../api/attendanceApi";

export default function GroupsTab() {
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    attendanceApi.get("/groups").then(({ data }) => setGroups(data));
  }, []);

  return (
    <ul className="group-list">
      {groups.map((g) => (
        <li key={g._id} className="group-card">
          <h2>{g.name}</h2>
          <p>Alumnos: {g.studentIds?.map((s) => s.name).join(", ") || "Sin alumnos"}</p>
        </li>
      ))}
    </ul>
  );
}

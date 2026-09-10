import Tabs from "../components/Tabs";
import GroupsTab from "./teacher/GroupsTab";
import AttendanceTab from "./teacher/AttendanceTab";
import PermissionsTab from "./teacher/PermissionsTab";

export default function TeacherPanel() {
  return (
    <section className="page">
      <h1>Panel del Maestro</h1>
      <Tabs
        tabs={[
          { key: "groups", label: "Mis grupos", content: <GroupsTab /> },
          { key: "attendance", label: "Asistencia", content: <AttendanceTab /> },
          { key: "permissions", label: "Permisos", content: <PermissionsTab /> },
        ]}
      />
    </section>
  );
}

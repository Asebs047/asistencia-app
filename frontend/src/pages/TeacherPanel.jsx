import Sidebar from "../components/Sidebar";
import GroupsTab from "./teacher/GroupsTab";
import AttendanceTab from "./teacher/AttendanceTab";
import PermissionsTab from "./teacher/PermissionsTab";
import ReportsTab from "./reports/ReportsTab";
import { IconGroups, IconAttendance, IconPermissions, IconReports } from "../components/icons";

export default function TeacherPanel() {
  return (
    <section>
      <div className="page" style={{ paddingBottom: 0 }}>
        <h1>Panel del Maestro</h1>
      </div>
      <Sidebar
        items={[
          { key: "groups", label: "Mis grupos", icon: IconGroups, content: <GroupsTab /> },
          { key: "attendance", label: "Asistencia", icon: IconAttendance, content: <AttendanceTab /> },
          { key: "permissions", label: "Permisos", icon: IconPermissions, content: <PermissionsTab /> },
          { key: "reports", label: "Reportes", icon: IconReports, content: <ReportsTab /> },
        ]}
      />
    </section>
  );
}

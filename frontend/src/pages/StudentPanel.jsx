import Sidebar from "../components/Sidebar";
import AttendanceTab from "./student/AttendanceTab";
import PermissionsTab from "./student/PermissionsTab";
import { IconAttendance, IconPermissions } from "../components/icons";

export default function StudentPanel() {
  return (
    <section>
      <div className="page" style={{ paddingBottom: 0 }}>
        <h1>Panel del Alumno</h1>
      </div>
      <Sidebar
        items={[
          { key: "attendance", label: "Asistencia", icon: IconAttendance, content: <AttendanceTab /> },
          { key: "permissions", label: "Permisos", icon: IconPermissions, content: <PermissionsTab /> },
        ]}
      />
    </section>
  );
}

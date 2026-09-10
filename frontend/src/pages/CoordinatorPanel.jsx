import Sidebar from "../components/Sidebar";
import StudentsTab from "./coordinator/StudentsTab";
import StaffTab from "./coordinator/StaffTab";
import GroupsTab from "./coordinator/GroupsTab";
import AttendanceTab from "./coordinator/AttendanceTab";
import ReportsTab from "./reports/ReportsTab";
import { IconStudents, IconTeacher, IconCoordinator, IconGroups, IconAttendance, IconReports } from "../components/icons";

export default function CoordinatorPanel() {
  return (
    <section>
      <div className="page" style={{ paddingBottom: 0 }}>
        <h1>Panel del Coordinador</h1>
      </div>
      <Sidebar
        items={[
          { key: "students", label: "Alumnos", icon: IconStudents, content: <StudentsTab /> },
          { key: "teachers", label: "Maestros", icon: IconTeacher, content: <StaffTab role="maestro" label="Maestro" /> },
          {
            key: "coordinators",
            label: "Coordinadores",
            icon: IconCoordinator,
            content: <StaffTab role="coordinador" label="Coordinador" />,
          },
          { key: "groups", label: "Grupos", icon: IconGroups, content: <GroupsTab /> },
          { key: "attendance", label: "Asistencia", icon: IconAttendance, content: <AttendanceTab /> },
          { key: "reports", label: "Reportes", icon: IconReports, content: <ReportsTab /> },
        ]}
      />
    </section>
  );
}

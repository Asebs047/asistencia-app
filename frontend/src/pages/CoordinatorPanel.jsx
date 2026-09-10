import Tabs from "../components/Tabs";
import StudentsTab from "./coordinator/StudentsTab";
import StaffTab from "./coordinator/StaffTab";
import GroupsTab from "./coordinator/GroupsTab";
import AttendanceTab from "./coordinator/AttendanceTab";

export default function CoordinatorPanel() {
  return (
    <section className="page">
      <h1>Panel del Coordinador</h1>
      <Tabs
        tabs={[
          { key: "students", label: "Alumnos", content: <StudentsTab /> },
          { key: "teachers", label: "Maestros", content: <StaffTab role="maestro" label="Maestro" /> },
          {
            key: "coordinators",
            label: "Coordinadores",
            content: <StaffTab role="coordinador" label="Coordinador" />,
          },
          { key: "groups", label: "Grupos", content: <GroupsTab /> },
          { key: "attendance", label: "Asistencia", content: <AttendanceTab /> },
        ]}
      />
    </section>
  );
}

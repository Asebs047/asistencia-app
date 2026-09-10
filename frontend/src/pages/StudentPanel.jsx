import Tabs from "../components/Tabs";
import AttendanceTab from "./student/AttendanceTab";
import PermissionsTab from "./student/PermissionsTab";

export default function StudentPanel() {
  return (
    <section className="page">
      <h1>Panel del Alumno</h1>
      <Tabs
        tabs={[
          { key: "attendance", label: "Asistencia", content: <AttendanceTab /> },
          { key: "permissions", label: "Permisos", content: <PermissionsTab /> },
        ]}
      />
    </section>
  );
}

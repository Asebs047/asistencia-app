import { useAuthStore } from "../store/authStore";

export default function Home() {
  const user = useAuthStore((s) => s.user);

  return (
    <section className="page">
      <h1>Sistema de Asistencia y Permisos</h1>
      <div className="section">
        <p>
          Gestiona la asistencia de alumnos por carnet o biometría, y las
          solicitudes de permiso para salir del salón, con un panel distinto
          para coordinador, maestro y alumno.
        </p>
      </div>
      {!user && <p className="hint">Inicia sesión para acceder a tu panel.</p>}
    </section>
  );
}

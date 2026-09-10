import { NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import "./NavBar.css";

export default function NavBar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <nav className="navbar">
      <span className="navbar-brand">Asistencia App</span>
      <div className="navbar-links">
        <NavLink to="/" end>
          Inicio
        </NavLink>
        {user && (
          <NavLink to="/panel">Mi panel</NavLink>
        )}
        <NavLink to="/grupos">Grupos</NavLink>
        {user ? (
          <>
            <span className="navbar-user">
              {user.name} ({user.role})
            </span>
            <button className="navbar-logout" onClick={handleLogout}>
              Salir
            </button>
          </>
        ) : (
          <NavLink to="/login">Iniciar sesión</NavLink>
        )}
      </div>
    </nav>
  );
}

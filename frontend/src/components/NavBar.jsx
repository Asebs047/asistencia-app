import { NavLink } from "react-router-dom";
import "./NavBar.css";

export default function NavBar() {
  return (
    <nav className="navbar">
      <span className="navbar-brand">Asistencia App</span>
      <div className="navbar-links">
        <NavLink to="/" end>
          Inicio
        </NavLink>
        <NavLink to="/grupos">Grupos</NavLink>
      </div>
    </nav>
  );
}

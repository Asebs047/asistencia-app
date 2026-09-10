import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { attendanceApi } from "../api/attendanceApi";
import { useAuthStore } from "../store/authStore";

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const navigate = useNavigate();
  const forced = !user.passwordChanged;

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas nuevas no coinciden");
      return;
    }

    setLoading(true);
    try {
      const { data } = await attendanceApi.post("/auth/change-password", {
        currentPassword,
        newPassword,
      });
      setUser(data.user);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo cambiar la contraseña");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="page">
      <h1>Cambiar contraseña</h1>
      {forced && (
        <p className="hint">
          Es tu primer inicio de sesión con una contraseña temporal — debes cambiarla antes
          de continuar.
        </p>
      )}
      <form onSubmit={handleSubmit} className="form">
        <label>
          Contraseña actual
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </label>
        <label>
          Nueva contraseña
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={6}
            required
          />
        </label>
        <label>
          Confirmar nueva contraseña
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={6}
            required
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? "Guardando..." : "Cambiar contraseña"}
        </button>
      </form>
    </section>
  );
}

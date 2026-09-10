import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function ProtectedRoute({ roles, allowUnchangedPassword, children }) {
  const { token, user } = useAuthStore();

  if (!token) return <Navigate to="/login" replace />;
  if (!user.passwordChanged && !allowUnchangedPassword) {
    return <Navigate to="/cambiar-password" replace />;
  }
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;

  return children;
}

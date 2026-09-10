import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token no proporcionado" });
  }

  try {
    const token = header.slice("Bearer ".length);
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Se revalida en cada solicitud (no solo en el login) para que desactivar una
    // cuenta corte su acceso de inmediato, no hasta que el token expire por sí solo.
    const user = await User.findById(payload.sub).select("active");
    if (!user || !user.active) {
      return res.status(401).json({ message: "Cuenta inactiva" });
    }

    req.user = payload;
    next();
  } catch {
    res.status(401).json({ message: "Token inválido o expirado" });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "No tienes permiso para esta acción" });
    }
    next();
  };
}

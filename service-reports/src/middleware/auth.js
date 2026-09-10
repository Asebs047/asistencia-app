import jwt from "jsonwebtoken";

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token no proporcionado" });
  }

  try {
    const token = header.slice("Bearer ".length);
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    req.token = token;
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

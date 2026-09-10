// Traduce errores comunes (duplicados, validación de Mongoose, ids malformados, JSON
// inválido) a respuestas 4xx limpias en vez de dejarlos caer como 500 genéricos.
export function errorHandler(err, req, res, next) {
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || "campo";
    return res.status(409).json({ message: `Ya existe un registro con ese ${field}` });
  }

  if (err.name === "ValidationError") {
    return res.status(400).json({
      message: "Datos inválidos",
      errors: Object.values(err.errors).map((e) => e.message),
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({ message: "Identificador inválido" });
  }

  if (err.type === "entity.parse.failed" || err instanceof SyntaxError) {
    return res.status(400).json({ message: "JSON inválido en el cuerpo de la solicitud" });
  }

  if (typeof err.status === "number" && err.status >= 400 && err.status < 500) {
    return res.status(err.status).json({ message: err.message || "Solicitud inválida" });
  }

  console.error(err);
  res.status(500).json({ message: "Error interno del servidor" });
}

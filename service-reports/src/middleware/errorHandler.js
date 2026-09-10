// Traduce errores comunes (validación de Mongoose, ids malformados, JSON inválido, y
// errores reenviados por llamadas HTTP a service-attendance) a respuestas 4xx limpias.
export function errorHandler(err, req, res, next) {
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

  // Error de axios al llamar a service-attendance: reenvía su status/mensaje si es un
  // 4xx (ej. 403/404 de autorización), en vez de dejarlo caer como 500.
  if (err.isAxiosError) {
    if (err.response) {
      const status = err.response.status;
      if (status >= 400 && status < 500) {
        return res.status(status).json(err.response.data || { message: "Solicitud inválida" });
      }
    } else {
      return res.status(502).json({ message: "service-attendance no respondió a tiempo" });
    }
  }

  if (typeof err.status === "number" && err.status >= 400 && err.status < 500) {
    return res.status(err.status).json({ message: err.message || "Solicitud inválida" });
  }

  console.error(err);
  res.status(500).json({ message: "Error interno del servidor" });
}

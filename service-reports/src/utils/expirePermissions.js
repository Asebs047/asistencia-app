import Permission from "../models/Permission.js";

const MAX_DURATION_MINUTES = 15;

// Marca como "vencido" cualquier permiso iniciado que exceda la duración máxima.
// Se ejecuta de forma perezosa (al listar), sin necesidad de un cron job.
export async function expireOverduePermissions() {
  const threshold = new Date(Date.now() - MAX_DURATION_MINUTES * 60 * 1000);
  await Permission.updateMany(
    { status: "iniciado", startedAt: { $lte: threshold } },
    { status: "vencido" }
  );
}

import { Router } from "express";
import Permission from "../models/Permission.js";
import { authMiddleware, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { attendanceClientFor } from "../clients/attendanceClient.js";
import { computePunctuality, computePermissionStats } from "../utils/statistics.js";

const router = Router();

const ENTRY_TIME = process.env.ATTENDANCE_ENTRY_TIME || "07:00";
const GRACE_MINUTES = process.env.ATTENDANCE_GRACE_MINUTES || 15;

router.use(authMiddleware);
// Los reportes son para coordinador/maestro; no están entre las funcionalidades del
// alumno en el enunciado (que solo consulta su propio historial vía Servicio A).
router.use(requireRole("coordinador", "maestro"));

// GET /reports/attendance - asistencia enriquecida con puntualidad + resumen.
// service-attendance ya filtra por rol (coordinador todo, maestro sus grupos), así
// que aquí solo se reenvía el token y se procesa el resultado.
router.get(
  "/attendance",
  asyncHandler(async (req, res) => {
    const client = attendanceClientFor(req.token);
    const { data: attendance } = await client.get("/attendance");
    res.json(computePunctuality(attendance, ENTRY_TIME, GRACE_MINUTES));
  })
);

// GET /reports/attendance/student/:studentId
router.get(
  "/attendance/student/:studentId",
  asyncHandler(async (req, res) => {
    const client = attendanceClientFor(req.token);
    const { data: attendance } = await client.get(`/attendance/student/${req.params.studentId}`);
    res.json(computePunctuality(attendance, ENTRY_TIME, GRACE_MINUTES));
  })
);

// GET /reports/attendance/group/:groupId
router.get(
  "/attendance/group/:groupId",
  asyncHandler(async (req, res) => {
    const client = attendanceClientFor(req.token);
    const { data: attendance } = await client.get(`/attendance/group/${req.params.groupId}`);
    res.json(computePunctuality(attendance, ENTRY_TIME, GRACE_MINUTES));
  })
);

// GET /reports/permissions - cantidad, duración promedio y frecuencia por alumno/grupo
router.get(
  "/permissions",
  asyncHandler(async (req, res) => {
    const { role } = req.user;

    let permissions;
    if (role === "coordinador") {
      permissions = await Permission.find();
    } else {
      const client = attendanceClientFor(req.token);
      const { data: groups } = await client.get("/groups");
      const groupIds = groups.map((g) => g._id);
      permissions = await Permission.find({ groupId: { $in: groupIds } });
    }

    res.json(computePermissionStats(permissions));
  })
);

export default router;

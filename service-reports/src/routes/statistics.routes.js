import { Router } from "express";
import Permission from "../models/Permission.js";
import { authMiddleware, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { attendanceClientFor } from "../clients/attendanceClient.js";
import { computePunctuality, computeAbsences, computePermissionStats } from "../utils/statistics.js";

const router = Router();

const ENTRY_TIME = process.env.ATTENDANCE_ENTRY_TIME || "07:00";
const GRACE_MINUTES = process.env.ATTENDANCE_GRACE_MINUTES || 15;

router.use(authMiddleware);
router.use(requireRole("coordinador", "maestro"));

const ACTIVE_PERMISSION_STATUSES = ["solicitado", "autorizado", "iniciado"];

async function scopedPermissions(req) {
  if (req.user.role === "coordinador") return Permission.find();
  const client = attendanceClientFor(req.token);
  const { data: groups } = await client.get("/groups");
  const groupIds = groups.map((g) => g._id);
  return Permission.find({ groupId: { $in: groupIds } });
}

// GET /statistics/summary - resumen general (alumnos activos, marcaciones de hoy,
// permisos activos, duración promedio de permisos). Todo ya viene filtrado por rol
// desde service-attendance / la propia base de permisos.
router.get(
  "/summary",
  asyncHandler(async (req, res) => {
    const client = attendanceClientFor(req.token);
    const [{ data: students }, { data: attendance }, permissions] = await Promise.all([
      client.get("/users", { params: { role: "alumno" } }),
      client.get("/attendance"),
      scopedPermissions(req),
    ]);

    const todayKey = new Date().toISOString().slice(0, 10);
    const todayEntradas = attendance.filter(
      (a) => a.type === "entrada" && new Date(a.markedAt).toISOString().slice(0, 10) === todayKey
    );

    const activePermissions = permissions.filter((p) => ACTIVE_PERMISSION_STATUSES.includes(p.status));
    const { byStudent } = computePermissionStats(permissions);
    const totalDuration = byStudent.reduce((sum, s) => sum + s.totalDurationMs, 0);
    const totalFinished = byStudent.reduce((sum, s) => sum + (s.avgDurationMs ? 1 : 0), 0);

    res.json({
      activeStudents: students.filter((s) => s.active).length,
      attendanceToday: todayEntradas.length,
      activePermissions: activePermissions.length,
      avgPermissionDurationMs: totalFinished ? totalDuration / totalFinished : null,
    });
  })
);

// GET /statistics/punctuality - % puntualidad general y por alumno
router.get(
  "/punctuality",
  asyncHandler(async (req, res) => {
    const client = attendanceClientFor(req.token);
    const { data: attendance } = await client.get("/attendance");
    const { records, summary } = computePunctuality(attendance, ENTRY_TIME, GRACE_MINUTES);

    const byStudent = new Map();
    for (const r of records) {
      if (r.type !== "entrada") continue;
      const key = r.studentId.toString();
      if (!byStudent.has(key)) byStudent.set(key, { studentId: r.studentId, total: 0, onTime: 0 });
      const bucket = byStudent.get(key);
      bucket.total += 1;
      if (r.onTime) bucket.onTime += 1;
    }

    res.json({
      summary,
      byStudent: [...byStudent.values()].map((b) => ({ ...b, onTimeRate: b.onTime / b.total })),
    });
  })
);

// GET /statistics/absences - ausencias por alumno en la ventana de días (?days=7)
router.get(
  "/absences",
  asyncHandler(async (req, res) => {
    const requested = Number(req.query.days);
    const days = requested > 0 ? Math.min(requested, 365) : 7;
    const client = attendanceClientFor(req.token);
    const [{ data: students }, { data: attendance }] = await Promise.all([
      client.get("/users", { params: { role: "alumno" } }),
      client.get("/attendance"),
    ]);

    res.json(computeAbsences(students.filter((s) => s.active), attendance, days));
  })
);

export default router;

import { Router } from "express";
import { z } from "zod";
import Attendance, { startOfDay } from "../models/Attendance.js";
import User from "../models/User.js";
import Group from "../models/Group.js";
import { authMiddleware } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();

const cardSchema = z.object({
  carnetCode: z.string().min(1),
  type: z.enum(["entrada", "salida"]).default("entrada"),
});

router.use(authMiddleware);

async function createAttendance(student, method, type, res) {
  if (!student || !student.active) {
    return res.status(404).json({ message: "Alumno no encontrado o inactivo" });
  }
  if (!student.groupId) {
    return res.status(422).json({ message: "El alumno no pertenece a ningún grupo" });
  }

  const day = startOfDay(new Date());

  if (type === "salida") {
    const entrada = await Attendance.findOne({ studentId: student._id, day, type: "entrada" });
    if (!entrada) {
      return res.status(422).json({ message: "No se puede registrar salida sin una entrada previa hoy" });
    }
  }

  try {
    const attendance = await Attendance.create({
      studentId: student._id,
      groupId: student.groupId,
      method,
      type,
      day,
    });
    return res.status(201).json(attendance);
  } catch (err) {
    if (err.code === 11000) {
      const label = type === "entrada" ? "una entrada" : "una salida";
      return res.status(409).json({ message: `El alumno ya registró ${label} hoy` });
    }
    throw err;
  }
}

// POST /attendance/card - marcación por carnet (entrada o salida)
router.post(
  "/card",
  asyncHandler(async (req, res) => {
    const parsed = cardSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Datos inválidos", errors: parsed.error.issues });
    }

    const student = await User.findOne({ carnetCode: parsed.data.carnetCode, role: "alumno" });

    // Un alumno solo puede marcar su propia asistencia; solo maestro/coordinador
    // (ej. operando un lector físico) pueden marcar la de cualquier alumno.
    if (req.user.role === "alumno" && student && student._id.toString() !== req.user.sub) {
      return res.status(403).json({ message: "No puedes marcar la asistencia de otro alumno" });
    }

    await createAttendance(student, "carnet", parsed.data.type, res);
  })
);

// GET /attendance - filtrado por rol
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { role, sub } = req.user;

    if (role === "coordinador") {
      return res.json(await Attendance.find().sort({ markedAt: -1 }));
    }
    if (role === "maestro") {
      const groups = await Group.find({ teacherId: sub });
      const groupIds = groups.map((g) => g._id);
      return res.json(await Attendance.find({ groupId: { $in: groupIds } }).sort({ markedAt: -1 }));
    }
    // alumno
    return res.json(await Attendance.find({ studentId: sub }).sort({ markedAt: -1 }));
  })
);

router.get(
  "/student/:studentId",
  asyncHandler(async (req, res) => {
    const { role, sub } = req.user;
    if (role === "alumno" && req.params.studentId !== sub) {
      return res.status(403).json({ message: "No puedes consultar asistencia de otro alumno" });
    }
    if (role === "maestro") {
      const student = await User.findById(req.params.studentId).select("groupId");
      const group = student?.groupId ? await Group.findOne({ _id: student.groupId, teacherId: sub }) : null;
      if (!group) return res.status(403).json({ message: "No eres maestro de este alumno" });
    }
    res.json(await Attendance.find({ studentId: req.params.studentId }).sort({ markedAt: -1 }));
  })
);

router.get(
  "/group/:groupId",
  asyncHandler(async (req, res) => {
    const { role, sub } = req.user;
    if (role === "maestro") {
      const group = await Group.findOne({ _id: req.params.groupId, teacherId: sub });
      if (!group) return res.status(403).json({ message: "No eres maestro de este grupo" });
    }
    if (role === "alumno") {
      return res.status(403).json({ message: "No autorizado" });
    }
    res.json(await Attendance.find({ groupId: req.params.groupId }).sort({ markedAt: -1 }));
  })
);

export { createAttendance };
export default router;

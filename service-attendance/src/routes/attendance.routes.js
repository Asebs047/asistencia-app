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
});

router.use(authMiddleware);

async function createAttendance(student, method, res) {
  if (!student || !student.active) {
    return res.status(404).json({ message: "Alumno no encontrado o inactivo" });
  }
  if (!student.groupId) {
    return res.status(422).json({ message: "El alumno no pertenece a ningún grupo" });
  }

  try {
    const attendance = await Attendance.create({
      studentId: student._id,
      groupId: student.groupId,
      method,
      day: startOfDay(new Date()),
    });
    return res.status(201).json(attendance);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "El alumno ya marcó asistencia hoy" });
    }
    throw err;
  }
}

// POST /attendance/card - marcación por carnet (alumno o coordinador/maestro operando el lector)
router.post(
  "/card",
  asyncHandler(async (req, res) => {
    const parsed = cardSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Datos inválidos", errors: parsed.error.issues });
    }

    const student = await User.findOne({ carnetCode: parsed.data.carnetCode, role: "alumno" });
    await createAttendance(student, "carnet", res);
  })
);

// GET /attendance - filtrado por rol
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { role, sub, groupId } = req.user;

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

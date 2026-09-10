import { Router } from "express";
import { z } from "zod";
import Group from "../models/Group.js";
import User from "../models/User.js";
import { authMiddleware, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();

const createGroupSchema = z.object({
  name: z.string().min(1),
  teacherId: z.string().nullable().optional(),
  studentIds: z.array(z.string()).optional(),
});

const updateGroupSchema = z.object({
  name: z.string().min(1).optional(),
  teacherId: z.string().nullable().optional(),
  studentIds: z.array(z.string()).optional(),
});

// Adjunta a cada grupo sus alumnos actuales (derivados de User.groupId, no de un
// arreglo propio) para no romper el contrato que ya consume el frontend.
async function attachStudents(groups) {
  const list = Array.isArray(groups) ? groups : [groups];
  const groupIds = list.map((g) => g._id);
  const students = await User.find({ role: "alumno", groupId: { $in: groupIds } }).select(
    "name email carnetCode groupId"
  );

  const byGroup = new Map();
  for (const student of students) {
    const key = student.groupId.toString();
    if (!byGroup.has(key)) byGroup.set(key, []);
    byGroup.get(key).push(student);
  }

  const result = list.map((g) => ({
    ...g.toObject(),
    studentIds: byGroup.get(g._id.toString()) || [],
  }));

  return Array.isArray(groups) ? result : result[0];
}

// Un alumno solo puede pertenecer a un grupo: asignarlo a `groupId` mueve el
// groupId de cada alumno de la lista (quitándolo de cualquier grupo anterior) y
// libera a los que estaban en este grupo pero ya no vienen en `studentIds`.
async function setGroupStudents(groupId, studentIds) {
  await User.updateMany({ groupId, _id: { $nin: studentIds } }, { groupId: null });
  if (studentIds.length) {
    await User.updateMany({ _id: { $in: studentIds } }, { groupId });
  }
}

router.use(authMiddleware);

// GET /groups - filtrado por rol
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { role, sub } = req.user;

    if (role === "coordinador") {
      const groups = await Group.find().populate("teacherId", "name email").sort({ createdAt: -1 });
      return res.json(await attachStudents(groups));
    }

    if (role === "maestro") {
      const groups = await Group.find({ teacherId: sub })
        .populate("teacherId", "name email")
        .sort({ createdAt: -1 });
      return res.json(await attachStudents(groups));
    }

    // alumno: solo su grupo. Se consulta groupId fresco en Mongo en vez de confiar
    // en el claim del JWT, que puede quedar desactualizado si lo reasignan de
    // grupo mientras la sesión sigue abierta.
    const self = await User.findById(sub).select("groupId");
    if (!self?.groupId) return res.json([]);
    const group = await Group.findById(self.groupId).populate("teacherId", "name email");
    if (!group) return res.json([]);
    res.json([await attachStudents(group)]);
  })
);

// POST /groups - solo coordinador
router.post(
  "/",
  requireRole("coordinador"),
  asyncHandler(async (req, res) => {
    const parsed = createGroupSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Datos inválidos", errors: parsed.error.issues });
    }

    const { studentIds, ...groupFields } = parsed.data;
    const group = await Group.create(groupFields);
    if (studentIds?.length) {
      await setGroupStudents(group._id, studentIds);
    }
    res.status(201).json(await attachStudents(group));
  })
);

// PUT /groups/:id - solo coordinador
router.put(
  "/:id",
  requireRole("coordinador"),
  asyncHandler(async (req, res) => {
    const parsed = updateGroupSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Datos inválidos", errors: parsed.error.issues });
    }

    const { studentIds, ...groupFields } = parsed.data;
    const group = await Group.findByIdAndUpdate(req.params.id, groupFields, { new: true });
    if (!group) return res.status(404).json({ message: "Grupo no encontrado" });

    if (studentIds) {
      await setGroupStudents(group._id, studentIds);
    }

    res.json(await attachStudents(group));
  })
);

// GET /groups/:id - lectura puntual (usada por service-reports para validar autorización)
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: "Grupo no encontrado" });
    res.json(group);
  })
);

export default router;

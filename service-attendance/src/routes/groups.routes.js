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

// Mantiene sincronizado User.groupId con Group.studentIds: quita el grupo a los
// alumnos removidos y lo asigna a los agregados. Group.studentIds es la fuente de
// verdad; User.groupId es una copia denormalizada que usan asistencia y permisos.
async function syncStudentGroups(groupId, previousStudentIds, nextStudentIds) {
  const previous = new Set(previousStudentIds.map(String));
  const next = new Set(nextStudentIds.map(String));

  const added = [...next].filter((id) => !previous.has(id));
  const removed = [...previous].filter((id) => !next.has(id));

  if (added.length) {
    await User.updateMany({ _id: { $in: added } }, { groupId });
  }
  if (removed.length) {
    await User.updateMany({ _id: { $in: removed }, groupId }, { groupId: null });
  }
}

router.use(authMiddleware);

// GET /groups - filtrado por rol
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { role, sub, groupId } = req.user;

    const baseQuery = Group.find()
      .populate("teacherId", "name email")
      .populate("studentIds", "name email carnetCode")
      .sort({ createdAt: -1 });

    if (role === "coordinador") {
      return res.json(await baseQuery);
    }

    if (role === "maestro") {
      return res.json(
        await Group.find({ teacherId: sub })
          .populate("teacherId", "name email")
          .populate("studentIds", "name email carnetCode")
          .sort({ createdAt: -1 })
      );
    }

    // alumno: solo su grupo
    if (!groupId) return res.json([]);
    const group = await Group.findById(groupId)
      .populate("teacherId", "name email")
      .populate("studentIds", "name email carnetCode");
    res.json(group ? [group] : []);
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

    const group = await Group.create(parsed.data);
    if (parsed.data.studentIds?.length) {
      await syncStudentGroups(group._id, [], parsed.data.studentIds);
    }
    res.status(201).json(group);
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

    const before = await Group.findById(req.params.id);
    if (!before) return res.status(404).json({ message: "Grupo no encontrado" });

    const group = await Group.findByIdAndUpdate(req.params.id, parsed.data, { new: true });

    if (parsed.data.studentIds) {
      await syncStudentGroups(group._id, before.studentIds, parsed.data.studentIds);
    }

    res.json(group);
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

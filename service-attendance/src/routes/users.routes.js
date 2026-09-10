import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import User from "../models/User.js";
import Group from "../models/Group.js";
import { authMiddleware, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["coordinador", "maestro", "alumno"]),
  carnetCode: z.string().optional(),
  groupId: z.string().optional(),
});

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  carnetCode: z.string().optional(),
  active: z.boolean().optional(),
  groupId: z.string().nullable().optional(),
});

router.use(authMiddleware);

// GET /users - lista filtrada por rol
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { role, sub, groupId } = req.user;

    if (role === "coordinador") {
      return res.json(await User.find().sort({ createdAt: -1 }));
    }

    if (role === "maestro") {
      const groups = await Group.find({ teacherId: sub });
      const groupIds = groups.map((g) => g._id);
      const users = await User.find({
        $or: [{ _id: sub }, { groupId: { $in: groupIds } }],
      });
      return res.json(users);
    }

    // alumno: solo su propio registro
    const self = await User.findOne({ _id: sub });
    res.json(self ? [self] : []);
  })
);

// POST /users - solo coordinador
router.post(
  "/",
  requireRole("coordinador"),
  asyncHandler(async (req, res) => {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Datos inválidos", errors: parsed.error.issues });
    }

    const { password, ...rest } = parsed.data;
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({ ...rest, passwordHash });
    res.status(201).json(user);
  })
);

// PUT /users/:id - solo coordinador
router.put(
  "/:id",
  requireRole("coordinador"),
  asyncHandler(async (req, res) => {
    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Datos inválidos", errors: parsed.error.issues });
    }

    const user = await User.findByIdAndUpdate(req.params.id, parsed.data, { new: true });
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });
    res.json(user);
  })
);

export default router;

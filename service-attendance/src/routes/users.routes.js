import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import User, { CARNET_REGEX } from "../models/User.js";
import Group from "../models/Group.js";
import { authMiddleware, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();

const carnetSchema = z
  .string()
  .regex(CARNET_REGEX, "El carnet debe tener 7 dígitos (AAAANNN, ej. 2024047)");

const nameFields = {
  firstName: z.string().min(1),
  lastName: z.string().min(1),
};

// Contraseña temporal asignada a todo usuario nuevo; debe cambiarla en su primer
// inicio de sesión (ver User.passwordChanged y POST /auth/change-password).
const DEFAULT_PASSWORD = process.env.DEFAULT_USER_PASSWORD || "changeme123";

// El alumno no envía email: se genera a partir de su nombre y carnet.
const createStudentSchema = z.object({
  ...nameFields,
  role: z.literal("alumno"),
  carnetCode: carnetSchema,
  groupId: z.string().optional(),
});

const createStaffSchema = z
  .object({
    ...nameFields,
    role: z.enum(["maestro", "coordinador"]),
    email: z.string().email(),
  })
  .strict("Maestro y coordinador no llevan carnet");

const createUserSchema = z.discriminatedUnion("role", [createStudentSchema, createStaffSchema]);

const updateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  carnetCode: carnetSchema.optional(),
  active: z.boolean().optional(),
  groupId: z.string().nullable().optional(),
});

router.use(authMiddleware);

// GET /users - lista filtrada por rol; ?role=alumno|maestro|coordinador para acotar
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { role, sub } = req.user;
    const roleFilter = req.query.role ? { role: req.query.role } : {};

    if (role === "coordinador") {
      return res.json(await User.find(roleFilter).sort({ createdAt: -1 }));
    }

    if (role === "maestro") {
      const groups = await Group.find({ teacherId: sub });
      const groupIds = groups.map((g) => g._id);
      const users = await User.find({
        $or: [{ _id: sub }, { groupId: { $in: groupIds } }],
        ...roleFilter,
      });
      return res.json(users);
    }

    // alumno: solo su propio registro
    const self = await User.findOne({ _id: sub });
    res.json(self ? [self] : []);
  })
);

// POST /users - solo coordinador. Alumno exige carnet (email autogenerado);
// maestro/coordinador dan su propio email y no llevan carnet.
router.post(
  "/",
  requireRole("coordinador"),
  asyncHandler(async (req, res) => {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Datos inválidos", errors: parsed.error.issues });
    }

    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    try {
      const user = await User.create({ ...parsed.data, passwordHash, passwordChanged: false });
      res.status(201).json({ ...user.toObject(), temporaryPassword: DEFAULT_PASSWORD });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ message: "El email o carnet ya está registrado" });
      }
      throw err;
    }
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

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    Object.assign(user, parsed.data);
    await user.save();
    res.json(user);
  })
);

export default router;

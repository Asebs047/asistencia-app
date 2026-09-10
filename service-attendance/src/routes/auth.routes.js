import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import User from "../models/User.js";
import { authMiddleware } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function toPublicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    groupId: user.groupId,
    carnetCode: user.carnetCode,
    passwordChanged: user.passwordChanged,
  };
}

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Credenciales inválidas", errors: parsed.error.issues });
    }

    const { password } = parsed.data;
    const email = parsed.data.email.trim().toLowerCase();
    const user = await User.findOne({ email, active: true });
    if (!user) {
      return res.status(401).json({ message: "Email o contraseña incorrectos" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: "Email o contraseña incorrectos" });
    }

    const token = jwt.sign(
      {
        sub: user._id.toString(),
        role: user.role,
        name: user.name,
        groupId: user.groupId ? user.groupId.toString() : null,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
    );

    res.json({ token, user: toPublicUser(user) });
  })
);

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

// POST /auth/change-password - el propio usuario cambia su contraseña temporal
router.post(
  "/change-password",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Datos inválidos", errors: parsed.error.issues });
    }

    const user = await User.findById(req.user.sub);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: "La contraseña actual no es correcta" });
    }

    user.passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
    user.passwordChanged = true;
    await user.save();

    res.json({ user: toPublicUser(user) });
  })
);

export default router;

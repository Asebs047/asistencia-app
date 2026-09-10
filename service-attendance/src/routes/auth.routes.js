import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import User from "../models/User.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Credenciales inválidas", errors: parsed.error.issues });
    }

    const { email, password } = parsed.data;
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

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        groupId: user.groupId,
      },
    });
  })
);

export default router;

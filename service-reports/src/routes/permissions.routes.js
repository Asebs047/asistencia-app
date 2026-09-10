import { Router } from "express";
import { z } from "zod";
import Permission from "../models/Permission.js";
import { authMiddleware, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { expireOverduePermissions } from "../utils/expirePermissions.js";
import { getGroupById, attendanceClientFor } from "../clients/attendanceClient.js";

const router = Router();

const ACTIVE_STATUSES = ["solicitado", "autorizado", "iniciado"];

router.use(authMiddleware);

// GET /permissions - filtrado por rol
router.get(
  "/",
  asyncHandler(async (req, res) => {
    await expireOverduePermissions();

    const { role, sub } = req.user;

    if (role === "coordinador") {
      return res.json(await Permission.find().sort({ requestedAt: -1 }));
    }

    if (role === "maestro") {
      const client = attendanceClientFor(req.token);
      const { data: groups } = await client.get("/groups");
      const groupIds = groups.map((g) => g._id);
      return res.json(await Permission.find({ groupId: { $in: groupIds } }).sort({ requestedAt: -1 }));
    }

    // alumno
    res.json(await Permission.find({ studentId: sub }).sort({ requestedAt: -1 }));
  })
);

// POST /permissions - el alumno solicita un permiso
router.post(
  "/",
  requireRole("alumno"),
  asyncHandler(async (req, res) => {
    const { sub: studentId, groupId } = req.user;
    if (!groupId) {
      return res.status(422).json({ message: "No perteneces a ningún grupo" });
    }

    // Validación real contra service-attendance: el grupo existe y sigue vigente.
    const group = await getGroupById(req.token, groupId);
    if (!group) {
      return res.status(422).json({ message: "Grupo no válido" });
    }

    const existing = await Permission.findOne({
      studentId,
      status: { $in: ACTIVE_STATUSES },
    });
    if (existing) {
      return res.status(409).json({ message: "Ya tienes un permiso activo o pendiente" });
    }

    const permission = await Permission.create({ studentId, groupId });
    res.status(201).json(permission);
  })
);

async function assertAuthority(req, res, permission) {
  if (req.user.role === "coordinador") return true;
  if (req.user.role !== "maestro") {
    res.status(403).json({ message: "No autorizado" });
    return false;
  }
  const group = await getGroupById(req.token, permission.groupId.toString());
  if (!group || group.teacherId?.toString() !== req.user.sub) {
    res.status(403).json({ message: "No eres maestro de este grupo" });
    return false;
  }
  return true;
}

// PATCH /permissions/:id/authorize
router.patch(
  "/:id/authorize",
  requireRole("maestro", "coordinador"),
  asyncHandler(async (req, res) => {
    const permission = await Permission.findById(req.params.id);
    if (!permission) return res.status(404).json({ message: "Permiso no encontrado" });
    if (!(await assertAuthority(req, res, permission))) return;
    if (permission.status !== "solicitado") {
      return res.status(409).json({ message: "El permiso ya fue resuelto" });
    }

    permission.status = "autorizado";
    permission.resolvedAt = new Date();
    await permission.save();
    res.json(permission);
  })
);

// PATCH /permissions/:id/reject
router.patch(
  "/:id/reject",
  requireRole("maestro", "coordinador"),
  asyncHandler(async (req, res) => {
    const permission = await Permission.findById(req.params.id);
    if (!permission) return res.status(404).json({ message: "Permiso no encontrado" });
    if (!(await assertAuthority(req, res, permission))) return;
    if (permission.status !== "solicitado") {
      return res.status(409).json({ message: "El permiso ya fue resuelto" });
    }

    permission.status = "rechazado";
    permission.resolvedAt = new Date();
    await permission.save();
    res.json(permission);
  })
);

// PATCH /permissions/:id/start - el alumno registra su salida
router.patch(
  "/:id/start",
  requireRole("alumno"),
  asyncHandler(async (req, res) => {
    const permission = await Permission.findOne({ _id: req.params.id, studentId: req.user.sub });
    if (!permission) return res.status(404).json({ message: "Permiso no encontrado" });
    if (permission.status !== "autorizado") {
      return res.status(409).json({ message: "El permiso no está autorizado" });
    }

    permission.status = "iniciado";
    permission.startedAt = new Date();
    await permission.save();
    res.json(permission);
  })
);

// PATCH /permissions/:id/finish - el alumno registra su regreso
router.patch(
  "/:id/finish",
  requireRole("alumno"),
  asyncHandler(async (req, res) => {
    const permission = await Permission.findOne({ _id: req.params.id, studentId: req.user.sub });
    if (!permission) return res.status(404).json({ message: "Permiso no encontrado" });
    if (permission.status !== "iniciado") {
      return res.status(409).json({ message: "El permiso no está en curso" });
    }

    permission.status = "finalizado";
    permission.finishedAt = new Date();
    await permission.save();
    res.json(permission);
  })
);

export default router;

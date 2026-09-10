import { Router } from "express";
import Permission from "../models/Permission.js";

const router = Router();

// GET /permissions - lista de permisos registrados en este servicio
router.get("/", async (req, res) => {
  const permissions = await Permission.find().sort({ createdAt: -1 });
  res.json(permissions);
});

export default router;

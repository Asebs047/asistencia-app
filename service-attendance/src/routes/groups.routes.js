import { Router } from "express";
import Group from "../models/Group.js";

const router = Router();

// GET /groups - lista de grupos con maestro y alumnos asignados
router.get("/", async (req, res) => {
  const groups = await Group.find()
    .populate("teacherId", "name email")
    .populate("studentIds", "name email carnetCode")
    .sort({ createdAt: -1 });

  res.json(groups);
});

export default router;

import "dotenv/config";
import mongoose from "mongoose";
import axios from "axios";
import { connectDB } from "./config/db.js";
import Permission from "./models/Permission.js";

const ATTENDANCE_URL = process.env.ATTENDANCE_SERVICE_URL || "http://localhost:4001";

function daysAgoAt(daysAgo, hh, mm) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hh, mm, 0, 0);
  return d;
}

// Este seed depende de que service-attendance ya esté corriendo (npm run dev) y
// sembrado (npm run seed), porque los alumnos/grupos son propiedad de ese servicio y
// se obtienen aquí vía HTTP, nunca por acceso directo a su base de datos.
async function seed() {
  await connectDB();
  await Permission.deleteMany({});

  const { data: login } = await axios.post(`${ATTENDANCE_URL}/auth/login`, {
    email: "coordinadora@example.com",
    password: "changeme123",
  });
  const client = axios.create({
    baseURL: ATTENDANCE_URL,
    headers: { Authorization: `Bearer ${login.token}` },
  });

  const { data: groups } = await client.get("/groups");
  const byCarnet = {};
  for (const group of groups) {
    for (const student of group.studentIds) {
      byCarnet[student.carnetCode] = { studentId: student._id, groupId: group._id };
    }
  }

  function ref(carnetCode) {
    const found = byCarnet[carnetCode];
    if (!found) throw new Error(`No se encontró un alumno con carnet ${carnetCode} (¿corriste el seed de service-attendance?)`);
    return found;
  }

  const permissions = [
    {
      ...ref("2024001"), // Carlos
      status: "finalizado",
      requestedAt: daysAgoAt(2, 9, 0),
      resolvedAt: daysAgoAt(2, 9, 1),
      startedAt: daysAgoAt(2, 9, 2),
      finishedAt: daysAgoAt(2, 9, 9),
    },
    {
      ...ref("2024002"), // Maria
      status: "finalizado",
      requestedAt: daysAgoAt(1, 10, 0),
      resolvedAt: daysAgoAt(1, 10, 1),
      startedAt: daysAgoAt(1, 10, 2),
      finishedAt: daysAgoAt(1, 10, 6),
    },
    {
      ...ref("2024003"), // Jose
      status: "rechazado",
      requestedAt: daysAgoAt(1, 11, 0),
      resolvedAt: daysAgoAt(1, 11, 2),
    },
    {
      ...ref("2024004"), // Ana Torres
      status: "autorizado",
      requestedAt: daysAgoAt(0, 8, 30),
      resolvedAt: daysAgoAt(0, 8, 31),
    },
    {
      ...ref("2024005"), // Pedro
      status: "solicitado",
      requestedAt: daysAgoAt(0, 9, 15),
    },
    {
      ...ref("2024006"), // Lucia
      status: "finalizado",
      requestedAt: daysAgoAt(3, 9, 0),
      resolvedAt: daysAgoAt(3, 9, 1),
      startedAt: daysAgoAt(3, 9, 2),
      finishedAt: daysAgoAt(3, 9, 12),
    },
    {
      ...ref("2024006"), // Lucia - segunda solicitud, otra semana
      status: "finalizado",
      requestedAt: daysAgoAt(1, 9, 0),
      resolvedAt: daysAgoAt(1, 9, 1),
      startedAt: daysAgoAt(1, 9, 2),
      finishedAt: daysAgoAt(1, 9, 7),
    },
  ];

  await Permission.insertMany(permissions);

  console.log(`Seed de permisos completado: ${permissions.length} registros.`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Error en seed:", err.response?.data || err.message);
  process.exit(1);
});

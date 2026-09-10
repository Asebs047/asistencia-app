import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectDB } from "./config/db.js";
import User from "./models/User.js";
import Group from "./models/Group.js";
import Attendance from "./models/Attendance.js";
import WebauthnCredential from "./models/WebauthnCredential.js";

const DEFAULT_PASSWORD = "changeme123";

async function seed() {
  await connectDB();

  await User.deleteMany({});
  await Group.deleteMany({});
  await Attendance.deleteMany({});
  await WebauthnCredential.deleteMany({});

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  const coordinador = await User.create({
    firstName: "Ana",
    lastName: "Coordinadora",
    email: "coordinadora@example.com",
    passwordHash,
    role: "coordinador",
  });

  const maestro = await User.create({
    firstName: "Luis",
    lastName: "Maestro",
    email: "maestro@example.com",
    passwordHash,
    role: "maestro",
  });

  // El email de los alumnos se autogenera: primera letra del nombre + apellido + carnet.
  const alumno1 = await User.create({
    firstName: "Carlos",
    lastName: "Alumno",
    passwordHash,
    role: "alumno",
    carnetCode: "2024001",
  });

  const alumno2 = await User.create({
    firstName: "Maria",
    lastName: "Alumna",
    passwordHash,
    role: "alumno",
    carnetCode: "2024002",
  });

  const grupo = await Group.create({
    name: "Grupo A - Turno Matutino",
    teacherId: maestro._id,
  });

  await User.updateMany(
    { _id: { $in: [alumno1._id, alumno2._id] } },
    { groupId: grupo._id }
  );

  console.log("Seed completado. Contraseña para todos los usuarios:", DEFAULT_PASSWORD);
  console.log({
    coordinador: coordinador.email,
    maestro: maestro.email,
    alumno1: alumno1.email,
    alumno2: alumno2.email,
    grupo: grupo.name,
  });

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Error en seed:", err);
  process.exit(1);
});

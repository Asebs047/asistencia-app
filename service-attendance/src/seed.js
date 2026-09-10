import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import User from "./models/User.js";
import Group from "./models/Group.js";

async function seed() {
  await connectDB();

  await User.deleteMany({});
  await Group.deleteMany({});

  const coordinador = await User.create({
    name: "Ana Coordinadora",
    email: "coordinadora@example.com",
    passwordHash: "placeholder",
    role: "coordinador",
  });

  const maestro = await User.create({
    name: "Luis Maestro",
    email: "maestro@example.com",
    passwordHash: "placeholder",
    role: "maestro",
  });

  const alumno1 = await User.create({
    name: "Carlos Alumno",
    email: "alumno1@example.com",
    passwordHash: "placeholder",
    role: "alumno",
    carnetCode: "2024001",
  });

  const alumno2 = await User.create({
    name: "Maria Alumna",
    email: "alumno2@example.com",
    passwordHash: "placeholder",
    role: "alumno",
    carnetCode: "2024002",
  });

  const grupo = await Group.create({
    name: "Grupo A - Turno Matutino",
    teacherId: maestro._id,
    studentIds: [alumno1._id, alumno2._id],
  });

  await User.updateMany(
    { _id: { $in: [alumno1._id, alumno2._id] } },
    { groupId: grupo._id }
  );

  console.log("Seed completado:");
  console.log({ coordinador: coordinador.email, maestro: maestro.email, grupo: grupo.name });

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Error en seed:", err);
  process.exit(1);
});

import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectDB } from "./config/db.js";
import User from "./models/User.js";
import Group from "./models/Group.js";
import Attendance, { startOfDay } from "./models/Attendance.js";
import WebauthnCredential from "./models/WebauthnCredential.js";

const DEFAULT_PASSWORD = "changeme123";

// Fecha/hora local N días atrás, a una hora fija. Las cuentas del seed ya tienen
// "passwordChanged: true" para que la demo no fuerce el cambio de contraseña; ese
// flujo se puede probar creando un alumno/maestro nuevo desde el panel del coordinador.
function atLocalTime(daysAgo, hh, mm) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hh, mm, 0, 0);
  return d;
}

async function markDay(studentId, groupId, entry) {
  if (entry.entrada) {
    const markedAt = atLocalTime(entry.daysAgo, ...entry.entrada);
    await Attendance.create({
      studentId,
      groupId,
      method: "carnet",
      type: "entrada",
      markedAt,
      day: startOfDay(markedAt),
    });
  }
  if (entry.salida) {
    const markedAt = atLocalTime(entry.daysAgo, ...entry.salida);
    await Attendance.create({
      studentId,
      groupId,
      method: "carnet",
      type: "salida",
      markedAt,
      day: startOfDay(markedAt),
    });
  }
}

async function seed() {
  await connectDB();

  await User.deleteMany({});
  await Group.deleteMany({});
  await Attendance.deleteMany({});
  await WebauthnCredential.deleteMany({});

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  const demoAccount = { passwordHash, passwordChanged: true };

  const coordinador = await User.create({
    firstName: "Ana",
    lastName: "Coordinadora",
    email: "coordinadora@example.com",
    role: "coordinador",
    ...demoAccount,
  });

  const maestroA = await User.create({
    firstName: "Luis",
    lastName: "Maestro",
    email: "maestro@example.com",
    role: "maestro",
    ...demoAccount,
  });

  const maestroB = await User.create({
    firstName: "Sofia",
    lastName: "Martinez",
    email: "smartinez@example.com",
    role: "maestro",
    ...demoAccount,
  });

  const grupoA = await Group.create({ name: "Grupo A - Turno Matutino", teacherId: maestroA._id });
  const grupoB = await Group.create({ name: "Grupo B - Turno Vespertino", teacherId: maestroB._id });

  // El email de los alumnos se autogenera: primera letra del nombre + apellido + carnet.
  const students = {};
  const studentDefs = [
    { key: "carlos", firstName: "Carlos", lastName: "Alumno", carnetCode: "2024001", groupId: grupoA._id },
    { key: "maria", firstName: "Maria", lastName: "Alumna", carnetCode: "2024002", groupId: grupoA._id },
    { key: "jose", firstName: "Jose", lastName: "Ramirez", carnetCode: "2024003", groupId: grupoA._id },
    { key: "anaTorres", firstName: "Ana", lastName: "Torres", carnetCode: "2024004", groupId: grupoB._id },
    { key: "pedro", firstName: "Pedro", lastName: "Diaz", carnetCode: "2024005", groupId: grupoB._id },
    { key: "lucia", firstName: "Lucia", lastName: "Fernandez", carnetCode: "2024006", groupId: grupoB._id },
  ];

  for (const def of studentDefs) {
    students[def.key] = await User.create({
      firstName: def.firstName,
      lastName: def.lastName,
      carnetCode: def.carnetCode,
      groupId: def.groupId,
      role: "alumno",
      ...demoAccount,
    });
  }

  // Historial de asistencia de los últimos 5 días: mezcla de puntuales, tarde y
  // ausencias, para que reportes/estadísticas tengan datos variados que mostrar.
  const attendancePlan = {
    carlos: [
      { daysAgo: 4, entrada: [6, 58], salida: [13, 2] },
      { daysAgo: 3, entrada: [7, 5], salida: [13, 0] },
      { daysAgo: 2, entrada: [6, 50] },
      { daysAgo: 1, entrada: [7, 10], salida: [13, 5] },
      { daysAgo: 0, entrada: [6, 59] },
    ],
    maria: [
      { daysAgo: 4, entrada: [7, 0] },
      { daysAgo: 3, entrada: [7, 20] },
      { daysAgo: 1, entrada: [7, 5] },
      { daysAgo: 0, entrada: [7, 12] },
    ],
    jose: [{ daysAgo: 4, entrada: [7, 30] }, { daysAgo: 2, entrada: [8, 0] }, { daysAgo: 0, entrada: [7, 45] }],
    anaTorres: [
      { daysAgo: 4, entrada: [7, 40] },
      { daysAgo: 3, entrada: [7, 50] },
      { daysAgo: 2, entrada: [7, 35] },
      { daysAgo: 1, entrada: [8, 10] },
      { daysAgo: 0, entrada: [7, 45] },
    ],
    pedro: [{ daysAgo: 4, entrada: [7, 5] }, { daysAgo: 0, entrada: [7, 0] }],
    lucia: [
      { daysAgo: 4, entrada: [6, 55], salida: [13, 0] },
      { daysAgo: 3, entrada: [6, 58], salida: [13, 1] },
      { daysAgo: 2, entrada: [7, 2], salida: [13, 0] },
      { daysAgo: 1, entrada: [6, 50], salida: [12, 58] },
      { daysAgo: 0, entrada: [6, 57] },
    ],
  };

  for (const [key, days] of Object.entries(attendancePlan)) {
    const student = students[key];
    for (const entry of days) {
      await markDay(student._id, student.groupId, entry);
    }
  }

  console.log("Seed completado. Contraseña para todos los usuarios:", DEFAULT_PASSWORD);
  console.log({
    coordinador: coordinador.email,
    maestros: [maestroA.email, maestroB.email],
    alumnos: studentDefs.map((d) => students[d.key].email),
    grupos: [grupoA.name, grupoB.name],
  });

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Error en seed:", err);
  process.exit(1);
});

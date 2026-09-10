import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import usersRoutes from "./routes/users.routes.js";
import groupsRoutes from "./routes/groups.routes.js";
import attendanceRoutes from "./routes/attendance.routes.js";
import webauthnRoutes, { biometricAttendanceRouter } from "./webauthn/webauthn.routes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.json({ service: "service-attendance", status: "ok" });
});

app.use("/auth", authRoutes);
app.use("/users", usersRoutes);
app.use("/groups", groupsRoutes);
app.use("/attendance", attendanceRoutes);
app.use("/webauthn", webauthnRoutes);
app.use("/attendance", biometricAttendanceRouter);

app.use((req, res) => {
  res.status(404).json({ message: "Recurso no encontrado" });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Error interno del servidor" });
});

const port = process.env.PORT || 4001;

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`[service-attendance] escuchando en puerto ${port}`);
    });
  })
  .catch((err) => {
    console.error("[service-attendance] error al conectar a MongoDB:", err.message);
    process.exit(1);
  });

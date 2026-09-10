import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { connectDB } from "./config/db.js";
import permissionsRoutes from "./routes/permissions.routes.js";
import reportsRoutes from "./routes/reports.routes.js";
import statisticsRoutes from "./routes/statistics.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.json({ service: "service-reports", status: "ok" });
});

app.use("/permissions", permissionsRoutes);
app.use("/reports", reportsRoutes);
app.use("/statistics", statisticsRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Recurso no encontrado" });
});

app.use(errorHandler);

const port = process.env.PORT || 4002;

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`[service-reports] escuchando en puerto ${port}`);
    });
  })
  .catch((err) => {
    console.error("[service-reports] error al conectar a MongoDB:", err.message);
    process.exit(1);
  });

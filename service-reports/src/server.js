import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { connectDB } from "./config/db.js";
import permissionsRoutes from "./routes/permissions.routes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.json({ service: "service-reports", status: "ok" });
});

app.use("/permissions", permissionsRoutes);

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

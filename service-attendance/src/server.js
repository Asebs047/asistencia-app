import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { connectDB } from "./config/db.js";
import groupsRoutes from "./routes/groups.routes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.json({ service: "service-attendance", status: "ok" });
});

app.use("/groups", groupsRoutes);

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

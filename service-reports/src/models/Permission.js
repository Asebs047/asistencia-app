import mongoose from "mongoose";

const permissionSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, required: true },
    groupId: { type: mongoose.Schema.Types.ObjectId, required: true },
    status: {
      type: String,
      enum: ["solicitado", "autorizado", "rechazado", "iniciado", "finalizado", "vencido"],
      default: "solicitado",
    },
    requestedAt: { type: Date, default: Date.now },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Permission", permissionSchema);

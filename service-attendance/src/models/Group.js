import mongoose from "mongoose";

// Los alumnos de un grupo NO se guardan aquí como arreglo: se derivan de
// User.groupId (fuente única de verdad), para que un alumno no pueda terminar
// perteneciendo a dos grupos a la vez por una desincronización entre ambos lados.
const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Group", groupSchema);

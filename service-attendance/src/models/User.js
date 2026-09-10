import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["coordinador", "maestro", "alumno"],
      required: true,
    },
    carnetCode: { type: String, unique: true, sparse: true },
    active: { type: Boolean, default: true },
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group", default: null },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);

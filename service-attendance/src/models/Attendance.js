import mongoose from "mongoose";

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

const attendanceSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
    method: { type: String, enum: ["carnet", "biometric"], required: true },
    markedAt: { type: Date, default: Date.now },
    day: { type: Date, default: () => startOfDay(new Date()) },
  },
  { timestamps: true }
);

attendanceSchema.index({ studentId: 1, day: 1 }, { unique: true });

export { startOfDay };
export default mongoose.model("Attendance", attendanceSchema);

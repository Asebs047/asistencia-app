import mongoose from "mongoose";

const CARNET_REGEX = /^\d{7}$/;
const MIN_ENROLLMENT_YEAR = 2000;

function isValidCarnet(value) {
  if (!CARNET_REGEX.test(value)) return false;
  const year = Number(value.slice(0, 4));
  const currentYear = new Date().getFullYear();
  return year >= MIN_ENROLLMENT_YEAR && year <= currentYear;
}

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
    carnetCode: {
      type: String,
      unique: true,
      sparse: true,
      validate: {
        validator: (value) => value == null || isValidCarnet(value),
        message: (props) =>
          `${props.value} no es un carnet válido: deben ser 7 dígitos, los primeros 4 el año de inscripción`,
      },
    },
    active: { type: Boolean, default: true },
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group", default: null },
  },
  { timestamps: true }
);

userSchema.pre("validate", function () {
  if (this.role === "alumno" && !this.carnetCode) {
    this.invalidate("carnetCode", "El carnet es obligatorio para los alumnos");
  }
  if (this.role !== "alumno" && this.carnetCode) {
    this.invalidate("carnetCode", "Solo los alumnos tienen carnet");
  }
});

export { isValidCarnet, CARNET_REGEX };
export default mongoose.model("User", userSchema);

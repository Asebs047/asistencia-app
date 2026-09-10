import mongoose from "mongoose";

const CARNET_REGEX = /^\d{7}$/;
const MIN_ENROLLMENT_YEAR = 2000;

function isValidCarnet(value) {
  if (!CARNET_REGEX.test(value)) return false;
  const year = Number(value.slice(0, 4));
  const currentYear = new Date().getFullYear();
  return year >= MIN_ENROLLMENT_YEAR && year <= currentYear;
}

const DIACRITICS_REGEX = new RegExp("[\\u0300-\\u036f]", "g");

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(DIACRITICS_REGEX, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
}

// ej. Juan Pérez + carnet 2024048 -> jperez-2024048@example.com
function generateStudentEmail(firstName, lastName, carnetCode) {
  const initial = slugify(firstName).charAt(0);
  const last = slugify(lastName);
  return `${initial}${last}-${carnetCode}@example.com`;
}

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    name: { type: String, trim: true },
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
    passwordChanged: { type: Boolean, default: false },
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

  if (this.firstName && this.lastName) {
    this.name = `${this.firstName} ${this.lastName}`;
  }

  if (this.role === "alumno" && this.isNew && this.firstName && this.lastName && this.carnetCode) {
    this.email = generateStudentEmail(this.firstName, this.lastName, this.carnetCode);
  }
});

export { isValidCarnet, CARNET_REGEX, generateStudentEmail, slugify };
export default mongoose.model("User", userSchema);

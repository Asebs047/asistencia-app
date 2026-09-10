import { useAuthStore } from "../store/authStore";
import CoordinatorPanel from "./CoordinatorPanel";
import TeacherPanel from "./TeacherPanel";
import StudentPanel from "./StudentPanel";

export default function Panel() {
  const user = useAuthStore((s) => s.user);

  if (user.role === "coordinador") return <CoordinatorPanel />;
  if (user.role === "maestro") return <TeacherPanel />;
  return <StudentPanel />;
}

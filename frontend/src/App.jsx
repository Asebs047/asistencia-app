import { Route, Routes } from "react-router-dom";
import NavBar from "./components/NavBar";
import ProtectedRoute from "./components/ProtectedRoute";
import Groups from "./pages/Groups";
import Login from "./pages/Login";
import Panel from "./pages/Panel";

export default function App() {
  return (
    <>
      <NavBar />
      <main>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/grupos"
            element={
              <ProtectedRoute>
                <Groups />
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Panel />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </>
  );
}

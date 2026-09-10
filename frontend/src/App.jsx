import { Route, Routes } from "react-router-dom";
import NavBar from "./components/NavBar";
import Home from "./pages/Home";
import Groups from "./pages/Groups";

export default function App() {
  return (
    <>
      <NavBar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/grupos" element={<Groups />} />
        </Routes>
      </main>
    </>
  );
}

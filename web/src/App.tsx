import { Route, Routes } from "react-router";
import Workspace from "./pages/Workspace";
import Navbar from "./components/navbar";
import { ThemeProvider } from "@/components/theme-provider";

function App() {
  return (
    <div className="">
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <Navbar />
        <Routes>
          <Route path="/workspace/:id" element={<Workspace />} />
        </Routes>
      </ThemeProvider>
    </div>
  );
}

export default App;

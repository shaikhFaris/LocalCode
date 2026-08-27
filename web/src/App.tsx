import { Route, Routes } from "react-router";
import Workspace from "./pages/Workspace";
import Navbar from "./components/navbar";
import { ThemeProvider } from "@/components/theme-provider";
import { SandboxProvider } from "@/context/sandbox-context";

function App() {
  return (
    <div className="">
      <SandboxProvider>
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
          <Navbar />
          <Routes>
            <Route path="/workspace/:id" element={<Workspace />} />
          </Routes>
        </ThemeProvider>
      </SandboxProvider>
    </div>
  );
}

export default App;

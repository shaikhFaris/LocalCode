import { Route, Routes } from "react-router";
import Workspace from "./pages/Workspace";
import MdDesign from "./pages/MdDesign";
import Navbar from "./components/navbar";
import { ThemeProvider } from "@/components/theme-provider";
import { SandboxProvider } from "@/context/sandbox-context";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./components/app-sidebar";

function App() {
  return (
    <div className="">
      <SandboxProvider>
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <Navbar />
              <Routes>
                <Route path="/" element={<MdDesign />} />
                <Route path="/md-design" element={<MdDesign />} />
                <Route path="/workspace/:id" element={<Workspace />} />
              </Routes>
            </SidebarInset>
          </SidebarProvider>
        </ThemeProvider>
      </SandboxProvider>
    </div>
  );
}

export default App;

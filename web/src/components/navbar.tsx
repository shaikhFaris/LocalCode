import { useSandbox } from "@/hooks/useSandBox";
import { ModeToggle } from "./mode-toggle";
import { SidebarTrigger } from "./ui/sidebar";

export default function Navbar() {
  const { sandboxConnected } = useSandbox();

  return (
    <div className="sticky top-0 z-10 flex w-full items-center justify-between bg-background/95 px-2 py-2 backdrop-blur md:px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
      </div>
      <div className="flex items-center gap-4">
        <div
          className="flex items-center gap-1 text-xs text-muted-foreground"
          aria-label={sandboxConnected ? "Sandbox connected" : "Sandbox disconnected"}
        >
          <span
            className={`size-2 rounded-full ${
              sandboxConnected ? "bg-emerald-500" : "bg-muted-foreground/50"
            }`}
          />
          <span className="font-mono uppercase">
            {sandboxConnected ? "Connected" : "Disconnected"}
          </span>
        </div>
        <ModeToggle />
      </div>
    </div>
  );
}

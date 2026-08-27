import { useSandbox } from "@/hooks/useSandBox";
import { ModeToggle } from "./mode-toggle";

export default function Navbar() {
  const { sandboxConnected } = useSandbox();

  return (
    <div className="px-2 md:px-4 sticky top-0 w-full flex items-center justify-between py-2">
      <h2 className="font-semibold">LocalCode</h2>
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

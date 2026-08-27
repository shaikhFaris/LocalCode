import { SandboxContext } from "@/hooks/useSandBox";
import { useMemo, useState } from "react";

export function SandboxProvider({ children }: { children: React.ReactNode }) {
  const [sandboxConnected, setSandboxConnected] = useState(false);
  const value = useMemo(
    () => ({ sandboxConnected, setSandboxConnected }),
    [sandboxConnected],
  );

  return <SandboxContext.Provider value={value}>{children}</SandboxContext.Provider>;
}

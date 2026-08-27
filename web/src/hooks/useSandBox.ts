import { createContext, useContext } from "react";

type SandboxContextValue = {
  sandboxConnected: boolean;
  setSandboxConnected: (connected: boolean) => void;
};

export const SandboxContext = createContext<SandboxContextValue | undefined>(undefined);

export function useSandbox() {
  const context = useContext(SandboxContext);

  if (!context) {
    throw new Error("useSandbox must be used within a SandboxProvider");
  }

  return context;
}

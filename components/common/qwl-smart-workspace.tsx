"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { SmartWorkspacePanel } from "@/components/common/smart-workspace-panel";
import type { WorkspaceAppContract } from "@/lib/workspace/context";

type WorkspaceBridgeValue = {
  contract: WorkspaceAppContract | null;
  setContract: (contract: WorkspaceAppContract | null) => void;
};

const WorkspaceBridge = createContext<WorkspaceBridgeValue | null>(null);

export function QwlSmartWorkspaceProvider({ children }: { children: ReactNode }) {
  const [contract, setContract] = useState<WorkspaceAppContract | null>(null);
  return <WorkspaceBridge.Provider value={{ contract, setContract }}>{children}</WorkspaceBridge.Provider>;
}

export function useWorkspaceContract(contract: WorkspaceAppContract | null) {
  const bridge = useContext(WorkspaceBridge);
  useEffect(() => {
    if (!bridge) return;
    bridge.setContract(contract);
    return () => bridge.setContract(null);
  }, [bridge, contract]);
}

export function QwlSmartWorkspace() {
  const bridge = useContext(WorkspaceBridge);
  return <SmartWorkspacePanel contract={bridge?.contract ?? null} />;
}

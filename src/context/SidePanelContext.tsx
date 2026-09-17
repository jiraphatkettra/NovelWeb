"use client";

import React, { createContext, useContext, useState } from "react";

interface SidePanelContextType {
  isSidePanelOpen: boolean;
  openSidePanel: () => void;
  closeSidePanel: () => void;
  toggleSidePanel: () => void;
  isIssueModalOpen: boolean;
  openIssueModal: () => void;
  closeIssueModal: () => void;
}

const SidePanelContext = createContext<SidePanelContextType | undefined>(undefined);

export function SidePanelProvider({ children }: { children: React.ReactNode }) {
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);

  const openSidePanel = () => setIsSidePanelOpen(true);
  const closeSidePanel = () => setIsSidePanelOpen(false);
  const toggleSidePanel = () => setIsSidePanelOpen((prev) => !prev);

  const openIssueModal = () => {
    setIsSidePanelOpen(false); // close side panel when opening issue modal
    setIsIssueModalOpen(true);
  };
  const closeIssueModal = () => setIsIssueModalOpen(false);

  return (
    <SidePanelContext.Provider
      value={{
        isSidePanelOpen,
        openSidePanel,
        closeSidePanel,
        toggleSidePanel,
        isIssueModalOpen,
        openIssueModal,
        closeIssueModal,
      }}
    >
      {children}
    </SidePanelContext.Provider>
  );
}

export function useSidePanel() {
  const context = useContext(SidePanelContext);
  if (!context) {
    throw new Error("useSidePanel must be used within a SidePanelProvider");
  }
  return context;
}

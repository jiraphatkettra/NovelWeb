"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface AuthModalContextType {
  isOpen: boolean;
  tab: "LOGIN" | "REGISTER";
  openAuthModal: (defaultTab?: "LOGIN" | "REGISTER") => void;
  closeAuthModal: () => void;
  setTab: (tab: "LOGIN" | "REGISTER") => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<"LOGIN" | "REGISTER">("LOGIN");

  const openAuthModal = (defaultTab: "LOGIN" | "REGISTER" = "LOGIN") => {
    setTab(defaultTab);
    setIsOpen(true);
  };

  const closeAuthModal = () => {
    setIsOpen(false);
  };

  return (
    <AuthModalContext.Provider
      value={{
        isOpen,
        tab,
        openAuthModal,
        closeAuthModal,
        setTab,
      }}
    >
      {children}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error("useAuthModal must be used within an AuthModalProvider");
  }
  return context;
}

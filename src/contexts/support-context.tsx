"use client";

import * as React from "react";

interface SupportContextType {
  isOpen: boolean;
  toggleSupport: () => void;
  openSupport: () => void;
  closeSupport: () => void;
}

const SupportContext = React.createContext<SupportContextType | undefined>(undefined);
 
interface SupportProviderProps {
  children: React.ReactNode;
}

export function SupportProvider({ children }: SupportProviderProps): React.JSX.Element {
  const [isOpen, setIsOpen] = React.useState<boolean>(false);

  const toggleSupport = (): void => setIsOpen(!isOpen);
  const openSupport = (): void => setIsOpen(true);
  const closeSupport = (): void => setIsOpen(false);

  const value: SupportContextType = {
    isOpen,
    toggleSupport,
    openSupport,
    closeSupport,
  };

  return (
    <SupportContext.Provider value={value}>
      {children}
    </SupportContext.Provider>
  );
}

export function useSupport(): SupportContextType {
  const context = React.useContext(SupportContext);
  if (context === undefined) {
    throw new Error("useSupport must be used within a SupportProvider");
  }
  return context;
}
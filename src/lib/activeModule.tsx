import { createContext, useContext, useState } from "react";

interface ActiveModuleContextType {
  activeModule: string;
  setActiveModule: (module: string) => void;
}

const ActiveModuleContext = createContext<ActiveModuleContextType>({
  activeModule: "general",
  setActiveModule: () => {},
});

export function ActiveModuleProvider({ children }: { children: React.ReactNode }) {
  const [activeModule, setActiveModule] = useState("general");
  return (
    <ActiveModuleContext.Provider value={{ activeModule, setActiveModule }}>
      {children}
    </ActiveModuleContext.Provider>
  );
}

export const useActiveModule = () => useContext(ActiveModuleContext);

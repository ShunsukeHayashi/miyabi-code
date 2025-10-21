import React, { createContext, useContext, useState, useCallback } from "react";

export type RefreshInterval = "off" | "5s" | "10s" | "30s";

interface RefreshContextType {
  interval: RefreshInterval;
  setInterval: (interval: RefreshInterval) => void;
  intervalMs: number;
}

const RefreshContext = createContext<RefreshContextType | undefined>(undefined);

const STORAGE_KEY = "miyabi-refresh-interval";

const intervalMap: Record<RefreshInterval, number> = {
  off: 0,
  "5s": 5000,
  "10s": 10000,
  "30s": 30000,
};

export const RefreshProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Initialize from localStorage or default to 5s
  const [interval, setIntervalState] = useState<RefreshInterval>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (
      stored === "off" ||
      stored === "5s" ||
      stored === "10s" ||
      stored === "30s"
    ) {
      return stored;
    }
    return "5s";
  });

  const setInterval = useCallback((newInterval: RefreshInterval) => {
    setIntervalState(newInterval);
    localStorage.setItem(STORAGE_KEY, newInterval);
  }, []);

  const intervalMs = intervalMap[interval];

  return (
    <RefreshContext.Provider value={{ interval, setInterval, intervalMs }}>
      {children}
    </RefreshContext.Provider>
  );
};

export const useRefresh = (): RefreshContextType => {
  const context = useContext(RefreshContext);
  if (context === undefined) {
    throw new Error("useRefresh must be used within a RefreshProvider");
  }
  return context;
};

"use client";

import { createContext, useCallback, useContext, useRef, ReactNode } from "react";

type StopFn = () => void;

interface ActiveGameContextValue {
  register: (gameId: string, stopFn: StopFn) => () => void;
  stopOthers: (gameId: string) => void;
}

const ActiveGameContext = createContext<ActiveGameContextValue>({
  register: () => () => {},
  stopOthers: () => {},
});

export function ActiveGameProvider({ children }: { children: ReactNode }) {
  const registryRef = useRef<Map<string, StopFn>>(new Map());

  const register = useCallback((gameId: string, stopFn: StopFn) => {
    registryRef.current.set(gameId, stopFn);
    return () => {
      registryRef.current.delete(gameId);
    };
  }, []);

  const stopOthers = useCallback((gameId: string) => {
    for (const [id, stopFn] of registryRef.current) {
      if (id !== gameId) {
        stopFn();
      }
    }
  }, []);

  return (
    <ActiveGameContext.Provider value={{ register, stopOthers }}>
      {children}
    </ActiveGameContext.Provider>
  );
}

export function useActiveGame() {
  return useContext(ActiveGameContext);
}

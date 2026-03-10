"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { AuditLog } from "./types";
import { useAuth } from "./auth-context";

interface AuditContextType {
  logs: AuditLog[];
  logAction: (action: string, details: string) => void;
}

const AuditContext = createContext<AuditContextType | undefined>(undefined);

export function AuditProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    const savedLogs = localStorage.getItem("arena_audit");
    if (savedLogs) {
        try {
            setLogs(JSON.parse(savedLogs));
        } catch (e) {
            console.error(e);
        }
    }
  }, []);

  const logAction = (action: string, details: string) => {
    const newLog: AuditLog = {
        id: crypto.randomUUID(),
        userId: user?.id || "anonymous",
        action,
        details,
        timestamp: Date.now()
    };
    
    // Optimistic update
    setLogs(prev => {
        const updated = [newLog, ...prev];
        localStorage.setItem("arena_audit", JSON.stringify(updated));
        return updated;
    });
  };

  return (
    <AuditContext.Provider value={{ logs, logAction }}>
      {children}
    </AuditContext.Provider>
  );
}

export function useAudit() {
  const context = useContext(AuditContext);
  if (!context) throw new Error("useAudit must be used within AuditProvider");
  return context;
}

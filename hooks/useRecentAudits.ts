"use client";

import { useState, useEffect } from "react";

export interface AuditRecord {
  id: string;
  repoUrl: string;
  score: string;
  timestamp: string;
}

export function useRecentAudits() {
  const [audits, setAudits] = useState<AuditRecord[]>([]);

  useEffect(() => {
    // Check if window is defined (client-side)
    if (typeof window === "undefined") return;

    const saved = localStorage.getItem("edgeinsight_history");
    if (saved) {
      try {
        setAudits(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  const saveAudit = (record: AuditRecord) => {
    // Check if window is defined (client-side)
    if (typeof window === "undefined") return;

    const newItem = { ...record, timestamp: new Date().toISOString() };
    const updated = [newItem, ...audits.filter((a) => a.repoUrl !== record.repoUrl)].slice(0, 5); // Keep top 5, no dupes
    setAudits(updated);
    localStorage.setItem("edgeinsight_history", JSON.stringify(updated));
  };

  return { audits, saveAudit };
}

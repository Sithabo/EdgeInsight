"use client";

import { useEffect, useState } from "react";
import { pollAuditStatus, AuditResponse } from "@/lib/api";

export function useAudit(auditId: string) {
  const [data, setData] = useState<AuditResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    let isMounted = true;

    async function checkStatus() {
      try {
        const result = await pollAuditStatus(auditId);

        if (!isMounted) return;

        // Result might be null if not yet saved by DO
        if (result) {
          setData(result);

          if (result.status === "completed" || result.status === "failed") {
            setLoading(false);
            clearInterval(intervalId);
          }
        }
      } catch (err) {
        if (!isMounted) return;
        console.error(err);
        // Don't necessarily stop polling on transient errors, but here we might want to log it
        // setError(err as Error);
      }
    }

    // Initial check
    checkStatus();

    // Poll every 2 seconds
    intervalId = setInterval(checkStatus, 2000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [auditId]);

  return { data, loading, error };
}

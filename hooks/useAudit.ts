"use client";

import { useEffect, useState } from "react";
import { pollAudit, AuditResponse } from "@/lib/api";

export function useAudit(auditId: string) {
  const [data, setData] = useState<AuditResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    let isMounted = true;

    async function checkStatus() {
      try {
        const result = await pollAudit(auditId);

        if (!isMounted) return;

        // Result might be null if not yet saved by DO
        if (result) {
          setData(result);

          if (result.status === "completed" || result.status === "failed") {
            setLoading(false);
            clearInterval(intervalId);
          }
        }
      } catch (err: any) {
        if (!isMounted) return;
        console.error(err);
        setError(err);
        setLoading(false);
        clearInterval(intervalId);
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

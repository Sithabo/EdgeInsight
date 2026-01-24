export interface AuditResponse {
  auditId: string;
  status: "queued" | "completed" | "failed";
  repoUrl: string;
  // Included when completed
  verdict_score?: string;
  summary?: string;
  tech_stack?: string[];
  cloudflare_native?: boolean;
  security_risks?: Array<{
    severity: "critical" | "high" | "medium" | "low";
    file: string;
    description: string;
  }>;
}

const API_BASE = "http://localhost:8787"; // Update with actual Worker URL if different

export async function startAudit(
  repoUrl: string,
): Promise<{ auditId: string; status: string }> {
  try {
    const res = await fetch(`${API_BASE}/audit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repoUrl }),
    });

    if (!res.ok) {
      throw new Error(`Failed to start audit: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Error starting audit:", error);
    throw error;
  }
}

export async function pollAuditStatus(auditId: string): Promise<AuditResponse> {
  try {
    const res = await fetch(`${API_BASE}/results/${auditId}`);

    if (!res.ok) {
      // If 404, it might just mean the DO hasn't saved it yet or ID is wrong.
      // For now assume error.
      throw new Error(`Failed to poll status: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Error polling audit:", error);
    throw error;
  }
}

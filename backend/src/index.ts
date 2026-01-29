import { Hono } from "hono";
import { cors } from "hono/cors";
import {
  WorkflowEntrypoint,
  WorkflowEvent,
  WorkflowStep,
} from "cloudflare:workers";
import { fetchGithubRepo, FileContent } from "./github-fetcher";

// -- Types --
type Bindings = {
  AUDIT_RESULTS: DurableObjectNamespace;
  AUDIT_WORKFLOW: Workflow;
  AI: Ai;
  GITHUB_TOKEN: string;
};

// -- Durable Object --
export class AuditResults implements DurableObject {
  private state: DurableObjectState;

  constructor(state: DurableObjectState, env: Bindings) {
    this.state = state;
  }

  async fetch(request: Request) {
    // Simple storage interface
    const url = new URL(request.url);
    if (url.pathname === "/get") {
      const res = await this.state.storage.get("result");
      return new Response(JSON.stringify(res || null), {
        headers: { "Content-Type": "application/json" },
      });
    }
    if (url.pathname === "/save" && request.method === "POST") {
      const data = await request.json();
      await this.state.storage.put("result", data);
      return new Response("Saved", { status: 200 });
    }
    return new Response("Not Found", { status: 404 });
  }
}

// -- Workflow --
type WorkflowParams = {
  repoUrl: string;
  auditId: string; // Used to address the DO
};

export class AuditWorkflow extends WorkflowEntrypoint<
  Bindings,
  WorkflowParams
> {
  async run(event: WorkflowEvent<WorkflowParams>, step: WorkflowStep) {
    const { repoUrl, auditId } = event.payload;

    try {
      // [BULLETPROOF FIX]
      // We merge "Fetch" and "Analyze" into ONE step.
      // This ensures the massive 'files' array is kept in RAM and never
      // saved to the Workflow's SQLite database (which causes the crash).
      const auditResult = await step.do("perform-audit", async () => {
        // --- 1. FETCH (In Memory) ---
        let files;
        try {
          files = await fetchGithubRepo(repoUrl, this.env.GITHUB_TOKEN);
        } catch (e: any) {
          // [FIX] Do NOT throw here, or the Workflow will retry indefinitely.
          // Return an error object so we can handle it gracefully in the next step.
          return { error: e.message || "Fetch Failed", filesFound: 0 };
        }

        if (!files || files.length === 0) {
           return { error: "No files found in repository", filesFound: 0 };
        }

        // --- 2. UPDATE STATUS (Fire & Forget) ---
        // We manually fire this to the DO so the frontend shows "Processing"
        const id = this.env.AUDIT_RESULTS.idFromString(auditId);
        const stub = this.env.AUDIT_RESULTS.get(id);
        stub.fetch("http://do/save", {
          method: "POST",
          body: JSON.stringify({
            status: "processing",
            repoUrl,
            stage: "AI_ANALYSIS_STARTED",
            filesFound: files.length,
            timestamp: new Date().toISOString(),
          }),
        });

        // --- 3. PREPARE AI CONTEXT ---
        // Strict truncation to prevent Context Window overflow
        const MAX_TOTAL_CHARS = 24000; // Safe buffer for Llama 3
        let currentChars = 0;

        const fileContext = files
          .map((f) => {
            if (currentChars > MAX_TOTAL_CHARS) return "";
            const MAX_FILE_CHARS = 6000;
            let content = f.content;
            if (content.length > MAX_FILE_CHARS) {
              content =
                content.substring(0, MAX_FILE_CHARS) + "\n...[TRUNCATED]";
            }
            MAX_FILE_CHARS;
            currentChars += content.length;
            return `File: ${f.path}\n\`\`\`\n${content}\n\`\`\``;
          })
          .filter((s) => s !== "")
          .join("\n\n");

        // --- 4. RUN AI ---
        const messages = [
          {
            role: "system",
            content: `You are a Senior Principal Engineer auditing a codebase.
          Analyze the provided code and return a STRICT JSON object. 
          
          Required JSON Schema:
          {
            "verdict_score": "string", 
            "summary": "string", 
            "tech_stack": ["string"],
            "cloudflare_native": boolean,
            "security_risks": [
              { "severity": "critical" | "high" | "medium", "file": "string", "description": "string", "snippet": "string", "lineNumber": number }
            ]
          }
          
          Constraints:
          - Summary: Write 2-3 professional sentences (approx 60-80 words). First, describe the architecture and key frameworks used. Second, provide a high-level assessment of the security posture, synthesizing the risks found below.
          - Security Risks: Return exactly 3 most relevant risks (prioritize Critical/High).
          - Snippet: Limit to 10 lines. MUST ESCAPE ALL DOUBLE QUOTES inside the snippet (e.g. \"var x = \\\"y\\\";\").
          - Verdict Score: MUST be a Letter Grade (A+, A, A-, B+, B, B-, C, D, F). 'F' if critical secrets are hardcoded.
          - Line Number: The exact line number in the source file where the snippet begins.
          

          Do NOT use Markdown formatting. Return ONLY the raw JSON string.`,
          },
          {
            role: "user",
            content: `Analyze this repository content:\n\n${fileContext}`,
          },
        ];

        const response = (await this.env.AI.run(
          "@cf/meta/llama-3.1-8b-instruct" as any,
          { messages, max_tokens: 2048 },
        )) as any;

        // --- 5. PARSE & RETURN ---
        let rawOutput = (response as any).response;

        // 1. Handle Case: AI returns an Object directly
        if (typeof rawOutput === "object" && rawOutput !== null) {
          return { audit: rawOutput, filesFound: files.length };
        }

        // 2. Handle Case: AI returns a String
        let responseText = String(rawOutput || "");

        // Strip Markdown
        responseText = responseText.replace(/```json/g, "").replace(/```/g, "");

        // Isolate JSON object
        const jsonStart = responseText.indexOf("{");
        const jsonEnd = responseText.lastIndexOf("}");
        if (jsonStart !== -1 && jsonEnd !== -1) {
          responseText = responseText.substring(jsonStart, jsonEnd + 1);
        }

        try {
          const parsed = JSON.parse(responseText);
          return { audit: parsed, filesFound: files.length };
        } catch (e) {
          console.error("JSON Parse Failed:", e);
          // Fallback: Return a valid "Error Report" so the UI doesn't crash
          return {
            audit: {
              verdict_score: "?",
              summary: "AI returned invalid JSON. Please try again.",
              tech_stack: [],
              cloudflare_native: false,
              security_risks: [],
            },
            filesFound: files.length,
          };
        }
      });

      // Step 2: Save Results (Only saves the small JSON, not the files)
      await step.do("save-results", async () => {
        const id = this.env.AUDIT_RESULTS.idFromString(auditId);
        const stub = this.env.AUDIT_RESULTS.get(id);

        // [FIX] Check for error returned from previous step
        if ((auditResult as any).error) {
           await stub.fetch("http://do/save", {
            method: "POST",
            body: JSON.stringify({
              status: "failed",
              error: (auditResult as any).error,
              repoUrl,
              timestamp: new Date().toISOString(),
            }),
          });
          return;
        }

        const { audit, filesFound } = auditResult as any;

        await stub.fetch("http://do/save", {
          method: "POST",
          body: JSON.stringify({
            status: "completed",
            repoUrl,
            audit,
            filesFound, // <--- CRITICAL: Save this again
            timestamp: new Date().toISOString(),
          }),
        });
      });
    } catch (error: any) {
      // Step 3: Global Error Handler
      await step.do("handle-error", async () => {
        const id = this.env.AUDIT_RESULTS.idFromString(auditId);
        const stub = this.env.AUDIT_RESULTS.get(id);

        console.error("Workflow Failed:", error);

        await stub.fetch("http://do/save", {
          method: "POST",
          body: JSON.stringify({
            status: "failed",
            error: error.message || "Unknown Workflow Error",
            repoUrl,
            timestamp: new Date().toISOString(),
          }),
        });
      });
    }
  }
}

// -- Worker (Hono) --
const app = new Hono<{ Bindings: Bindings }>();

app.use("*", cors());

app.get("/", (c) => c.text("EdgeInsight Backend Active"));

app.post("/audit", async (c) => {
  const { repoUrl } = await c.req.json<{ repoUrl: string }>();
  if (!repoUrl) return c.json({ error: "Missing repoUrl" }, 400);

  // ID for the DO is derived from the repo URL hash or random unique ID
  // For simplicity, we'll generate a random ID and return it
  const auditId = c.env.AUDIT_RESULTS.newUniqueId().toString();

  // Trigger Workflow
  await c.env.AUDIT_WORKFLOW.create({
    params: { repoUrl, auditId },
  });

  return c.json({ auditId, status: "queued" });
});

app.get("/results/:id", async (c) => {
  const idStr = c.req.param("id");
  let id;
  try {
    id = c.env.AUDIT_RESULTS.idFromString(idStr);
  } catch (e) {
    return c.json({ error: "Invalid ID" }, 400);
  }
  const stub = c.env.AUDIT_RESULTS.get(id);
  const res = await stub.fetch("http://do/get");
  const data = await res.json();
  return c.json(data);
});

export default app;

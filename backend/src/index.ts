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
        // Notify: Fetching
        {
          const id = this.env.AUDIT_RESULTS.idFromString(auditId);
          const stub = this.env.AUDIT_RESULTS.get(id);
          stub.fetch("http://do/save", {
            method: "POST",
            body: JSON.stringify({
              status: "processing",
              repoUrl,
              stage: "FETCHING_REPO", // <--- NEW STAGE
              timestamp: new Date().toISOString(),
            }),
          });
        }

        let files;
        try {
          files = await fetchGithubRepo(repoUrl, this.env.GITHUB_TOKEN);
        } catch (e: any) {
          return { error: e.message || "Fetch Failed", filesFound: 0 };
        }

        if (!files || files.length === 0) {
           return { error: "No files found in repository", filesFound: 0 };
        }

        // --- 2. UPDATE STATUS (Fire & Forget) ---
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
         // Notify: Analyzing
         {
          const id = this.env.AUDIT_RESULTS.idFromString(auditId);
          const stub = this.env.AUDIT_RESULTS.get(id);
          stub.fetch("http://do/save", {
            method: "POST",
            body: JSON.stringify({
              status: "processing",
              repoUrl,
              stage: "ANALYZING_CODE", // <--- NEW STAGE
              filesFound: files.length,
              timestamp: new Date().toISOString(),
            }),
          });
        }

        const MAX_TOTAL_CHARS = 16000; // Reduced from 24000 to safe-guard 8k context limit
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
            currentChars += content.length;
            return `File: ${f.path}\n\`\`\`\n${content}\n\`\`\``;
          })
          .filter((s) => s !== "")
          .join("\n\n");

        // --- 4. RUN AI (WITH RETRY & SELF-CORRECTION) ---
        let attempts = 0;
        const MAX_ATTEMPTS = 3;
        let lastError = "";
        let messages = [
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
          - Summary: Write 2-3 professional sentences between 60-80 words.
          - Security Risks: Return exactly 3 most relevant risks.
          - Snippet: Limit to 10 lines. MUST ESCAPE ALL DOUBLE QUOTES inside the JSON string values.
          - Verdict Score: MUST be a Letter Grade (A+, A, ... F).
          - Line Number: The exact line number in the source file where the snippet begins.
          
          CRITICAL: Return ONLY the raw JSON string. Do not use Markdown formatting. Ensure valid JSON syntax (no trailing commas, properly escaped quotes).`,
          },
          {
            role: "user",
            content: `Analyze this repository content:\n\n${fileContext}`,
          },
        ];

        while (attempts < MAX_ATTEMPTS) {
          attempts++;
          try {
            console.log(`AI Attempt ${attempts}/${MAX_ATTEMPTS}`);
            
            const response = (await this.env.AI.run(
              "@cf/meta/llama-3.1-8b-instruct" as any,
              { messages, max_tokens: 2048 },
            )) as any;

            let rawOutput = (response as any).response;

            // Handle Object return
            if (typeof rawOutput === "object" && rawOutput !== null) {
              return { audit: rawOutput, filesFound: files.length };
            }

            // Handle String return
            let responseText = String(rawOutput || "");
            const originalResponse = responseText;

            // Clean Markdown
            responseText = responseText.replace(/```json/g, "").replace(/```/g, "");
            
            // Extract JSON
            const jsonStart = responseText.indexOf("{");
            const jsonEnd = responseText.lastIndexOf("}");
            if (jsonStart !== -1 && jsonEnd !== -1) {
              responseText = responseText.substring(jsonStart, jsonEnd + 1);
            }

            const parsed = JSON.parse(responseText);
            return { audit: parsed, filesFound: files.length };
            
          } catch (e: any) {
            console.error(`Attempt ${attempts} Failed:`, e);
            lastError = e.message;

            // Add error to context for next attempt
            messages.push({
               role: "user",
               content: `Your previous response was invalid JSON. Error: ${lastError}.
               
               Please fix the JSON and return ONLY the valid JSON object. Ensure all strings are properly escaped.`
            });
          }
        }

        // Fallback after all retries failed
        return {
            audit: {
              verdict_score: "?",
              summary: "AI Failed to generate valid JSON after multiple attempts.",
              tech_stack: [],
              cloudflare_native: false,
              security_risks: [],
            },
            filesFound: files.length,
          };
      });

      // Step 2: Save Results (Only saves the small JSON, not the files)
      await step.do("save-results", async () => {
         // Notify: Generating Report
         const id = this.env.AUDIT_RESULTS.idFromString(auditId);
         const stub = this.env.AUDIT_RESULTS.get(id);

         await stub.fetch("http://do/save", {
          method: "POST",
          body: JSON.stringify({
            status: "processing",
            repoUrl,
            stage: "GENERATING_REPORT", // <--- NEW STAGE
            timestamp: new Date().toISOString(),
          }),
        });


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

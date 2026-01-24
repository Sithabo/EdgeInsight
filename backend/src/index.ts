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
      // Step 1: Fetch
      // Step 1: Fetch
      const fetchResult = await step.do("fetch-files", async () => {
        try {
          const f = await fetchGithubRepo(repoUrl, this.env.GITHUB_TOKEN);
          return { success: true, files: f };
        } catch (e: any) {
          return { success: false, error: e.message || "Failed to fetch repo" };
        }
      });

      if (!fetchResult.success || !fetchResult.files) {
        await step.do("save-failed-fetch", async () => {
          const id = this.env.AUDIT_RESULTS.idFromString(auditId);
          const stub = this.env.AUDIT_RESULTS.get(id);
          await stub.fetch("http://do/save", {
            method: "POST",
            body: JSON.stringify({
              status: "failed",
              error:
                fetchResult.error ||
                "Failed to access repository (Private or 404)",
              repoUrl,
              timestamp: new Date().toISOString(),
            }),
          });
        });
        return;
      }

      const files = fetchResult.files;

      // Step 2: Analyze with AI
      const audit = await step.do("analyze-code", async () => {
        // Construct Prompt with truncation
        // Limit total characters to Avoid context limit issues (rough estimate)
        const MAX_TOTAL_CHARS = 100000;
        let currentChars = 0;

        const fileContext = files
          .map((f) => {
            if (currentChars > MAX_TOTAL_CHARS) return "";

            // Truncate individual huge files
            const MAX_FILE_CHARS = 20000;
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

        const messages = [
          {
            role: "system",
            content: `You are an expert code auditor. 
          Analyze the provided code and return a STRICT JSON object. 
          DO NOT return Markdown. DO NOT return free text. 
          
          Required JSON Schema:
          {
            "verdict_score": "string", // e.g. "A+", "B-", "C"
            "summary": "string", // 2 sentence summary
            "tech_stack": ["string"], // e.g. ["React", "Workers"]
            "cloudflare_native": boolean, // true if workers/wrangler detected
            "security_risks": [
              { "severity": "critical" | "high" | "medium" | "low", "file": "string", "description": "string" }
            ]
          }`,
          },
          {
            role: "user",
            content: `Analyze this repository content:\n\n${fileContext}`,
          },
        ];

        const response = (await this.env.AI.run(
          "@cf/meta/llama-3.3-70b-instruct-fp8-fast" as any,
          {
            messages,
          },
        )) as any;

        // Parse the response to ensure it's an object
        // Llama might wrap it in markdown code blocks despite instructions
        let responseText = (response as any).response || "";

        // Attempt to clean markdown if present
        responseText = responseText
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();

        let parsedAudit;
        try {
          parsedAudit = JSON.parse(responseText);
        } catch (e) {
          // Fallback if JSON parsing fails
          parsedAudit = {
            verdict_score: "F",
            summary:
              "Failed to parse AI response. Raw output: " +
              responseText.substring(0, 100),
            tech_stack: [],
            cloudflare_native: false,
            security_risks: [],
          };
        }

        return parsedAudit;
      });

      // Step 3: Save to Durable Object
      await step.do("save-results", async () => {
        const id = this.env.AUDIT_RESULTS.idFromString(auditId);
        const stub = this.env.AUDIT_RESULTS.get(id);
        await stub.fetch("http://do/save", {
          method: "POST",
          body: JSON.stringify({
            status: "completed",
            repoUrl,
            filesFound: files.length,
            audit: audit,
            timestamp: new Date().toISOString(),
          }),
        });
      });
    } catch (error: any) {
      // Global Error Handler
      await step.do("handle-error", async () => {
        const id = this.env.AUDIT_RESULTS.idFromString(auditId);
        const stub = this.env.AUDIT_RESULTS.get(id);

        const errorMessage = error.message || "Unknown Workflow Error";

        await stub.fetch("http://do/save", {
          method: "POST",
          body: JSON.stringify({
            status: "failed",
            error: errorMessage,
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

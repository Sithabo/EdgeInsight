import { Hono } from "hono";
import { cors } from "hono/cors";
import {
  WorkflowEntrypoint,
  WorkflowEvent,
  WorkflowStep,
} from "cloudflare:workers";
import { fetchGithubRepo } from "./github-fetcher";

// -- Types --
type Bindings = {
  AUDIT_RESULTS: DurableObjectNamespace;
  AUDIT_WORKFLOW: Workflow;
  AI: Ai;
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

    // Step 1: Fetch
    const files = await step.do("fetch-files", async () => {
      // @ts-ignore
      return await fetchGithubRepo(repoUrl);
    });

    // Step 2: Analyze with AI
    const audit = await step.do("analyze-code", async () => {
      // Construct Prompt
      // @ts-ignore
      const fileContext = files
        // @ts-ignore
        .map((f) => `File: ${f.path}\n\`\`\`\n${f.content}\n\`\`\``)
        .join("\n\n");
      const messages = [
        {
          role: "system",
          content: `You are auditing an intern applicant. Identify the language (JS, Go, Rust, Python, etc.). Rate the code quality. Crucial: Explicitly state if this tech stack is 'Cloudflare Native' (JS/Rust/Wasm/Python-Workers) or 'Legacy/Incompatible' (Java/Spring, PHP).`,
        },
        { role: "user", content: `Analyze this repository:\n\n${fileContext}` },
      ];

      const response = await this.env.AI.run(
        "@cf/meta/llama-3.3-70b-instruct" as any,
        {
          messages,
        },
      );

      return response; // simplified
    });

    // Step 3: Save to Durable Object
    await step.do("save-results", async () => {
      const id = this.env.AUDIT_RESULTS.idFromString(auditId);
      const stub = this.env.AUDIT_RESULTS.get(id);
      await stub.fetch("http://do/save", {
        method: "POST",
        body: JSON.stringify({
          repoUrl,
          // @ts-ignore
          filesFound: files.length,
          audit: audit,
          timestamp: new Date().toISOString(),
        }),
      });
    });
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

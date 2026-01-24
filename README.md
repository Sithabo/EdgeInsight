# EdgeInsight: AI-Powered Repository Auditor

EdgeInsight is a full-stack AI application built entirely on the Cloudflare Developer Platform. It performs architectural and security audits on GitHub repositories in seconds.

**🔗 Live Demo:** [edgeinsight.pages.dev]

## ⚡ Tech Stack (Cloudflare Native)

This project strictly adheres to the Cloudflare "North Star" architecture:

- **Frontend:** Next.js (App Router) deployed on **Cloudflare Pages**.
- **AI Inference:** **Workers AI** running Llama 3.1 8B Instruct (optimized for edge latency).
- **Orchestration:** **Cloudflare Workflows** to handle long-running fetch & analysis tasks.
- **State Management:** **Durable Objects** for real-time status updates and result persistence.
- **Backend:** **Cloudflare Workers** (Hono.js) as the API gateway.

## 🚀 How It Works

1.  **User Input:** User submits a GitHub URL via the Next.js frontend.
2.  **Workflow Trigger:** The Worker initiates an asynchronous `AuditWorkflow`.
3.  **Step 1 (Fetch):** The Workflow fetches the raw code from GitHub (in-memory to avoid storage limits).
4.  **Step 2 (Analyze):** Llama 3 analyzes the codebase for security risks, architecture, and tech stack.
5.  **Step 3 (Persist):** Results are saved to a Durable Object.
6.  **Realtime UI:** The frontend polls the Durable Object to show a live "Processing" state and the final report.

## 🛠️ Local Development

1.  `npm install`
2.  `npx wrangler dev` (Backend)
3.  `npm run dev` (Frontend)

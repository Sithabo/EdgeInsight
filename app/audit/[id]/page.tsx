"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useAudit } from "@/hooks/useAudit";

const LOADING_LOGS = [
  "> [INFO] Fetching commit history from main...",
  "> [NETWORK] Establishing edge worker connection...",
  "> [SYSTEM] Spinning up Llama 3.3 (8B Instruct)...",
  "> [DATA] Processing packets via global edge nodes...",
  "> [ANALYSIS] Parsing dependency tree...",
  "> [SECURITY] Scanning for vulnerabilties...",
  "> [AI] Generating architectural summary...",
];

export default function AuditPage() {
  const params = useParams();
  const id = params.id as string;
  const { data, loading } = useAudit(id);
  const router = useRouter();

  // Loading State Logic
  const [logIndex, setLogIndex] = useState(0);

  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setLogIndex((prev) => (prev + 1) % LOADING_LOGS.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [loading]);

  if (loading || !data || data.status === "queued") {
    return (
      <div className="bg-background-light dark:bg-background-dark font-display text-white selection:bg-primary/30 overflow-hidden min-h-screen flex flex-col">
        {/* Ghosted Dashboard Background */}
        <div className="fixed inset-0 z-0 opacity-10 blur-md pointer-events-none scale-105">
          <div className="p-10 grid grid-cols-3 gap-6">
            <div className="h-64 bg-primary/20 rounded-xl"></div>
            <div className="h-64 bg-primary/20 rounded-xl col-span-2"></div>
            <div className="h-40 bg-primary/20 rounded-xl"></div>
            <div className="h-40 bg-primary/20 rounded-xl"></div>
            <div className="h-40 bg-primary/20 rounded-xl"></div>
            <div className="h-96 bg-primary/20 rounded-xl col-span-3"></div>
          </div>
        </div>

        {/* Top Nav Bar (Loading version) */}
        <header className="relative z-20 flex items-center justify-between whitespace-nowrap border-b border-solid border-primary/10 px-10 py-4 glass-panel">
          <div className="flex items-center gap-4 text-white">
            <div className="size-8 flex items-center justify-center bg-primary rounded-lg">
              <span
                className="material-symbols-outlined text-white"
                style={{ fontVariationSettings: '"FILL" 1' }}
              >
                architecture
              </span>
            </div>
            <h2 className="text-white text-xl font-bold leading-tight tracking-tight">
              EdgeInsight
            </h2>
          </div>
          <div className="flex flex-1 justify-end gap-4 items-center">
            <div className="px-3 py-1 rounded bg-primary/10 border border-primary/20 text-primary text-xs font-mono uppercase tracking-widest">
              Pipeline Active
            </div>
            <div
              className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border border-primary/20"
              style={{
                backgroundImage:
                  'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAnwirg68YYpOervGeDPeKxypTHZHINwYP0nQlmxRdqDQKSFigu0yk2Ez88LbW8plTaSCLb2eCJFuNO2M-42cxlPiCPb1PkVYAC36OKLNfwycm_RmeGzPmATzrFEnPzefznoH9yPeRtOIUKlZFyoDZuVJCAPgLOvu4b24rQKtATwSi-hDe8xMD6Xa3OI1CKdI300e78orCb10TZOujhSCc8-iOJr-GQkwmR3ZpsfXKRq0kRoq76FNi-VkSQoShCLXVWYyj_ZlNqk5bt")',
              }}
            ></div>
          </div>
        </header>

        <main className="relative z-20 flex-1 flex flex-col items-center justify-center px-4">
          <div className="max-w-[800px] w-full mb-12">
            <h1 className="text-white tracking-tight text-4xl md:text-5xl font-bold leading-tight text-center pb-3">
              Analyzing Repository{" "}
              <span className="text-primary">Architecture</span>
            </h1>
            <p className="text-gray-400 text-center text-lg">
              Scanning dependencies, commit velocity, and code quality
              signatures.
            </p>
          </div>

          {/* Animation */}
          <div className="relative w-full max-w-4xl h-64 flex items-center justify-between px-12 mb-12">
            {/* Component nodes here - simplified for brevity if needed, but keeping fidelity */}
            {/* GitHub Node */}
            <div className="relative flex flex-col items-center gap-4 group">
              <div className="size-20 rounded-2xl glass-panel flex items-center justify-center border-2 border-primary/40 pipeline-glow">
                <span className="material-symbols-outlined text-4xl text-white">
                  database
                </span>
              </div>
              <span className="font-mono text-xs uppercase tracking-tighter text-gray-400">
                GitHub Source
              </span>
            </div>
            {/* Connector 1 */}
            <div className="flex-1 h-[2px] mx-4 bg-gradient-to-r from-primary/60 via-primary/20 to-primary/60 relative overflow-hidden">
              <div className="absolute inset-0 bg-primary w-20 blur-sm translate-x-[-100%] animate-[move_2s_linear_infinite]"></div>
            </div>
            {/* Edge Workers Hub */}
            <div className="relative flex flex-col items-center gap-4">
              <div className="size-32 rounded-full glass-panel flex items-center justify-center border-4 border-primary pipeline-glow relative">
                <div className="absolute inset-0 rounded-full border-2 border-primary/30 scale-125 animate-ping opacity-20"></div>
                <span
                  className="material-symbols-outlined text-6xl text-primary animate-pulse"
                  style={{ fontVariationSettings: '"FILL" 1' }}
                >
                  hub
                </span>
              </div>
              <span className="font-mono text-xs uppercase tracking-tighter text-primary font-bold">
                Edge Workers Hub
              </span>
            </div>
            {/* Connector 2 */}
            <div className="flex-1 h-[2px] mx-4 bg-gradient-to-r from-primary/60 via-primary/20 to-primary/60 relative overflow-hidden">
              <div className="absolute inset-0 bg-primary w-20 blur-sm translate-x-[-100%] animate-[move_2s_linear_infinite_0.5s]"></div>
            </div>
            {/* AI Analysis Node */}
            <div className="relative flex flex-col items-center gap-4">
              <div className="size-20 rounded-2xl glass-panel flex items-center justify-center border-2 border-primary/40 pipeline-glow">
                <span className="material-symbols-outlined text-4xl text-white">
                  psychology
                </span>
              </div>
              <span className="font-mono text-xs uppercase tracking-tighter text-gray-400">
                AI Analysis
              </span>
            </div>
          </div>

          {/* Logs */}
          <div className="max-w-[640px] w-full glass-panel rounded-xl p-6 border border-white/5">
            <div className="flex flex-col gap-4">
              <div className="flex gap-6 justify-between items-end">
                <div className="flex flex-col gap-1">
                  <p className="text-white text-lg font-medium leading-none">
                    Llama 3.3 Initialization
                  </p>
                  <p className="text-primary text-xs font-mono">
                    NODE_ID: US-EAST-1_WKR_09
                  </p>
                </div>
                <p className="text-primary text-2xl font-bold leading-none font-mono tracking-tighter">
                  65.2%
                </p>
              </div>
              <div className="h-3 rounded-full bg-primary/10 overflow-hidden border border-primary/10">
                <div
                  className="h-full rounded-full bg-primary pipeline-glow"
                  style={{ width: "65%" }}
                ></div>
              </div>
              <div className="bg-black/40 rounded-lg p-4 font-mono text-sm border border-white/5 min-h-[100px] flex flex-col justify-end">
                {/* Dynamic Logs */}
                {LOADING_LOGS.slice(
                  Math.max(0, logIndex - 3),
                  logIndex + 1,
                ).map((log, i) => (
                  <p
                    key={i}
                    className={`mb-1 ${i === Math.min(logIndex, 3) ? "text-primary animate-pulse" : "text-gray-500"}`}
                  >
                    {log}
                  </p>
                ))}
                <p className="text-white mt-1">
                  &gt; [DATA] Processing packets via global edge nodes...
                  <span className="inline-block w-2 h-4 bg-primary ml-1"></span>
                </p>
              </div>
            </div>
          </div>
        </main>

        <style jsx global>{`
          .glass-panel {
            background: rgba(33, 24, 17, 0.7);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(228, 129, 47, 0.1);
          }
          .pipeline-glow {
            box-shadow: 0 0 20px rgba(228, 129, 47, 0.15);
          }
          @keyframes move {
            from {
              transform: translateX(-100%);
            }
            to {
              transform: translateX(400%);
            }
          }
        `}</style>
      </div>
    );
  }

  // Success State
  const verdictScore = data.verdict_score || "?";
  const scoreColorClass = verdictScore.startsWith("A")
    ? "text-green-500"
    : verdictScore.startsWith("C")
      ? "text-orange-500"
      : "text-primary";

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen">
      <Navbar />

      <main className="max-w-[1200px] mx-auto px-6 py-8">
        {/* Breadcrumbs & Profile Header */}
        <div className="flex flex-col gap-6 mb-10">
          <div className="flex flex-wrap gap-2 items-center">
            <Link
              href="/"
              className="text-slate-500 dark:text-slate-400 text-sm font-medium hover:text-primary"
            >
              Repositories
            </Link>
            <span className="text-slate-400 text-sm font-medium">/</span>
            <span className="text-slate-900 dark:text-white text-sm font-bold">
              {data.repoUrl.replace("https://github.com/", "")}
            </span>
          </div>
          <div className="flex flex-col @[520px]:flex-row @[520px]:justify-between items-start gap-6">
            <div className="flex gap-6">
              <div className="bg-gradient-to-br from-primary to-orange-700 rounded-xl min-h-32 w-32 flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-6xl">
                  folder_zip
                </span>
              </div>
              <div className="flex flex-col justify-center">
                <h1 className="text-slate-900 dark:text-white text-3xl font-bold leading-tight tracking-[-0.015em] mb-1">
                  {data.repoUrl.replace("https://github.com/", "")}
                </h1>
                <p className="text-slate-400 text-base font-normal flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">
                    history
                  </span>
                  Last commit 2 days ago • main branch
                </p>
                <p className="text-slate-400 text-base font-normal flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">
                    description
                  </span>
                  248 Files • 12.4 MB
                </p>
              </div>
            </div>
            {/* Buttons intentionally omitted or simple mock implementation */}
          </div>
        </div>

        {/* Main Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 ai-glow-bg rounded-3xl p-4">
          {/* Left: Score Card */}
          <div className="lg:col-span-3">
            <div className="flex flex-col h-full items-center justify-center gap-4 rounded-2xl p-8 border border-primary/30 bg-card-dark shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <p className="text-slate-400 text-lg font-medium uppercase tracking-widest">
                Verdict Score
              </p>
              <div className="relative">
                <p
                  className={`text-8xl font-black leading-none score-glow ${scoreColorClass}`}
                >
                  {verdictScore}
                </p>
                <div className="absolute -inset-4 bg-primary/20 blur-3xl -z-10 rounded-full"></div>
              </div>
              <p className="text-green-500 text-sm font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">
                  trending_up
                </span>
                Top 5% of Repos
              </p>
            </div>
          </div>

          {/* Right: AI Summary & Stack */}
          <div className="lg:col-span-9 flex flex-col gap-6">
            {/* Summary */}
            <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary">
                  auto_awesome
                </span>
                <p className="text-white text-lg font-bold leading-tight">
                  AI Technical Summary
                </p>
              </div>
              <p className="text-slate-300 text-lg leading-relaxed mb-6">
                {data.summary || "Analyzing repository content..."}
              </p>
              <div className="flex items-center justify-between border-t border-white/10 pt-4">
                <div className="flex gap-2">
                  {/* Mock Tags */}
                  <span className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded text-xs font-bold uppercase tracking-wider">
                    Fast Refresh
                  </span>
                </div>
                <Link
                  href={`/audit/${id}/security`}
                  className="text-sm font-bold flex items-center gap-2 text-white hover:text-primary transition-colors"
                >
                  View detailed analysis
                  <span className="material-symbols-outlined text-[18px]">
                    arrow_forward
                  </span>
                </Link>
              </div>
            </div>

            {/* Tech Stack & Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Stack */}
              <div className="bg-card-dark border border-border-dark rounded-2xl p-6">
                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">
                  Tech Stack Detected
                </h3>
                <div className="flex flex-wrap gap-3">
                  {data.tech_stack?.map((tech) => (
                    <div
                      key={tech}
                      className="flex items-center gap-2 bg-background-dark border border-border-dark px-4 py-2 rounded-lg group hover:border-primary transition-colors"
                    >
                      <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                      <span className="text-sm font-bold text-white">
                        {tech}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Key Metrics */}
              <div className="bg-card-dark border border-border-dark rounded-2xl p-6 flex flex-col justify-between">
                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">
                  Key Indicators
                </h3>
                <div className="flex justify-between items-center gap-4">
                  <div className="flex flex-col items-center gap-2 flex-1">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${data.cloudflare_native ? "bg-orange-500/10 border border-orange-500/30 text-orange-500" : "bg-slate-500/10 border border-slate-500/30 text-slate-500"}`}
                    >
                      <span className="material-symbols-outlined">
                        cloud_done
                      </span>
                    </div>
                    <span className="text-xs font-medium text-slate-400">
                      Deployment
                    </span>
                    <span className="text-sm font-bold text-white uppercase">
                      {data.cloudflare_native ? "Edge" : "Standard"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style jsx global>{`
        .glass-card {
          background: rgba(26, 29, 35, 0.6);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(228, 129, 47, 0.15);
        }
        .score-glow {
          text-shadow: 0 0 20px rgba(228, 129, 47, 0.5);
        }
        .ai-glow-bg {
          background: radial-gradient(
            circle at center,
            rgba(228, 129, 47, 0.08) 0%,
            transparent 70%
          );
        }
      `}</style>
    </div>
  );
}

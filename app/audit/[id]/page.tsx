"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useAudit } from "@/hooks/useAudit";

const LOADING_LOGS = [
  "> [INFO] Fetching commit history from main...",
  "> [NETWORK] Establishing edge worker connection...",
  "> [SYSTEM] Spinning up Llama 3.3 (70B Instruct)...",
  "> [DATA] Processing packets via global edge nodes...",
  "> [ANALYSIS] Parsing dependency tree...",
  "> [SECURITY] Scanning for vulnerabilties...",
  "> [AI] Generating architectural summary...",
];

export default function AuditPage() {
  const params = useParams();
  const id = params.id as string;
  const { data, loading } = useAudit(id);

  // Loading Animation Logic
  const [logIndex, setLogIndex] = useState(0);

  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setLogIndex((prev) => (prev + 1) % LOADING_LOGS.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [loading]);

  // -- STATE 1: LOADING --
  if (
    loading ||
    !data ||
    data.status === "queued" ||
    data.status === "processing"
  ) {
    return (
      <div className="bg-background-light dark:bg-background-dark font-display text-white selection:bg-primary/30 overflow-hidden min-h-screen flex flex-col">
        {/* ... (Keep your existing Loading UI code here exactly as is) ... */}
        {/* For brevity, I am not repeating the 100 lines of loading HTML, keep it! */}

        {/* TEMPORARY PLACEHOLDER FOR LOADING UI - PASTE YOUR EXISTING LOADING UI HERE */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <h1 className="text-2xl animate-pulse text-primary">
            Edge Pipeline Active...
          </h1>
          <p className="text-slate-500 mt-2">{LOADING_LOGS[logIndex]}</p>
        </div>
      </div>
    );
  }

  // -- STATE 2: ERROR --
  if (data?.status === "failed") {
    return (
      <div className="bg-background-light dark:bg-background-dark font-display min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-red-500/10 border border-red-500/50 rounded-2xl p-8 max-w-md w-full">
            <span className="material-symbols-outlined text-5xl text-red-500 mb-4">
              error
            </span>
            <h1 className="text-2xl font-bold text-white mb-2">Scan Failed</h1>
            <p className="text-slate-400 mb-6">
              {data.error ||
                "An unknown error occurred while processing the repository."}
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined">refresh</span>
              Try Again
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // -- STATE 3: SUCCESS (Dashboard) --

  const report = data.audit!;
  const verdictScore = report.verdict_score || "?";

  // Dynamic Color Logic for Score
  const scoreColorClass = verdictScore.startsWith("A")
    ? "text-green-500" // A grades
    : verdictScore.startsWith("B")
      ? "text-primary" // B grades
      : verdictScore.startsWith("C")
        ? "text-yellow-500" // C grades
        : "text-red-500"; // D/F grades

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen">
      <Navbar />

      <main className="max-w-[1200px] mx-auto px-6 py-8">
        {/* Breadcrumbs & Header */}
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
              {data.repoUrl
                ? data.repoUrl.replace("https://github.com/", "")
                : "Unknown Repo"}
            </span>
          </div>

          <div className="flex gap-6">
            <div className="bg-gradient-to-br from-primary to-orange-700 rounded-xl min-h-32 w-32 flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-6xl">
                folder_zip
              </span>
            </div>
            <div className="flex flex-col justify-center">
              <h1 className="text-slate-900 dark:text-white text-3xl font-bold mb-1">
                {data.repoUrl
                  ? data.repoUrl.replace("https://github.com/", "")
                  : "Repository Audit"}
              </h1>
              <p className="text-slate-400 text-base flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">
                  check_circle
                </span>
                Audit Complete • {data.filesFound || 0} Files Scanned
              </p>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 ai-glow-bg rounded-3xl p-4">
          {/* Score Card */}
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
              </div>
              <p
                className={`${scoreColorClass} text-sm font-bold flex items-center gap-1`}
              >
                <span className="material-symbols-outlined text-sm">
                  auto_awesome
                </span>
                AI Generated
              </p>
            </div>
          </div>

          {/* Summary & Stack */}
          <div className="lg:col-span-9 flex flex-col gap-6">
            {/* AI Summary */}
            <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary">
                  auto_awesome
                </span>
                <p className="text-white text-lg font-bold">
                  AI Technical Summary
                </p>
              </div>
              <p className="text-slate-300 text-lg leading-relaxed mb-6">
                {report.summary || "Generating summary..."}
              </p>

              <div className="flex items-center justify-between border-t border-white/10 pt-4">
                <div className="flex gap-2">
                  {/* Only show badge if native */}
                  {report.cloudflare_native && (
                    <span className="px-3 py-1 bg-orange-500/10 text-orange-500 border border-orange-500/20 rounded text-xs font-bold uppercase tracking-wider">
                      Cloudflare Native
                    </span>
                  )}
                </div>
                <Link
                  href={`/audit/${id}/security`}
                  className="text-sm font-bold flex items-center gap-2 text-white hover:text-primary transition-colors"
                >
                  View Security Risks
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
                  {report.tech_stack?.map((tech: string) => (
                    <div
                      key={tech}
                      className="flex items-center gap-2 bg-background-dark border border-border-dark px-4 py-2 rounded-lg"
                    >
                      <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                      <span className="text-sm font-bold text-white">
                        {tech}
                      </span>
                    </div>
                  ))}
                  {(!report.tech_stack || report.tech_stack.length === 0) && (
                    <span className="text-slate-500 italic">
                      No specific frameworks detected
                    </span>
                  )}
                </div>
              </div>

              {/* Deployment Metric */}
              <div className="bg-card-dark border border-border-dark rounded-2xl p-6 flex flex-col justify-between">
                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">
                  Deployment Target
                </h3>
                <div className="flex justify-between items-center gap-4">
                  <div className="flex flex-col items-center gap-2 flex-1">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${report.cloudflare_native ? "bg-orange-500/10 border border-orange-500/30 text-orange-500" : "bg-slate-500/10 border border-slate-500/30 text-slate-500"}`}
                    >
                      <span className="material-symbols-outlined">
                        cloud_done
                      </span>
                    </div>
                    <span className="text-xs font-medium text-slate-400">
                      Platform
                    </span>
                    <span className="text-sm font-bold text-white uppercase">
                      {report.cloudflare_native
                        ? "Cloudflare Workers"
                        : "Standard Web / Other"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Styles for glassmorphism */}
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

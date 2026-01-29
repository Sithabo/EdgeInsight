"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { FlickeringGrid } from "../components/ui/flickering-grid";
import { BorderBeam } from "../components/ui/border-beam";
import { cn } from "../lib/utils";
import { useRecentAudits } from "../hooks/useRecentAudits";

function RecentScans() {
  const { audits } = useRecentAudits();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || audits.length === 0) return null;

  return (
    <div className="w-full max-w-2xl mt-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 text-center md:text-left pl-2">
        Your Recent Scans
      </h3>
      <div className="grid gap-3">
        {audits.map((audit) => (
          <Link
            key={audit.id}
            href={`/audit/${audit.id}`}
            className="group flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/30 transition-all"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="size-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-slate-400 text-lg">
                  folder
                </span>
              </div>
              <span className="font-medium text-slate-300 group-hover:text-white truncate">
                {audit.repoUrl.replace("https://github.com/", "")}
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span
                className={cn(
                  "text-sm font-bold px-2 py-0.5 rounded",
                  audit.score.startsWith("A")
                    ? "bg-green-500/10 text-green-500"
                    : audit.score.startsWith("B")
                      ? "bg-blue-500/10 text-blue-500"
                      : "bg-yellow-500/10 text-yellow-500",
                )}
              >
                {audit.score}
              </span>
              <span className="material-symbols-outlined text-slate-500 group-hover:text-primary transition-colors text-lg">
                chevron_right
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Helper validation function
  const isValidGithubUrl = (input: string) => {
    try {
      // Basic URL structure check
      if (!input.includes("github.com")) return false;

      // Clean url (remove protocol) to check path
      const cleanUrl = input.replace(/^https?:\/\//, "").replace("www.", "");

      // Must start with github.com/
      if (!cleanUrl.startsWith("github.com/")) return false;

      const parts = cleanUrl.split("/");
      // Must have exactly: github.com, owner, repo (at least)
      // parts[0] = github.com
      // parts[1] = owner
      // parts[2] = repo
      if (parts.length < 3) return false;

      // Ensure owner and repo are not empty strings
      if (!parts[1] || !parts[2]) return false;

      return true;
    } catch (e) {
      return false;
    }
  };

  const submitAudit = async (repoUrl: string) => {
    if (!repoUrl) return;

    // Clear previous errors
    setError("");

    // Validate Frontend First
    if (!isValidGithubUrl(repoUrl)) {
      setError(
        "Please enter a valid GitHub repository URL (e.g. https://github.com/owner/repo)",
      );
      return;
    }

    setIsLoading(true);
    try {
      const { submitAudit } = await import("../lib/api");
      const { auditId } = await submitAudit(repoUrl);
      router.push(`/audit/${auditId}`);
    } catch (e) {
      console.error("Failed to start audit", e);
      alert("Failed to start audit. Please check text URL.");
      setIsLoading(false);
    }
  };

  const handleRunAudit = () => {
    submitAudit(url);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleRunAudit();
    }
  };

  return (
    <>
      <div className="relative min-h-screen flex flex-col overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-white">
        {/* Backgrounds */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <FlickeringGrid
            className="z-0 absolute inset-0 size-full"
            squareSize={4}
            gridGap={6}
            color="#f37f20"
            maxOpacity={0.15}
            flickerChance={0.1}
          />
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[800px] h-[300px] md:h-[500px] bg-primary/10 blur-[80px] md:blur-[120px] rounded-full pointer-events-none z-0"></div>

        {/* Top Navigation Bar - Landing Specific */}
        <Navbar />

        <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-4">
          {/* Hero Section */}
          <div className="w-full max-w-5xl py-12 md:py-20 flex flex-col items-center text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] md:text-xs font-bold uppercase tracking-widest mb-6 md:mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Now Powered by GPT-4o
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-7xl font-bold font-display mb-6 tracking-tight leading-[1.1]">
              Audit Code at the <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">
                Speed of Edge
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base md:text-xl text-slate-400 max-w-2xl mb-10 md:mb-12 font-light px-4">
              Instant architectural analysis and technical depth assessment for
              recruiting teams. Move from "Candidate" to "Hired" with AI-driven
              repository intelligence.
            </p>

            {/* Input Bar */}
            <div className="w-full max-w-3xl flex flex-col gap-3">
              <div
                className={cn(
                  "glass-panel p-2 rounded-2xl flex flex-col md:flex-row gap-2 items-stretch shadow-2xl transition-all relative overflow-hidden",
                  "bg-black/40 backdrop-blur-xl border border-white/10",
                  error ? "border-red-500/50" : "border-white/10",
                )}
              >
                <div className="flex items-center px-4 text-slate-500 py-2 md:py-0 justify-center md:justify-start">
                  <span className="material-symbols-outlined">link</span>
                </div>
                <input
                  className="flex-1 bg-transparent border-none focus:ring-0 text-base md:text-lg py-3 md:py-4 placeholder:text-slate-600 font-medium outline-none text-center md:text-left min-w-0"
                  placeholder="Paste GitHub Repository URL..."
                  type="text"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    if (error) setError(""); // Clear error on edit
                  }}
                  onKeyDown={handleKeyDown}
                  disabled={isLoading}
                />
                <button
                  onClick={handleRunAudit}
                  disabled={isLoading}
                  className={cn(
                    "bg-primary text-background-dark font-bold px-8 py-3 md:py-4 rounded-xl flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed",
                    "glow-button",
                  )}
                >
                  {isLoading ? (
                    <>
                      <span className="size-5 border-2 border-background-dark border-t-transparent rounded-full animate-spin"></span>
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <span>Run Audit</span>
                      <span className="material-symbols-outlined text-xl">
                        bolt
                      </span>
                    </>
                  )}
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="animate-in fade-in slide-in-from-top-2 text-red-400 text-sm font-medium flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-sm">
                    error
                  </span>
                  {error}
                </div>
              )}
            </div>

            {/* Stacks Grid */}
            <div className="mt-16 flex flex-col items-center gap-6">
              <p className="text-[10px] md:text-xs uppercase tracking-[0.2em] text-slate-500 font-bold">
                Supports modern architectures
              </p>
              <div className="flex flex-wrap justify-center gap-8 md:gap-12 opacity-40 grayscale hover:grayscale-0 transition-all duration-500 px-4">
                <div className="flex items-center gap-2 group cursor-default">
                  <span className="material-symbols-outlined text-2xl group-hover:text-[#61DAFB]">
                    deployed_code
                  </span>
                  <span className="text-lg font-bold">React</span>
                </div>
                <div className="flex items-center gap-2 group cursor-default">
                  <span className="material-symbols-outlined text-2xl group-hover:text-[#3776AB]">
                    terminal
                  </span>
                  <span className="text-lg font-bold">Python</span>
                </div>
                <div className="flex items-center gap-2 group cursor-default">
                  <span className="material-symbols-outlined text-2xl group-hover:text-[#DEA584]">
                    settings_input_component
                  </span>
                  <span className="text-lg font-bold">Rust</span>
                </div>
                <div className="flex items-center gap-2 group cursor-default">
                  <span className="material-symbols-outlined text-2xl group-hover:text-[#00ADD8]">
                    cloud_sync
                  </span>
                  <span className="text-lg font-bold">Go</span>
                </div>
              </div>
            </div>

            {/* Recent Scans (Client Side Only) */}
            <RecentScans />
          </div>
        </main>

        <Footer />
      </div>

      <style jsx global>{`
        .glow-button {
          box-shadow: 0 0 20px rgba(243, 127, 32, 0.3);
        }
        .glow-button:hover {
          box-shadow: 0 0 30px rgba(243, 127, 32, 0.5);
        }
      `}</style>
    </>
  );
}

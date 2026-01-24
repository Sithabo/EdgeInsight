"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Footer from "../components/Footer";

export default function Home() {
  const [url, setUrl] = useState("");
  const router = useRouter();

  const submitAudit = async (repoUrl: string) => {
    if (!repoUrl) return;
    try {
      const { submitAudit } = await import("../lib/api");
      const { auditId } = await submitAudit(repoUrl);
      router.push(`/audit/${auditId}`);
    } catch (e) {
      console.error("Failed to start audit", e);
      alert("Failed to start audit. Please check text URL.");
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
      {/* Top Navigation Bar - Landing Specific */}
      <header className="w-full border-b border-white/5 bg-background-light/50 dark:bg-background-dark/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-primary flex items-center justify-center rounded-lg">
              <span className="material-symbols-outlined text-background-dark font-bold">
                query_stats
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight font-display">
              EdgeInsight
            </h2>
          </div>
          <nav className="hidden md:flex items-center gap-10">
            <Link
              className="text-sm font-medium opacity-70 hover:opacity-100 transition-opacity"
              href="#"
            >
              Features
            </Link>
            <Link
              className="text-sm font-medium opacity-70 hover:opacity-100 transition-opacity"
              href="#"
            >
              Docs
            </Link>
            <Link
              className="text-sm font-medium opacity-70 hover:opacity-100 transition-opacity"
              href="#"
            >
              Pricing
            </Link>
            <button className="bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-2 rounded-lg text-sm font-bold transition-all">
              Login
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center relative overflow-hidden min-h-[calc(100vh-80px-300px)]">
        {/* Background Decor */}
        <div className="absolute inset-0 grid-bg pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-primary/10 blur-[120px] rounded-full pointer-events-none"></div>

        {/* Hero Section */}
        <div className="relative z-10 w-full max-w-5xl px-6 py-20 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Now Powered by GPT-4o
          </div>
          <h1 className="text-5xl md:text-7xl font-bold font-display mb-6 tracking-tight leading-[1.1]">
            Audit Code at the <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">
              Speed of Edge
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-12 font-light">
            Instant architectural analysis and technical depth assessment for
            recruiting teams. Move from "Candidate" to "Hired" with AI-driven
            repository intelligence.
          </p>

          {/* Massive Input Bar */}
          <div className="w-full max-w-3xl group">
            <div className="glass-panel p-2 rounded-2xl flex flex-col md:flex-row gap-2 items-stretch shadow-2xl transition-all group-focus-within:border-primary/40 group-focus-within:ring-4 ring-primary/5">
              <div className="flex items-center px-4 text-slate-500">
                <span className="material-symbols-outlined">link</span>
              </div>
              <input
                className="flex-1 bg-transparent border-none focus:ring-0 text-lg py-4 placeholder:text-slate-600 font-medium outline-none"
                placeholder="Paste GitHub Repository URL (e.g. cloudflare/workers-sdk)..."
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                onClick={handleRunAudit}
                className="bg-primary text-background-dark font-bold px-8 py-4 rounded-xl flex items-center justify-center gap-2 glow-button whitespace-nowrap cursor-pointer hover:bg-primary/90"
              >
                <span>Run Audit</span>
                <span className="material-symbols-outlined text-xl">bolt</span>
              </button>
            </div>
          </div>

          {/* Social Proof / Tech Grid */}
          <div className="mt-16 flex flex-col items-center gap-6">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-bold">
              Supports modern architectures
            </p>
            <div className="flex flex-wrap justify-center gap-8 md:gap-12 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
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
        </div>
      </main>

      <Footer />

      <style jsx global>{`
        .glass-panel {
          background: rgba(39, 33, 27, 0.6);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .glow-button {
          box-shadow: 0 0 20px rgba(243, 127, 32, 0.3);
          transition: all 0.3s ease;
        }
        .glow-button:hover {
          box-shadow: 0 0 30px rgba(243, 127, 32, 0.5);
          transform: translateY(-1px);
        }
        .grid-bg {
          background-image: radial-gradient(
            circle at 2px 2px,
            rgba(243, 127, 32, 0.05) 1px,
            transparent 0
          );
          background-size: 40px 40px;
        }
      `}</style>
    </>
  );
}

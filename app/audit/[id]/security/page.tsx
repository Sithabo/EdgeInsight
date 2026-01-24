"use client";

export const runtime = "edge";

import { useState } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import { useAudit } from "@/hooks/useAudit";
import Link from "next/link";

export default function SecurityDeepDive() {
  const params = useParams();
  const id = params.id as string;
  const { data, loading } = useAudit(id);
  const [selectedRiskIndex, setSelectedRiskIndex] = useState(0);

  if (loading || !data) {
    return <div className="text-center p-20">Loading analysis...</div>;
  }

  const risks = data.audit?.security_risks || [];
  const selectedRisk = risks[selectedRiskIndex];

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 flex flex-col gap-6 h-[calc(100vh-80px)]">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <Link
            href={`/audit/${id}`}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Back to Dashboard
          </Link>
          <div className="h-6 w-px bg-border-dark"></div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">
              security
            </span>
            Security Deep Dive
          </h1>
        </div>

        {/* Content Split */}
        <div className="flex-1 grid grid-cols-12 gap-6 overflow-hidden min-h-0">
          {/* Sidebar List */}
          <div className="col-span-4 flex flex-col gap-4 overflow-y-auto pr-2 bg-card-dark rounded-2xl border border-border-dark p-4">
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">
              Authenticated Risks ({risks.length})
            </h3>

            {risks.map((risk, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedRiskIndex(idx)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedRiskIndex === idx
                    ? "bg-primary/10 border-primary shadow-[0_0_15px_rgba(243,127,32,0.1)]"
                    : "bg-background-dark border-border-dark hover:border-slate-600"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      risk.severity === "critical"
                        ? "bg-red-500/20 text-red-500"
                        : risk.severity === "high"
                          ? "bg-orange-500/20 text-orange-500"
                          : "bg-yellow-500/20 text-yellow-500"
                    }`}
                  >
                    {risk.severity}
                  </span>
                  <span className="text-slate-500 text-xs font-mono">
                    {idx + 1}
                  </span>
                </div>
                <h4 className="font-bold text-sm mb-1 line-clamp-2">
                  {risk.description.split(".")[0]}
                </h4>
                <p className="text-slate-500 text-xs font-mono truncate">
                  {risk.file}
                </p>
              </div>
            ))}

            {risks.length === 0 && (
              <div className="text-slate-500 text-center py-10">
                No security risks detected.
              </div>
            )}
          </div>

          {/* Code Editor / Detail View */}
          <div className="col-span-8 flex flex-col bg-[#0d1117] rounded-2xl border border-border-dark overflow-hidden">
            {selectedRisk ? (
              <>
                <div className="bg-[#161b22] px-6 py-4 border-b border-border-dark flex justify-between items-center">
                  <div className="flex items-center gap-2 font-mono text-sm text-slate-300">
                    <span className="material-symbols-outlined text-sm">
                      description
                    </span>
                    {selectedRisk.file}
                  </div>
                </div>
                <div className="flex-1 p-6 overflow-y-auto font-mono text-sm text-slate-300 leading-relaxed bg-[#0d1117]">
                  <div className="bg-red-500/5 border border-red-500/20 p-4 rounded-lg mb-6 text-red-200">
                    <strong>Identified Risk:</strong> {selectedRisk.description}
                  </div>
                  <p className="text-slate-500">
                    // Code preview is not available in this demo mode.
                  </p>
                  <p className="text-slate-500">
                    // Imagine critical code snippets here highlighting the
                    vulnerability.
                  </p>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500">
                Select a risk to view details
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

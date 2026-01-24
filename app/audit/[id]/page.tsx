"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useAudit } from "@/hooks/useAudit";

export default function AuditPage() {
  const params = useParams();
  const id = params?.id as string;
  const { data, loading, error } = useAudit(id);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
        <div className="w-full max-w-md space-y-4">
          <h1 className="text-2xl font-bold text-center animate-pulse">
            Pipeline Active
          </h1>
          <div className="text-center text-gray-400 text-sm">
            Analyzing Repository...
          </div>
          {/* Orange Progress Bar */}
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-orange-500 animate-progress"></div>
          </div>
        </div>

        {/* Simple CSS animation for the progress bar if not in tailwind config */}
        <style jsx>{`
          @keyframes progress {
            0% {
              width: 0%;
              transform: translateX(-100%);
            }
            50% {
              width: 50%;
            }
            100% {
              width: 100%;
              transform: translateX(0%);
            }
          }
          .animate-progress {
            animation: progress 2s infinite ease-in-out;
            width: 100%;
          }
        `}</style>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-red-500">Audit not found or expired.</div>
      </div>
    );
  }

  // Dashboard (JSON Data Render)
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8 font-mono">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="border-b border-gray-700 pb-4 mb-8">
          <h1 className="text-3xl font-bold text-orange-500">
            EdgeInsight Audit
          </h1>
          <p className="text-gray-400 mt-2">ID: {id}</p>
          <p className="text-gray-400">Repo: {data.repoUrl}</p>
        </header>

        {/* Verdict */}
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xl font-semibold">Verdict Score</h2>
            <span
              className={`text-4xl font-bold ${getScoreColor(data.verdict_score)}`}
            >
              {data.verdict_score || "N/A"}
            </span>
          </div>
          <p className="mt-4 text-gray-300 leading-relaxed">
            {data.summary || "No summary provided."}
          </p>
        </div>

        {/* Tech Stack */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-white">
              Tech Stack
            </h3>
            <div className="flex flex-wrap gap-2">
              {data.tech_stack?.map((tech) => (
                <span
                  key={tech}
                  className="px-3 py-1 bg-gray-700 rounded-full text-sm"
                >
                  {tech}
                </span>
              )) || <span className="text-gray-500">Unknown</span>}
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-white">
              Cloudflare Native?
            </h3>
            <div className="flex items-center space-x-2">
              <div
                className={`w-4 h-4 rounded-full ${data.cloudflare_native ? "bg-green-500" : "bg-red-500"}`}
              ></div>
              <span>
                {data.cloudflare_native
                  ? "Yes, Workers Detected"
                  : "No, Legacy/Other"}
              </span>
            </div>
          </div>
        </div>

        {/* Risks */}
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-white">
            Security Risks
          </h3>
          {data.security_risks && data.security_risks.length > 0 ? (
            <ul className="space-y-3">
              {data.security_risks.map((risk, idx) => (
                <li
                  key={idx}
                  className="bg-gray-900/50 p-4 rounded border-l-4 border-red-500"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-red-400 font-bold uppercase text-xs tracking-wider">
                      {risk.severity}
                    </span>
                    <span className="text-gray-500 text-xs font-mono">
                      {risk.file}
                    </span>
                  </div>
                  <p className="text-gray-300">{risk.description}</p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-green-500">
              No major security risks detected.
            </div>
          )}
        </div>

        {/* Raw JSON Debug (Optional but helpful for developer) */}
        <details className="pt-8">
          <summary className="cursor-pointer text-gray-500 hover:text-white">
            View Raw JSON
          </summary>
          <pre className="mt-4 bg-black p-4 rounded overflow-auto text-xs text-green-400">
            {JSON.stringify(data, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
}

function getScoreColor(score?: string) {
  if (!score) return "text-gray-500";
  if (score.startsWith("A")) return "text-green-500";
  if (score.startsWith("B")) return "text-blue-500";
  if (score.startsWith("C")) return "text-yellow-500";
  return "text-red-500";
}

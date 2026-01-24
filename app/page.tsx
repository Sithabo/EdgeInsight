"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { submitAudit } from "@/lib/api";

export default function Home() {
  const [repoUrl, setRepoUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const { auditId, status } = await submitAudit(repoUrl);

      // Navigate to the audit page
      router.push(`/audit/${auditId}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to start audit");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white font-sans">
      <main className="w-full max-w-xl p-8 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold tracking-tighter bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
            EdgeInsight
          </h1>
          <p className="text-gray-400 text-lg">
            Instant Codebase Audit & Security Analysis
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="repoUrl"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                GitHub Repository URL
              </label>
              <input
                id="repoUrl"
                type="text"
                placeholder="https://github.com/owner/repo"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm bg-red-900/20 p-3 rounded border border-red-900/50">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !repoUrl}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-3.5 rounded-lg transition-colors flex items-center justify-center"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                  Starting Analysis...
                </span>
              ) : (
                "Start Audit"
              )}
            </button>
          </form>
        </div>

        <div className="flex justify-center gap-6 text-gray-500 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span>Workers AI</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            <span>Durable Objects</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            <span>Workflows</span>
          </div>
        </div>
      </main>
    </div>
  );
}

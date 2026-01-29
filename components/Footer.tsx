"use client";

export default function Footer() {
  return (
    <footer className="w-full py-12 border-t border-white/5 relative z-10 bg-background-dark/80">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-2 opacity-50">
          <span className="material-symbols-outlined text-sm">cloud</span>
          <p className="text-sm font-medium uppercase tracking-widest">
            Built with Cloudflare Workers, Pages & Llama 3
          </p>
        </div>
        <div className="text-sm text-slate-600">
          © {new Date().getFullYear()} EdgeInsight. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

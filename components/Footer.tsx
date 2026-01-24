"use client";

export default function Footer() {
  return (
    <footer className="w-full py-12 border-t border-white/5 relative z-10 bg-background-dark/80">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-2 opacity-50">
          <span className="material-symbols-outlined text-sm">cloud</span>
          <p className="text-sm font-medium uppercase tracking-widest">
            Powered by Cloudflare Workers
          </p>
        </div>
        <div className="flex gap-8">
          <a
            className="text-sm text-slate-500 hover:text-white transition-colors"
            href="#"
          >
            Privacy Policy
          </a>
          <a
            className="text-sm text-slate-500 hover:text-white transition-colors"
            href="#"
          >
            Terms of Service
          </a>
          <a
            className="text-sm text-slate-500 hover:text-white transition-colors"
            href="#"
          >
            Security
          </a>
        </div>
        <div className="text-sm text-slate-600">
          © 2024 EdgeInsight AI. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

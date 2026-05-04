import React from "react";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30">
      {/* Hero Section */}
      <div className="relative overflow-hidden pt-32 pb-20 lg:pt-48 lg:pb-32">
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3">
          <div className="h-[400px] w-[400px] rounded-full bg-indigo-600/20 blur-[120px]"></div>
        </div>
        <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3">
          <div className="h-[400px] w-[400px] rounded-full bg-emerald-600/20 blur-[120px]"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700/50 text-sm font-medium text-slate-300 mb-8 backdrop-blur-sm">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400"></span>
            Next-Gen Insurance Platform
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8">
            The Intelligent Future of <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Insurance SaaS</span>
          </h1>
          <p className="max-w-2xl mx-auto text-xl text-slate-400 mb-10 leading-relaxed">
            Empowering <span className="text-slate-200 font-medium">insurance companies</span>, <span className="text-slate-200 font-medium">agents</span>, and <span className="text-slate-200 font-medium">clients</span> with AI. Streamline workflows, analyze data in real-time, and make smarter decisions.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button className="px-8 py-4 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white font-medium transition-all shadow-[0_0_40px_-10px_rgba(99,102,241,0.5)] hover:shadow-[0_0_60px_-15px_rgba(99,102,241,0.7)] hover:-translate-y-1">
              Start Free Trial
            </button>
            <button className="px-8 py-4 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium transition-all hover:-translate-y-1">
              Book a Demo
            </button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Risk Analysis */}
          <div className="group p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-indigo-500/50 transition-all backdrop-blur-sm hover:-translate-y-2 hover:shadow-[0_10px_40px_-15px_rgba(99,102,241,0.2)]">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-200 mb-3">AI Risk Analysis</h3>
            <p className="text-slate-400 leading-relaxed">
              Leverage machine learning models to accurately assess client risk profiles instantly, improving underwriting speed and accuracy.
            </p>
          </div>

          {/* Fraud Detection */}
          <div className="group p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-emerald-500/50 transition-all backdrop-blur-sm hover:-translate-y-2 hover:shadow-[0_10px_40px_-15px_rgba(16,185,129,0.2)]">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-200 mb-3">Fraud Detection</h3>
            <p className="text-slate-400 leading-relaxed">
              Identify suspicious claims patterns using advanced anomaly detection, saving millions for insurance companies automatically.
            </p>
          </div>

          {/* Product Recommendations */}
          <div className="group p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-cyan-500/50 transition-all backdrop-blur-sm hover:-translate-y-2 hover:shadow-[0_10px_40px_-15px_rgba(6,182,212,0.2)]">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-200 mb-3">Product Recommendations</h3>
            <p className="text-slate-400 leading-relaxed">
              Provide agents with smart, context-aware policy recommendations tailored to individual client needs and life events.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getProducts, InsuranceProduct } from "@/lib/api";

export default function Home() {
  const [products, setProducts] = useState<InsuranceProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProducts() {
      try {
        const data = await getProducts();
        setProducts(data);
      } catch (err) {
        setError("Failed to load products. Please ensure the backend is running.");
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

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
            <Link 
              href="/auth/sign-up"
              className="px-8 py-4 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white font-medium transition-all shadow-[0_0_40px_-10px_rgba(99,102,241,0.5)] hover:shadow-[0_0_60px_-15px_rgba(99,102,241,0.7)] hover:-translate-y-1 inline-flex items-center justify-center"
            >
              Start Free Trial
            </Link>
            <Link 
              href="/auth/sign-in"
              className="px-8 py-4 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium transition-all hover:-translate-y-1 inline-flex items-center justify-center"
            >
              Book a Demo
            </Link>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
        <h2 className="text-3xl font-bold text-center mb-4">Available Insurance Products</h2>
        <p className="text-center text-sm text-slate-500 mb-12 max-w-2xl mx-auto bg-slate-900/50 py-2 px-4 rounded-full border border-slate-800/80 backdrop-blur-sm">
          Select a product to get started with our AI-driven application process.
        </p>
        
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        )}

        {error && (
          <div className="p-6 bg-red-500/10 border border-red-500/50 rounded-2xl text-center text-red-400 max-w-2xl mx-auto backdrop-blur-sm">
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <div key={product.id} className="group p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-indigo-500/50 transition-all backdrop-blur-sm hover:-translate-y-2 hover:shadow-[0_10px_40px_-15px_rgba(99,102,241,0.2)] flex flex-col h-full">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-slate-800 text-xs font-medium text-indigo-300 border border-indigo-500/20 uppercase tracking-wider">
                    {product.type}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-200 mb-2">{product.name}</h3>
                <p className="text-sm font-medium text-emerald-400 mb-4">{product.company.name}</p>
                <p className="text-slate-400 leading-relaxed flex-grow">
                  {product.description || "No description provided."}
                </p>
                {product.basePremium > 0 ? (
                  <p className="text-emerald-400 text-sm font-bold mt-3">From ${product.basePremium}/month</p>
                ) : (
                  <p className="text-zinc-500 text-sm font-medium mt-3 italic">Contact for pricing</p>
                )}
                <div className="mt-6 pt-6 border-t border-slate-800/50">
                  <Link 
                    href="/auth/sign-in"
                    className="w-full py-3 px-4 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-medium transition-all shadow-[0_0_20px_-5px_rgba(99,102,241,0.4)] hover:shadow-[0_0_25px_-5px_rgba(99,102,241,0.6)] flex items-center justify-center gap-2"
                  >
                    Apply Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

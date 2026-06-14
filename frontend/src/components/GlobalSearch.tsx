'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, FileText, Activity, ShieldCheck, Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/formatDate';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type SearchResult = {
  id: string;
  type: 'application' | 'claim' | 'policy';
  title: string;
  subtitle: string;
  url: string;
};

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ applications: SearchResult[], claims: SearchResult[], policies: SearchResult[] }>({
    applications: [],
    claims: [],
    policies: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Handle Hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setResults({ applications: [], claims: [], policies: [] });
    }
  }, [isOpen]);

  // Handle Search Fetching
  useEffect(() => {
    if (!query.trim()) {
      setResults({ applications: [], claims: [], policies: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('access_token');
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        const role = user?.role?.toLowerCase() === 'agent' ? 'agent' : 'client';
        const baseRoute = `/dashboard/${role}`;

        if (!token) {
          setIsLoading(false);
          return;
        }

        const headers = { Authorization: `Bearer ${token}` };

        // Fetch data in parallel
        const [appRes, claimRes, polRes] = await Promise.all([
          fetch(`${API_BASE}/applications?limit=50`, { headers }).then(r => r.ok ? r.json() : { items: [] }),
          fetch(`${API_BASE}/claims?limit=50`, { headers }).then(r => r.ok ? r.json() : { items: [] }),
          fetch(`${API_BASE}/policies?limit=50`, { headers }).then(r => r.ok ? r.json() : { items: [] })
        ]);

        const appItems = appRes.items || [];
        const claimItems = claimRes.items || [];
        const polItems = polRes.items || [];

        const q = query.toLowerCase();

        const filteredApps: SearchResult[] = appItems
          .filter((a: any) => a.id.toLowerCase().startsWith(q) || a.product?.name?.toLowerCase().includes(q))
          .slice(0, 3)
          .map((a: any) => ({
            id: a.id,
            type: 'application',
            title: a.product?.name || 'Application',
            subtitle: `ID: ${a.id.substring(0, 8)} • ${formatDate(a.createdAt)}`,
            url: `${baseRoute}/applications/${a.id}`
          }));

        const filteredClaims: SearchResult[] = claimItems
          .filter((c: any) => c.id.toLowerCase().startsWith(q) || c.description?.toLowerCase().includes(q))
          .slice(0, 3)
          .map((c: any) => ({
            id: c.id,
            type: 'claim',
            title: 'Claim',
            subtitle: `ID: ${c.id.substring(0, 8)} • ${formatDate(c.createdAt)}`,
            url: `${baseRoute}/claims/${c.id}`
          }));

        const filteredPols: SearchResult[] = polItems
          .filter((p: any) => p.policyNumber?.toLowerCase().includes(q) || p.product?.name?.toLowerCase().includes(q))
          .slice(0, 3)
          .map((p: any) => ({
            id: p.id,
            type: 'policy',
            title: p.product?.name || 'Policy',
            subtitle: `Policy #: ${p.policyNumber} • ${formatDate(p.startDate)}`,
            url: `${baseRoute}/policies/${p.id}`
          }));

        setResults({ applications: filteredApps, claims: filteredClaims, policies: filteredPols });
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const totalResults = results.applications.length + results.claims.length + results.policies.length;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[80] flex items-start justify-center pt-[10vh] px-4">
      <div 
        className="absolute inset-0" 
        onClick={() => setIsOpen(false)} 
        aria-hidden="true" 
      />
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Search Input */}
        <div className="flex items-center px-4 border-b border-zinc-800 shrink-0 h-16">
          <Search className="h-5 w-5 text-zinc-500 mr-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search applications, claims, or policies..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none text-white focus:outline-none placeholder:text-zinc-500 text-lg"
          />
          {isLoading && <Loader2 className="h-5 w-5 text-amber-500 animate-spin" />}
          <div className="ml-3 px-2 py-1 bg-zinc-800 rounded text-[10px] font-mono font-bold text-zinc-500 uppercase">
            ESC
          </div>
        </div>

        {/* Results Body */}
        <div className="flex-1 max-h-[60vh] overflow-y-auto p-4 space-y-6">
          {!query.trim() ? (
            <div className="py-12 text-center text-zinc-500">
              <Search className="h-8 w-8 mx-auto mb-3 opacity-20" />
              <p>Type to search across your applications, claims, and policies.</p>
            </div>
          ) : totalResults === 0 && !isLoading ? (
            <div className="py-12 text-center text-zinc-500">
              <p>No matches for "{query}"</p>
            </div>
          ) : (
            <>
              {results.applications.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider px-2">Applications</h3>
                  {results.applications.map((res) => (
                    <Link
                      key={res.id}
                      href={res.url}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-800/50 transition-colors group"
                    >
                      <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/20 group-hover:border-amber-500/40">
                        <FileText className="h-5 w-5 text-amber-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white group-hover:text-amber-400 transition-colors">{res.title}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">{res.subtitle}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {results.claims.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider px-2">Claims</h3>
                  {results.claims.map((res) => (
                    <Link
                      key={res.id}
                      href={res.url}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-800/50 transition-colors group"
                    >
                      <div className="h-10 w-10 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0 border border-rose-500/20 group-hover:border-rose-500/40">
                        <Activity className="h-5 w-5 text-rose-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white group-hover:text-rose-400 transition-colors">{res.title}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">{res.subtitle}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {results.policies.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider px-2">Policies</h3>
                  {results.policies.map((res) => (
                    <Link
                      key={res.id}
                      href={res.url}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-800/50 transition-colors group"
                    >
                      <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20 group-hover:border-emerald-500/40">
                        <ShieldCheck className="h-5 w-5 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white group-hover:text-emerald-400 transition-colors">{res.title}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">{res.subtitle}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

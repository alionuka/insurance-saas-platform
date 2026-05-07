'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, UserSquare2, ShieldCheck, Settings, Bell, Search, Menu, ArrowLeft, LogOut } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  const isClient = pathname.startsWith('/dashboard/client');
  const isAgent = pathname.startsWith('/dashboard/agent');
  const isCompany = pathname.startsWith('/dashboard/company');
  const isAdmin = pathname.startsWith('/dashboard/admin');
  const isHome = pathname === '/dashboard' || pathname === '/dashboard/';

  let roleLabel = '';
  let rolePath = '/dashboard';

  if (isClient) {
    roleLabel = 'Client Portal';
    rolePath = '/dashboard/client';
  } else if (isAgent) {
    roleLabel = 'Agent Portal';
    rolePath = '/dashboard/agent';
  } else if (isCompany) {
    roleLabel = 'Company Admin';
    rolePath = '/dashboard/company';
  } else if (isAdmin) {
    roleLabel = 'Platform Admin';
    rolePath = '/dashboard/admin';
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col border-r border-zinc-800 bg-zinc-950">
        <div className="h-16 flex items-center px-6 border-b border-zinc-800">
          <ShieldCheck className="h-6 w-6 text-indigo-500 mr-2" />
          <span className="text-xl font-semibold tracking-tight text-white">InsurSaaS</span>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="px-3 space-y-1">
            {!isHome ? (
              <>
                <div className="px-3 mb-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  Active Session: {roleLabel}
                </div>
                <Link 
                  href={rolePath} 
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors group ${
                    pathname === rolePath ? 'bg-indigo-500/10 text-indigo-400' : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                  }`}
                >
                  <LayoutDashboard className={`mr-3 h-5 w-5 ${pathname === rolePath ? 'text-indigo-400' : 'text-zinc-400 group-hover:text-indigo-400'}`} />
                  Main Dashboard
                </Link>
                
                <div className="my-6 border-t border-zinc-800/50 mx-3"></div>
                
                <Link 
                  href="/dashboard" 
                  className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors group"
                >
                  <ArrowLeft className="mr-3 h-5 w-5 text-zinc-500 group-hover:text-zinc-300" />
                  Back to Demo Home
                </Link>
              </>
            ) : (
              <div className="px-4 py-6">
                <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-center">
                  <p className="text-xs text-zinc-500 leading-relaxed italic">
                    Welcome to the InsurSaaS Demo. Select a role from the entry page to view specialized dashboards.
                  </p>
                </div>
              </div>
            )}
          </nav>
        </div>
        
        <div className="p-4 border-t border-zinc-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-indigo-400">
                DU
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white line-clamp-1">Demo User</p>
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-tighter">Read-Only</p>
              </div>
            </div>
            {!isHome && (
              <Link href="/dashboard" title="Exit Session">
                <LogOut className="h-4 w-4 text-zinc-600 hover:text-rose-400 transition-colors" />
              </Link>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-zinc-800 bg-zinc-950">
          <div className="flex items-center">
            <button className="text-zinc-400 hover:text-white md:hidden">
              <Menu className="h-6 w-6" />
            </button>
            <div className="ml-4 md:ml-0 relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500" />
              <input 
                type="text" 
                placeholder="Search resources..." 
                className="w-full md:w-64 pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-zinc-500"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="text-zinc-400 hover:text-white relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-indigo-500 ring-2 ring-zinc-950"></span>
            </button>
            <div className="h-8 w-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sm text-zinc-300">
              ?
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-zinc-950 p-6">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}


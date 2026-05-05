import Link from 'next/link';
import { LayoutDashboard, Users, UserSquare2, ShieldCheck, Settings, Bell, Search, Menu } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
            <div className="px-3 mb-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Overview
            </div>
            <Link href="/dashboard" className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-zinc-800 hover:text-white group text-zinc-300">
              <LayoutDashboard className="mr-3 h-5 w-5 text-zinc-400 group-hover:text-indigo-400" />
              Main Dashboard
            </Link>
            
            <div className="px-3 mt-6 mb-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Demo Role Switcher
              <span className="block mt-1 text-[10px] text-yellow-500/80 normal-case">(Authentication pending)</span>
            </div>
            
            <Link href="/dashboard/client" className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-zinc-800 hover:text-white group text-zinc-300">
              <UserSquare2 className="mr-3 h-5 w-5 text-zinc-400 group-hover:text-indigo-400" />
              Client View
            </Link>
            
            <Link href="/dashboard/agent" className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-zinc-800 hover:text-white group text-zinc-300">
              <Users className="mr-3 h-5 w-5 text-zinc-400 group-hover:text-indigo-400" />
              Agent View
            </Link>
            
            <Link href="/dashboard/company" className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-zinc-800 hover:text-white group text-zinc-300">
              <Settings className="mr-3 h-5 w-5 text-zinc-400 group-hover:text-indigo-400" />
              Company View
            </Link>
            
            <Link href="/dashboard/admin" className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-zinc-800 hover:text-white group text-zinc-300">
              <ShieldCheck className="mr-3 h-5 w-5 text-zinc-400 group-hover:text-indigo-400" />
              Admin View
            </Link>
          </nav>
        </div>
        
        <div className="p-4 border-t border-zinc-800">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center text-sm font-medium text-white">
              JD
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">Demo User</p>
              <p className="text-xs text-zinc-400">View Only Mode</p>
            </div>
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

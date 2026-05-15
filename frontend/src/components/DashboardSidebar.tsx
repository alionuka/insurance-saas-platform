'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  FileText, 
  Activity, 
  Calculator, 
  Sparkles,
  BarChart3,
  Package,
  Users,
  ScrollText,
  LogOut,
} from 'lucide-react';
import { logout } from '@/lib/auth';

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
};

const CUSTOMER_NAV: NavItem[] = [
  { href: '/dashboard/client', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/client/applications', label: 'Applications', icon: FileText },
  { href: '/dashboard/client/policies', label: 'Policies', icon: ShieldCheck },
  { href: '/dashboard/client/claims', label: 'Claims', icon: Activity },
  { href: '/dashboard/client/quote', label: 'Get a Quote', icon: Calculator },
  { href: '/dashboard/client/recommendations', label: 'For You', icon: Sparkles },
];

const AGENT_NAV: NavItem[] = [
  { href: '/dashboard/agent', label: 'Workspace', icon: LayoutDashboard },
];

const COMPANY_ADMIN_NAV: NavItem[] = [
  { href: '/dashboard/company', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/company/products', label: 'Products', icon: Package },
];

const PLATFORM_ADMIN_NAV: NavItem[] = [
  { href: '/dashboard/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/admin/users', label: 'Users', icon: Users },
  { href: '/dashboard/admin/audit-logs', label: 'Audit Log', icon: ScrollText },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<{ firstName: string; lastName: string; email: string; role: string } | null>(null);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error('Failed to parse user from localStorage', e);
    }
  }, []);

  const getInitials = () => {
    if (!user) return 'DU';
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'U';
  };

  const navItems = user?.role === 'CUSTOMER' ? CUSTOMER_NAV
                 : user?.role === 'AGENT' ? AGENT_NAV
                 : user?.role === 'COMPANY_ADMIN' ? COMPANY_ADMIN_NAV
                 : user?.role === 'PLATFORM_ADMIN' ? PLATFORM_ADMIN_NAV
                 : [];

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 flex flex-col bg-zinc-950 border-r border-zinc-800 z-50">
      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b border-zinc-800 shrink-0">
        <ShieldCheck className="h-6 w-6 text-indigo-500 mr-2 shrink-0" />
        <span className="text-xl font-semibold tracking-tight text-white">InsurSaaS</span>
      </div>
      
      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6">
        <nav className="px-3 space-y-1.5">
          {navItems.map((item) => {
            const isActive = item.href === '/dashboard/client' || item.href === '/dashboard/agent' || item.href === '/dashboard/company' || item.href === '/dashboard/admin' 
              ? pathname === item.href
              : pathname.startsWith(item.href);

            const Icon = item.icon;

            return (
              <Link 
                key={item.href}
                href={item.href} 
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors relative ${
                  isActive 
                    ? 'bg-indigo-500/10 text-indigo-400' 
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-indigo-500 rounded-r-full" />
                )}
                <Icon className={`mr-3 h-5 w-5 shrink-0 ${isActive ? 'text-indigo-400' : 'text-zinc-500'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      
      {/* User Info & Logout */}
      <div className="p-4 border-t border-zinc-800 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center min-w-0 pr-3">
            <div className="h-9 w-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-indigo-400 shrink-0">
              {getInitials()}
            </div>
            <div className="ml-3 truncate">
              <p className="text-sm font-medium text-white truncate">
                {user ? `${user.firstName} ${user.lastName}` : 'Demo User'}
              </p>
              <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-tighter truncate">
                {user ? user.role.replace('_', ' ') : 'Read-Only'}
              </p>
            </div>
          </div>
          <button 
            onClick={() => {
              logout();
              window.location.href = '/auth/sign-in';
            }}
            className="text-zinc-500 hover:text-rose-400 transition-colors p-1.5 rounded-md hover:bg-rose-500/10 shrink-0"
            title="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

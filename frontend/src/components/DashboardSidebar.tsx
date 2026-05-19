'use client';

import { useState, useEffect, useMemo } from 'react';
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
  UserCircle,
  Building2,
  Menu,
  Search,
  Brain,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { logout } from '@/lib/auth';
import NotificationsBell from '@/components/NotificationsBell';
import GlobalSearch from '@/components/GlobalSearch';
import { useT } from '@/i18n/LocaleProvider';
import LocaleSwitcher from '@/i18n/LocaleSwitcher';

type NavItem = {
  href: string;
  labelKey: string;
  icon: React.ElementType;
};

const CUSTOMER_NAV: NavItem[] = [
  { href: '/dashboard/client', labelKey: 'sidebar.nav.overview', icon: LayoutDashboard },
  { href: '/dashboard/client/applications', labelKey: 'sidebar.nav.applications', icon: FileText },
  { href: '/dashboard/client/policies', labelKey: 'sidebar.nav.policies', icon: ShieldCheck },
  { href: '/dashboard/client/claims', labelKey: 'sidebar.nav.claims', icon: Activity },
  { href: '/dashboard/client/products', labelKey: 'sidebar.nav.browseProducts', icon: Package },
  { href: '/dashboard/client/quote', labelKey: 'sidebar.nav.getQuote', icon: Calculator },
  { href: '/dashboard/client/recommendations', labelKey: 'sidebar.nav.forYou', icon: Sparkles },
  { href: '/dashboard/profile', labelKey: 'sidebar.nav.profile', icon: UserCircle },
];

const AGENT_NAV: NavItem[] = [
  { href: '/dashboard/agent', labelKey: 'sidebar.nav.overview', icon: LayoutDashboard },
  { href: '/dashboard/agent/applications', labelKey: 'sidebar.nav.applications', icon: FileText },
  { href: '/dashboard/agent/claims', labelKey: 'sidebar.nav.claims', icon: Activity },
  { href: '/dashboard/profile', labelKey: 'sidebar.nav.profile', icon: UserCircle },
];

const COMPANY_ADMIN_NAV: NavItem[] = [
  { href: '/dashboard/company', labelKey: 'sidebar.nav.analytics', icon: BarChart3 },
  { href: '/dashboard/company/products', labelKey: 'sidebar.nav.products', icon: Package },
  { href: '/dashboard/company/policies', labelKey: 'sidebar.nav.policies', icon: ShieldCheck },
  { href: '/dashboard/company/claims', labelKey: 'sidebar.nav.claims', icon: Activity },
  { href: '/dashboard/company/settings', labelKey: 'sidebar.nav.settings', icon: Palette },
  { href: '/dashboard/profile', labelKey: 'sidebar.nav.profile', icon: UserCircle },
];

const PLATFORM_ADMIN_NAV: NavItem[] = [
  { href: '/dashboard/admin', labelKey: 'sidebar.nav.overview', icon: LayoutDashboard },
  { href: '/dashboard/admin/companies', labelKey: 'sidebar.nav.companies', icon: Building2 },
  { href: '/dashboard/admin/users', labelKey: 'sidebar.nav.users', icon: Users },
  { href: '/dashboard/admin/audit-logs', labelKey: 'sidebar.nav.auditLog', icon: ScrollText },
  { href: '/dashboard/admin/ml-models', labelKey: 'sidebar.nav.mlModels', icon: Brain },
  { href: '/dashboard/profile', labelKey: 'sidebar.nav.profile', icon: UserCircle },
];

const COLLAPSE_KEY = 'sidebar_collapsed_v1';
const EXPANDED_WIDTH = '15rem'; // 240px — original size, matches md:ml-60
const COLLAPSED_WIDTH = '4rem'; //  64px — icon-only rail

export default function DashboardSidebar() {
  const pathname = usePathname();
  const { t } = useT();
  const [user, setUser] = useState<{ firstName: string; lastName: string; email: string; role: string } | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  // Collapsed state — persisted in localStorage so it survives reloads.
  // We start with `null` instead of a default to avoid the initial flash
  // when the saved state differs from the default.
  const [collapsed, setCollapsed] = useState<boolean | null>(null);

  // Hydrate user from localStorage and collapsed preference on mount.
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      const storedCollapsed = localStorage.getItem(COLLAPSE_KEY);
      setCollapsed(storedCollapsed === 'true');
    } catch (e) {
      console.error('Failed to read sidebar state', e);
      setCollapsed(false);
    }
  }, []);

  // Sync CSS variable so the page's main content can shift its left margin
  // in tandem with the sidebar. Defined at :root so any descendent can read
  // var(--sidebar-width).
  useEffect(() => {
    if (collapsed === null) return;
    document.documentElement.style.setProperty(
      '--sidebar-width',
      collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH,
    );
  }, [collapsed]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSE_KEY, String(next));
      } catch {
        // ignore storage quota / private-mode errors
      }
      return next;
    });
  };

  const getInitials = () => {
    if (!user) return 'DU';
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'U';
  };

  const navItems = useMemo(() => {
    return user?.role === 'CUSTOMER' ? CUSTOMER_NAV
         : user?.role === 'AGENT' ? AGENT_NAV
         : user?.role === 'COMPANY_ADMIN' ? COMPANY_ADMIN_NAV
         : user?.role === 'PLATFORM_ADMIN' ? PLATFORM_ADMIN_NAV
         : [];
  }, [user?.role]);

  // Treat null (not yet hydrated) as expanded so first paint matches
  // the default --sidebar-width.
  const isCollapsed = collapsed === true;

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 shadow-lg"
        aria-label="Open sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Drawer */}
      {/* On desktop width animates between collapsed (4rem) and expanded
          (15rem). On mobile we always render at 18rem drawer width and
          ignore the collapsed flag — drawer pattern doesn't need a
          collapsed mode. */}
      <aside
        className={`fixed inset-y-0 left-0 w-72 flex flex-col bg-zinc-950 border-r border-zinc-800 z-50 transform transition-all duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${isCollapsed ? 'md:w-16' : 'md:w-60'}`}
      >
        {/* Brand + header tools */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-800 shrink-0">
          <div className={`flex items-center min-w-0 ${isCollapsed ? 'md:justify-center md:w-full' : ''}`}>
            <ShieldCheck className="h-6 w-6 text-indigo-500 shrink-0" />
            <span
              className={`text-xl font-semibold tracking-tight text-white truncate transition-opacity ${
                isCollapsed ? 'md:hidden ml-2' : 'ml-2 md:block'
              }`}
            >
              {t('sidebar.brand')}
            </span>
          </div>

          {/* Header tools — locale switcher moved to footer. Hidden in
              collapsed mode to free the cramped 4rem rail. */}
          <div className={`items-center gap-2 ${isCollapsed ? 'hidden' : 'flex'}`}>
            <button
              data-tour="global-search"
              onClick={() => {
                const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
                window.dispatchEvent(event);
              }}
              className="flex items-center gap-2 text-xs text-zinc-500 hover:text-white border border-zinc-800 rounded-md px-2 py-1 transition-colors"
              title={`${t('sidebar.search')} (⌘K)`}
            >
              <Search className="h-3.5 w-3.5" />
              <kbd className="font-mono bg-zinc-800 px-1 rounded text-[9px] font-bold hidden xl:inline">⌘K</kbd>
            </button>
            <div data-tour="notifications">
              <NotificationsBell />
            </div>
          </div>
        </div>

        {/* Collapsed-only icon rail: search + bell stacked vertically so
            users keep access without expanding. */}
        {isCollapsed && (
          <div className="hidden md:flex flex-col items-center gap-2 py-3 border-b border-zinc-800/60 shrink-0">
            <button
              onClick={() => {
                const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
                window.dispatchEvent(event);
              }}
              className="p-2 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors"
              title={`${t('sidebar.search')} (⌘K)`}
            >
              <Search className="h-4 w-4" />
            </button>
            <div title={t('sidebar.brand')}>
              <NotificationsBell />
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-6">
          <nav
            data-tour="sidebar-nav"
            className={`space-y-1.5 ${isCollapsed ? 'md:px-2' : 'px-3'}`}
          >
            {navItems.map((item) => {
              const isActive = item.href === '/dashboard/client' || item.href === '/dashboard/agent' || item.href === '/dashboard/company' || item.href === '/dashboard/admin'
                ? pathname === item.href
                : pathname.startsWith(item.href);

              const Icon = item.icon;
              const label = t(item.labelKey);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  title={isCollapsed ? label : undefined}
                  className={`flex items-center text-sm font-medium rounded-lg transition-colors relative ${
                    isCollapsed
                      ? 'md:justify-center md:px-0 md:py-2.5 px-3 py-2'
                      : 'px-3 py-2'
                  } ${
                    isActive
                      ? 'bg-indigo-500/10 text-indigo-400'
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                  }`}
                >
                  {isActive && !isCollapsed && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-indigo-500 rounded-r-full" />
                  )}
                  <Icon
                    className={`h-5 w-5 shrink-0 ${isActive ? 'text-indigo-400' : 'text-zinc-500'} ${
                      isCollapsed ? 'md:mr-0 mr-3' : 'mr-3'
                    }`}
                  />
                  <span className={isCollapsed ? 'md:hidden' : ''}>{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Info & Footer controls */}
        <div className="p-3 border-t border-zinc-800 shrink-0">
          {isCollapsed ? (
            // Collapsed footer — just avatar (with name tooltip), locale,
            // logout. Stacked vertically to fit the 4rem rail.
            <div className="hidden md:flex flex-col items-center gap-2">
              <div
                className="h-9 w-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-indigo-400"
                title={user ? `${user.firstName} ${user.lastName}` : 'Demo User'}
              >
                {getInitials()}
              </div>
              <LocaleSwitcher variant="nav" />
              <button
                onClick={() => {
                  logout();
                  window.location.href = '/auth/sign-in';
                }}
                className="text-zinc-500 hover:text-rose-400 transition-colors p-1.5 rounded-md hover:bg-rose-500/10"
                title={t('sidebar.signOutTitle')}
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            // Expanded footer — original horizontal layout with name/role
            // and logout pinned right.
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
                    {user ? user.role.replace('_', ' ') : t('sidebar.readonlyRole')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <LocaleSwitcher variant="nav" />
                <button
                  onClick={() => {
                    logout();
                    window.location.href = '/auth/sign-in';
                  }}
                  className="text-zinc-500 hover:text-rose-400 transition-colors p-1.5 rounded-md hover:bg-rose-500/10"
                  title={t('sidebar.signOutTitle')}
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Collapse toggle — desktop only. Sits at the bottom of the
              sidebar separator so it doesn't compete with primary controls. */}
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isCollapsed ? 'Expand' : 'Collapse'}
            className="hidden md:flex w-full mt-3 items-center justify-center gap-2 text-[10px] uppercase tracking-widest font-bold text-zinc-600 hover:text-zinc-300 hover:bg-zinc-900/60 rounded-md py-1.5 transition-colors"
          >
            {isCollapsed ? (
              <PanelLeftOpen className="h-3.5 w-3.5" />
            ) : (
              <>
                <PanelLeftClose className="h-3.5 w-3.5" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>

      <GlobalSearch />
    </>
  );
}

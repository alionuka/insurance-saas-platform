'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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

// Resizable sidebar — user drags the right edge to change width.
// Width is persisted to localStorage so it survives reloads.
const WIDTH_KEY = 'sidebar_width_px_v1';
const DEFAULT_WIDTH = 240; // 15rem — original baseline
const MIN_WIDTH = 180; //     11.25rem — narrowest before labels truncate
const MAX_WIDTH = 420; //     26.25rem — widest before main content feels squashed

export default function DashboardSidebar() {
  const pathname = usePathname();
  const { t } = useT();
  const [user, setUser] = useState<{ firstName: string; lastName: string; email: string; role: string; avatarUrl?: string | null } | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  // null until hydrated to avoid SSR mismatch
  const [width, setWidth] = useState<number | null>(null);
  const isResizingRef = useRef(false);

  // Hydrate user + saved width on mount.
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) setUser(JSON.parse(storedUser));

      const storedWidth = Number(localStorage.getItem(WIDTH_KEY));
      if (
        Number.isFinite(storedWidth) &&
        storedWidth >= MIN_WIDTH &&
        storedWidth <= MAX_WIDTH
      ) {
        setWidth(storedWidth);
      } else {
        setWidth(DEFAULT_WIDTH);
      }
    } catch (e) {
      console.error('Failed to hydrate sidebar state', e);
      setWidth(DEFAULT_WIDTH);
    }
  }, []);

  useEffect(() => {
    const handleUserUpdate = () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to update sidebar user', e);
      }
    };
    window.addEventListener('user-updated', handleUserUpdate);
    return () => window.removeEventListener('user-updated', handleUserUpdate);
  }, []);

  // Mirror width into a CSS variable so the page's main content margin can
  // track it without React re-renders. Defined on :root so any descendant
  // can read `var(--sidebar-width)`.
  useEffect(() => {
    if (width === null) return;
    document.documentElement.style.setProperty(
      '--sidebar-width',
      `${width}px`,
    );
  }, [width]);

  // Drag handlers — bound to document while dragging so the cursor doesn't
  // need to stay perfectly inside the 4px handle.
  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    // Visual feedback: disable text selection while dragging.
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return;
      const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, e.clientX));
      setWidth(next);
    };
    const onMouseUp = () => {
      if (!isResizingRef.current) return;
      isResizingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      // Persist final width (read latest from CSS var to avoid stale closure).
      const cssWidth = document.documentElement.style.getPropertyValue(
        '--sidebar-width',
      );
      const parsed = parseInt(cssWidth, 10);
      if (Number.isFinite(parsed)) {
        try {
          localStorage.setItem(WIDTH_KEY, String(parsed));
        } catch {
          // ignore quota / private-mode errors
        }
      }
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  // Double-click on the handle = reset to default width. Common UX in
  // VS Code, Notion, etc.
  const resetWidth = useCallback(() => {
    setWidth(DEFAULT_WIDTH);
    try {
      localStorage.setItem(WIDTH_KEY, String(DEFAULT_WIDTH));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  const sidebarStyle: React.CSSProperties =
    width !== null ? { width: `${width}px` } : {};

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

      {/* Sidebar Drawer.
          Width is set inline via the user's drag. On mobile we ignore that
          and use the fixed w-72 drawer pattern. */}
      <aside
        style={sidebarStyle}
        className={`fixed inset-y-0 left-0 w-72 flex flex-col bg-zinc-950 border-r border-zinc-800 z-50 transform transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand + header tools */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-800 shrink-0">
          <div className="flex items-center min-w-0">
            <ShieldCheck className="h-6 w-6 text-amber-500 mr-2 shrink-0" />
            <span className="text-xl font-semibold tracking-tight text-white truncate hidden md:block">
              {t('sidebar.brand')}
            </span>
          </div>

          {/* Header tools — locale switcher moved to footer to free crowding here. */}
          <div className="flex items-center gap-2">
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

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-6">
          <nav data-tour="sidebar-nav" className="px-3 space-y-1.5">
            {navItems.map((item) => {
              const isActive = item.href === '/dashboard/client' || item.href === '/dashboard/agent' || item.href === '/dashboard/company' || item.href === '/dashboard/admin'
                ? pathname === item.href
                : pathname.startsWith(item.href);

              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors relative ${
                    isActive
                      ? 'bg-amber-500/10 text-amber-400'
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                  }`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-amber-500 rounded-r-full" />
                  )}
                  <Icon className={`mr-3 h-5 w-5 shrink-0 ${isActive ? 'text-amber-400' : 'text-zinc-500'}`} />
                  <span className="truncate">{t(item.labelKey)}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-zinc-800 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center min-w-0 pr-3">
              <div className="h-9 w-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden text-xs font-bold text-amber-400 shrink-0">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={`${user.firstName} ${user.lastName}`}
                    className="h-full w-full object-cover rounded-full"
                  />
                ) : (
                  getInitials()
                )}
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
        </div>

        {/* Drag-to-resize handle — invisible 4px strip on the right edge.
            Hover reveals a subtle amber line so the affordance is
            discoverable. Double-click resets to default width. Desktop
            only — mobile uses the drawer pattern. */}
        <div
          onMouseDown={startResizing}
          onDoubleClick={resetWidth}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize sidebar (drag, double-click to reset)"
          title="Drag to resize · double-click to reset"
          className="hidden md:block absolute top-0 right-0 h-full w-1.5 cursor-col-resize group z-[60]"
        >
          {/* Visible accent on hover */}
          <div className="absolute inset-y-0 right-0 w-px bg-zinc-800 group-hover:bg-amber-500 group-hover:w-0.5 transition-all" />
        </div>
      </aside>

      <GlobalSearch />
    </>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, ShieldCheck, FileText, CreditCard, Activity, ShieldAlert, BookOpen } from 'lucide-react';
import { formatDate } from '@/lib/formatDate';
import { logout } from '@/lib/auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type AuditLog = {
  id: string;
  action: string;
  resourceType: string | null;
  createdAt: string;
};

export default function NotificationsBell() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchLogs() {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) return;
        
        const res = await fetch(`${API_BASE}/audit-logs/me?limit=10`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.status === 401) {
          logout();
          window.location.href = '/auth/sign-in';
          return;
        }
        
        if (!res.ok) return;
        
        const data = await res.json();
        const fetchedLogs = data.items || [];
        
        if (isMounted) {
          setLogs(fetchedLogs);
          const lastSeenStr = localStorage.getItem('notifications_last_seen');
          const lastSeen = lastSeenStr ? new Date(lastSeenStr).getTime() : 0;
          
          const unread = fetchedLogs.filter((log: AuditLog) => new Date(log.createdAt).getTime() > lastSeen).length;
          setUnreadCount(unread);
        }
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    }
    
    fetchLogs();
    
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAllAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    localStorage.setItem('notifications_last_seen', new Date().toISOString());
    setUnreadCount(0);
  };

  const getIconForResource = (resourceType: string | null, action: string) => {
    const type = resourceType?.toLowerCase() || '';
    const act = action.toLowerCase();
    
    if (act.includes('auth') || act.includes('login')) {
      return <ShieldCheck className="h-4 w-4 text-blue-700" />;
    }
    if (type.includes('application') || type.includes('claim')) {
      return <Activity className="h-4 w-4 text-blue-700" />;
    }
    if (type.includes('payment') || act.includes('payment')) {
      return <CreditCard className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />;
    }
    if (type.includes('policy')) {
      return <BookOpen className="h-4 w-4 text-blue-700" />;
    }
    if (type.includes('document')) {
      return <FileText className="h-4 w-4 text-slate-600 dark:text-slate-400" />;
    }
    return <ShieldAlert className="h-4 w-4 text-slate-600 dark:text-slate-400" />;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-slate-900 dark:text-slate-100 shadow-sm ring-2 ring-zinc-950">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 max-h-[500px] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-[60] flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 shrink-0 sticky top-0 bg-white dark:bg-slate-900/95 backdrop-blur z-10">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllAsRead}
                className="text-xs text-blue-700 hover:text-blue-600 transition-colors font-medium"
              >
                Mark all as read
              </button>
            )}
          </div>
          
          <div className="flex-1 divide-y divide-zinc-800/50">
            {logs.length > 0 ? (
              logs.map((log) => (
                <div key={log.id} className="px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-800/30 transition-colors flex items-start gap-3">
                  <div className="mt-0.5 h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center shrink-0 border border-slate-300 dark:border-slate-700/50">
                    {getIconForResource(log.resourceType, log.action)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate" title={log.action}>
                      {log.action}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 uppercase tracking-wider font-medium">
                      {formatDate(log.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
                <Bell className="h-8 w-8 mb-2 opacity-20" />
                <p className="text-sm">No activity yet.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Download, Trash2, AlertTriangle, Loader2, ShieldAlert } from 'lucide-react';
import { logout } from '@/lib/auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function GdprPanel() {
  const router = useRouter();
  const [exporting, setExporting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) {
      logout();
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/auth/me/export`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error('Export failed');
      }
      // Trigger file download
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `insursaas-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Data export downloaded', {
        description: 'Your personal data has been saved to your downloads folder.',
      });
    } catch (err: any) {
      toast.error('Export failed', { description: err.message });
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletePassword || deleting) return;
    setDeleting(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) {
      logout();
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: deletePassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Deletion failed');
      }
      toast.success('Account permanently deleted', {
        description: 'All your personal data has been removed.',
      });
      // Clear local session and redirect to landing
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      document.cookie = 'access_token=; path=/; max-age=0';
      router.push('/');
    } catch (err: any) {
      toast.error('Deletion failed', { description: err.message });
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-blue-700" />
          Privacy & Data Rights
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          GDPR-compliant data portability and erasure. You control your personal data at all times.
        </p>

        <div className="space-y-4">
          {/* Export */}
          <div className="bg-slate-50 dark:bg-[#060b1a]/50 border border-slate-200 dark:border-slate-800 rounded-lg p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Export your data</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Download a JSON file with all personal data we hold — profile, applications, policies, claims, payments, audit log. <span className="text-slate-600 dark:text-slate-400 italic">Article 20 — right to data portability.</span>
                </p>
              </div>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-zinc-700 disabled:opacity-50 rounded-lg transition-colors"
              >
                {exporting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                Export
              </button>
            </div>
          </div>

          {/* Delete */}
          <div className="bg-rose-500/5 border border-rose-500/20 rounded-lg p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-sm font-bold text-rose-300">Delete account</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  Permanently delete your account and all linked data. This cannot be undone. <span className="text-slate-600 dark:text-slate-400 italic">Article 17 — right to erasure.</span>
                </p>
              </div>
              <button
                onClick={() => setShowDeleteDialog(true)}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      {showDeleteDialog && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 "
          onClick={() => !deleting && setShowDeleteDialog(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-rose-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-rose-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-rose-700 dark:text-rose-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Delete account permanently?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
              All your applications, policies, claims, and payment history will be permanently removed.
              Confirm with your current password.
            </p>

            <input
              type="password"
              autoFocus
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Current password"
              className="w-full bg-slate-50 dark:bg-[#060b1a] border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-rose-500 mb-4"
              disabled={deleting}
            />

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowDeleteDialog(false)}
                disabled={deleting}
                className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-zinc-700 disabled:opacity-50 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={!deletePassword || deleting}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Deleting…
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    Permanently delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

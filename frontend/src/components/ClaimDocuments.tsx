'use client';

import { useState, useEffect, useCallback } from 'react';
import { FileText, Upload, X, Loader2, Download, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '@/lib/formatDate';
import { logout } from '@/lib/auth';

interface ClaimDocument {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
  uploadedById: string;
  uploadedBy: {
    firstName: string;
    lastName: string;
  };
}

interface ClaimDocumentsProps {
  claimId: string;
  canUpload: boolean;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function ClaimDocuments({ claimId, canUpload }: ClaimDocumentsProps) {
  const [documents, setDocuments] = useState<ClaimDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Wrapped in useCallback so the useEffect deps array stays stable; before
  // this was an arrow function declared AFTER useEffect — fine at runtime
  // (effects run post-render) but a temporal-dead-zone reference flagged by
  // the React 19 ESLint rule.
  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/claims/${claimId}/documents`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (res.status === 401) {
        logout();
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch documents');
      const data = await res.json();
      setDocuments(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  }, [claimId]);

  useEffect(() => {
    void fetchDocuments();
    // Hydrate current user ID from the JWT so we can later show "your upload"
    // vs "another user's upload" affordances. Read once on mount.
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserId(payload.sub);
      } catch (e) {
        console.error('Failed to parse token payload', e);
      }
    }
  }, [claimId, fetchDocuments]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_BASE}/claims/${claimId}/documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (res.status === 401) {
        logout();
        return;
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      const newDoc = await res.json();
      setDocuments((prev) => [newDoc, ...prev]);
      toast.success('Document uploaded');
      // Reset input
      e.target.value = '';
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    toast('Delete this document?', {
      action: {
        label: 'Delete',
        onClick: async () => {
          const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
          try {
            const res = await fetch(`${API_BASE}/claims/${claimId}/documents/${docId}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });

            if (res.status === 401) {
              logout();
              return;
            }

            if (!res.ok) throw new Error('Delete failed');
            setDocuments((prev) => prev.filter((d) => d.id !== docId));
            toast.success('Document deleted');
          } catch (err: any) {
            toast.error(err.message);
          }
        }
      },
      cancel: {
        label: 'Cancel',
        onClick: () => {}
      }
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="p-4 bg-zinc-950/50 border border-zinc-800 rounded-lg mt-2 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-zinc-300 uppercase tracking-tight flex items-center gap-2">
          <FileText className="h-4 w-4 text-blue-400" />
          Supporting Documents
        </h4>
        {canUpload && (
          <label className="cursor-pointer bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold uppercase py-1.5 px-3 rounded flex items-center gap-2 transition-colors disabled:opacity-50">
            {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
            Upload File
            <input
              type="file"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
              accept="image/jpeg,image/png,image/webp,application/pdf"
            />
          </label>
        )}
      </div>



      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-6 w-6 text-zinc-600 animate-spin" />
        </div>
      ) : documents.length > 0 ? (
        <div className="grid gap-2">
          {documents.map((doc) => (
            <div key={doc.id} className="group flex items-center justify-between p-2.5 bg-zinc-900 border border-zinc-800 rounded hover:border-zinc-700 transition-colors">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="h-8 w-8 rounded bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-700">
                  <FileText className="h-4 w-4 text-zinc-400" />
                </div>
                <div className="overflow-hidden">
                  <a 
                    href={doc.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-white hover:text-blue-400 transition-colors truncate block max-w-xs flex items-center gap-2"
                  >
                    {doc.filename}
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                  <p className="text-[10px] text-zinc-500">
                    {formatSize(doc.sizeBytes)} • {doc.mimeType.split('/')[1].toUpperCase()} • {formatDate(doc.uploadedAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {canUpload && currentUserId === doc.uploadedById && (
                  <button 
                    onClick={() => handleDelete(doc.id)}
                    className="p-1.5 text-zinc-500 hover:text-rose-400 transition-colors"
                    title="Delete document"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <a 
                  href={doc.url} 
                  download 
                  className="p-1.5 text-zinc-500 hover:text-white transition-colors"
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center border border-zinc-800 border-dashed rounded text-zinc-500 text-xs italic">
          No documents uploaded yet.
        </div>
      )}
    </div>
  );
}

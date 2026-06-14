'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Upload, Save } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Props {
  initialValues: {
    name: string;
    description: string;
    primaryColor: string;
    logoUrl: string | null;
  };
}

/**
 * COMPANY_ADMIN-facing branding editor. Two independent operations:
 * - PATCH /companies/me updates display fields (name, description, color).
 * - POST /companies/me/logo uploads a logo file separately so we can keep
 *   the JSON PATCH lightweight and the file upload streamed.
 */
export default function CompanyBrandingForm({ initialValues }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(initialValues.name);
  const [description, setDescription] = useState(initialValues.description);
  const [primaryColor, setPrimaryColor] = useState(initialValues.primaryColor);
  const [logoUrl, setLogoUrl] = useState<string | null>(initialValues.logoUrl);
  const [savingFields, setSavingFields] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const tokenHeader = (): HeadersInit => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('access_token')
        : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const handleSaveFields = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingFields(true);
    try {
      const res = await fetch(`${API_URL}/companies/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...tokenHeader() },
        body: JSON.stringify({ name, description, primaryColor }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to save branding');
      }
      toast.success('Branding updated', {
        description: 'Customer-facing surfaces will reflect the change.',
      });
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSavingFields(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo too large — max 2 MB');
      return;
    }
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_URL}/companies/me/logo`, {
        method: 'POST',
        headers: tokenHeader(),
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to upload logo');
      }
      setLogoUrl(data.logoUrl);
      toast.success('Logo uploaded');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
      {/* Logo section */}
      <div>
        <label className="block text-sm font-bold text-slate-900 mb-2">Logo</label>
        <div className="flex items-center gap-4">
          <div
            className="h-20 w-20 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0"
            style={
              !logoUrl
                ? { backgroundColor: primaryColor + '20' }
                : undefined
            }
          >
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt="Company logo preview"
                className="h-full w-full object-contain"
              />
            ) : (
              <span
                className="text-2xl font-black"
                style={{ color: primaryColor }}
              >
                {name.slice(0, 2).toUpperCase() || '??'}
              </span>
            )}
          </div>
          <div className="flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={handleLogoUpload}
              className="hidden"
              data-testid="logo-upload-input"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingLogo}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-zinc-700 disabled:opacity-50 text-sm font-medium text-slate-900 transition-colors"
            >
              {uploadingLogo ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {logoUrl ? 'Replace logo' : 'Upload logo'}
            </button>
            <p className="text-[11px] text-slate-500 mt-2">
              PNG, JPEG, WebP, or SVG. Max 2 MB. Square ratio works best.
            </p>
          </div>
        </div>
      </div>

      {/* Fields form */}
      <form onSubmit={handleSaveFields} className="space-y-5 pt-2 border-t border-slate-200/60">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
          <div>
            <label
              htmlFor="company-name"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Company name
            </label>
            <input
              id="company-name"
              type="text"
              required
              minLength={2}
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="primary-color"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Primary colour
            </label>
            <div className="flex items-center gap-3">
              <input
                id="primary-color"
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-10 w-14 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                pattern="^#[0-9a-fA-F]{6}$"
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="#3b82f6"
              />
            </div>
          </div>
        </div>

        <div>
          <label
            htmlFor="company-description"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Description
          </label>
          <textarea
            id="company-description"
            rows={3}
            maxLength={500}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm resize-none"
            placeholder="Short tagline shown to customers — what makes your company different?"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            {description.length} / 500 characters
          </p>
        </div>

        <button
          type="submit"
          disabled={savingFields}
          className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold text-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: primaryColor }}
        >
          {savingFields ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save branding
            </>
          )}
        </button>
      </form>
    </div>
  );
}

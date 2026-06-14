'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Camera } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/lib/api-client';
import { useT } from '@/i18n/LocaleProvider';

export default function AvatarUploadButton() {
  const router = useRouter();
  const { t } = useT();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate client-side size (2 MB)
    const MAX_BYTES = 2 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      toast.error(t('profile.photoTooLarge'));
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setIsLoading(true);
    try {
      const response = await apiClient.post('/auth/me/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Update user in localStorage
      const userJson = localStorage.getItem('user');
      if (userJson && response.data) {
        const currentUser = JSON.parse(userJson);
        const updatedUser = {
          ...currentUser,
          avatarUrl: response.data.avatarUrl,
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }

      // Dispatch event for other components to listen to (e.g. sidebar)
      window.dispatchEvent(new Event('user-updated'));

      toast.success(t('profile.photoUpdated'));
      router.refresh();
    } catch (err: any) {
      console.error(err);
      toast.error(t('profile.photoUploadFailed'));
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex flex-col items-center">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
      />
      <button
        onClick={handleButtonClick}
        disabled={isLoading}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-600 bg-blue-700/10 hover:bg-blue-700/20 border border-blue-700/30 hover:border-blue-700/40 px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Camera className="h-3.5 w-3.5" />
        )}
        {t('profile.uploadPhoto')}
      </button>
    </div>
  );
}

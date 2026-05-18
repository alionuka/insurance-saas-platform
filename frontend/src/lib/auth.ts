'use client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export type UserRole = 'CUSTOMER' | 'AGENT' | 'COMPANY_ADMIN' | 'PLATFORM_ADMIN';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export function setAuthData(access_token: string, refresh_token: string, user: User) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);
    localStorage.setItem('user', JSON.stringify(user));
    
    // Sync to cookies for middleware/server-side support
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `access_token=${access_token}; path=/; max-age=86400; SameSite=Lax${secure}`;
    document.cookie = `refresh_token=${refresh_token}; path=/; max-age=604800; SameSite=Lax${secure}`;
  }
}

export function getAuthToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('access_token');
  }
  return null;
}

export function getRefreshToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('refresh_token');
  }
  return null;
}

export function getStoredUser(): User | null {
  if (typeof window !== 'undefined') {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      try {
        return JSON.parse(userJson);
      } catch (e) {
        return null;
      }
    }
  }
  return null;
}

export function clearAuthCookie() {
  if (typeof window !== 'undefined') {
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `access_token=; path=/; max-age=0; SameSite=Lax${secure}`;
    document.cookie = `refresh_token=; path=/; max-age=0; SameSite=Lax${secure}`;
  }
}

export function logout() {
  if (typeof window !== 'undefined') {
    const token = getAuthToken();
    if (token) {
      fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }).catch(err => console.error('Failed to logout on backend', err));
    }
    
    clearAuthCookie();
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    window.location.href = '/auth/sign-in';
  }
}

export function getDashboardRedirect(role: UserRole): string {
  switch (role) {
    case 'CUSTOMER':
      return '/dashboard/client';
    case 'AGENT':
      return '/dashboard/agent';
    case 'COMPANY_ADMIN':
      return '/dashboard/company';
    case 'PLATFORM_ADMIN':
      return '/dashboard/admin';
    default:
      return '/dashboard';
  }
}

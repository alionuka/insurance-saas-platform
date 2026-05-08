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

export function setAuthData(token: string, user: User) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('access_token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }
}

export function getAuthToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('access_token');
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

export function logout() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token');
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

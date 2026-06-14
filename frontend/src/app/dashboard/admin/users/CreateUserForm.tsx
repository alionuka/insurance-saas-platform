'use client';

import React, { useState } from 'react';
import { Mail, Lock, User, ShieldCheck, Loader2, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { logout } from '@/lib/auth';

interface Company {
  id: string;
  name: string;
}

interface CreateUserFormProps {
  companies: Company[];
}

export default function CreateUserForm({ companies }: CreateUserFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'AGENT',
    companyId: '',
  });
  const [loading, setLoading] = useState(false);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      // Clear companyId if role is not COMPANY_ADMIN
      if (name === 'role' && value !== 'COMPANY_ADMIN') {
        newData.companyId = '';
      }
      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);


    // Client-side validation
    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    if (formData.role === 'COMPANY_ADMIN' && !formData.companyId) {
      toast.error('Select a company for COMPANY_ADMIN');
      setLoading(false);
      return;
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) {
      logout();
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          // Only include companyId if role is COMPANY_ADMIN
          companyId: formData.role === 'COMPANY_ADMIN' ? formData.companyId : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          return;
        }
        throw new Error(data.message || 'Failed to create user');
      }

      toast.success(`Account ${data.email} provisioned as ${data.role}`);
      // Clear personal info but keep role and companyId
      setFormData((prev) => ({
        ...prev,
        email: '',
        password: '',
        firstName: '',
        lastName: '',
      }));
    } catch (err: any) {
      toast.error(err.message || 'An error occurred during submission');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
      <div className="p-6 border-b border-slate-200 bg-white/50 flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-blue-700" />
        <h2 className="text-lg font-bold text-slate-900">Provision New Staff Account</h2>
      </div>

      <div className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">


          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-slate-600 mb-1.5">
                First Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className="appearance-none block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm"
                  placeholder="Jane"
                />
              </div>
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-slate-600 mb-1.5">
                Last Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="appearance-none block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm"
                  placeholder="Smith"
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-600 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-slate-500" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="appearance-none block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm"
                placeholder="jane.smith@example.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-600 mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-slate-500" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                value={formData.password}
                onChange={handleChange}
                className="appearance-none block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-slate-600 mb-1.5">
                Staff Role
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="block w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm appearance-none cursor-pointer"
              >
                <option value="AGENT">Agent</option>
                <option value="COMPANY_ADMIN">Company Admin</option>
                <option value="PLATFORM_ADMIN">Platform Admin</option>
              </select>
            </div>

            {formData.role === 'COMPANY_ADMIN' && (
              <div>
                <label htmlFor="companyId" className="block text-sm font-medium text-slate-600 mb-1.5">
                  Assigned Company
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 className="h-4 w-4 text-slate-500" />
                  </div>
                  <select
                    id="companyId"
                    name="companyId"
                    required={formData.role === 'COMPANY_ADMIN'}
                    value={formData.companyId}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm appearance-none cursor-pointer"
                  >
                    <option value="">-- Select a Company --</option>
                    {companies.length > 0 ? (
                      companies.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No companies exist yet.</option>
                    )}
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-blue-900/20"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'Create Staff Account'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import Link from 'next/link';
import { UserSquare2, Users, Settings, ShieldCheck, Info } from 'lucide-react';

export default function DashboardEntry() {
  const roles = [
    {
      title: 'Continue as Client',
      description: 'View your applications, active policies, and file insurance claims.',
      href: '/dashboard/client',
      icon: UserSquare2,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
    },
    {
      title: 'Continue as Agent',
      description: 'Review customer applications, assess risks, and manage policy approvals.',
      href: '/dashboard/agent',
      icon: Users,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
    },
    {
      title: 'Continue as Company Admin',
      description: 'Manage product catalogs, view company-wide analytics, and monitor performance.',
      href: '/dashboard/company',
      icon: Settings,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/20',
    },
    {
      title: 'Continue as Platform Admin',
      description: 'Global system administration, tenant management, and platform-level monitoring.',
      href: '/dashboard/admin',
      icon: ShieldCheck,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-white mb-4">Welcome to InsurSaaS</h1>
        <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
          Please select a role to explore the platform's capabilities. 
          This is a simulated environment for demonstration purposes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {roles.map((role) => (
          <Link 
            key={role.href} 
            href={role.href}
            className="group relative bg-zinc-900 border border-zinc-800 rounded-2xl p-8 hover:border-zinc-700 transition-all hover:shadow-2xl hover:shadow-indigo-500/10 overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-32 h-32 ${role.bgColor} rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110`}></div>
            
            <div className="relative z-10">
              <div className={`h-12 w-12 rounded-xl ${role.bgColor} border ${role.borderColor} flex items-center justify-center mb-6`}>
                <role.icon className={`h-6 w-6 ${role.color}`} />
              </div>
              
              <h2 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">
                {role.title}
              </h2>
              <p className="text-zinc-400 text-sm leading-relaxed">
                {role.description}
              </p>
              
              <div className="mt-6 flex items-center text-xs font-bold uppercase tracking-widest text-zinc-500 group-hover:text-white transition-colors">
                Enter Portal 
                <span className="ml-2 transform group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-16 p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl flex items-start gap-4">
        <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
          <Info className="h-5 w-5 text-indigo-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Demo Mode Notice</h3>
          <p className="text-sm text-zinc-400">
            Authentication and role-based access control (RBAC) are currently simulated. 
            Production environments will integrate with central identity providers for secure access management.
          </p>
        </div>
      </div>
    </div>
  );
}


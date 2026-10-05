'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Car, AlertTriangle, BarChart3, ArrowLeft } from 'lucide-react';

export function AdminNav() {
  const pathname = usePathname();

  const links = [
    { href: '/admin', label: 'Overview', icon: LayoutDashboard },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/rides', label: 'Rides', icon: Car },
    { href: '/admin/reports', label: 'Reports', icon: AlertTriangle },
    { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-8">
      <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition shrink-0 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>

      <Link
        href="/dashboard"
        className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition ml-4 shrink-0"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Back to App</span>
      </Link>
    </div>
  );
}

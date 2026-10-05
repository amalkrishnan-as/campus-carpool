'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { AdminAnalytics } from '@/types';
import { Navbar } from '@/components/Navbar';
import { AdminNav } from '@/components/AdminNav';
import { AdminStatsCards } from '@/components/AdminStatsCards';
import { LoadingState } from '@/components/LoadingState';
import { ShieldAlert, Users, Car, AlertTriangle, ArrowRight } from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!token || user?.role !== 'ADMIN')) {
      router.push('/dashboard');
      return;
    }

    if (token && user?.role === 'ADMIN') {
      api.admin.analytics(token)
        .then((data) => setStats(data as AdminAnalytics))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [token, user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <LoadingState message="Loading administrator portal..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        <AdminNav />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">Admin Operations Center</h1>
          <p className="text-sm text-slate-400 mt-1">
            Platform oversight, campus user moderation, ride monitoring, and safety reports
          </p>
        </div>

        {stats && (
          <div className="mb-10">
            <AdminStatsCards stats={stats} />
          </div>
        )}

        {/* Quick Management Shortcuts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/admin/users"
            className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 transition group"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-indigo-400 transition">
              Manage Students
            </h3>
            <p className="text-xs text-slate-400 mt-1 mb-4 leading-relaxed">
              Inspect student identities, review academic year/department, and suspend or activate accounts.
            </p>
            <span className="text-xs font-semibold text-indigo-400 inline-flex items-center gap-1">
              View student roster <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          <Link
            href="/admin/rides"
            className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/40 transition group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Car className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition">
              Inspect Rides
            </h3>
            <p className="text-xs text-slate-400 mt-1 mb-4 leading-relaxed">
              Monitor active, completed, or cancelled rides across all university routes. Cancel invalid carpools.
            </p>
            <span className="text-xs font-semibold text-amber-400 inline-flex items-center gap-1">
              Browse carpools <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          <Link
            href="/admin/reports"
            className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-rose-500/40 transition group"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-rose-400 transition">
              Incident Reports
            </h3>
            <p className="text-xs text-slate-400 mt-1 mb-4 leading-relaxed">
              Resolve peer disputes, safety flags, no-shows, harassment reports, and add administrative notes.
            </p>
            <span className="text-xs font-semibold text-rose-400 inline-flex items-center gap-1">
              Investigate incidents <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        </div>
      </main>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { AdminAnalytics } from '@/types';
import { Navbar } from '@/components/Navbar';
import { AdminNav } from '@/components/AdminNav';
import { AdminStatsCards } from '@/components/AdminStatsCards';
import { LoadingState } from '@/components/LoadingState';
import { BarChart3, TrendingUp, Users, Car, CheckCircle2 } from 'lucide-react';

export default function AdminAnalyticsPage() {
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
          <LoadingState message="Calculating university carpool metrics..." />
        </div>
      </div>
    );
  }

  const acceptanceRate =
    stats && stats.total_requests > 0
      ? Math.round((stats.accepted_requests / stats.total_requests) * 100)
      : 100;

  const completionRate =
    stats && stats.total_rides > 0
      ? Math.round((stats.completed_rides / stats.total_rides) * 100)
      : 100;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        <AdminNav />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">Platform Analytics</h1>
          <p className="text-sm text-slate-400 mt-1">
            System performance, student adoption rates, and carpooling efficiency
          </p>
        </div>

        {stats && (
          <div className="space-y-8">
            <AdminStatsCards stats={stats} />

            {/* Performance Ratios */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                    <span>Seat Request Acceptance Rate</span>
                  </h3>
                  <span className="text-2xl font-bold text-emerald-400">{acceptanceRate}%</span>
                </div>
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  Percentage of seat requests approved by driver peers. High rates indicate high route compatibility among students.
                </p>
                <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-1000"
                    style={{ width: `${acceptanceRate}%` }}
                  />
                </div>
              </div>

              <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                    <span>Ride Completion Reliability</span>
                  </h3>
                  <span className="text-2xl font-bold text-indigo-400">{completionRate}%</span>
                </div>
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  Proportion of scheduled carpools completed without cancellation. Measures campus driver punctuality and reliability.
                </p>
                <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-1000"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

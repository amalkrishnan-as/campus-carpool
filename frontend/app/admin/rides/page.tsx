'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { Navbar } from '@/components/Navbar';
import { AdminNav } from '@/components/AdminNav';
import { Pagination } from '@/components/Pagination';
import { LoadingState } from '@/components/LoadingState';
import { Car, MapPin, Calendar, Clock, AlertTriangle, ExternalLink } from 'lucide-react';

interface AdminRideItem {
  id: string;
  source: string;
  destination: string;
  status: string;
  departure_date: string;
  driver_id: string;
}

export default function AdminRidesPage() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();

  const [rides, setRides] = useState<AdminRideItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchRides = async (p: number) => {
    if (!token) return;
    setLoading(true);
    try {
      const res = (await api.admin.rides(token, p)) as {
        items: AdminRideItem[];
        total_pages: number;
      };
      setRides(res.items || []);
      setTotalPages(res.total_pages || 1);
    } catch {
      setRides([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && (!token || user?.role !== 'ADMIN')) {
      router.push('/dashboard');
      return;
    }
    if (token && user?.role === 'ADMIN') {
      fetchRides(page);
    }
  }, [token, user, authLoading, page, router]);

  const handleAdminCancel = async (id: string) => {
    if (!token) return;
    if (!confirm('Are you sure you want to administratively cancel this ride?')) return;
    setCancellingId(id);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/admin/rides/${id}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setRides((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: 'CANCELLED' } : r))
        );
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to cancel ride');
    } finally {
      setCancellingId(null);
    }
  };

  const statusStyles: Record<string, string> = {
    OPEN: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    FULL: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    STARTED: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    COMPLETED: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    CANCELLED: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        <AdminNav />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">Platform Carpools</h1>
          <p className="text-sm text-slate-400 mt-1">
            Global monitoring of all university travel routes and lifecycle statuses
          </p>
        </div>

        {loading ? (
          <LoadingState message="Loading ride catalog..." />
        ) : (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-6 py-4">Route</th>
                    <th className="px-6 py-4">Departure Date</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Driver ID</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {rides.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Car className="w-4 h-4 text-indigo-400 shrink-0" />
                          <span className="font-semibold text-white">
                            {r.source} → {r.destination}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-slate-300">
                        {r.departure_date}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                            statusStyles[r.status] || 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-slate-400 font-mono text-[11px]">
                        {r.driver_id.slice(0, 8)}...
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <Link
                            href={`/rides/${r.id}`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                            title="Inspect Ride"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>

                          {r.status !== 'CANCELLED' && r.status !== 'COMPLETED' && (
                            <button
                              onClick={() => handleAdminCancel(r.id)}
                              disabled={cancellingId === r.id}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500 hover:text-white border border-rose-500/20 transition disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        )}
      </main>
    </div>
  );
}

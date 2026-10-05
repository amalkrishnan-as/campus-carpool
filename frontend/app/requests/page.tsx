'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { RideRequest } from '@/types';
import { Navbar } from '@/components/Navbar';
import { RequestCard } from '@/components/RequestCard';
import { LoadingState } from '@/components/LoadingState';
import { EmptyState } from '@/components/EmptyState';
import { Clock, Search } from 'lucide-react';

export default function RequestsPage() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'ACCEPTED' | 'CANCELLED'>('ALL');

  const fetchRequests = async () => {
    if (!token) return;
    try {
      const data = (await api.requests.my(token)) as RideRequest[];
      setRequests(data);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !token) {
      router.push('/login');
      return;
    }
    if (token) {
      fetchRequests();
    }
  }, [token, authLoading, router]);

  const handleCancelRequest = async (id: string) => {
    if (!token) return;
    try {
      await api.requests.cancel(token, id);
      fetchRequests();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to cancel request');
    }
  };

  const filtered = requests.filter((r) => {
    if (filter === 'PENDING') return r.status === 'PENDING';
    if (filter === 'ACCEPTED') return r.status === 'ACCEPTED';
    if (filter === 'CANCELLED') return r.status === 'CANCELLED' || r.status === 'REJECTED';
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">Seat Requests</h1>
          <p className="text-sm text-slate-400 mt-1">
            Track your carpool seat requests and booking status
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-3">
          {(['ALL', 'PENDING', 'ACCEPTED', 'CANCELLED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition ${
                filter === tab
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {tab === 'ALL' ? 'All Requests' : tab}
            </button>
          ))}
        </div>

        {loading ? (
          <LoadingState message="Loading your seat requests..." />
        ) : filtered.length > 0 ? (
          <div className="space-y-4">
            {filtered.map((req) => (
              <RequestCard
                key={req.id}
                request={req}
                viewAs="passenger"
                onCancel={() => handleCancelRequest(req.id)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Clock className="w-10 h-10" />}
            title="No seat requests found"
            description="You haven't requested any rides in this section yet."
            actionLabel="Search Rides"
            actionHref="/rides/search"
          />
        )}
      </main>
    </div>
  );
}

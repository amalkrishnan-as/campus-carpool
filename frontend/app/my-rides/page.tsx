'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { Ride } from '@/types';
import { Navbar } from '@/components/Navbar';
import { RideCard } from '@/components/RideCard';
import { LoadingState } from '@/components/LoadingState';
import { EmptyState } from '@/components/EmptyState';
import { Car, Plus } from 'lucide-react';

export default function MyRidesPage() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'>('ALL');

  const fetchMyRides = async () => {
    if (!token) return;
    try {
      const data = (await api.rides.myRides(token)) as Ride[];
      setRides(data);
    } catch {
      setRides([]);
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
      fetchMyRides();
    }
  }, [token, authLoading, router]);

  const filteredRides = rides.filter((r) => {
    if (filter === 'ACTIVE') return r.status === 'OPEN' || r.status === 'FULL' || r.status === 'STARTED';
    if (filter === 'COMPLETED') return r.status === 'COMPLETED';
    if (filter === 'CANCELLED') return r.status === 'CANCELLED';
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">My Offered Rides</h1>
            <p className="text-sm text-slate-400 mt-1">Manage all carpools you have offered</p>
          </div>

          <Link
            href="/rides/create"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Offer New Ride</span>
          </Link>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-3">
          {(['ALL', 'ACTIVE', 'COMPLETED', 'CANCELLED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition ${
                filter === tab
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {tab === 'ALL' ? 'All Rides' : tab}
            </button>
          ))}
        </div>

        {loading ? (
          <LoadingState message="Loading your rides..." />
        ) : filteredRides.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRides.map((ride) => (
              <RideCard
                key={ride.id}
                ride={ride}
                showActions={true}
                onCancel={async () => {
                  if (token) {
                    await api.rides.cancel(token, ride.id);
                    fetchMyRides();
                  }
                }}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Car className="w-10 h-10" />}
            title="No rides found"
            description="You haven't offered any rides in this category yet."
            actionLabel="Offer a Ride"
            actionHref="/rides/create"
          />
        )}
      </main>
    </div>
  );
}

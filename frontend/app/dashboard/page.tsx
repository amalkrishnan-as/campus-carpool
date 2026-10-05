'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { Ride, RideRequest, Notification } from '@/types';
import { Navbar } from '@/components/Navbar';
import { RideCard } from '@/components/RideCard';
import { RequestCard } from '@/components/RequestCard';
import { LoadingState } from '@/components/LoadingState';
import { EmptyState } from '@/components/EmptyState';
import {
  Car,
  Search,
  Plus,
  Clock,
  ArrowRight,
  ShieldCheck,
  Star,
  Users,
  AlertCircle,
  Bell,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();

  const [myRides, setMyRides] = useState<Ride[]>([]);
  const [myRequests, setMyRequests] = useState<RideRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !token) {
      router.push('/login');
      return;
    }

    if (token) {
      Promise.all([
        api.rides.myRides(token),
        api.requests.my(token),
        api.notifications.list(token, false),
      ])
        .then(([ridesRes, requestsRes, notifsRes]) => {
          setMyRides(ridesRes as Ride[]);
          setMyRequests(requestsRes as RideRequest[]);
          setNotifications((notifsRes as Notification[]).slice(0, 5));
        })
        .catch((err) => {
          setError(err.message || 'Failed to load dashboard data');
        })
        .finally(() => setLoading(false));
    }
  }, [token, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <LoadingState message="Loading your campus carpool dashboard..." />
        </div>
      </div>
    );
  }

  const activeOfferedRides = myRides.filter(
    (r) => r.status === 'OPEN' || r.status === 'FULL' || r.status === 'STARTED'
  );
  const nextOfferedRide = activeOfferedRides[0];

  const activeBookings = myRequests.filter((req) => req.status === 'ACCEPTED');
  const pendingRequests = myRequests.filter((req) => req.status === 'PENDING');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Welcome Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-8 rounded-3xl bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900/60 border border-indigo-500/20 mb-8 backdrop-blur-md">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
                Verified Student
              </span>
              {user?.department && (
                <span className="text-xs text-slate-400">
                  {user.department} {user.year ? `• Year ${user.year}` : ''}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Welcome back, {user?.name || 'Student'}! 👋
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Ready for your next commute? Find rides offered by peers or offer empty seats from your car.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/rides/search"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition"
            >
              <Search className="w-4 h-4" />
              <span>Find Ride</span>
            </Link>
            <Link
              href="/rides/create"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Offer Ride</span>
            </Link>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content: 2 Cols */}
          <div className="lg:col-span-2 space-y-8">
            {/* Upcoming Ride Card (Driver or Passenger) */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <Car className="w-4 h-4 text-indigo-400" />
                  <span>Your Upcoming Ride</span>
                </h2>
                <Link
                  href="/my-rides"
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1"
                >
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {nextOfferedRide ? (
                <RideCard
                  ride={nextOfferedRide}
                  showActions={true}
                  onCancel={async () => {
                    if (token) {
                      await api.rides.cancel(token, nextOfferedRide.id);
                      setMyRides((prev) =>
                        prev.map((r) =>
                          r.id === nextOfferedRide.id ? { ...r, status: 'CANCELLED' } : r
                        )
                      );
                    }
                  }}
                />
              ) : activeBookings.length > 0 && activeBookings[0].ride ? (
                <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                      Confirmed Passenger
                    </span>
                    <span className="text-xs text-slate-400">
                      {activeBookings[0].ride.departure_date} at {activeBookings[0].ride.departure_time}
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2">
                    {activeBookings[0].ride.source} → {activeBookings[0].ride.destination}
                  </h4>
                  <p className="text-xs text-slate-400 mb-4">
                    Pickup: {activeBookings[0].ride.pickup_point}
                  </p>
                  <Link
                    href={`/rides/${activeBookings[0].ride.id}`}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                  >
                    View Ride Details →
                  </Link>
                </div>
              ) : (
                <EmptyState
                  icon={<Car className="w-8 h-8" />}
                  title="No active rides scheduled"
                  description="You don't have any upcoming trips planned. Find a ride or offer your empty seats."
                  actionLabel="Search Rides"
                  actionHref="/rides/search"
                />
              )}
            </div>

            {/* Pending Seat Requests */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-400" />
                  <span>Pending Seat Requests</span>
                </h2>
                <Link
                  href="/requests"
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1"
                >
                  Manage requests <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {pendingRequests.length > 0 ? (
                <div className="space-y-3">
                  {pendingRequests.slice(0, 3).map((req) => (
                    <RequestCard
                      key={req.id}
                      request={req}
                      viewAs="passenger"
                      onCancel={async () => {
                        if (token) {
                          await api.requests.cancel(token, req.id);
                          setMyRequests((prev) => prev.filter((r) => r.id !== req.id));
                        }
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-center">
                  <p className="text-xs text-slate-400">No pending ride requests at this moment.</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar: Profile snippet & Notifications */}
          <div className="space-y-6">
            {/* Quick Profile Summary */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
              <h3 className="text-sm font-semibold text-white mb-4">Community Standing</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-lg">
                  {user?.name?.[0] || 'U'}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{user?.name}</h4>
                  <p className="text-xs text-slate-400">{user?.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800 text-center">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
                  <div className="flex items-center justify-center gap-1 text-amber-400 font-bold text-base">
                    <Star className="w-4 h-4 fill-amber-400" />
                    <span>{user?.average_rating ? user.average_rating.toFixed(1) : '5.0'}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">Rating ({user?.rating_count || 0})</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
                  <p className="font-bold text-base text-white">{myRides.length}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Rides Offered</p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80">
                <Link
                  href="/profile"
                  className="block text-center py-2 px-3 rounded-xl text-xs font-medium text-slate-300 bg-slate-800/60 hover:bg-slate-800 transition"
                >
                  Edit Profile & Vehicles
                </Link>
              </div>
            </div>

            {/* In-app Notifications list */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Bell className="w-4 h-4 text-indigo-400" />
                  <span>Recent Notifications</span>
                </h3>
                <Link
                  href="/notifications"
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition"
                >
                  View all
                </Link>
              </div>

              {notifications.length > 0 ? (
                <div className="space-y-3">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 rounded-xl border text-xs transition ${
                        n.is_read
                          ? 'bg-slate-950/40 border-slate-800 text-slate-400'
                          : 'bg-indigo-950/30 border-indigo-500/30 text-slate-200'
                      }`}
                    >
                      <p className="font-medium text-slate-100">{n.title}</p>
                      <p className="text-slate-400 mt-1 line-clamp-2">{n.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 text-center py-4">No new notifications</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

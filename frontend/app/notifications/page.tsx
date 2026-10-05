'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { Notification } from '@/types';
import { Navbar } from '@/components/Navbar';
import { LoadingState } from '@/components/LoadingState';
import { EmptyState } from '@/components/EmptyState';
import { Bell, CheckCheck, Car, Calendar, User } from 'lucide-react';

export default function NotificationsPage() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    if (!token) return;
    try {
      const data = (await api.notifications.list(token)) as Notification[];
      setNotifications(data);
    } catch {
      setNotifications([]);
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
      fetchNotifs();
    }
  }, [token, authLoading, router]);

  const handleMarkRead = async (id: string) => {
    if (!token) return;
    try {
      await api.notifications.markRead(token, id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch {}
  };

  const handleMarkAllRead = async () => {
    if (!token) return;
    try {
      await api.notifications.markAllRead(token);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {}
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Notifications</h1>
            <p className="text-sm text-slate-400 mt-1">Real-time alerts for your carpool activities</p>
          </div>

          {notifications.some((n) => !n.is_read) && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-indigo-400 bg-indigo-950/40 border border-indigo-500/30 hover:bg-indigo-900/50 transition"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Mark all read</span>
            </button>
          )}
        </div>

        {loading ? (
          <LoadingState message="Loading notifications..." />
        ) : notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.is_read && handleMarkRead(n.id)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                  n.is_read
                    ? 'bg-slate-900/40 border-slate-800/80 text-slate-400'
                    : 'bg-indigo-950/20 border-indigo-500/30 text-slate-200 hover:border-indigo-500/50 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                        n.is_read
                          ? 'bg-slate-800 text-slate-500'
                          : 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                      }`}
                    >
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">{n.title}</h4>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">{n.message}</p>
                      <span className="text-[11px] text-slate-500 mt-2 block">
                        {new Date(n.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {!n.is_read && (
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Bell className="w-10 h-10" />}
            title="All caught up!"
            description="You don't have any notifications right now."
          />
        )}
      </main>
    </div>
  );
}

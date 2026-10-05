'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { User, PaginatedResult } from '@/types';
import { Navbar } from '@/components/Navbar';
import { AdminNav } from '@/components/AdminNav';
import { UserAvatar } from '@/components/UserAvatar';
import { Pagination } from '@/components/Pagination';
import { LoadingState } from '@/components/LoadingState';
import { Shield, ShieldAlert, CheckCircle, Ban, Star } from 'lucide-react';

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = async (p: number) => {
    if (!token) return;
    setLoading(true);
    try {
      const res = (await api.admin.users(token, p)) as {
        items: User[];
        total_pages: number;
      };
      setUsers(res.items || []);
      setTotalPages(res.total_pages || 1);
    } catch {
      setUsers([]);
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
      fetchUsers(page);
    }
  }, [token, user, authLoading, page, router]);

  const handleSuspend = async (userId: string) => {
    if (!token) return;
    setActionLoading(userId);
    try {
      await api.admin.suspendUser(token, userId);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: 'SUSPENDED' } : u))
      );
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to suspend user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleActivate = async (userId: string) => {
    if (!token) return;
    setActionLoading(userId);
    try {
      await api.admin.activateUser(token, userId);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: 'ACTIVE' } : u))
      );
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to activate user');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        <AdminNav />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">Student Directory</h1>
          <p className="text-sm text-slate-400 mt-1">
            Oversee user accounts, verified statuses, and moderation enforcement
          </p>
        </div>

        {loading ? (
          <LoadingState message="Loading student records..." />
        ) : (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">College Record</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Rating</th>
                    <th className="px-6 py-4 text-right">Moderation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <UserAvatar name={u.name} size="sm" />
                          <div>
                            <p className="font-semibold text-white">{u.name}</p>
                            <p className="text-slate-400 text-[11px]">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-slate-300">
                        <p>{u.department || 'N/A'}</p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          {u.college_id ? `ID: ${u.college_id}` : ''} {u.year ? `• Yr ${u.year}` : ''}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            u.role === 'ADMIN'
                              ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                            u.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : u.status === 'SUSPENDED'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-amber-400 font-medium">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span>{u.average_rating ? u.average_rating.toFixed(1) : '5.0'}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right">
                        {u.role !== 'ADMIN' && (
                          <div className="inline-flex items-center gap-2">
                            {u.status === 'SUSPENDED' ? (
                              <button
                                onClick={() => handleActivate(u.id)}
                                disabled={actionLoading === u.id}
                                className="px-3 py-1 rounded-lg text-xs font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white border border-emerald-500/20 transition disabled:opacity-50"
                              >
                                Activate
                              </button>
                            ) : (
                              <button
                                onClick={() => handleSuspend(u.id)}
                                disabled={actionLoading === u.id}
                                className="px-3 py-1 rounded-lg text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500 hover:text-white border border-rose-500/20 transition disabled:opacity-50"
                              >
                                Suspend
                              </button>
                            )}
                          </div>
                        )}
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

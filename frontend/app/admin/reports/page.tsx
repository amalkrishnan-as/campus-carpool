'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { Report } from '@/types';
import { Navbar } from '@/components/Navbar';
import { AdminNav } from '@/components/AdminNav';
import { LoadingState } from '@/components/LoadingState';
import { EmptyState } from '@/components/EmptyState';
import { Modal } from '@/components/Modal';
import { AlertTriangle, CheckCircle, Clock, ShieldCheck, FileText } from 'lucide-react';

export default function AdminReportsPage() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');

  // Edit / Resolve Modal
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [newStatus, setNewStatus] = useState('UNDER_REVIEW');
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchReports = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = (await api.admin.reports(token)) as Report[];
      setReports(data);
    } catch {
      setReports([]);
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
      fetchReports();
    }
  }, [token, user, authLoading, router]);

  const handleOpenResolve = (rep: Report) => {
    setSelectedReport(rep);
    setNewStatus(rep.status);
    setAdminNotes(rep.admin_notes || '');
  };

  const handleUpdateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedReport) return;
    setUpdating(true);
    try {
      const updated = (await api.admin.updateReport(token, selectedReport.id, {
        status: newStatus,
        admin_notes: adminNotes.trim(),
      })) as Report;

      setReports((prev) =>
        prev.map((r) => (r.id === selectedReport.id ? updated : r))
      );
      setSelectedReport(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update report');
    } finally {
      setUpdating(false);
    }
  };

  const filtered = reports.filter((r) => {
    if (filter === 'ALL') return true;
    return r.status === filter;
  });

  const statusStyles: Record<string, string> = {
    OPEN: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    UNDER_REVIEW: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    RESOLVED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    DISMISSED: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        <AdminNav />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">Incident Reports</h1>
          <p className="text-sm text-slate-400 mt-1">
            Safety flags, conduct disputes, and campus community moderation
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-3">
          {['ALL', 'OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                filter === tab
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>

        {loading ? (
          <LoadingState message="Loading incident reports..." />
        ) : filtered.length > 0 ? (
          <div className="space-y-4">
            {filtered.map((rep) => (
              <div
                key={rep.id}
                className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                        statusStyles[rep.status] || 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {rep.status.replace('_', ' ')}
                    </span>
                    <span className="text-xs font-bold text-white px-2.5 py-1 rounded-lg bg-slate-800">
                      Reason: {rep.reason}
                    </span>
                  </div>

                  <span className="text-xs text-slate-500">
                    Reported on {new Date(rep.created_at).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-sm text-slate-300 mb-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                  {rep.description || 'No detailed incident description provided.'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-400 pt-2 mb-4">
                  <div>
                    <span className="text-slate-500 block">Reported User ID:</span>
                    <span className="font-mono text-slate-300">{rep.reported_user_id}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Reporter User ID:</span>
                    <span className="font-mono text-slate-300">{rep.reporter_id}</span>
                  </div>
                </div>

                {rep.admin_notes && (
                  <div className="p-3 mb-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-xs">
                    <span className="font-semibold text-indigo-400 block mb-1">Admin Resolution Notes:</span>
                    <p className="text-slate-300">{rep.admin_notes}</p>
                  </div>
                )}

                <div className="flex justify-end pt-3 border-t border-slate-800">
                  <button
                    onClick={() => handleOpenResolve(rep)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition shadow-lg shadow-indigo-600/20"
                  >
                    Update Status & Notes
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<AlertTriangle className="w-10 h-10" />}
            title="No reports in this category"
            description="All student reports in this status have been reviewed."
          />
        )}

        {/* Update Report Modal */}
        <Modal
          isOpen={!!selectedReport}
          onClose={() => setSelectedReport(null)}
          title="Resolve Incident Report"
        >
          <form onSubmit={handleUpdateReport} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Update Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition"
              >
                <option value="OPEN">Open</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="RESOLVED">Resolved</option>
                <option value="DISMISSED">Dismissed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Admin Notes / Outcome</label>
              <textarea
                rows={4}
                required
                placeholder="Document resolution action taken (e.g. User warned, temporary suspension, etc.)..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={updating}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50"
            >
              {updating ? 'Saving...' : 'Save Resolution'}
            </button>
          </form>
        </Modal>
      </main>
    </div>
  );
}

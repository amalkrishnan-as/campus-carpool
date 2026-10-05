'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { Navbar } from '@/components/Navbar';
import { LoadingState } from '@/components/LoadingState';
import {
  Lock,
  Shield,
  UserX,
  AlertCircle,
  CheckCircle,
  KeyRound,
  Trash2,
} from 'lucide-react';

interface BlockedUser {
  id: string;
  blocked_id: string;
  created_at: string;
  blocked_user?: {
    id: string;
    name: string;
    email: string;
  };
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, token, loading: authLoading, logout } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loadingBlocks, setLoadingBlocks] = useState(true);

  useEffect(() => {
    if (!authLoading && !token) {
      router.push('/login');
      return;
    }

    if (token) {
      api.blocks.list(token)
        .then((data) => setBlockedUsers(data as BlockedUser[]))
        .catch(() => setBlockedUsers([]))
        .finally(() => setLoadingBlocks(false));
    }
  }, [token, authLoading, router]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setPasswordMsg(null);
    setPasswordError(null);

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }

    setPasswordLoading(true);
    try {
      await api.users.changePassword(token, {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPasswordMsg('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      let msg = 'Failed to change password.';
      if (err instanceof Error) {
        try {
          const parsed = JSON.parse(err.message);
          if (parsed.message) msg = parsed.message;
        } catch {
          msg = err.message;
        }
      }
      setPasswordError(msg);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleUnblock = async (blockedId: string) => {
    if (!token) return;
    try {
      await api.blocks.unblock(token, blockedId);
      setBlockedUsers((prev) => prev.filter((b) => b.blocked_id !== blockedId));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to unblock user');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <LoadingState message="Loading settings..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">Account Settings</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your security credentials and community privacy preferences
          </p>
        </div>

        <div className="space-y-8">
          {/* Security & Password */}
          <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
              <div className="p-2 rounded-xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Security & Password</h3>
                <p className="text-xs text-slate-400">Update your access password regularly</p>
              </div>
            </div>

            {passwordMsg && (
              <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{passwordMsg}</span>
              </div>
            )}

            {passwordError && (
              <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  New Password (Min 8 characters)
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <button
                type="submit"
                disabled={passwordLoading}
                className="mt-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/20 disabled:opacity-50"
              >
                {passwordLoading ? 'Updating Password...' : 'Update Password'}
              </button>
            </form>
          </div>

          {/* Blocked Users */}
          <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
              <div className="p-2 rounded-xl bg-purple-600/10 text-purple-400 border border-purple-500/20">
                <UserX className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Blocked Users</h3>
                <p className="text-xs text-slate-400">
                  Blocked members cannot request your rides or interact with your profile
                </p>
              </div>
            </div>

            {loadingBlocks ? (
              <LoadingState message="Loading blocked users..." minHeight="min-h-[100px]" />
            ) : blockedUsers.length > 0 ? (
              <div className="space-y-3">
                {blockedUsers.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800"
                  >
                    <div>
                      <p className="text-xs font-semibold text-white">
                        {b.blocked_user?.name || `User ID: ${b.blocked_id.slice(0, 8)}...`}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Blocked on {new Date(b.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <button
                      onClick={() => handleUnblock(b.blocked_id)}
                      className="px-3 py-1 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
                    >
                      Unblock
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">You haven&apos;t blocked any members.</p>
            )}
          </div>

          {/* Session / Danger Zone */}
          <div className="p-8 rounded-3xl bg-slate-900/80 border border-rose-500/20 backdrop-blur-xl">
            <h3 className="text-base font-bold text-rose-400 mb-1">Session Actions</h3>
            <p className="text-xs text-slate-400 mb-4">
              Sign out of this session across your browser.
            </p>

            <button
              onClick={logout}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500 hover:text-white border border-rose-500/30 transition"
            >
              Sign Out of Campus Carpool
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

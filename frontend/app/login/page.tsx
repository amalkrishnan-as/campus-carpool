'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getErrorMessage } from '@/lib/api';
import { Car, Lock, Mail, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email.trim(), password);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 relative bg-slate-950 bg-grid-pattern">
      {/* Background ambient lighting */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[500px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/15 to-transparent rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-4 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-xl shadow-indigo-600/30 group-hover:scale-105 transition-transform">
              <Car className="w-6 h-6" />
            </div>
            <span className="font-bold text-2xl text-white tracking-tight">Campus Carpool</span>
          </Link>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-950/50 text-indigo-300 text-xs font-semibold mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>Verified Student Access</span>
          </div>

          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Sign in with your verified college credentials
          </p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
          {error && (
            <div className="flex items-start gap-3 p-4 mb-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs leading-relaxed">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                College Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-indigo-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  placeholder="student@sctce.ac.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 bg-slate-950/90 border border-slate-700/80 rounded-xl text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <Link href="/verify" className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition">
                  Have a token?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-indigo-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 bg-slate-950/90 border border-slate-700/80 rounded-xl text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 mt-4 flex items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/30 disabled:opacity-50 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-400">
              Don&apos;t have an account yet?{' '}
              <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold ml-1 underline-offset-2 hover:underline">
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

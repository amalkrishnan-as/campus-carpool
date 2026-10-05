'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Car, KeyRound, CheckCircle2, AlertCircle, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';

function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialToken = searchParams?.get('token') || '';

  const [token, setToken] = useState(initialToken);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;

    setError(null);
    setLoading(true);

    try {
      await api.auth.verify(token.trim());
      setSuccess(true);
    } catch (err: unknown) {
      let msg = 'Invalid or expired verification token.';
      if (err instanceof Error) {
        try {
          const parsed = JSON.parse(err.message);
          if (parsed.message) msg = parsed.message;
        } catch {
          msg = err.message;
        }
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
      {success ? (
        <div className="text-center py-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/10">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Account Verified!</h3>
          <p className="text-sm text-slate-300 max-w-sm mx-auto mb-6 leading-relaxed">
            Your college status has been validated. You can now login to offer empty seats or request carpools.
          </p>
          <Link
            href="/login"
            className="w-full inline-flex items-center justify-center gap-2 h-12 px-5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition hover:scale-[1.01]"
          >
            <span>Proceed to Sign In</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <>
          {error && (
            <div className="flex items-start gap-3 p-4 mb-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs leading-relaxed">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Verification Token / Code
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-indigo-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  placeholder="Paste verification token here"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 bg-slate-950/90 border border-slate-700/80 rounded-xl text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition font-mono"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                Tip: When running locally, tokens are printed in your backend console output during registration.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 mt-2 flex items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/30 disabled:opacity-50 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <span>{loading ? 'Verifying Student Identity...' : 'Activate Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-400">
              Already verified?{' '}
              <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold ml-1 underline-offset-2 hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
        </>
      )}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 relative bg-slate-950 bg-grid-pattern">
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
            <span>Identity Confirmation</span>
          </div>

          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Account Verification
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Confirm your student identity to begin carpooling
          </p>
        </div>

        <Suspense fallback={
          <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 text-sm">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mr-2" />
            Loading verification form...
          </div>
        }>
          <VerifyForm />
        </Suspense>
      </div>
    </div>
  );
}

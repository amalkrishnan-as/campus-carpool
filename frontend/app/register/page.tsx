'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  Car,
  User,
  Mail,
  Lock,
  Building,
  Calendar,
  Phone,
  IdCard,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    college_id: '',
    department: '',
    year: '',
    phone: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.auth.register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        college_id: formData.college_id.trim() || undefined,
        department: formData.department.trim() || undefined,
        year: formData.year ? parseInt(formData.year) : undefined,
        phone: formData.phone.trim() || undefined,
      });

      setSuccess(true);
    } catch (err: unknown) {
      let msg = 'Registration failed. Please check your information.';
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
    <div className="min-h-screen flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 relative bg-slate-950 bg-grid-pattern">
      {/* Ambient background glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/15 to-transparent rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-xl relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-4 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-xl shadow-indigo-600/30 group-hover:scale-105 transition-transform">
              <Car className="w-6 h-6" />
            </div>
            <span className="font-bold text-2xl text-white tracking-tight">Campus Carpool</span>
          </Link>
          
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-950/50 text-indigo-300 text-xs font-semibold mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>Verified Student Community</span>
          </div>

          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Create Student Account
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Join verified campus ridesharing with your college email
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Registration Successful!</h3>
              <p className="text-sm text-slate-300 max-w-md mx-auto mb-8 leading-relaxed">
                Your campus account has been created. Check your verification token or enter it directly to activate your account.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/verify"
                  className="flex-1 py-3.5 px-5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition text-center shadow-lg shadow-indigo-600/25"
                >
                  Verify Account Token
                </Link>
                <Link
                  href="/login"
                  className="flex-1 py-3.5 px-5 rounded-xl text-sm font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition text-center border border-slate-700"
                >
                  Go to Sign In
                </Link>
              </div>
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
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-indigo-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alex Johnson"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full h-12 pl-12 pr-4 bg-slate-950/90 border border-slate-700/80 rounded-xl text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                    />
                  </div>
                </div>

                {/* College Email */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      College Email Address
                    </label>
                    <span className="text-[11px] font-semibold text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-500/20">
                      @college.edu or @ac.in
                    </span>
                  </div>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-indigo-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      required
                      placeholder="alex@college.edu"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full h-12 pl-12 pr-4 bg-slate-950/90 border border-slate-700/80 rounded-xl text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Password (Min 8 characters)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-indigo-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="password"
                      required
                      minLength={8}
                      placeholder="••••••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full h-12 pl-12 pr-4 bg-slate-950/90 border border-slate-700/80 rounded-xl text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                    />
                  </div>
                </div>

                {/* Student ID & Academic Year */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                      Student / Roll ID
                    </label>
                    <div className="relative">
                      <IdCard className="w-4 h-4 text-indigo-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="e.g. CS2023-042"
                        value={formData.college_id}
                        onChange={(e) => setFormData({ ...formData, college_id: e.target.value })}
                        className="w-full h-12 pl-12 pr-4 bg-slate-950/90 border border-slate-700/80 rounded-xl text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                      Academic Year
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-indigo-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <select
                        value={formData.year}
                        onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                        className="w-full h-12 pl-12 pr-4 bg-slate-950/90 border border-slate-700/80 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition cursor-pointer"
                      >
                        <option value="">Select Year</option>
                        <option value="1">Year 1 (Freshman)</option>
                        <option value="2">Year 2 (Sophomore)</option>
                        <option value="3">Year 3 (Junior)</option>
                        <option value="4">Year 4 (Senior)</option>
                        <option value="5">Year 5 (Graduate/PG)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Department & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                      Department
                    </label>
                    <div className="relative">
                      <Building className="w-4 h-4 text-indigo-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="e.g. Computer Science"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className="w-full h-12 pl-12 pr-4 bg-slate-950/90 border border-slate-700/80 rounded-xl text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                      Phone Number (Optional)
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-indigo-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="tel"
                        placeholder="e.g. +91 9876543210"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full h-12 pl-12 pr-4 bg-slate-950/90 border border-slate-700/80 rounded-xl text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 mt-4 flex items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/30 disabled:opacity-50 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                >
                  <span>{loading ? 'Creating Student Profile...' : 'Complete Registration'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-slate-800 text-center">
                <p className="text-xs text-slate-400">
                  Already registered on Campus Carpool?{' '}
                  <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold ml-1 underline-offset-2 hover:underline">
                    Sign in here
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

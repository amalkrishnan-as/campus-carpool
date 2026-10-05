'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { Vehicle } from '@/types';
import { Navbar } from '@/components/Navbar';
import { UserAvatar } from '@/components/UserAvatar';
import { RatingStars } from '@/components/RatingStars';
import { Modal } from '@/components/Modal';
import { VehicleForm } from '@/components/VehicleForm';
import { LoadingState } from '@/components/LoadingState';
import {
  User,
  Mail,
  Building,
  Calendar,
  Phone,
  IdCard,
  Car,
  Plus,
  Trash2,
  ShieldCheck,
  Star,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { user, token, loading: authLoading, refreshUser } = useAuth();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);

  // Edit profile form
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !token) {
      router.push('/login');
      return;
    }

    if (user) {
      setName(user.name || '');
      setDepartment(user.department || '');
      setYear(user.year ? String(user.year) : '');
      setPhone(user.phone || '');
    }

    if (token) {
      api.vehicles.list(token)
        .then((data) => setVehicles(data as Vehicle[]))
        .catch(() => {})
        .finally(() => setLoadingVehicles(false));
    }
  }, [user, token, authLoading, router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      await api.users.updateMe(token, {
        name: name.trim(),
        department: department.trim() || undefined,
        year: year ? parseInt(year) : undefined,
        phone: phone.trim() || undefined,
      });
      await refreshUser();
      setMessage('Profile updated successfully!');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddVehicle = async (data: {
    type: string;
    model: string;
    registration_number: string;
    seat_capacity: number;
  }) => {
    if (!token) return;
    const newV = (await api.vehicles.create(token, data)) as Vehicle;
    setVehicles((prev) => [...prev, newV]);
    setIsAddVehicleOpen(false);
  };

  const handleDeleteVehicle = async (id: string) => {
    if (!token) return;
    if (!confirm('Are you sure you want to remove this vehicle?')) return;
    try {
      await api.vehicles.delete(token, id);
      setVehicles((prev) => prev.filter((v) => v.id !== id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to remove vehicle');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <LoadingState message="Loading profile..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">Student Profile</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your personal academic identity and registered vehicles
          </p>
        </div>

        {message && (
          <div className="flex items-center gap-2.5 p-4 mb-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2.5 p-4 mb-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Profile Card & Trust */}
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 text-center backdrop-blur-xl">
              <div className="flex justify-center mb-4">
                <UserAvatar name={user?.name || 'Student'} size="xl" />
              </div>
              <h3 className="text-lg font-bold text-white">{user?.name}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mt-3">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{user?.status}</span>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-800 flex items-center justify-around">
                <div>
                  <div className="flex items-center justify-center gap-1 text-amber-400 font-bold text-lg">
                    <Star className="w-4 h-4 fill-amber-400" />
                    <span>{user?.average_rating ? user.average_rating.toFixed(1) : '5.0'}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Rating ({user?.rating_count || 0})</p>
                </div>

                <div className="h-8 w-px bg-slate-800" />

                <div>
                  <p className="font-bold text-lg text-white">{vehicles.length}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Vehicles</p>
                </div>
              </div>
            </div>

            {/* Academic Info */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3 text-xs">
              <h4 className="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-2">
                College Record
              </h4>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-500">Student ID</span>
                <span className="font-mono">{user?.college_id || 'Not specified'}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-500">Department</span>
                <span>{user?.department || 'Not specified'}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-500">Academic Year</span>
                <span>{user?.year ? `Year ${user.year}` : 'Not specified'}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Edit Profile & Vehicles */}
          <div className="lg:col-span-2 space-y-8">
            {/* Edit Info Form */}
            <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl">
              <h3 className="text-lg font-bold text-white mb-6">Edit Profile Information</h3>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Department</label>
                    <input
                      type="text"
                      placeholder="e.g. Electrical Engineering"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Year of Study</label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      placeholder="e.g. 3"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="e.g. +91 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>

                <div className="flex justify-end pt-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Profile Changes'}
                  </button>
                </div>
              </form>
            </div>

            {/* Registered Vehicles */}
            <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white">Registered Vehicles</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Vehicles available for offering carpools</p>
                </div>

                <button
                  onClick={() => setIsAddVehicleOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Vehicle</span>
                </button>
              </div>

              {loadingVehicles ? (
                <LoadingState message="Loading vehicles..." minHeight="min-h-[150px]" />
              ) : vehicles.length > 0 ? (
                <div className="space-y-3">
                  {vehicles.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/60 border border-slate-800"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20">
                          <Car className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-white">{v.model}</h4>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {v.registration_number} • {v.seat_capacity} seats • {v.type}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteVehicle(v.id)}
                        className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition"
                        title="Delete vehicle"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-slate-950/40 border border-dashed border-slate-800 text-center">
                  <Car className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">No vehicles registered yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal for adding a vehicle */}
        <Modal
          isOpen={isAddVehicleOpen}
          onClose={() => setIsAddVehicleOpen(false)}
          title="Register a Campus Vehicle"
        >
          <VehicleForm
            onSubmit={handleAddVehicle}
            onCancel={() => setIsAddVehicleOpen(false)}
          />
        </Modal>
      </main>
    </div>
  );
}

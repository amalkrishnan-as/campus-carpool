'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { Vehicle } from '@/types';
import { Navbar } from '@/components/Navbar';
import { Modal } from '@/components/Modal';
import { VehicleForm } from '@/components/VehicleForm';
import {
  Car,
  MapPin,
  Calendar,
  Clock,
  Users,
  DollarSign,
  FileText,
  Plus,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export default function CreateRidePage() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);

  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [pickupPoint, setPickupPoint] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [availableSeats, setAvailableSeats] = useState(3);
  const [contribution, setContribution] = useState('');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !token) {
      router.push('/login');
      return;
    }

    if (token) {
      api.vehicles.list(token)
        .then((data) => {
          const vList = data as Vehicle[];
          setVehicles(vList);
          if (vList.length > 0) {
            setVehicleId(vList[0].id);
            setAvailableSeats(vList[0].seat_capacity);
          }
        })
        .catch(() => {})
        .finally(() => setLoadingVehicles(false));
    }
  }, [token, authLoading, router]);

  const handleVehicleChange = (id: string) => {
    setVehicleId(id);
    const chosen = vehicles.find((v) => v.id === id);
    if (chosen) {
      setAvailableSeats(chosen.seat_capacity);
    }
  };

  const handleCreateRide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError(null);

    if (!vehicleId) {
      setError('Please add and select a registered vehicle.');
      return;
    }

    if (!source.trim() || !destination.trim() || !pickupPoint.trim()) {
      setError('Please fill in source, destination, and pickup point.');
      return;
    }

    if (!departureDate || !departureTime) {
      setError('Please select departure date and time.');
      return;
    }

    setSubmitting(true);

    try {
      await api.rides.create(token, {
        source: source.trim(),
        destination: destination.trim(),
        pickup_point: pickupPoint.trim(),
        departure_date: departureDate,
        departure_time: departureTime,
        vehicle_id: vehicleId,
        available_seats: availableSeats,
        contribution: contribution ? parseFloat(contribution) : 0,
        notes: notes.trim() || undefined,
      });

      router.push('/my-rides');
    } catch (err: unknown) {
      let msg = 'Failed to publish ride.';
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
      setSubmitting(false);
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
    setVehicleId(newV.id);
    setAvailableSeats(newV.seat_capacity);
    setIsAddVehicleOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">Offer a Campus Ride</h1>
          <p className="text-sm text-slate-400 mt-1">
            Have empty seats? Share your route with college peers and split travel expenses.
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 mb-6 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleCreateRide} className="space-y-6">
            {/* Vehicle Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-slate-300">Select Vehicle</label>
                <button
                  type="button"
                  onClick={() => setIsAddVehicleOpen(true)}
                  className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Register New Vehicle</span>
                </button>
              </div>

              {vehicles.length === 0 && !loadingVehicles ? (
                <div className="p-4 rounded-xl border border-dashed border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs flex items-center justify-between">
                  <span>You need to register at least one vehicle before offering a ride.</span>
                  <button
                    type="button"
                    onClick={() => setIsAddVehicleOpen(true)}
                    className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded-lg transition"
                  >
                    Add Vehicle
                  </button>
                </div>
              ) : (
                <select
                  value={vehicleId}
                  onChange={(e) => handleVehicleChange(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.model} ({v.registration_number}) — {v.seat_capacity} seats
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Route */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Origin / Departure Point</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Campus Main Gate"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder:text-slate-600 text-sm focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Destination</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Central Railway Station"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder:text-slate-600 text-sm focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>
            </div>

            {/* Pickup Point */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Exact Pickup Landmark / Spot
              </label>
              <input
                type="text"
                required
                placeholder="e.g. In front of College Library porch"
                value={pickupPoint}
                onChange={(e) => setPickupPoint(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder:text-slate-600 text-sm focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Departure Date</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="date"
                    required
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Departure Time</label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="time"
                    required
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>
            </div>

            {/* Available Seats & Cost Contribution */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Available Seats</label>
                <div className="relative">
                  <Users className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="number"
                    min="1"
                    max="8"
                    required
                    value={availableSeats}
                    onChange={(e) => setAvailableSeats(parseInt(e.target.value) || 1)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Fuel Contribution per Seat (₹ / $)
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0 for free / community"
                    value={contribution}
                    onChange={(e) => setContribution(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder:text-slate-600 text-sm focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Notes for Passengers (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Boot space available for backpacks. Leaving promptly on time."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder:text-slate-600 text-sm focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || vehicles.length === 0}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/25 disabled:opacity-50 transition active:scale-[0.99]"
            >
              <span>{submitting ? 'Publishing Ride...' : 'Publish Carpool Ride'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
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

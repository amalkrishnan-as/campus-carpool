'use client';

import { useState } from 'react';
import { Vehicle } from '@/types';
import { Car, Bike, ShieldCheck, AlertCircle } from 'lucide-react';

interface VehicleFormProps {
  initialData?: Vehicle;
  onSubmit: (data: {
    type: string;
    model: string;
    registration_number: string;
    seat_capacity: number;
  }) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
}

export function VehicleForm({ initialData, onSubmit, onCancel, loading }: VehicleFormProps) {
  const [type, setType] = useState(initialData?.type || 'CAR');
  const [model, setModel] = useState(initialData?.model || '');
  const [registrationNumber, setRegistrationNumber] = useState(
    initialData?.registration_number || ''
  );
  const [seatCapacity, setSeatCapacity] = useState(initialData?.seat_capacity || 3);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!model.trim() || !registrationNumber.trim()) {
      setError('Please provide vehicle model and registration number.');
      return;
    }

    if (seatCapacity < 1 || seatCapacity > 8) {
      setError('Seat capacity must be between 1 and 8.');
      return;
    }

    try {
      await onSubmit({
        type,
        model: model.trim(),
        registration_number: registrationNumber.trim().toUpperCase(),
        seat_capacity: seatCapacity,
      });
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to save vehicle details.';
      setError(errorMsg);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1.5">Vehicle Type</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              setType('CAR');
              if (seatCapacity === 1) setSeatCapacity(3);
            }}
            className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition ${
              type === 'CAR'
                ? 'bg-indigo-600/20 border-indigo-500 text-white'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Car className="w-4 h-4" />
            Car / Hatchback / Sedan
          </button>
          <button
            type="button"
            onClick={() => {
              setType('BIKE');
              setSeatCapacity(1);
            }}
            className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition ${
              type === 'BIKE'
                ? 'bg-indigo-600/20 border-indigo-500 text-white'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Bike className="w-4 h-4" />
            Two-Wheeler / Scooter
          </button>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1.5">
          Make & Model (e.g. Honda City, Hyundai i20, Royal Enfield)
        </label>
        <input
          type="text"
          required
          placeholder="e.g. Maruti Swift"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1.5">
          Registration Number (License Plate)
        </label>
        <input
          type="text"
          required
          placeholder="e.g. KL-01-AB-1234"
          value={registrationNumber}
          onChange={(e) => setRegistrationNumber(e.target.value)}
          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm uppercase focus:outline-none focus:border-indigo-500 transition"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1.5">
          Passenger Seat Capacity (Excluding Driver)
        </label>
        <input
          type="number"
          min="1"
          max={type === 'BIKE' ? 1 : 8}
          required
          value={seatCapacity}
          onChange={(e) => setSeatCapacity(parseInt(e.target.value) || 1)}
          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition"
        />
        <p className="text-[11px] text-slate-500 mt-1">
          {type === 'BIKE' ? 'Maximum 1 pillion rider permitted.' : 'Seats available for campus peers.'}
        </p>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-1.5 px-5 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition"
        >
          <ShieldCheck className="w-4 h-4" />
          {loading ? 'Saving...' : initialData ? 'Update Vehicle' : 'Register Vehicle'}
        </button>
      </div>
    </form>
  );
}

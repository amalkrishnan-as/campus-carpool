'use client';

import { Search, MapPin, Calendar, Users, DollarSign, Filter, RefreshCcw } from 'lucide-react';

export interface FilterParams {
  source?: string;
  destination?: string;
  date?: string;
  vehicle_type?: string;
  min_seats?: number;
  max_contribution?: number;
}

interface RideFiltersProps {
  filters: FilterParams;
  onChange: (filters: FilterParams) => void;
  onSearch: () => void;
  onReset: () => void;
}

export function RideFilters({ filters, onChange, onSearch, onReset }: RideFiltersProps) {
  return (
    <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl shadow-xl backdrop-blur-md">
      <div className="flex items-center gap-2 mb-4 text-indigo-400 font-semibold text-sm">
        <Filter className="w-4 h-4" />
        <span>Filter & Search Rides</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Source */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Origin / Campus</label>
          <div className="relative">
            <MapPin className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="e.g. Campus Main Gate"
              value={filters.source || ''}
              onChange={(e) => onChange({ ...filters, source: e.target.value })}
              className="w-full pl-10 pr-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-200 placeholder:text-slate-600 text-sm focus:outline-none focus:border-indigo-500 transition"
            />
          </div>
        </div>

        {/* Destination */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Destination</label>
          <div className="relative">
            <MapPin className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="e.g. City Center / Railway Station"
              value={filters.destination || ''}
              onChange={(e) => onChange({ ...filters, destination: e.target.value })}
              className="w-full pl-10 pr-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-200 placeholder:text-slate-600 text-sm focus:outline-none focus:border-indigo-500 transition"
            />
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Departure Date</label>
          <div className="relative">
            <Calendar className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
            <input
              type="date"
              value={filters.date || ''}
              onChange={(e) => onChange({ ...filters, date: e.target.value })}
              className="w-full pl-10 pr-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-200 placeholder:text-slate-600 text-sm focus:outline-none focus:border-indigo-500 transition"
            />
          </div>
        </div>

        {/* Vehicle Type */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Vehicle Type</label>
          <select
            value={filters.vehicle_type || ''}
            onChange={(e) => onChange({ ...filters, vehicle_type: e.target.value || undefined })}
            className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition"
          >
            <option value="">Any Vehicle</option>
            <option value="CAR">Car</option>
            <option value="BIKE">Motorcycle / Scooter</option>
            <option value="SUV">SUV</option>
          </select>
        </div>

        {/* Min Seats */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Min Available Seats</label>
          <div className="relative">
            <Users className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
            <input
              type="number"
              min="1"
              max="8"
              placeholder="e.g. 1"
              value={filters.min_seats || ''}
              onChange={(e) =>
                onChange({ ...filters, min_seats: e.target.value ? parseInt(e.target.value) : undefined })
              }
              className="w-full pl-10 pr-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-200 placeholder:text-slate-600 text-sm focus:outline-none focus:border-indigo-500 transition"
            />
          </div>
        </div>

        {/* Max Contribution */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Max Contribution (₹ / $)</label>
          <div className="relative">
            <DollarSign className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
            <input
              type="number"
              min="0"
              placeholder="e.g. 150"
              value={filters.max_contribution || ''}
              onChange={(e) =>
                onChange({ ...filters, max_contribution: e.target.value ? parseFloat(e.target.value) : undefined })
              }
              className="w-full pl-10 pr-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-200 placeholder:text-slate-600 text-sm focus:outline-none focus:border-indigo-500 transition"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-xl transition"
        >
          <RefreshCcw className="w-3.5 h-3.5" />
          Reset
        </button>
        <button
          type="button"
          onClick={onSearch}
          className="flex items-center gap-2 px-6 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/20 transition"
        >
          <Search className="w-4 h-4" />
          Find Rides
        </button>
      </div>
    </div>
  );
}

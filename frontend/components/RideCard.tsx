import { Ride } from '@/types';
import Link from 'next/link';
import { MapPin, Clock, Users, DollarSign, Star, Car } from 'lucide-react';

interface RideCardProps {
  ride: Ride;
  showActions?: boolean;
  onCancel?: () => void;
  onStart?: () => void;
  onComplete?: () => void;
  currentUserId?: string;
}

function StatusBadge({ status }: { status: string }) {
  return <span className={`badge badge-${status.toLowerCase()}`}>{status}</span>;
}

function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <span className="flex items-center gap-1 text-xs text-slate-400">
      <Star size={12} className="star fill-current" />
      <span>{rating > 0 ? rating.toFixed(1) : 'New'}</span>
      {count > 0 && <span>({count})</span>}
    </span>
  );
}

export function RideCard({ ride, showActions, onCancel, onStart, onComplete, currentUserId }: RideCardProps) {
  const isDriver = currentUserId && ride.driver_id === currentUserId;

  return (
    <div className="card hover:cursor-pointer animate-fade-in">
      <Link href={`/rides/${ride.id}`} className="block">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <MapPin size={14} className="text-indigo-400 shrink-0" />
                <span className="text-sm font-semibold text-white truncate">{ride.source}</span>
              </div>
              <span className="text-slate-500 shrink-0">→</span>
              <div className="flex items-center gap-1.5 min-w-0">
                <MapPin size={14} className="text-purple-400 shrink-0" />
                <span className="text-sm font-semibold text-white truncate">{ride.destination}</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-1">📍 {ride.pickup_point}</p>
          </div>
          <StatusBadge status={ride.status} />
        </div>

        <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Clock size={13} className="text-slate-500" />
            <span>{ride.departure_date} at {ride.departure_time}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users size={13} className="text-slate-500" />
            <span>{ride.available_seats} seat{ride.available_seats !== 1 ? 's' : ''} available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <DollarSign size={13} className="text-slate-500" />
            <span>₹{ride.contribution}</span>
          </div>
          {ride.vehicle && (
            <div className="flex items-center gap-1.5">
              <Car size={13} className="text-slate-500" />
              <span>{ride.vehicle.model} ({ride.vehicle.type})</span>
            </div>
          )}
        </div>

        {ride.driver && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
              {ride.driver.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm text-slate-300 font-medium">{ride.driver.name}</p>
              <StarRating rating={ride.driver.average_rating} count={ride.driver.rating_count} />
            </div>
          </div>
        )}
      </Link>

      {showActions && (
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-white/5">
          {isDriver && ride.status === 'OPEN' && (
            <button onClick={onStart} className="btn-success text-xs py-1.5 px-3">Start Ride</button>
          )}
          {isDriver && ride.status === 'STARTED' && (
            <button onClick={onComplete} className="btn-success text-xs py-1.5 px-3">Complete Ride</button>
          )}
          {isDriver && (ride.status === 'OPEN' || ride.status === 'FULL') && (
            <button onClick={onCancel} className="btn-danger text-xs py-1.5 px-3">Cancel Ride</button>
          )}
        </div>
      )}
    </div>
  );
}

export default RideCard;

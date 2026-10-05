import { RideRequest } from '@/types';
import { Clock, User, Check, X } from 'lucide-react';

interface RequestCardProps {
  request: RideRequest;
  viewAs: 'driver' | 'passenger';
  onAccept?: () => void;
  onReject?: () => void;
  onCancel?: () => void;
}

function StatusBadge({ status }: { status: string }) {
  return <span className={`badge badge-${status.toLowerCase()}`}>{status}</span>;
}

export function RequestCard({ request, viewAs, onAccept, onReject, onCancel }: RequestCardProps) {
  const canAct = viewAs === 'driver' && request.status === 'PENDING';
  const canCancel = viewAs === 'passenger' && (request.status === 'PENDING' || request.status === 'ACCEPTED');

  return (
    <div className="card animate-fade-in">
      <div className="flex items-start justify-between mb-3">
        {request.ride && (
          <div>
            <p className="text-sm font-semibold text-white">
              {request.ride.source} → {request.ride.destination}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {request.ride.departure_date} at {request.ride.departure_time}
            </p>
          </div>
        )}
        <StatusBadge status={request.status} />
      </div>

      {request.passenger && viewAs === 'driver' && (
        <div className="flex items-center gap-2 mt-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
            {request.passenger.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm text-slate-300">{request.passenger.name}</p>
            {request.passenger.department && (
              <p className="text-xs text-slate-500">{request.passenger.department}</p>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
        <Clock size={12} />
        <span>Requested {new Date(request.created_at).toLocaleDateString()}</span>
      </div>

      {(canAct || canCancel) && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-white/5">
          {canAct && (
            <>
              <button onClick={onAccept} className="btn-success text-xs py-1.5 px-3 flex items-center gap-1">
                <Check size={13} /> Accept
              </button>
              <button onClick={onReject} className="btn-danger text-xs py-1.5 px-3 flex items-center gap-1">
                <X size={13} /> Reject
              </button>
            </>
          )}
          {canCancel && (
            <button onClick={onCancel} className="btn-danger text-xs py-1.5 px-3">Cancel Request</button>
          )}
        </div>
      )}
    </div>
  );
}

export default RequestCard;

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { Ride, RideRequest, Rating } from '@/types';
import { Navbar } from '@/components/Navbar';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { UserAvatar } from '@/components/UserAvatar';
import { RatingStars } from '@/components/RatingStars';
import { RequestCard } from '@/components/RequestCard';
import { Modal } from '@/components/Modal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import {
  Car,
  MapPin,
  Calendar,
  Clock,
  Users,
  DollarSign,
  Star,
  ShieldCheck,
  AlertCircle,
  CheckCircle,
  XCircle,
  Share2,
  Flag,
} from 'lucide-react';

export default function RideDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, token } = useAuth();
  const rideId = params?.id as string;

  const [ride, setRide] = useState<Ride | null>(null);
  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [myRequest, setMyRequest] = useState<RideRequest | null>(null);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Modals
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('MISCONDUCT');
  const [reportDesc, setReportDesc] = useState('');

  // Rating modal
  const [isRateOpen, setIsRateOpen] = useState(false);
  const [rateUserId, setRateUserId] = useState('');
  const [rateScore, setRateScore] = useState(5);
  const [rateComment, setRateComment] = useState('');

  const loadRide = async () => {
    if (!rideId) return;
    try {
      const r = (await api.rides.get(rideId)) as Ride;
      setRide(r);

      const ratingList = (await api.rides.getRatings(rideId).catch(() => [])) as Rating[];
      setRatings(ratingList);

      if (token) {
        if (user && r.driver_id === user.id) {
          const reqs = (await api.rides.getRequests(token, rideId)) as RideRequest[];
          setRequests(reqs);
        } else {
          const myReqs = (await api.requests.my(token)) as RideRequest[];
          const found = myReqs.find((req) => req.ride_id === rideId);
          if (found) setMyRequest(found);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load ride details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRide();
  }, [rideId, token, user]);

  const isDriver = user && ride && ride.driver_id === user.id;

  const handleRequestSeat = async () => {
    if (!token) {
      router.push('/login');
      return;
    }
    setActionLoading(true);
    setError(null);
    try {
      const res = (await api.rides.request(token, rideId)) as RideRequest;
      setMyRequest(res);
      setMessage('Seat requested successfully! Waiting for driver confirmation.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not request seat.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!token || !myRequest) return;
    setActionLoading(true);
    try {
      await api.requests.cancel(token, myRequest.id);
      setMyRequest((prev) => (prev ? { ...prev, status: 'CANCELLED' } : null));
      loadRide();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to cancel request.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptRequest = async (reqId: string) => {
    if (!token) return;
    try {
      await api.requests.accept(token, reqId);
      loadRide();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to accept request.');
    }
  };

  const handleRejectRequest = async (reqId: string) => {
    if (!token) return;
    try {
      await api.requests.reject(token, reqId);
      loadRide();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reject request.');
    }
  };

  const handleStartRide = async () => {
    if (!token || !ride) return;
    try {
      const updated = (await api.rides.start(token, ride.id)) as Ride;
      setRide(updated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to start ride.');
    }
  };

  const handleCompleteRide = async () => {
    if (!token || !ride) return;
    try {
      const updated = (await api.rides.complete(token, ride.id)) as Ride;
      setRide(updated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to complete ride.');
    }
  };

  const handleCancelRide = async () => {
    if (!token || !ride) return;
    try {
      const updated = (await api.rides.cancel(token, ride.id)) as Ride;
      setRide(updated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to cancel ride.');
    }
  };

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !rateUserId) return;
    try {
      await api.rides.rate(token, rideId, {
        reviewed_user_id: rateUserId,
        rating: rateScore,
        comment: rateComment.trim() || undefined,
      });
      setIsRateOpen(false);
      setMessage('Rating submitted successfully!');
      loadRide();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit rating.');
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !ride) return;
    try {
      await api.reports.create(token, {
        reported_user_id: ride.driver_id,
        ride_id: ride.id,
        reason: reportReason,
        description: reportDesc.trim(),
      });
      setIsReportOpen(false);
      setMessage('Report submitted to campus admins for review.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit report.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <LoadingState message="Loading ride details..." />
        </div>
      </div>
    );
  }

  if (error && !ride) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <Navbar />
        <div className="flex-1 max-w-lg mx-auto flex items-center justify-center px-4">
          <ErrorState message={error} onRetry={loadRide} />
        </div>
      </div>
    );
  }

  if (!ride) return null;

  const statusColors = {
    OPEN: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    FULL: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    STARTED: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    COMPLETED: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    CANCELLED: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    EXPIRED: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-10">
        {/* Breadcrumb / Top Bar */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/rides/search"
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
          >
            ← Back to all rides
          </Link>

          <div className="flex items-center gap-2">
            {!isDriver && (
              <button
                onClick={() => setIsReportOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 text-xs transition"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Report</span>
              </button>
            )}
          </div>
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
          {/* Ride Overview (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl">
              <div className="flex items-center justify-between pb-6 border-b border-slate-800">
                <span
                  className={`text-xs px-3 py-1 rounded-full font-semibold border uppercase tracking-wider ${
                    statusColors[ride.status]
                  }`}
                >
                  {ride.status}
                </span>

                <div className="flex items-center gap-1 text-slate-400 text-xs">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  <span>{ride.departure_date}</span>
                  <span className="mx-1">•</span>
                  <Clock className="w-4 h-4 text-purple-400" />
                  <span>{ride.departure_time}</span>
                </div>
              </div>

              {/* Route Display */}
              <div className="py-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Departure Campus / Point</p>
                    <h3 className="text-lg font-bold text-white">{ride.source}</h3>
                    <p className="text-xs text-indigo-400 mt-0.5 font-medium">
                      Pickup Landmark: {ride.pickup_point}
                    </p>
                  </div>
                </div>

                <div className="ml-3 pl-3 border-l-2 border-dashed border-slate-800 py-1" />

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Arrival Destination</p>
                    <h3 className="text-lg font-bold text-white">{ride.destination}</h3>
                  </div>
                </div>
              </div>

              {/* Vehicle & Specs */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-800">
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-[11px] text-slate-500 uppercase font-semibold">Available Seats</span>
                  <div className="flex items-center gap-1.5 mt-1 text-indigo-400 font-bold text-lg">
                    <Users className="w-5 h-5" />
                    <span>{ride.available_seats} / {ride.original_seats}</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-[11px] text-slate-500 uppercase font-semibold">Contribution</span>
                  <div className="flex items-center gap-1 mt-1 text-emerald-400 font-bold text-lg">
                    <span>₹{parseFloat(ride.contribution).toFixed(2)}</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 col-span-2 sm:col-span-1">
                  <span className="text-[11px] text-slate-500 uppercase font-semibold">Vehicle</span>
                  <div className="flex items-center gap-1.5 mt-1 text-slate-200 font-medium text-xs">
                    <Car className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">{ride.vehicle?.model || 'Campus Car'}</span>
                  </div>
                </div>
              </div>

              {ride.notes && (
                <div className="mt-6 p-4 rounded-2xl bg-slate-950/40 border border-slate-800 text-xs text-slate-300">
                  <span className="text-[11px] text-slate-500 uppercase font-semibold block mb-1">
                    Driver Notes
                  </span>
                  <p>{ride.notes}</p>
                </div>
              )}
            </div>

            {/* If Driver: Manage Requests & Ride Lifecycle */}
            {isDriver && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-base font-bold text-white">Ride Management</h3>
                    <p className="text-xs text-slate-400">Control lifecycle and incoming seat requests</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {ride.status === 'OPEN' && (
                      <>
                        <button
                          onClick={handleStartRide}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold transition"
                        >
                          Start Ride
                        </button>
                        <button
                          onClick={handleCancelRide}
                          className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 rounded-xl text-xs font-semibold transition"
                        >
                          Cancel Ride
                        </button>
                      </>
                    )}
                    {ride.status === 'STARTED' && (
                      <button
                        onClick={handleCompleteRide}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold transition"
                      >
                        Complete Ride
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-3">
                    Passenger Requests ({requests.length})
                  </h4>
                  {requests.length > 0 ? (
                    requests.map((req) => (
                      <div key={req.id} className="space-y-2">
                        <RequestCard
                          request={req}
                          viewAs="driver"
                          onAccept={() => handleAcceptRequest(req.id)}
                          onReject={() => handleRejectRequest(req.id)}
                        />
                        {ride.status === 'COMPLETED' && req.status === 'ACCEPTED' && (
                          <div className="flex justify-end">
                            <button
                              onClick={() => {
                                setRateUserId(req.passenger_id);
                                setIsRateOpen(true);
                              }}
                              className="px-3 py-1 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 rounded-lg text-xs font-medium transition"
                            >
                              Rate Passenger
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 py-3 text-center">No passenger requests yet.</p>
                  )}
                </div>
              </div>
            )}

            {/* Ride Ratings Section */}
            {ratings.length > 0 && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl">
                <h3 className="text-base font-bold text-white mb-4">Trip Reviews & Ratings</h3>
                <div className="space-y-3">
                  {ratings.map((rate) => (
                    <div key={rate.id} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                      <div className="flex items-center justify-between mb-2">
                        <RatingStars rating={rate.rating} size="sm" />
                        <span className="text-[11px] text-slate-500">
                          {new Date(rate.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {rate.comment && <p className="text-xs text-slate-300">{rate.comment}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Driver Profile & Booking CTA (1 col) */}
          <div className="space-y-6">
            {/* Driver Profile Card */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-4">
                <UserAvatar name={ride.driver?.name || 'Driver'} size="lg" />
                <div>
                  <h4 className="text-sm font-bold text-white">{ride.driver?.name}</h4>
                  <p className="text-xs text-slate-400">
                    {ride.driver?.department || 'Verified Student'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 mb-6">
                <div className="flex items-center gap-1 text-amber-400 font-bold text-sm">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span>{ride.driver?.average_rating ? ride.driver.average_rating.toFixed(1) : '5.0'}</span>
                </div>
                <span className="text-xs text-slate-500">
                  ({ride.driver?.rating_count || 0} reviews)
                </span>
                <span className="ml-auto text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Verified
                </span>
              </div>

              {/* Passenger CTA Button */}
              {!isDriver && (
                <div className="space-y-3">
                  {myRequest ? (
                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-center">
                      <p className="text-xs text-slate-400 mb-1">Your Request Status</p>
                      <p className="text-sm font-bold text-indigo-400 mb-3 uppercase tracking-wide">
                        {myRequest.status}
                      </p>
                      {myRequest.status === 'PENDING' && (
                        <button
                          onClick={handleCancelRequest}
                          disabled={actionLoading}
                          className="w-full py-2 px-3 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500 text-rose-300 hover:text-white text-xs font-semibold transition"
                        >
                          Cancel Request
                        </button>
                      )}
                      {ride.status === 'COMPLETED' && myRequest.status === 'ACCEPTED' && (
                        <button
                          onClick={() => {
                            setRateUserId(ride.driver_id);
                            setIsRateOpen(true);
                          }}
                          className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition shadow-lg shadow-indigo-600/20"
                        >
                          Rate Driver
                        </button>
                      )}
                    </div>
                  ) : ride.status === 'OPEN' && ride.available_seats > 0 ? (
                    <button
                      onClick={handleRequestSeat}
                      disabled={actionLoading}
                      className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/25 disabled:opacity-50 transition"
                    >
                      {actionLoading ? 'Sending Request...' : 'Request Seat'}
                    </button>
                  ) : (
                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-400">
                      This ride is currently {ride.status.toLowerCase()} and cannot accept new requests.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal for Rating */}
        <Modal isOpen={isRateOpen} onClose={() => setIsRateOpen(false)} title="Submit Peer Rating">
          <form onSubmit={handleSubmitRating} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">Rating (1 to 5 Stars)</label>
              <div className="flex items-center justify-center p-4 bg-slate-950 rounded-2xl border border-slate-800">
                <RatingStars
                  rating={rateScore}
                  interactive={true}
                  size="lg"
                  onRatingChange={(s) => setRateScore(s)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Feedback / Comments</label>
              <textarea
                rows={3}
                placeholder="Great driving, on-time, courteous..."
                value={rateComment}
                onChange={(e) => setRateComment(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition"
            >
              Submit Rating
            </button>
          </form>
        </Modal>

        {/* Modal for Reporting */}
        <Modal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} title="Report User or Ride">
          <form onSubmit={handleSubmitReport} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Reason for Report</label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition"
              >
                <option value="UNSAFE_DRIVING">Unsafe Driving</option>
                <option value="NO_SHOW">No Show</option>
                <option value="HARASSMENT">Harassment</option>
                <option value="FAKE_PROFILE">Fake Profile</option>
                <option value="MISCONDUCT">Misconduct</option>
                <option value="SPAM">Spam</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Description of Incident</label>
              <textarea
                rows={4}
                required
                placeholder="Provide detailed information for campus admin review..."
                value={reportDesc}
                onChange={(e) => setReportDesc(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold transition"
            >
              Submit Report
            </button>
          </form>
        </Modal>
      </main>
    </div>
  );
}

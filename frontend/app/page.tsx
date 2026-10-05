'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import {
  Car,
  Search,
  ShieldCheck,
  Users,
  Compass,
  Sparkles,
  MapPin,
  Clock,
  HeartHandshake,
  CheckCircle,
  ArrowRight,
  Shield,
  Star,
  Calendar,
} from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (source.trim()) params.append('source', source.trim());
    if (destination.trim()) params.append('destination', destination.trim());
    if (date) params.append('date', date);
    router.push(`/rides/search?${params.toString()}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white bg-grid-pattern">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-20 sm:pt-28 md:pt-32 pb-20 md:pb-28 overflow-hidden">
        {/* Glow gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[450px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/15 to-pink-500/10 blur-[150px] rounded-full pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-950/60 text-indigo-300 text-xs font-semibold mb-8 backdrop-blur-md shadow-lg shadow-indigo-950/40">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Exclusive to Verified College Students</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.15] mb-6">
            Find your way home.{' '}
            <span className="block mt-1 sm:inline sm:mt-0 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400">
              Share the ride.
            </span>
          </h1>

          <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            Travel safely with your campus community. Split travel contributions, reduce your carbon
            footprint, and commute with verified peers from your university.
          </p>

          {/* Quick Route Search Widget */}
          <div className="max-w-3xl mx-auto mb-12 p-3 sm:p-4 rounded-3xl bg-slate-900/90 border border-slate-700/80 shadow-2xl backdrop-blur-xl">
            <form onSubmit={handleHeroSearch} className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-7 gap-2.5">
              <div className="sm:col-span-2 relative">
                <MapPin className="w-4 h-4 text-indigo-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Leaving from (e.g. College Gate)"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full h-11 pl-10 pr-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 placeholder:text-slate-500 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                />
              </div>

              <div className="sm:col-span-2 relative">
                <Compass className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Heading to (e.g. Kazhakkoottam)"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full h-11 pl-10 pr-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 placeholder:text-slate-500 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                />
              </div>

              <div className="sm:col-span-2 relative">
                <Calendar className="w-4 h-4 text-pink-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full h-11 pl-10 pr-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                />
              </div>

              <div className="sm:col-span-3 md:col-span-1">
                <button
                  type="submit"
                  className="w-full h-11 flex items-center justify-center gap-1.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  <span>Search</span>
                </button>
              </div>
            </form>
          </div>

          {/* Secondary CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-16">
            <Link
              href="/rides/search"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Search className="w-4 h-4" />
              <span>Browse All Rides</span>
            </Link>
            <Link
              href="/rides/create"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-slate-200 bg-slate-900 border border-slate-700/80 hover:bg-slate-800 hover:text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Car className="w-4 h-4" />
              <span>Offer Empty Seats</span>
            </Link>
          </div>

          {/* Quick Stats Banner */}
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-xl grid grid-cols-2 md:grid-cols-4 gap-6 text-center max-w-4xl mx-auto">
            <div className="p-3">
              <p className="text-3xl font-extrabold text-indigo-400">100%</p>
              <p className="text-xs font-medium text-slate-400 mt-1">Verified College IDs</p>
            </div>
            <div className="p-3">
              <p className="text-3xl font-extrabold text-purple-400">0%</p>
              <p className="text-xs font-medium text-slate-400 mt-1">Commercial Markups</p>
            </div>
            <div className="p-3">
              <p className="text-3xl font-extrabold text-pink-400">5.0 ★</p>
              <p className="text-xs font-medium text-slate-400 mt-1">Peer Ratings & Reviews</p>
            </div>
            <div className="p-3">
              <p className="text-3xl font-extrabold text-emerald-400">Green</p>
              <p className="text-xs font-medium text-slate-400 mt-1">Low Carbon Footprint</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-slate-900/40 border-y border-slate-800/80 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2">
              Simple & Community-Driven
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white">
              How Campus Carpool Works
            </h3>
            <p className="text-slate-400 text-sm mt-3 leading-relaxed">
              Commuting to campus or heading home for the weekend? Hitch a ride or share your empty seats in three straightforward steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md relative group hover:border-indigo-500/50 transition">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-lg mb-6 group-hover:scale-105 transition-transform">
                1
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Publish or Search Routes</h4>
              <p className="text-sm text-slate-400 leading-relaxed">
                Drivers list empty seats with their route, departure date, and nominal fuel contribution. Passengers browse routes leaving from or going to campus.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md relative group hover:border-purple-500/50 transition">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-lg mb-6 group-hover:scale-105 transition-transform">
                2
              </div>
              <h4 className="text-lg font-bold text-white mb-2">One-Click Request & Approval</h4>
              <p className="text-sm text-slate-400 leading-relaxed">
                Send a seat request. The driver reviews your campus profile and accepts with guaranteed seat allocation backed by safe transactional booking.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md relative group hover:border-pink-500/50 transition">
              <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center font-bold text-lg mb-6 group-hover:scale-105 transition-transform">
                3
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Travel Together & Rate</h4>
              <p className="text-sm text-slate-400 leading-relaxed">
                Meet at the agreed campus pickup point. Travel safely together, split the journey costs, and leave mutual feedback to build trust.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* College Trust & Verification Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-950/40 text-emerald-400 text-xs font-semibold mb-4">
                <ShieldCheck className="w-4 h-4" />
                <span>Strict Security Protocol</span>
              </div>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-white mb-6 leading-tight">
                Built strictly for students, by students. No outsiders.
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-6">
                Unlike commercial ridesharing apps, Campus Carpool enforces academic domain email validation and official student ID verification. You know precisely who is in the car with you.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-sm font-semibold text-slate-200">Mandatory College Identity</h5>
                    <p className="text-xs text-slate-400 mt-0.5">Only verified students with active institutional emails can register and book seats.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-sm font-semibold text-slate-200">Mutual Rating & Trust Scores</h5>
                    <p className="text-xs text-slate-400 mt-0.5">Driver punctuality and passenger reliability are transparently scored after every trip.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-sm font-semibold text-slate-200">Zero Commercial Exploitation</h5>
                    <p className="text-xs text-slate-400 mt-0.5">Strictly cost-sharing community carpooling. Fair fuel splitting without surge pricing.</p>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 hover:text-white hover:bg-slate-800 text-xs font-semibold transition"
                >
                  <span>Join your campus network</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Visual Card Mockup */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-3xl blur-2xl -z-10" />
              <div className="p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center justify-between pb-6 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-600/30 text-indigo-400 flex items-center justify-center font-bold">
                      AK
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Amal Krishna</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Computer Science • Year 3</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                    Verified Student
                  </span>
                </div>

                <div className="py-6 space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Route</span>
                    <span className="font-semibold text-slate-200">College Gate → Kazhakkoottam</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Departure</span>
                    <span className="text-slate-200">Friday • 5:15 PM</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Vehicle</span>
                    <span className="text-slate-200">Hyundai i20 (KL-01-BK-4589)</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Contribution</span>
                    <span className="text-emerald-400 font-bold">₹50 / seat</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400">2 seats remaining</span>
                  <span className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-300 font-medium">
                    Instant Request
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Car className="w-4 h-4" />
            </div>
            <span className="font-bold text-white text-base tracking-tight">Campus Carpool</span>
          </div>

          <p className="text-xs text-slate-500 text-center sm:text-left">
            &copy; {new Date().getFullYear()} Campus Carpool. Student cost-sharing platform for college communities.
          </p>

          <div className="flex items-center gap-6 text-xs text-slate-400">
            <Link href="/rides/search" className="hover:text-white transition">Rides</Link>
            <Link href="/login" className="hover:text-white transition">Sign In</Link>
            <Link href="/register" className="hover:text-white transition">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

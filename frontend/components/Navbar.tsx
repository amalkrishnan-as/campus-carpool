'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Bell,
  Car,
  Menu,
  X,
  LogOut,
  User,
  LayoutDashboard,
  Search,
  Plus,
  Shield,
  Clock,
  Settings,
  ChevronDown,
} from 'lucide-react';

export function Navbar() {
  const { user, token, logout } = useAuth();
  const [unread, setUnread] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    if (!token) return;
    const fetchCount = async () => {
      try {
        const data = (await api.notifications.unreadCount(token)) as { count: number };
        setUnread(data.count);
      } catch {}
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [token]);

  if (!user) {
    return (
      <header className="sticky top-0 z-50 w-full bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-600/30 group-hover:scale-105 transition-transform">
              <Car className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg text-white tracking-tight">Campus Carpool</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md shadow-indigo-600/25 transition active:scale-[0.98]"
            >
              Join Campus Network
            </Link>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        {/* Brand */}
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-600/30 group-hover:scale-105 transition-transform">
            <Car className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg text-white tracking-tight hidden sm:inline">
            Campus Carpool
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 text-xs font-medium text-slate-300">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl hover:text-white hover:bg-slate-900 transition"
          >
            <LayoutDashboard className="w-4 h-4 text-indigo-400" />
            <span>Dashboard</span>
          </Link>
          <Link
            href="/rides/search"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl hover:text-white hover:bg-slate-900 transition"
          >
            <Search className="w-4 h-4 text-indigo-400" />
            <span>Find Ride</span>
          </Link>
          <Link
            href="/rides/create"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl hover:text-white hover:bg-slate-900 transition"
          >
            <Plus className="w-4 h-4 text-indigo-400" />
            <span>Offer Ride</span>
          </Link>
          <Link
            href="/my-rides"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl hover:text-white hover:bg-slate-900 transition"
          >
            <Car className="w-4 h-4 text-indigo-400" />
            <span>My Rides</span>
          </Link>
          <Link
            href="/requests"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl hover:text-white hover:bg-slate-900 transition"
          >
            <Clock className="w-4 h-4 text-indigo-400" />
            <span>Requests</span>
          </Link>

          {user.role === 'ADMIN' && (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-purple-300 bg-purple-950/40 border border-purple-500/30 hover:bg-purple-900/50 transition font-semibold"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin</span>
            </Link>
          )}
        </nav>

        {/* Right side: Notifications & Profile Menu */}
        <div className="flex items-center gap-3">
          <Link
            href="/notifications"
            className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-xl transition"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unread > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </Link>

          {/* User dropdown toggle */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-1.5 pl-2.5 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-xs font-medium transition"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-bold text-[10px]">
                {user.name?.[0] || 'U'}
              </div>
              <span className="hidden sm:inline font-semibold text-slate-100 max-w-[120px] truncate">
                {user.name}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-2 border-b border-slate-800">
                  <p className="text-xs font-bold text-white truncate">{user.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                </div>
                <Link
                  href="/profile"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800/80 transition"
                >
                  <User className="w-4 h-4 text-indigo-400" />
                  <span>Profile & Vehicles</span>
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800/80 transition"
                >
                  <Settings className="w-4 h-4 text-indigo-400" />
                  <span>Settings</span>
                </Link>
                <div className="border-t border-slate-800 my-1" />
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    logout();
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-xs text-rose-400 hover:bg-rose-500/10 transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-900"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950 px-4 py-4 space-y-2 text-xs font-medium">
          <Link
            href="/dashboard"
            onClick={() => setMenuOpen(false)}
            className="block py-2 text-slate-300 hover:text-white"
          >
            Dashboard
          </Link>
          <Link
            href="/rides/search"
            onClick={() => setMenuOpen(false)}
            className="block py-2 text-slate-300 hover:text-white"
          >
            Find a Ride
          </Link>
          <Link
            href="/rides/create"
            onClick={() => setMenuOpen(false)}
            className="block py-2 text-slate-300 hover:text-white"
          >
            Offer a Ride
          </Link>
          <Link
            href="/my-rides"
            onClick={() => setMenuOpen(false)}
            className="block py-2 text-slate-300 hover:text-white"
          >
            My Rides
          </Link>
          <Link
            href="/requests"
            onClick={() => setMenuOpen(false)}
            className="block py-2 text-slate-300 hover:text-white"
          >
            Seat Requests
          </Link>
          {user.role === 'ADMIN' && (
            <Link
              href="/admin"
              onClick={() => setMenuOpen(false)}
              className="block py-2 text-purple-400 font-semibold"
            >
              Admin Dashboard
            </Link>
          )}
        </div>
      )}
    </header>
  );
}

export default Navbar;

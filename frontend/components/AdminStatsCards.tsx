import { AdminAnalytics } from '@/types';
import { Users, Car, CheckCircle2, AlertTriangle, Clock, ShieldCheck } from 'lucide-react';

interface AdminStatsCardsProps {
  stats: AdminAnalytics;
}

export function AdminStatsCards({ stats }: AdminStatsCardsProps) {
  const cards = [
    {
      label: 'Total Registered Students',
      value: stats.total_users,
      icon: Users,
      color: 'from-blue-500/20 to-indigo-500/20 text-indigo-400 border-indigo-500/30',
    },
    {
      label: 'Active Verified Students',
      value: stats.active_users,
      icon: ShieldCheck,
      color: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30',
    },
    {
      label: 'Active Rides',
      value: stats.active_rides,
      icon: Car,
      color: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30',
    },
    {
      label: 'Completed Rides',
      value: stats.completed_rides,
      icon: CheckCircle2,
      color: 'from-purple-500/20 to-violet-500/20 text-purple-400 border-purple-500/30',
    },
    {
      label: 'Accepted Seat Requests',
      value: stats.accepted_requests,
      icon: Clock,
      color: 'from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/30',
    },
    {
      label: 'Open Incident Reports',
      value: stats.open_reports,
      icon: AlertTriangle,
      color: 'from-rose-500/20 to-red-500/20 text-rose-400 border-rose-500/30',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`p-6 rounded-2xl border bg-gradient-to-br ${card.color} bg-slate-900/60 backdrop-blur-md transition-all hover:scale-[1.01]`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  {card.label}
                </p>
                <p className="text-3xl font-bold text-white mt-2">{card.value}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/80 border border-white/5">
                <Icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

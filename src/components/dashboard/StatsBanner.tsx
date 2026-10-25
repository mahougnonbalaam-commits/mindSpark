import React from 'react';
import { Bookmark, Clock, PlayCircle, CheckCircle2, Sparkles } from 'lucide-react';
import { Idea } from '../../types';

interface StatsBannerProps {
  ideas: Idea[];
  t: any;
}

export const StatsBanner: React.FC<StatsBannerProps> = ({ ideas, t }) => {
  const savedCount = ideas.length;
  const toProduceCount = ideas.filter(i => i.status === 'to_produce').length;
  const inProgressCount = ideas.filter(i => i.status === 'in_progress').length;
  const publishedCount = ideas.filter(i => i.status === 'published').length;

  const stats = [
    {
      label: t.dashboard.stats.savedIdeas,
      value: savedCount,
      icon: Bookmark,
      color: 'text-spark-400',
      bg: 'bg-spark-500/10 border-spark-500/20'
    },
    {
      label: t.dashboard.stats.toProduce,
      value: toProduceCount,
      icon: Clock,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20'
    },
    {
      label: t.dashboard.stats.inProgress,
      value: inProgressCount,
      icon: PlayCircle,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10 border-cyan-500/20'
    },
    {
      label: t.dashboard.stats.published,
      value: publishedCount,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className="glass-panel p-4 rounded-2xl flex items-center gap-3.5 transition-transform hover:-translate-y-0.5"
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${stat.bg} ${stat.color} shrink-0`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-white tracking-tight">{stat.value}</p>
              <p className="text-xs text-zinc-400 font-medium truncate">{stat.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

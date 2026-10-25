import React from 'react';
import {
  Layers,
  LayoutDashboard,
  Video,
  FolderKanban,
  UserCircle,
  Heart,
  Clock
} from 'lucide-react';

export type ActiveTab =
  | 'swipe'
  | 'dashboard'
  | 'studio'
  | 'library';

export const NAV_ICONS: Record<ActiveTab, React.ComponentType<{ className?: string }>> = {
  swipe: Layers,
  dashboard: LayoutDashboard,
  studio: Video,
  library: FolderKanban
};

export const NAV_ORDER: ActiveTab[] = ['swipe', 'dashboard', 'studio', 'library'];

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenSettings: () => void;
  favoritesCount: number;
  toProduceCount: number;
  t: any;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  onOpenSettings,
  favoritesCount,
  toProduceCount,
  t
}) => {
  const badges: Partial<Record<ActiveTab, string | null>> = {
    studio: '9:16',
    library: toProduceCount > 0 ? `${toProduceCount}` : null
  };

  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-slate-200/80 dark:border-white/10 bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl p-4 justify-between overflow-y-auto">
      {/* Navigation Links */}
      <div className="space-y-1">
        <p className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
          Atelier de création
        </p>

        {NAV_ORDER.map((id) => {
          const Icon = NAV_ICONS[id];
          const isActive = activeTab === id;
          const badge = badges[id];

          return (
            <button
              key={id}
              onClick={() => onSelectTab(id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                isActive
                  ? 'bg-spark-500/10 dark:bg-spark-600/15 text-spark-700 dark:text-spark-300 border-spark-500/30 shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-white/5 border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-spark-600 dark:text-spark-400' : 'text-slate-400 dark:text-zinc-500'}`} />
                <span>{t.nav[id]}</span>
              </div>

              {badge && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                    isActive
                      ? 'bg-spark-500/20 text-spark-700 dark:text-spark-200'
                      : 'bg-slate-100 dark:bg-dark-800 text-slate-500 dark:text-zinc-400'
                  }`}
                >
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Summary Card & Settings */}
      <div className="space-y-3 pt-4 border-t border-slate-200/80 dark:border-white/10">
        {/* Quick status summary */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-dark-850/80 border border-slate-200/80 dark:border-white/5 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" /> À produire
            </span>
            <span className="font-bold text-slate-800 dark:text-zinc-200">{toProduceCount}</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400 fill-rose-400/20" /> Favoris
            </span>
            <span className="font-bold text-slate-800 dark:text-zinc-200">{favoritesCount}</span>
          </div>
        </div>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors border border-transparent cursor-pointer"
        >
          <UserCircle className="w-4 h-4" />
          <span>{t.nav.settings}</span>
        </button>
      </div>
    </aside>
  );
};

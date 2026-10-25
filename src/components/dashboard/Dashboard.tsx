import React from 'react';
import {
  Layers,
  FolderKanban,
  ArrowRight,
  Flame,
  Heart,
  Clock,
  History,
  Sparkles,
  Video
} from 'lucide-react';
import { Idea, ProductionStatus } from '../../types';
import { StatsBanner } from './StatsBanner';
import { PopularIdeas } from './PopularIdeas';
import { IdeaCard } from '../generator/IdeaCard';
import { POPULAR_IDEAS } from '../../services/templates';
import { ActiveTab } from '../layout/Sidebar';

interface DashboardProps {
  ideas: Idea[];
  history: Idea[];
  onSelectTab: (tab: ActiveTab) => void;
  onOpenDetail: (idea: Idea) => void;
  onToggleFavorite: (id: string) => void;
  onUpdateStatus: (id: string, status: ProductionStatus) => void;
  onOpenStudio: (idea: Idea) => void;
  onCopyText: (text: string, label: string) => void;
  t: any;
}

export const Dashboard: React.FC<DashboardProps> = ({
  ideas,
  history,
  onSelectTab,
  onOpenDetail,
  onToggleFavorite,
  onUpdateStatus,
  onOpenStudio,
  onCopyText,
  t
}) => {
  const favorites = ideas.filter(i => i.isFavorite);
  const queueToProduce = ideas.filter(i => i.status === 'to_produce' || i.status === 'in_progress');

  return (
    <div className="space-y-10 animate-fade-in">
      {/* 1. Hero Section */}
      <div className="relative glass-panel rounded-3xl p-6 sm:p-10 border border-white/10 overflow-hidden bg-gradient-to-r from-dark-900 via-dark-900 to-spark-950/40">
        {/* Glow orb */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-spark-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-spark-500/10 border border-spark-500/20 text-spark-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Assistant IA pour créateurs de contenu vidéo court</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            Ne manquez plus jamais d'idées de <span className="gradient-text">vidéos virales</span>.
          </h1>

          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-2xl">
            MindSpark AI transforme vos thématiques en scripts percutants, hooks psychologiques, découpages chronométrés et prompts vidéo optimisés pour TikTok, Reels et Shorts.
          </p>

          {/* Quick Action CTA Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onSelectTab('swipe')}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-spark-600 to-indigo-600 hover:from-spark-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-spark-600/30 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Layers className="w-4 h-4" />
              <span>{t.nav.swipe}</span>
            </button>

            <button
              onClick={() => onSelectTab('library')}
              className="px-5 py-3 rounded-2xl bg-dark-800 hover:bg-dark-750 border border-white/10 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 transition-colors cursor-pointer"
            >
              <FolderKanban className="w-4 h-4 text-spark-400" />
              <span>{t.nav.library}</span>
            </button>

            <button
              onClick={() => onSelectTab('studio')}
              className="px-4 py-3 rounded-2xl bg-dark-850 hover:bg-dark-800 border border-white/5 text-zinc-300 hover:text-white font-medium text-xs sm:text-sm flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Video className="w-4 h-4 text-cyan-400" />
              <span>{t.nav.studio}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Stats Banner */}
      <StatsBanner ideas={ideas} t={t} />

      {/* 3. Section « Préparer ma prochaine vidéo » */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                {t.dashboard.prepareSection}
              </h2>
              <p className="text-xs text-zinc-400">
                {t.dashboard.prepareDesc}
              </p>
            </div>
          </div>

          <button
            onClick={() => onSelectTab('library')}
            className="text-xs font-semibold text-spark-400 hover:text-spark-300 flex items-center gap-1"
          >
            <span>Voir tout le pipeline</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {queueToProduce.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {queueToProduce.slice(0, 3).map((idea) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                onOpenDetail={onOpenDetail}
                onToggleFavorite={onToggleFavorite}
                onUpdateStatus={onUpdateStatus}
                onOpenStudio={onOpenStudio}
                onCopyText={onCopyText}
                t={t}
              />
            ))}
          </div>
        ) : (
          <div className="glass-panel p-6 rounded-2xl border border-white/5 text-center text-xs text-zinc-400">
            Aucun projet en attente. Marquez une idée comme « À produire » pour la retrouver ici.
          </div>
        )}
      </div>

      {/* 4. Section « Idées populaires & Inspirations virales » */}
      <PopularIdeas
        ideas={POPULAR_IDEAS}
        onOpenDetail={onOpenDetail}
        onToggleFavorite={onToggleFavorite}
        onUpdateStatus={onUpdateStatus}
        onOpenStudio={onOpenStudio}
        onCopyText={onCopyText}
        t={t}
      />

      {/* 5. Section « Mes idées favorites » */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Heart className="w-4 h-4 fill-rose-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                {t.dashboard.favoritesSection}
              </h2>
              <p className="text-xs text-zinc-400">
                Vos concepts favoris enregistrés pour inspiration.
              </p>
            </div>
          </div>
        </div>

        {favorites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {favorites.slice(0, 3).map((idea) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                onOpenDetail={onOpenDetail}
                onToggleFavorite={onToggleFavorite}
                onUpdateStatus={onUpdateStatus}
                onOpenStudio={onOpenStudio}
                onCopyText={onCopyText}
                t={t}
              />
            ))}
          </div>
        ) : (
          <div className="glass-panel p-6 rounded-2xl border border-white/5 text-center text-xs text-zinc-400">
            {t.dashboard.favoritesEmpty}
          </div>
        )}
      </div>

      {/* 6. Section « Historique des générations » */}
      {history.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                {t.dashboard.historySection}
              </h2>
              <p className="text-xs text-zinc-400">
                Les dernières idées générées au cours de vos sessions.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {history.slice(0, 3).map((idea) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                onOpenDetail={onOpenDetail}
                onToggleFavorite={onToggleFavorite}
                onUpdateStatus={onUpdateStatus}
                onOpenStudio={onOpenStudio}
                onCopyText={onCopyText}
                t={t}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

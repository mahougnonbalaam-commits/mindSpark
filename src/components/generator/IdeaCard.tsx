import React from 'react';
import {
  Heart,
  Copy,
  Clock,
  Sparkles,
  ArrowRight,
  Video,
  FileEdit,
  Share2
} from 'lucide-react';
import { Idea, ProductionStatus } from '../../types';
import { Badge } from '../common/Badge';

interface IdeaCardProps {
  idea: Idea;
  onOpenDetail: (idea: Idea) => void;
  onToggleFavorite: (id: string) => void;
  onUpdateStatus?: (id: string, status: ProductionStatus) => void;
  onOpenStudio?: (idea: Idea) => void;
  onCopyText: (text: string, label: string) => void;
  t: any;
}

export const IdeaCard: React.FC<IdeaCardProps> = ({
  idea,
  onOpenDetail,
  onToggleFavorite,
  onUpdateStatus,
  onOpenStudio,
  onCopyText,
  t
}) => {
  const platformColors = {
    tiktok: 'purple' as const,
    instagram: 'rose' as const,
    youtube: 'amber' as const,
    facebook: 'cyan' as const
  };

  const statusBadges = {
    to_produce: { label: t.library.toProduce, variant: 'amber' as const },
    in_progress: { label: t.library.inProgress, variant: 'cyan' as const },
    published: { label: t.library.published, variant: 'emerald' as const }
  };

  return (
    <div className="glass-panel glass-panel-hover rounded-2xl p-5 flex flex-col justify-between relative group border border-white/10 hover:border-spark-500/30 transition-all duration-300">
      <div>
        {/* Top Badges & Favorite */}
        <div className="flex items-center justify-between gap-2 mb-3.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant={platformColors[idea.platform] || 'purple'} size="sm">
              {idea.platform.toUpperCase()}
            </Badge>
            <Badge variant="zinc" size="sm">
              <Clock className="w-3 h-3 text-zinc-400" />
              {idea.duration}s
            </Badge>
            {idea.status && statusBadges[idea.status] && (
              <Badge variant={statusBadges[idea.status].variant} size="sm">
                {statusBadges[idea.status].label}
              </Badge>
            )}
          </div>

          <button
            onClick={() => onToggleFavorite(idea.id)}
            className={`p-2 rounded-xl transition-all ${
              idea.isFavorite
                ? 'text-rose-400 bg-rose-500/10 hover:bg-rose-500/20'
                : 'text-zinc-500 hover:text-rose-400 hover:bg-white/5'
            }`}
            title="Ajouter aux favoris"
          >
            <Heart className={`w-4 h-4 ${idea.isFavorite ? 'fill-rose-400' : ''}`} />
          </button>
        </div>

        {/* Title */}
        <h3
          onClick={() => onOpenDetail(idea)}
          className="text-base font-bold text-white hover:text-spark-300 transition-colors line-clamp-2 cursor-pointer leading-snug"
        >
          {idea.title}
        </h3>

        {/* Hook Highlight Box */}
        <div className="mt-3.5 p-3 rounded-xl bg-dark-950/80 border border-white/5 relative group/hook">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-spark-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> {t.detail.hookBadge}
            </span>
            <button
              onClick={() => onCopyText(idea.hook, 'Hook copié')}
              className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 opacity-80 group-hover/hook:opacity-100 transition-opacity"
            >
              <Copy className="w-3 h-3" />
              <span>{t.actions.copy}</span>
            </button>
          </div>
          <p className="text-xs text-zinc-300 line-clamp-2 italic font-serif">
            "{idea.hook}"
          </p>
        </div>

        {/* Concept snippet */}
        <p className="mt-3 text-xs text-zinc-400 line-clamp-2 leading-relaxed">
          {idea.concept}
        </p>
      </div>

      {/* Card Footer Actions */}
      <div className="mt-4 pt-3.5 border-t border-white/5 flex items-center justify-between gap-2">
        <button
          onClick={() => onOpenDetail(idea)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-spark-400 hover:text-spark-300 transition-colors"
        >
          <span>Fiche complète</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
        </button>

        <div className="flex items-center gap-1.5">
          {onOpenStudio && (
            <button
              onClick={() => onOpenStudio(idea)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors"
              title="Prompts Vidéo IA (9:16)"
            >
              <Video className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => onCopyText(idea.script, 'Script complet copié')}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            title="Copier le script complet"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

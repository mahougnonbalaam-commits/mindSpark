import React from 'react';
import { Flame, Sparkles, ArrowRight } from 'lucide-react';
import { Idea, ProductionStatus } from '../../types';
import { IdeaCard } from '../generator/IdeaCard';

interface PopularIdeasProps {
  ideas: Idea[];
  onOpenDetail: (idea: Idea) => void;
  onToggleFavorite: (id: string) => void;
  onUpdateStatus: (id: string, status: ProductionStatus) => void;
  onOpenStudio: (idea: Idea) => void;
  onCopyText: (text: string, label: string) => void;
  t: any;
}

export const PopularIdeas: React.FC<PopularIdeasProps> = ({
  ideas,
  onOpenDetail,
  onToggleFavorite,
  onUpdateStatus,
  onOpenStudio,
  onCopyText,
  t
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-spark-500/10 border border-spark-500/20 flex items-center justify-center text-spark-400">
            <Flame className="w-4 h-4 text-spark-400" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">
              {t.dashboard.popularSection}
            </h2>
            <p className="text-xs text-zinc-400">
              {t.dashboard.popularDesc}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ideas.slice(0, 4).map((idea) => (
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
  );
};

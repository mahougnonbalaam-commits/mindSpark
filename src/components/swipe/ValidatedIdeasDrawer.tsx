import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Flame,
  Copy,
  Clock,
  Download,
  Trash2,
  FileEdit,
  Video,
  Sparkles,
  ArrowRight,
  Search,
  Bookmark,
  RotateCcw,
  CheckCircle2,
  XCircle,
  CornerDownRight
} from 'lucide-react';
import { Idea, ProductionStatus } from '../../types';
import { Badge } from '../common/Badge';
import { exportService } from '../../services/exportService';

export interface ValidatedIdeasDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: 'validated' | 'rejected';
  onSelectTab: (tab: 'validated' | 'rejected') => void;
  validatedIdeas: Idea[];
  rejectedIdeas: Idea[];
  onOpenDetail: (idea: Idea) => void;
  onUpdateStatus: (id: string, status: ProductionStatus) => void;
  onOpenEdit: (idea: Idea) => void;
  onDeleteIdea: (id: string, fromList: 'validated' | 'rejected') => void;
  onRestoreRejectedIdea: (id: string, target: 'validated' | 'deck') => void;
  onMoveToRejected: (id: string) => void;
  onOpenStudio: (idea: Idea) => void;
  onCopyText: (text: string, label: string) => void;
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
  t: any;
}

export const ValidatedIdeasDrawer: React.FC<ValidatedIdeasDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  validatedIdeas,
  rejectedIdeas,
  onOpenDetail,
  onUpdateStatus,
  onOpenEdit,
  onDeleteIdea,
  onRestoreRejectedIdea,
  onMoveToRejected,
  onOpenStudio,
  onCopyText,
  onShowToast,
  t
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Start each opening with an empty search
  useEffect(() => {
    if (!isOpen) setSearchQuery('');
  }, [isOpen]);

  if (!isOpen) return null;

  const currentList = activeTab === 'validated' ? validatedIdeas : rejectedIdeas;

  const filtered = currentList.filter(i => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      i.title.toLowerCase().includes(q) ||
      i.hook.toLowerCase().includes(q) ||
      i.concept.toLowerCase().includes(q) ||
      i.script.toLowerCase().includes(q)
    );
  });

  const exportAllValidated = () => {
    if (validatedIdeas.length === 0) return;
    const combined = validatedIdeas
      .map(
        (idea, idx) =>
          `=== IDÉE VALIDÉE ${idx + 1} : ${idea.title} ===\n${exportService.toPlainText(idea)}`
      )
      .join('\n\n========================================\n\n');
    exportService.downloadFile(
      combined,
      `mes-idees-validees-mindspark.txt`,
      'text/plain;charset=utf-8'
    );
    onShowToast(`${validatedIdeas.length} idée(s) validée(s) exportée(s) !`, 'success');
  };

  const handleRestoreAllRejected = () => {
    if (rejectedIdeas.length === 0) return;
    if (window.confirm(`Voulez-vous repêcher toutes les ${rejectedIdeas.length} idées passées et les valider ?`)) {
      rejectedIdeas.forEach(i => onRestoreRejectedIdea(i.id, 'validated'));
      onShowToast(`Toutes les idées passées ont été repêchées et validées !`, 'success');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-white/10 shadow-2xl flex flex-col justify-between overflow-hidden text-slate-800 dark:text-zinc-100 transition-colors">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-slate-950/70 backdrop-blur-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-spark-500/10 border border-spark-500/20 flex items-center justify-center text-spark-600 dark:text-spark-400">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Mes Idées & Sélections
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Consultez vos idées validées (OK) et vos idées passées
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-4 pt-3 pb-2 bg-slate-100/70 dark:bg-dark-950/50 border-b border-slate-200 dark:border-white/5 flex items-center gap-2">
          <button
            onClick={() => onSelectTab('validated')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'validated'
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                : 'bg-white dark:bg-dark-850/60 border border-slate-200 dark:border-white/5 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Validées (OK)</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'validated'
                  ? 'bg-white text-emerald-700'
                  : 'bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-zinc-300'
              }`}
            >
              {validatedIdeas.length}
            </span>
          </button>

          <button
            onClick={() => onSelectTab('rejected')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'rejected'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25'
                : 'bg-white dark:bg-dark-850/60 border border-slate-200 dark:border-white/5 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
            }`}
          >
            <XCircle className="w-4 h-4" />
            <span>Passées (Moins bon)</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'rejected'
                  ? 'bg-white text-rose-700'
                  : 'bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-zinc-300'
              }`}
            >
              {rejectedIdeas.length}
            </span>
          </button>
        </div>

        {/* Search & Action Bar */}
        <div className="p-3.5 border-b border-slate-200 dark:border-white/5 bg-slate-50/60 dark:bg-dark-900/60 flex items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeTab === 'validated'
                  ? 'Filtrer les idées validées...'
                  : 'Filtrer les idées passées...'
              }
              className="w-full bg-white dark:bg-dark-850 border border-slate-200 dark:border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-spark-500"
            />
          </div>

          {activeTab === 'validated' ? (
            <button
              onClick={exportAllValidated}
              disabled={validatedIdeas.length === 0}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-dark-800 dark:hover:bg-dark-750 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 transition-colors shrink-0 disabled:opacity-40 cursor-pointer shadow-sm"
              title="Exporter toutes les idées validées en TXT"
            >
              <Download className="w-3.5 h-3.5 text-spark-600 dark:text-spark-400" />
              <span className="hidden sm:inline">Exporter tout</span>
            </button>
          ) : (
            <button
              onClick={handleRestoreAllRejected}
              disabled={rejectedIdeas.length === 0}
              className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-dark-800 dark:hover:bg-dark-750 border border-emerald-200 dark:border-white/10 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 transition-colors shrink-0 disabled:opacity-40 cursor-pointer shadow-sm"
              title="Repêcher toutes les idées passées"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tout repêcher</span>
            </button>
          )}
        </div>

        {/* List of cards */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {filtered.length > 0 ? (
            filtered.map((idea) => (
              <div
                key={idea.id}
                className={`rounded-2xl p-4 sm:p-5 border space-y-3 relative group transition-colors shadow-sm ${
                  activeTab === 'validated'
                    ? 'bg-white dark:bg-slate-850 border-slate-200/90 dark:border-white/10 hover:border-emerald-500/40 shadow-slate-100'
                    : 'bg-slate-50/80 dark:bg-dark-900/50 border-slate-200/90 dark:border-white/10 hover:border-rose-500/30'
                }`}
              >
                {/* Badges & Actions */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant={idea.platform === 'tiktok' ? 'purple' : idea.platform === 'instagram' ? 'rose' : 'amber'} size="sm">
                      {idea.platform.toUpperCase()}
                    </Badge>
                    <Badge variant="zinc" size="sm">
                      <Clock className="w-3 h-3 text-slate-400 dark:text-zinc-400" />
                      {idea.duration}s
                    </Badge>
                    {activeTab === 'rejected' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-300">
                        Passée
                      </span>
                    )}
                  </div>

                  {activeTab === 'validated' ? (
                    /* Status selector */
                    <select
                      value={idea.status || 'to_produce'}
                      onChange={(e) => onUpdateStatus(idea.id, e.target.value as ProductionStatus)}
                      className="bg-slate-100 dark:bg-dark-850 text-[11px] font-semibold text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1 focus:outline-none focus:border-spark-500 cursor-pointer"
                    >
                      <option value="to_produce">⏳ À produire</option>
                      <option value="in_progress">🎬 En cours</option>
                      <option value="published">✅ Publiée</option>
                    </select>
                  ) : (
                    /* Restore direct button for passed ideas */
                    <button
                      onClick={() => {
                        onRestoreRejectedIdea(idea.id, 'validated');
                        onShowToast(`💚 Idée repêchée et ajoutée aux validées !`, 'success');
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:hover:bg-emerald-500/25 border border-emerald-200 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold transition-all cursor-pointer shadow-sm"
                      title="Repêcher cette idée"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Repêcher</span>
                    </button>
                  )}
                </div>

                {/* Title */}
                <h3
                  onClick={() => onOpenDetail(idea)}
                  className="text-sm sm:text-base font-bold text-slate-900 dark:text-white hover:text-spark-600 dark:hover:text-spark-300 transition-colors cursor-pointer leading-snug"
                >
                  {idea.title}
                </h3>

                {/* Hook Box */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-dark-950/80 border border-slate-200/70 dark:border-white/5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-spark-600 dark:text-spark-400 uppercase tracking-wider flex items-center gap-1">
                      <Flame className="w-3 h-3" /> Hook d'accroche
                    </span>
                    <button
                      onClick={() => onCopyText(idea.hook, 'Hook copié dans le presse-papier')}
                      className="text-[10px] text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copier</span>
                    </button>
                  </div>
                  <p className="text-xs italic text-slate-700 dark:text-zinc-200 font-serif">
                    « {idea.hook} »
                  </p>
                </div>

                {/* Script snippet */}
                <p className="text-xs text-slate-600 dark:text-zinc-300 line-clamp-2 leading-relaxed font-sans">
                  {idea.script}
                </p>

                {/* Card Actions */}
                <div className="pt-2 border-t border-slate-200/70 dark:border-white/5 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onOpenDetail(idea)}
                    className="text-xs font-semibold text-spark-600 dark:text-spark-400 hover:text-spark-700 dark:hover:text-spark-300 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Fiche complète</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>

                  <div className="flex items-center gap-1.5">
                    {activeTab === 'validated' ? (
                      <>
                        <button
                          onClick={() => onOpenStudio(idea)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-600 dark:text-zinc-400 dark:hover:text-cyan-300 hover:bg-slate-100 dark:hover:bg-cyan-500/10 transition-colors cursor-pointer"
                          title="Prompts Vidéo IA"
                        >
                          <Video className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onOpenEdit(idea)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                          title="Modifier le script"
                        >
                          <FileEdit className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onCopyText(idea.script, 'Script complet copié')}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                          title="Copier le script complet"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            onMoveToRejected(idea.id);
                            onShowToast('Idée déplacée vers les idées passées', 'info');
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Déplacer vers les idées passées"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            if (window.confirm('Supprimer définitivement cette idée ?')) {
                              onDeleteIdea(idea.id, 'validated');
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:text-zinc-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        {/* Actions for rejected tab */}
                        <button
                          onClick={() => {
                            onRestoreRejectedIdea(idea.id, 'deck');
                            onShowToast('Idée réinjectée dans le deck de swipe !', 'info');
                          }}
                          className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-dark-800 dark:hover:bg-dark-750 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white text-[11px] font-semibold border border-slate-200 dark:border-white/10 flex items-center gap-1 transition-colors cursor-pointer"
                          title="Remettre cette idée dans la file de swipe"
                        >
                          <CornerDownRight className="w-3 h-3 text-spark-600 dark:text-spark-400" />
                          <span>Remettre au Deck</span>
                        </button>

                        <button
                          onClick={() => {
                            if (window.confirm('Supprimer définitivement cette idée ?')) {
                              onDeleteIdea(idea.id, 'rejected');
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:text-zinc-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Supprimer définitivement"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 dark:text-zinc-500 mx-auto">
                {activeTab === 'validated' ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-500/50" />
                ) : (
                  <XCircle className="w-6 h-6 text-rose-500/50" />
                )}
              </div>
              <p className="text-sm font-semibold text-slate-800 dark:text-zinc-300">
                {activeTab === 'validated'
                  ? 'Aucune idée validée pour le moment'
                  : 'Aucune idée passée pour le moment'}
              </p>
              <p className="text-xs text-slate-500 dark:text-zinc-500 max-w-xs mx-auto">
                {activeTab === 'validated'
                  ? 'Swiper à droite (ou cliquez sur le bouton 💚) sur les cartes qui vous plaisent pour les retrouver ici.'
                  : 'Swiper à gauche (ou cliquez sur le bouton ❌) pour écarter des idées. Vous pourrez toujours les repêcher ici.'}
              </p>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-slate-50/90 dark:bg-dark-950/80 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-zinc-400">
            {activeTab === 'validated'
              ? `${validatedIdeas.length} idée(s) validée(s)`
              : `${rejectedIdeas.length} idée(s) passée(s)`}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-dark-800 dark:hover:bg-dark-750 text-xs font-semibold text-slate-800 dark:text-white transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

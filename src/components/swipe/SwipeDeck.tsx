import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Check,
  Eye,
  RefreshCw,
  Sparkles,
  Volume2,
  VolumeX
} from 'lucide-react';
import { Idea } from '../../types';
import { SwipeCard } from './SwipeCard';
import { SwipeParticles } from './SwipeParticles';
import { soundService } from '../../services/soundService';

interface SwipeDeckProps {
  ideas: Idea[];
  onSwipeLeft: (idea: Idea) => void;
  onSwipeRight: (idea: Idea) => void;
  onOpenDetail: (idea: Idea) => void;
  onReloadIdeas: () => void;
  onCopyText: (text: string, label: string) => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  validatedCount?: number;
  rejectedCount?: number;
  onOpenDrawerTab?: (tab: 'validated' | 'rejected') => void;
  keyboardEnabled?: boolean; // false while a modal or drawer covers the deck
  t: any;
}

export const SwipeDeck: React.FC<SwipeDeckProps> = ({
  ideas,
  onSwipeLeft,
  onSwipeRight,
  onOpenDetail,
  onReloadIdeas,
  onCopyText,
  selectedCategory,
  onSelectCategory,
  validatedCount = 0,
  rejectedCount = 0,
  onOpenDrawerTab,
  keyboardEnabled = true,
  t
}) => {
  const [swipeTrigger, setSwipeTrigger] = useState<'left' | 'right' | null>(null);
  const [particleType, setParticleType] = useState<'keep' | 'pass' | null>(null);
  const [isMuted, setIsMuted] = useState(() => soundService.getMuted());
  // -1 (leaning pass) .. 0 .. 1 (leaning keep), drives the deck, glow and buttons while dragging
  const [dragProgress, setDragProgress] = useState(0);
  // Button "punch" feedback; the key restarts the animation on repeated presses
  const [punch, setPunch] = useState<{ direction: 'left' | 'right'; key: number } | null>(null);
  const [showHint, setShowHint] = useState(false);

  // Nudge the first card once per session to show it can be swiped
  useEffect(() => {
    try {
      if (sessionStorage.getItem('mindspark_swipe_hint')) return;
      sessionStorage.setItem('mindspark_swipe_hint', '1');
    } catch {
      return;
    }
    setShowHint(true);
    const timer = window.setTimeout(() => setShowHint(false), 2200);
    return () => window.clearTimeout(timer);
  }, []);

  const handleDragProgress = useCallback((progress: number) => {
    setDragProgress(progress);
    if (progress !== 0) setShowHint(false);
  }, []);

  const currentIdea = ideas[0];
  const hasMore = ideas.length > 0;

  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    setSwipeTrigger(null);
    setDragProgress(0);
    if (!currentIdea) return;

    if (direction === 'left') {
      soundService.playPass();
      setParticleType('pass');
      onSwipeLeft(currentIdea);
    } else {
      soundService.playKeep();
      setParticleType('keep');
      onSwipeRight(currentIdea);
    }
  }, [currentIdea, onSwipeLeft, onSwipeRight]);

  const triggerButtonSwipe = (direction: 'left' | 'right') => {
    if (!currentIdea || swipeTrigger) return;
    setShowHint(false);
    setPunch({ direction, key: Date.now() });
    setSwipeTrigger(direction);
  };

  const handleToggleSound = () => {
    const next = soundService.toggleMute();
    setIsMuted(next);
  };

  // Keyboard navigation shortcuts
  useEffect(() => {
    if (!keyboardEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        triggerButtonSwipe('left');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        triggerButtonSwipe('right');
      } else if (e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (currentIdea) onOpenDetail(currentIdea);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIdea, swipeTrigger, onOpenDetail, keyboardEnabled]);

  const lean = Math.abs(dragProgress);
  const keepLean = Math.max(dragProgress, 0);
  const passLean = Math.max(-dragProgress, 0);

  const categories = [
    { id: 'all', label: '🔥 Tous les thèmes' },
    { id: 'psychology', label: '🧠 Psychologie' },
    { id: 'deep_reflections', label: '🌌 Réflexions' },
    { id: 'relationships', label: '❤️ Relations' },
    { id: 'discipline_motivation', label: '⚡ Discipline' },
    { id: 'short_moral_stories', label: '📖 Storytelling' },
    { id: 'hard_truths', label: '👁️ Vérités' },
    { id: 'philosophy', label: '🏛️ Philosophie' },
    { id: 'mystery_intrigue', label: '🕵️ Mystères' },
    { id: 'educational_facts', label: '📚 Éducatif' },
  ];

  return (
    <div className="flex flex-col items-center justify-between h-full max-h-full max-w-sm sm:max-w-md mx-auto py-1 sm:py-3 px-2 sm:px-3 w-full relative overflow-hidden">
      {/* Dynamic celebratory / swoosh particles during swipe */}
      <SwipeParticles
        type={particleType}
        onDone={() => setParticleType(null)}
      />

      {/* Category Filter Pills Bar */}
      <div className="w-full flex items-center gap-1.5 overflow-x-auto pb-1.5 sm:pb-2 scrollbar-none mb-1.5 sm:mb-3 shrink-0">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelectCategory(c.id)}
            className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === c.id
                ? 'bg-gradient-to-r from-spark-600 to-indigo-600 text-white shadow-md shadow-spark-600/30 font-bold scale-105'
                : 'bg-white/80 dark:bg-slate-900/80 border border-slate-200/90 dark:border-white/10 text-slate-700 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white hover:border-spark-400/50 shadow-sm'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Main Card Deck Area (Flex-scaled to fit any mobile phone screen) */}
      <div className="relative w-full flex-1 min-h-[300px] max-h-[460px] sm:max-h-[540px] my-1 sm:my-auto">
        {hasMore ? (
          <>
            {/* Keep / pass glow following the drag */}
            <div
              aria-hidden
              className="absolute -inset-8 pointer-events-none blur-2xl transition-opacity duration-150"
              style={{
                opacity: lean,
                background: dragProgress >= 0
                  ? 'radial-gradient(circle at 90% 50%, rgba(16, 185, 129, 0.5), transparent 60%)'
                  : 'radial-gradient(circle at 10% 50%, rgba(244, 63, 94, 0.5), transparent 60%)'
              }}
            />

            {/* Background Deck Card 2 (Deepest shadow) */}
            {ideas.length > 2 && (
              <div
                style={{
                  transform: `scale(${0.89 + lean * 0.06}) translateY(${22 - lean * 12}px)`,
                  opacity: 0.4 + lean * 0.45
                }}
                className="absolute inset-0 rounded-3xl border border-slate-200/50 dark:border-white/5 bg-slate-100 dark:bg-slate-950 shadow-lg pointer-events-none transition-all duration-200 ease-out"
              />
            )}

            {/* Background Deck Card 1 (Next card waiting underneath with spring elevation) */}
            {ideas.length > 1 && (
              <div
                style={{
                  transform: `scale(${0.95 + lean * 0.05}) translateY(${10 - lean * 10}px)`,
                  opacity: 0.85 + lean * 0.15
                }}
                className="absolute inset-0 pointer-events-none transition-all duration-200 ease-out"
              >
                <SwipeCard
                  key={ideas[1].id}
                  idea={ideas[1]}
                  isTop={false}
                  onSwipe={() => {}}
                  onOpenDetail={() => {}}
                  onCopyText={() => {}}
                  t={t}
                />
              </div>
            )}

            {/* Top Interactive Card (rises from the deck, nudges once as a hint) */}
            <div key={currentIdea.id} className="absolute inset-0 z-30 animate-card-rise">
              <div className={`absolute inset-0 ${showHint ? 'animate-swipe-hint' : ''}`}>
                <SwipeCard
                  idea={currentIdea}
                  isTop={true}
                  swipeTrigger={swipeTrigger}
                  onSwipe={handleSwipe}
                  onOpenDetail={onOpenDetail}
                  onCopyText={onCopyText}
                  onDragProgress={handleDragProgress}
                  t={t}
                />
              </div>
            </div>
          </>
        ) : (
          /* Empty Deck State */
          <div className="absolute inset-0 glass-panel rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center text-center space-y-4 border border-slate-200/90 dark:border-white/10 bg-white/95 dark:bg-slate-900/90 shadow-2xl animate-fade-in">
            <div className="w-16 h-16 rounded-3xl bg-spark-500/10 border border-spark-500/20 flex items-center justify-center text-spark-600 dark:text-spark-400 shadow-lg shadow-spark-500/20">
              <Sparkles className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                Tous les thèmes de cette liste ont été triés !
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-xs mx-auto leading-relaxed">
                Vous avez passé en revue l'ensemble des concepts de cette sélection.
              </p>
            </div>

            {/* Quick summary stats */}
            <div className="flex items-center justify-center gap-3 py-1">
              <button
                type="button"
                onClick={() => onOpenDrawerTab && onOpenDrawerTab('validated')}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <span>💚 Validées :</span>
                <span className="font-black text-emerald-800 dark:text-emerald-200">{validatedCount}</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenDrawerTab && onOpenDrawerTab('rejected')}
                className="px-3.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-bold hover:bg-rose-100 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <span>❌ Passées :</span>
                <span className="font-black text-rose-800 dark:text-rose-200">{rejectedCount}</span>
              </button>
            </div>

            <div className="flex flex-col gap-2.5 w-full max-w-xs pt-2">
              <button
                onClick={onReloadIdeas}
                className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-spark-600 to-indigo-600 hover:from-spark-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-spark-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Recharger / Réinitialiser le deck</span>
              </button>

              {selectedCategory !== 'all' && (
                <button
                  onClick={() => onSelectCategory('all')}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  Explorer tous les thèmes
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Controls & Keyboard / Audio Hints */}
      <div className="w-full pt-1.5 sm:pt-3 space-y-1 sm:space-y-2 shrink-0">
        {/* Swipe Button Controls */}
        <div className="flex items-center justify-center gap-5 sm:gap-8">
          {/* Button PASS (Swipe Left) */}
          <span
            className="relative inline-flex rounded-full transition-transform duration-150 ease-out"
            style={{
              transform: `scale(${1 + passLean * 0.22})`,
              boxShadow: `0 0 0 ${passLean * 6}px rgba(244, 63, 94, 0.18)`
            }}
          >
          {punch?.direction === 'left' && (
            <span key={punch.key} aria-hidden className="absolute inset-0 rounded-full border-2 border-rose-400 animate-ring-pulse pointer-events-none" />
          )}
          <button
            key={punch?.direction === 'left' ? punch.key : 'pass'}
            onClick={() => triggerButtonSwipe('left')}
            disabled={!hasMore || Boolean(swipeTrigger)}
            className={`${punch?.direction === 'left' ? 'animate-button-punch ' : ''}group w-12 h-12 sm:w-16 sm:h-16 rounded-full border border-rose-200 dark:border-rose-500/30 bg-rose-50/90 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-lg sm:shadow-xl shadow-rose-200/50 dark:shadow-rose-950/50 hover:scale-110 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer`}
            title="Passer (Flèche Gauche ←)"
          >
            <X className="w-6 h-6 sm:w-8 sm:h-8 stroke-[2.5] transition-transform group-hover:rotate-12" />
          </button>
          </span>

          {/* Button EXPAND / VIEW SCRIPT */}
          <button
            onClick={() => currentIdea && onOpenDetail(currentIdea)}
            disabled={!hasMore}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-zinc-200 flex items-center justify-center shadow-sm sm:shadow-md hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title="Voir la fiche complète"
          >
            <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-spark-600 dark:text-spark-400" />
          </button>

          {/* Button KEEP / OK (Swipe Right) */}
          <span
            className="relative inline-flex rounded-full transition-transform duration-150 ease-out"
            style={{
              transform: `scale(${1 + keepLean * 0.22})`,
              boxShadow: `0 0 0 ${keepLean * 6}px rgba(16, 185, 129, 0.18)`
            }}
          >
          {punch?.direction === 'right' && (
            <span key={punch.key} aria-hidden className="absolute inset-0 rounded-full border-2 border-emerald-400 animate-ring-pulse pointer-events-none" />
          )}
          <button
            key={punch?.direction === 'right' ? punch.key : 'keep'}
            onClick={() => triggerButtonSwipe('right')}
            disabled={!hasMore || Boolean(swipeTrigger)}
            className={`${punch?.direction === 'right' ? 'animate-button-punch ' : ''}group w-12 h-12 sm:w-16 sm:h-16 rounded-full border border-emerald-200 dark:border-emerald-500/40 bg-emerald-50/90 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-lg sm:shadow-xl shadow-emerald-200/50 dark:shadow-emerald-950/50 hover:scale-110 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer`}
            title="Garder (Flèche Droite →)"
          >
            <Check className="w-6 h-6 sm:w-8 sm:h-8 stroke-[3] transition-transform group-hover:scale-110" />
          </button>
          </span>
        </div>

        {/* Keyboard and sound toggle hint */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 text-[10px] sm:text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
          <span className="hidden sm:flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-dark-850 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-zinc-300 text-[10px]">←</kbd> Passer
          </span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-dark-850 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-zinc-300 text-[10px]">Espace</kbd> Détails
          </span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-dark-850 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-zinc-300 text-[10px]">→</kbd> Garder
          </span>
          <span className="hidden sm:inline">•</span>
          {/* Mute/Sound toggle */}
          <button
            onClick={handleToggleSound}
            className="flex items-center gap-1 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors cursor-pointer py-0.5 px-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
            title={isMuted ? 'Activer le son' : 'Couper le son'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-500" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-500" />}
            <span>{isMuted ? 'Muet' : 'Son activé'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

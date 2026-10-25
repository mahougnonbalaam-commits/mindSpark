import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Check,
  X,
  ArrowRight,
  Eye,
  Clock
} from 'lucide-react';
import { Idea } from '../../types';
import { Badge } from '../common/Badge';

interface SwipeCardProps {
  idea: Idea;
  isTop: boolean;
  swipeTrigger?: 'left' | 'right' | null;
  onSwipe: (direction: 'left' | 'right') => void;
  onOpenDetail: (idea: Idea) => void;
  onCopyText: (text: string, label: string) => void;
  onDragProgress?: (progress: number) => void; // -1 (pass) .. 0 .. 1 (keep)
  t: any;
}

const SWIPE_THRESHOLD = 80;   // px dragged to commit a swipe
const FLICK_VELOCITY = 0.5;   // px/ms: a quick flick commits even below the threshold
const FLICK_MIN_DISTANCE = 25;

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

interface ExitMotion {
  direction: 'left' | 'right';
  x: number;
  y: number;
  rotation: number;
  duration: number; // seconds
}

export const SwipeCard: React.FC<SwipeCardProps> = ({
  idea,
  isTop,
  swipeTrigger,
  onSwipe,
  onOpenDetail,
  onDragProgress,
  t
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [exit, setExit] = useState<ExitMotion | null>(null);

  // Use refs to avoid stale closures during mouse/touch events
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const lastMove = useRef({ x: 0, y: 0, time: 0 });
  const velocity = useRef({ x: 0, y: 0 });
  // Grabbing the bottom half tilts the card the other way, like holding a real card
  const rotateSign = useRef(1);
  const exitTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(exitTimer.current), []);

  const triggerExit = useCallback((direction: 'left' | 'right') => {
    const sign = direction === 'right' ? 1 : -1;
    const speed = Math.abs(velocity.current.x);
    // Faster flicks fly out faster and spin a bit more
    const duration = clamp(0.42 - speed * 0.12, 0.24, 0.42);
    setExit({
      direction,
      x: sign * (window.innerWidth + 260),
      y: dragOffsetRef.current.y * 0.45 + clamp(velocity.current.y * 320, -260, 260),
      rotation: sign * rotateSign.current * (24 + Math.min(speed * 14, 18)),
      duration
    });
    onDragProgress?.(sign);
    try {
      navigator.vibrate?.(direction === 'right' ? [10, 30, 14] : 10);
    } catch {
      // vibration unsupported
    }
    exitTimer.current = window.setTimeout(() => onSwipe(direction), duration * 1000 * 0.85);
  }, [onSwipe, onDragProgress]);

  // Programmatic swipe triggered by buttons (❌ or 💚)
  useEffect(() => {
    if (swipeTrigger && isTop && !exit) {
      rotateSign.current = 1;
      velocity.current = { x: swipeTrigger === 'right' ? 0.6 : -0.6, y: -0.15 };
      triggerExit(swipeTrigger);
    }
  }, [swipeTrigger, isTop, exit, triggerExit]);

  const startDrag = (clientX: number, clientY: number) => {
    isDraggingRef.current = true;
    setIsDragging(true);
    startPos.current = { x: clientX, y: clientY };
    lastMove.current = { x: 0, y: 0, time: performance.now() };
    velocity.current = { x: 0, y: 0 };
    const rect = cardRef.current?.getBoundingClientRect();
    rotateSign.current = rect && clientY > rect.top + rect.height / 2 ? -1 : 1;
  };

  const moveDrag = (clientX: number, clientY: number) => {
    const dx = clientX - startPos.current.x;
    const dy = clientY - startPos.current.y;

    // Smoothed pointer velocity, used to detect flicks on release
    const now = performance.now();
    const dt = now - lastMove.current.time;
    if (dt > 0) {
      const vx = (dx - lastMove.current.x) / dt;
      const vy = (dy - lastMove.current.y) / dt;
      velocity.current = {
        x: velocity.current.x * 0.3 + vx * 0.7,
        y: velocity.current.y * 0.3 + vy * 0.7
      };
    }
    lastMove.current = { x: dx, y: dy, time: now };

    dragOffsetRef.current = { x: dx, y: dy };
    setDragOffset({ x: dx, y: dy });
    onDragProgress?.(clamp(dx / SWIPE_THRESHOLD, -1, 1));
  };

  const finishSwipe = useCallback(() => {
    isDraggingRef.current = false;
    setIsDragging(false);

    // A pause before releasing kills the flick
    if (performance.now() - lastMove.current.time > 90) velocity.current = { x: 0, y: 0 };

    const { x } = dragOffsetRef.current;
    const vx = velocity.current.x;
    if (x > SWIPE_THRESHOLD || (vx > FLICK_VELOCITY && x > FLICK_MIN_DISTANCE)) {
      triggerExit('right');
    } else if (x < -SWIPE_THRESHOLD || (vx < -FLICK_VELOCITY && x < -FLICK_MIN_DISTANCE)) {
      triggerExit('left');
    } else {
      dragOffsetRef.current = { x: 0, y: 0 };
      setDragOffset({ x: 0, y: 0 });
      onDragProgress?.(0);
    }
  }, [triggerExit, onDragProgress]);

  // Touch Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isTop || exit) return;
    startDrag(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || !isTop || exit) return;
    moveDrag(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (!isTop || exit || !isDraggingRef.current) return;
    finishSwipe();
  };

  // Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isTop || exit) return;
    if ((e.target as HTMLElement).closest('button')) return;

    e.preventDefault();
    startDrag(e.clientX, e.clientY);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return;
      moveDrag(moveEvent.clientX, moveEvent.clientY);
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      finishSwipe();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Visual calculation
  const rotation = isDragging ? dragOffset.x * 0.065 * rotateSign.current : 0;
  const keepOpacity = exit ? (exit.direction === 'right' ? 1 : 0) : clamp(dragOffset.x / SWIPE_THRESHOLD, 0, 1);
  const passOpacity = exit ? (exit.direction === 'left' ? 1 : 0) : clamp(-dragOffset.x / SWIPE_THRESHOLD, 0, 1);

  // Shadow tinted green / red as the card leans towards keep / pass
  const tintShadow = keepOpacity > 0
    ? `0 28px 60px -14px rgba(16, 185, 129, ${0.15 + keepOpacity * 0.4})`
    : passOpacity > 0
    ? `0 28px 60px -14px rgba(244, 63, 94, ${0.15 + passOpacity * 0.4})`
    : '0 25px 50px -12px rgba(0, 0, 0, 0.25)';

  const transformStyle: React.CSSProperties = exit
    ? {
        transform: `translate3d(${exit.x}px, ${exit.y}px, 0) rotate(${exit.rotation}deg) scale(0.94)`,
        transition: `transform ${exit.duration}s cubic-bezier(0.4, 0, 0.7, 0.4), opacity ${exit.duration}s ease-in`,
        opacity: 0,
        boxShadow: tintShadow,
        pointerEvents: 'none'
      }
    : isDragging
    ? {
        transform: `translate3d(${dragOffset.x}px, ${dragOffset.y * 0.45}px, 0) rotate(${rotation}deg) scale(1.03)`,
        cursor: 'grabbing',
        userSelect: 'none',
        boxShadow: tintShadow,
        transition: 'box-shadow 0.15s ease'
      }
    : {
        transform: 'translate3d(0px, 0px, 0) rotate(0deg) scale(1)',
        // Overshooting curve: the card springs back with a small bounce
        transition: 'transform 0.55s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease'
      };

  const platformInfo: Record<string, { label: string; color: 'purple' | 'rose' | 'amber' | 'cyan' }> = {
    tiktok: { label: 'TikTok', color: 'purple' },
    instagram: { label: 'Instagram Reels', color: 'rose' },
    youtube: { label: 'YouTube Shorts', color: 'amber' },
    facebook: { label: 'Facebook Watch', color: 'cyan' }
  };

  const categoryLabels: Record<string, string> = {
    deep_reflections: 'Réflexion Profonde',
    relationships: 'Relations Humaines',
    psychology: 'Psychologie',
    discipline_motivation: 'Discipline & Mindset',
    hard_truths: 'Vérité Difficile',
    life_lessons: 'Leçon de Vie',
    philosophy: 'Philosophie',
    short_moral_stories: 'Storytelling',
    surprising_facts: 'Fait Surprenant',
    respectful_debates: 'Débat Respectueux',
    original_quotes: 'Citation Originale',
    faceless_voiceover: 'Voix Off + Images IA',
    mystery_intrigue: 'Mystère & Intrigue',
    educational_facts: 'Contenu Éducatif'
  };

  const currentPlatform = platformInfo[idea.platform] || { label: idea.platform.toUpperCase(), color: 'purple' };
  const currentCategory = categoryLabels[idea.category] || idea.category;

  return (
    <div
      ref={cardRef}
      style={{
        ...transformStyle,
        touchAction: 'none'
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onMouseDown={handleMouseDown}
      className={`absolute inset-0 select-none glass-panel rounded-2xl sm:rounded-3xl p-4 sm:p-7 md:p-8 flex flex-col justify-between border border-slate-200/90 dark:border-white/10 shadow-xl sm:shadow-2xl bg-white/95 dark:bg-slate-900/95 overflow-hidden ${
        isTop ? 'z-30 cursor-grab active:cursor-grabbing' : 'pointer-events-none'
      }`}
    >
      {/* 💚 KEEP / OK Stamp Overlay with Spring Feel */}
      <div
        style={{
          opacity: keepOpacity,
          transform: `rotate(-15deg) scale(${0.85 + keepOpacity * 0.25})`
        }}
        className="absolute top-4 left-4 sm:top-8 sm:left-8 z-40 border-2 sm:border-4 border-emerald-500 bg-emerald-50/95 dark:bg-emerald-950/95 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 sm:px-4 sm:py-1.5 rounded-xl sm:rounded-2xl font-black text-sm sm:text-xl tracking-wider uppercase shadow-xl sm:shadow-2xl shadow-emerald-500/25 pointer-events-none flex items-center gap-1.5 sm:gap-2 transition-transform duration-75"
      >
        <Check className="w-4 h-4 sm:w-6 sm:h-6 stroke-[3]" />
        <span>GARDER (OK)</span>
      </div>

      {/* ❌ PASS Stamp Overlay with Spring Feel */}
      <div
        style={{
          opacity: passOpacity,
          transform: `rotate(15deg) scale(${0.85 + passOpacity * 0.25})`
        }}
        className="absolute top-4 right-4 sm:top-8 sm:right-8 z-40 border-2 sm:border-4 border-rose-500 bg-rose-50/95 dark:bg-rose-950/95 text-rose-600 dark:text-rose-400 px-2.5 py-1 sm:px-4 sm:py-1.5 rounded-xl sm:rounded-2xl font-black text-sm sm:text-xl tracking-wider uppercase shadow-xl sm:shadow-2xl shadow-rose-500/25 pointer-events-none flex items-center gap-1.5 sm:gap-2 transition-transform duration-75"
      >
        <X className="w-4 h-4 sm:w-6 sm:h-6 stroke-[3]" />
        <span>PASSER</span>
      </div>

      {/* 1. TOP ROW : RÉSEAU & TYPE & DURÉE */}
      <div className="flex items-center justify-between gap-2 pb-2.5 sm:pb-4 border-b border-slate-200/70 dark:border-white/10 pointer-events-none">
        <Badge variant={currentPlatform.color} size="sm" className="font-bold tracking-wide text-[11px] sm:text-xs">
          {currentPlatform.label}
        </Badge>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <Badge variant="zinc" size="sm" className="font-semibold text-slate-700 dark:text-zinc-300 text-[10px] sm:text-xs py-0.5 px-2">
            {currentCategory}
          </Badge>
          <span className="text-[10px] sm:text-xs text-slate-500 dark:text-zinc-400 font-mono font-medium flex items-center gap-0.5 sm:gap-1">
            <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 dark:text-zinc-500" />
            {idea.duration}s
          </span>
        </div>
      </div>

      {/* 2. CENTER : LE THÈME (COMPACT & MARQUANT SUR MOBILE) */}
      <div className="my-auto py-2 sm:py-6 space-y-2 sm:space-y-4 text-center pointer-events-none">
        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 sm:px-3.5 sm:py-1 rounded-full bg-spark-500/10 border border-spark-500/20 text-spark-600 dark:text-spark-300 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <span>Thème de la vidéo</span>
        </div>

        <h2 className="text-base sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white leading-snug sm:leading-tight tracking-tight px-1 line-clamp-3 sm:line-clamp-none">
          « {idea.title} »
        </h2>

        <p className="text-xs sm:text-sm md:text-base font-serif italic text-slate-600 dark:text-zinc-300 leading-relaxed max-w-md mx-auto line-clamp-2 sm:line-clamp-3">
          {idea.hook}
        </p>
      </div>

      {/* 3. BOTTOM : BOUTON SIMPLE POUR VOIR LE SCRIPT COMPLET */}
      <div className="pt-2.5 sm:pt-4 border-t border-slate-200/70 dark:border-white/10">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetail(idea);
          }}
          className="w-full py-2.5 sm:py-3.5 px-3 sm:px-5 rounded-xl sm:rounded-2xl bg-slate-100 hover:bg-slate-200/90 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/10 text-[11px] sm:text-sm font-bold text-slate-800 dark:text-zinc-200 hover:text-slate-950 dark:hover:text-white flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer group pointer-events-auto shadow-sm"
        >
          <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-spark-600 dark:text-spark-400" />
          <span>Voir le script complet & détails</span>
          <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 dark:text-zinc-400 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};

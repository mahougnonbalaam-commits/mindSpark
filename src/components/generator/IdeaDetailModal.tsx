import React, { useState } from 'react';
import {
  X,
  Copy,
  Heart,
  Video,
  FileEdit,
  Download,
  Share2,
  Clock,
  Sparkles,
  Music,
  Tv,
  Check,
  Flame,
  MessageSquare,
  Hash,
  ArrowRight
} from 'lucide-react';
import { Idea, ProductionStatus } from '../../types';
import { Badge } from '../common/Badge';
import { exportService } from '../../services/exportService';

interface IdeaDetailModalProps {
  idea: Idea | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleFavorite: (id: string) => void;
  onUpdateStatus: (id: string, status: ProductionStatus) => void;
  onOpenEdit: (idea: Idea) => void;
  onOpenStudio: (idea: Idea) => void;
  onCopyText: (text: string, label: string) => void;
  t: any;
}

export const IdeaDetailModal: React.FC<IdeaDetailModalProps> = ({
  idea,
  isOpen,
  onClose,
  onToggleFavorite,
  onUpdateStatus,
  onOpenEdit,
  onOpenStudio,
  onCopyText,
  t
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen || !idea) return null;

  const copySection = (text: string, key: string, label: string) => {
    onCopyText(text, label);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 dark:bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl my-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col text-slate-800 dark:text-zinc-100 transition-colors">
        {/* Glow backdrop */}
        <div className="absolute top-0 right-1/4 w-80 h-40 bg-spark-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-white/10 flex items-start justify-between gap-4 bg-slate-50/80 dark:bg-dark-950/60 sticky top-0 z-20 backdrop-blur-xl">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="purple" size="md">
                {idea.platform.toUpperCase()}
              </Badge>
              <Badge variant="zinc" size="md">
                <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-400" />
                {idea.duration}s
              </Badge>
              <Badge variant="cyan" size="md">
                {idea.tone}
              </Badge>
              <Badge variant="amber" size="md">
                {idea.format}
              </Badge>
            </div>

            <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
              {idea.title}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleFavorite(idea.id)}
              className={`p-2.5 rounded-xl border border-slate-200 dark:border-white/10 transition-colors cursor-pointer ${
                idea.isFavorite
                  ? 'bg-rose-50 dark:bg-rose-500/15 border-rose-200 dark:border-rose-500/30 text-rose-500 dark:text-rose-400'
                  : 'bg-slate-100 dark:bg-dark-850 text-slate-500 dark:text-zinc-400 hover:text-rose-500'
              }`}
              title="Favori"
            >
              <Heart className={`w-5 h-5 ${idea.isFavorite ? 'fill-rose-400' : ''}`} />
            </button>

            <button
              onClick={onClose}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-dark-850 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-8 space-y-6 overflow-y-auto">
          {/* Status selector & quick actions bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-dark-950/70 border border-white/5">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400 font-medium">Statut de production :</span>
              <select
                value={idea.status || 'to_produce'}
                onChange={(e) => onUpdateStatus(idea.id, e.target.value as ProductionStatus)}
                className="bg-dark-850 text-xs font-semibold text-zinc-200 border border-white/10 rounded-xl px-3 py-1.5 focus:outline-none focus:border-spark-500"
              >
                <option value="to_produce">⏳ À produire</option>
                <option value="in_progress">🎬 En cours de création</option>
                <option value="published">✅ Publiée</option>
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => onOpenStudio(idea)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-spark-600/20 hover:bg-spark-600/30 border border-spark-500/30 text-spark-300 text-xs font-semibold transition-all"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Prompts Vidéo IA</span>
              </button>

              <button
                onClick={() => onOpenEdit(idea)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-dark-800 hover:bg-dark-750 border border-white/10 text-zinc-300 text-xs font-semibold transition-all"
              >
                <FileEdit className="w-3.5 h-3.5" />
                <span>{t.actions.editScript}</span>
              </button>

              <button
                onClick={() => exportService.exportAsMarkdown(idea)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-dark-800 hover:bg-dark-750 border border-white/10 text-zinc-300 text-xs font-semibold transition-all"
                title="Télécharger en Markdown"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Markdown</span>
              </button>
            </div>
          </div>

          {/* 1. Hook (0-3s) - Hero visual block */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-spark-950/60 via-dark-850 to-dark-900 border border-spark-500/30 shadow-lg relative group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-spark-400 flex items-center gap-2">
                <Flame className="w-4 h-4 text-spark-400" />
                {t.detail.hookBadge}
              </span>
              <button
                onClick={() => copySection(idea.hook, 'hook', 'Hook copié')}
                className="flex items-center gap-1 text-xs text-spark-300 hover:text-white bg-spark-500/10 hover:bg-spark-500/20 px-2.5 py-1 rounded-lg border border-spark-500/20 transition-all"
              >
                {copiedKey === 'hook' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'hook' ? 'Copié' : t.actions.copy}</span>
              </button>
            </div>
            <p className="text-base sm:text-lg font-serif italic text-white font-medium leading-relaxed">
              "{idea.hook}"
            </p>
            <p className="text-[11px] text-zinc-400 mt-2 font-sans">
              {t.detail.hookDesc}
            </p>
          </div>

          {/* 2. Concept */}
          <div className="p-4 rounded-2xl bg-dark-950/60 border border-white/5 space-y-1.5">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              {t.detail.conceptTitle}
            </h4>
            <p className="text-sm text-zinc-200 leading-relaxed">
              {idea.concept}
            </p>
          </div>

          {/* 3. Script Complet */}
          <div className="p-5 rounded-2xl bg-dark-950/90 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-spark-300 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-spark-400" />
                {t.detail.scriptTitle} ({idea.duration}s)
              </h4>
              <button
                onClick={() => copySection(idea.script, 'script', 'Script complet copié')}
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg transition-all"
              >
                {copiedKey === 'script' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'script' ? 'Copié' : t.actions.copy}</span>
              </button>
            </div>
            <p className="text-sm text-zinc-100 whitespace-pre-line leading-relaxed font-sans font-normal p-4 rounded-xl bg-dark-900 border border-white/5">
              {idea.script}
            </p>
          </div>

          {/* 4. Timeline / Déroulement chronométré */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              {t.detail.timelineTitle}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {idea.timeline.map((beat, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-dark-950/60 border border-white/5 space-y-1"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-spark-400 font-bold">{beat.timestamp}</span>
                    <span className="text-[11px] font-semibold text-zinc-400">{beat.label}</span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-normal">{beat.content}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 5. Voiceover TTS Clean */}
          <div className="p-5 rounded-2xl bg-dark-950/60 border border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  {t.detail.voiceoverTitle}
                </h4>
                <p className="text-[11px] text-zinc-500">{t.detail.voiceoverDesc}</p>
              </div>
              <button
                onClick={() => copySection(idea.voiceoverText, 'voiceover', 'Voix off copiée')}
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white bg-white/5 px-2.5 py-1 rounded-lg transition-all"
              >
                {copiedKey === 'voiceover' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'voiceover' ? 'Copié' : t.actions.copy}</span>
              </button>
            </div>
            <p className="text-xs sm:text-sm text-zinc-300 font-mono bg-dark-900/90 p-3.5 rounded-xl border border-white/5 leading-relaxed">
              {idea.voiceoverText}
            </p>
          </div>

          {/* 6. Visual suggestions & On-screen text */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Visuals */}
            <div className="p-4 rounded-2xl bg-dark-950/60 border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Tv className="w-3.5 h-3.5 text-cyan-400" />
                  {t.detail.visualsTitle}
                </h4>
                <button
                  onClick={() => copySection(idea.visualSuggestions, 'visuals', 'Suggestions visuelles copiées')}
                  className="text-xs text-zinc-500 hover:text-white"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                {idea.visualSuggestions}
              </p>
            </div>

            {/* On-screen text */}
            <div className="p-4 rounded-2xl bg-dark-950/60 border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  {t.detail.onScreenTitle}
                </h4>
                <button
                  onClick={() => copySection(idea.onScreenText.join('\n'), 'onscreen', 'Textes écran copiés')}
                  className="text-xs text-zinc-500 hover:text-white"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
              <ul className="space-y-1.5">
                {idea.onScreenText.map((txt, i) => (
                  <li key={i} className="text-xs text-zinc-200 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-spark-400 shrink-0" />
                    <span>"{txt}"</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 7. Audio atmosphere & Conclusion / CTA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Audio */}
            <div className="p-4 rounded-2xl bg-dark-950/60 border border-white/5 space-y-2">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-amber-400" />
                {t.detail.audioTitle}
              </h4>
              <p className="text-xs text-zinc-300 leading-relaxed">
                {idea.soundtrackSuggestion}
              </p>
            </div>

            {/* Conclusion & CTA */}
            <div className="p-4 rounded-2xl bg-dark-950/60 border border-white/5 space-y-2">
              <div>
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                  {t.detail.conclusionTitle}
                </span>
                <p className="text-xs text-zinc-200 font-medium">"{idea.conclusion}"</p>
              </div>
              <div className="pt-2 border-t border-white/5">
                <span className="text-[11px] font-bold text-spark-400 uppercase tracking-wider block">
                  {t.detail.ctaTitle}
                </span>
                <p className="text-xs text-zinc-300">"{idea.cta}"</p>
              </div>
            </div>
          </div>

          {/* 8. Caption & Hashtags */}
          <div className="p-5 rounded-2xl bg-dark-950/60 border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-rose-400" />
                {t.detail.captionTitle} & {t.detail.hashtagsTitle}
              </h4>
              <button
                onClick={() => copySection(`${idea.caption}\n\n${idea.hashtags.join(' ')}`, 'caption', 'Légende & Hashtags copiés')}
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white bg-white/5 px-2.5 py-1 rounded-lg transition-all"
              >
                {copiedKey === 'caption' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'caption' ? 'Copié' : t.actions.copy}</span>
              </button>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">{idea.caption}</p>
            <div className="flex flex-wrap gap-1.5 pt-2">
              {idea.hashtags.map((h, i) => (
                <span key={i} className="text-[11px] text-spark-400 font-mono bg-spark-500/10 px-2 py-0.5 rounded-md">
                  {h}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Sticky Footer */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-dark-950/80 backdrop-blur-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportService.exportAsTxt(idea)}
              className="px-3 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-white/5 hover:bg-white/10 transition-colors"
            >
              Export TXT
            </button>
            <button
              onClick={() => exportService.exportAsJson(idea)}
              className="px-3 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-white/5 hover:bg-white/10 transition-colors"
            >
              Export JSON
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenStudio(idea)}
              className="px-4 py-2 rounded-xl bg-spark-600 hover:bg-spark-500 text-white text-xs font-semibold shadow-lg shadow-spark-600/30 transition-all flex items-center gap-1.5"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Générer prompts vidéo IA</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white bg-dark-800 hover:bg-dark-750 transition-colors"
            >
              {t.actions.close}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  Sparkles,
  Camera,
  Copy,
  Check,
  RefreshCw,
  Sliders,
  Tv,
  Film,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Idea, VisualScenePrompt } from '../../types';
import { aiService, AiError } from '../../services/aiService';
import { CREDIT_COSTS } from '../../services/pricing';
import { storageService } from '../../services/storageService';
import { Badge } from '../common/Badge';

interface AiVideoStudioProps {
  initialIdea?: Idea | null;
  onCopyText: (text: string, label: string) => void;
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
  isLoggedIn: boolean;
  onRequireLogin: () => void;
  onCreditsChange: (credits: number) => void;
  t: any;
}

export const AiVideoStudio: React.FC<AiVideoStudioProps> = ({
  initialIdea,
  onCopyText,
  onShowToast,
  isLoggedIn,
  onRequireLogin,
  onCreditsChange,
  t
}) => {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(initialIdea || null);
  const [scenes, setScenes] = useState<VisualScenePrompt[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  // Only the latest request may update the scenes (an older, slower one is ignored)
  const latestRequest = useRef(0);

  useEffect(() => {
    const list = storageService.getIdeas();
    setIdeas(list);
    if (!selectedIdea && list.length > 0) {
      setSelectedIdea(list[0]);
    }
  }, []);

  useEffect(() => {
    if (initialIdea) {
      setSelectedIdea(initialIdea);
    }
  }, [initialIdea]);

  // Selecting an idea shows the free template scenes; AI generation is an explicit, paid action
  useEffect(() => {
    if (selectedIdea) {
      latestRequest.current++;
      setIsGenerating(false);
      setScenes(aiService.videoStudioPromptsFallback(selectedIdea));
    }
  }, [selectedIdea]);

  const generateWithAi = async (idea: Idea) => {
    if (!isLoggedIn) {
      onRequireLogin();
      return;
    }
    const requestId = ++latestRequest.current;
    setIsGenerating(true);
    try {
      const result = await aiService.generateVideoStudioPromptsAI(idea);
      onCreditsChange(result.credits);
      if (requestId === latestRequest.current) {
        setScenes(result.scenes);
        onShowToast("Scènes générées par l'IA", 'success');
      }
    } catch (e) {
      if (e instanceof AiError) {
        if (e.credits !== null) onCreditsChange(e.credits);
        if (e.code === 'not_authenticated') onRequireLogin();
      }
      if (requestId === latestRequest.current) {
        onShowToast(e instanceof Error ? e.message : 'Erreur de génération des scènes', 'error');
      }
    } finally {
      if (requestId === latestRequest.current) setIsGenerating(false);
    }
  };

  const copyItem = (text: string, key: string, label: string) => {
    onCopyText(text, label);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const copyAllPrompts = () => {
    if (!selectedIdea) return;
    const all = scenes.map(s => `SCÈNE ${s.sceneNumber} (${s.timecode})
VOIX OFF : "${s.voiceoverLine}"
IMAGE PROMPT (Midjourney / FLUX) :
${s.imagePrompt}

VIDEO PROMPT (Runway / Kling) :
${s.videoPrompt}

MOUVEMENT CAMÉRA : ${s.cameraMovement}
TEXTE ÉCRAN : ${s.onScreenText || ''}
----------------------------------------`).join('\n\n');

    copyItem(all, 'all', 'Tous les prompts copiés !');
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
          <Video className="w-7 h-7 text-cyan-400" />
          <span>{t.studio.title}</span>
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          {t.studio.desc}
        </p>
      </div>

      {/* Select Idea Bar */}
      <div className="glass-panel p-5 rounded-3xl border border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex-1">
          <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
            Sélectionner un script dans votre bibliothèque :
          </label>
          <select
            value={selectedIdea?.id || ''}
            onChange={(e) => {
              const found = ideas.find(i => i.id === e.target.value);
              if (found) setSelectedIdea(found);
            }}
            className="w-full bg-dark-850 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-spark-500"
          >
            {ideas.map(i => (
              <option key={i.id} value={i.id}>
                {i.title} ({i.duration}s - {i.platform.toUpperCase()})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 sm:self-end">
          <button
            onClick={() => selectedIdea && generateWithAi(selectedIdea)}
            disabled={isGenerating || !selectedIdea}
            className="px-4 py-2.5 rounded-xl bg-dark-800 hover:bg-dark-750 border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors disabled:opacity-50"
            title={isLoggedIn ? undefined : 'Connexion requise'}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>
              {isGenerating ? 'Génération…' : `Générer avec l'IA · ${CREDIT_COSTS.video_prompts} crédit${CREDIT_COSTS.video_prompts > 1 ? 's' : ''}`}
            </span>
          </button>

          <button
            onClick={copyAllPrompts}
            disabled={scenes.length === 0}
            className="px-4 py-2.5 rounded-xl bg-spark-600 hover:bg-spark-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-spark-600/30"
          >
            {copiedKey === 'all' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copier tous les prompts</span>
          </button>
        </div>
      </div>

      {/* Selected Idea Summary Banner */}
      {selectedIdea && (
        <div className="p-4 rounded-2xl bg-dark-950/60 border border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">{selectedIdea.title}</span>
            <Badge variant="purple" size="sm">{selectedIdea.duration}s</Badge>
            <Badge variant="cyan" size="sm">9:16 Vertical</Badge>
          </div>
          <div className="text-zinc-400 italic font-serif truncate max-w-md">
            Hook : "{selectedIdea.hook}"
          </div>
        </div>
      )}

      {/* 9:16 Editing Directives Box */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-dark-900 to-dark-850 border border-white/10 space-y-3">
        <h3 className="text-xs font-bold text-spark-400 uppercase tracking-wider flex items-center gap-2">
          <Sliders className="w-4 h-4 text-spark-400" />
          <span>Instructions de montage vertical 9:16 (Faceless Creator)</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-dark-950/80 border border-white/5 space-y-1">
            <span className="font-bold text-zinc-300 block">Rythme des coupes</span>
            <p className="text-zinc-400">1 coupe toutes les 2.5 à 3.5 secondes pour maintenir la dopamine visuelle et stopper le scroll.</p>
          </div>
          <div className="p-3 rounded-xl bg-dark-950/80 border border-white/5 space-y-1">
            <span className="font-bold text-zinc-300 block">Typographie & Sous-titres</span>
            <p className="text-zinc-400">Police grasse centrée au tiers médian, 2-3 mots affichés à la fois avec surlignage jaune ou violet.</p>
          </div>
          <div className="p-3 rounded-xl bg-dark-950/80 border border-white/5 space-y-1">
            <span className="font-bold text-zinc-300 block">Étalonnage cinématique</span>
            <p className="text-zinc-400">LUT sombre et contrastée, désaturation légère, grain 35mm à 12% pour un look premium intemporel.</p>
          </div>
        </div>
      </div>

      {/* Scene By Scene Prompts List */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>Découpage scène par scène ({scenes.length} scènes synchronisées)</span>
        </h2>

        {scenes.map((scene) => (
          <div
            key={scene.sceneNumber}
            className="glass-panel rounded-2xl p-5 border border-white/10 space-y-4 hover:border-cyan-500/30 transition-colors"
          >
            {/* Scene Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-bold text-xs flex items-center justify-center">
                  #{scene.sceneNumber}
                </span>
                <span className="font-mono text-xs text-spark-400 font-bold">{scene.timecode}</span>
                <span className="text-xs text-zinc-400 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-zinc-500" />
                  <span className="font-medium text-zinc-300">{scene.cameraMovement}</span>
                </span>
              </div>

              {scene.onScreenText && (
                <span className="text-[11px] text-zinc-400 bg-dark-800 px-2.5 py-1 rounded-lg border border-white/5">
                  Incrustation : <strong className="text-zinc-200">"{scene.onScreenText}"</strong>
                </span>
              )}
            </div>

            {/* Voiceover line */}
            <div className="p-3 rounded-xl bg-dark-950/70 border border-white/5 text-xs text-zinc-300 flex items-start gap-2">
              <span className="font-bold text-zinc-400 shrink-0">Voix off :</span>
              <span className="italic font-serif">"{scene.voiceoverLine}"</span>
            </div>

            {/* Image Prompt Box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-spark-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-spark-400" />
                  Prompt Image (Midjourney v6 / FLUX)
                </span>
                <button
                  onClick={() => copyItem(scene.imagePrompt, `img-${scene.sceneNumber}`, 'Prompt Image copié')}
                  className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white bg-white/5 px-2 py-0.5 rounded-lg transition-colors"
                >
                  {copiedKey === `img-${scene.sceneNumber}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === `img-${scene.sceneNumber}` ? 'Copié' : 'Copier'}</span>
                </button>
              </div>
              <p className="text-xs text-zinc-200 font-mono bg-dark-900/90 p-3 rounded-xl border border-white/5 leading-relaxed select-all">
                {scene.imagePrompt}
              </p>
            </div>

            {/* Video Motion Prompt Box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Film className="w-3 h-3 text-cyan-400" />
                  Prompt Vidéo & Mouvement (Runway Gen-3 / Kling AI / Luma)
                </span>
                <button
                  onClick={() => copyItem(scene.videoPrompt, `vid-${scene.sceneNumber}`, 'Prompt Vidéo copié')}
                  className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white bg-white/5 px-2 py-0.5 rounded-lg transition-colors"
                >
                  {copiedKey === `vid-${scene.sceneNumber}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === `vid-${scene.sceneNumber}` ? 'Copié' : 'Copier'}</span>
                </button>
              </div>
              <p className="text-xs text-cyan-100 font-mono bg-dark-900/90 p-3 rounded-xl border border-cyan-500/10 leading-relaxed select-all">
                {scene.videoPrompt}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

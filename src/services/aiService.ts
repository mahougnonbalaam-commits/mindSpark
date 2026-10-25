import { FunctionsHttpError } from '@supabase/supabase-js';
import { Idea, VisualScenePrompt } from '../types';
import { supabase } from './supabaseClient';

const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback);

function normalizeScene(raw: any, idx: number): VisualScenePrompt | null {
  if (!raw || typeof raw !== 'object' || !str(raw.imagePrompt)) return null;
  return {
    sceneNumber: Number(raw.sceneNumber) || idx + 1,
    timecode: str(raw.timecode),
    voiceoverLine: str(raw.voiceoverLine),
    imagePrompt: str(raw.imagePrompt),
    videoPrompt: str(raw.videoPrompt),
    cameraMovement: str(raw.cameraMovement),
    onScreenText: str(raw.onScreenText) || undefined
  };
}

function normalizeScenes(raw: unknown): VisualScenePrompt[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeScene).filter((s): s is VisualScenePrompt => s !== null);
}

export type AiErrorCode = 'not_authenticated' | 'insufficient_credits' | 'generation_failed' | 'unavailable';

export class AiError extends Error {
  constructor(public code: AiErrorCode, message: string, public credits: number | null) {
    super(message);
  }
}

export const aiService = {
  // Paid AI generation, run server-side by the "generate" Edge Function (it holds the Gemini key and charges credits)
  async generateVideoStudioPromptsAI(idea: Idea): Promise<{ scenes: VisualScenePrompt[]; credits: number }> {
    if (!supabase) {
      throw new AiError('unavailable', 'La génération IA n\'est pas encore disponible sur cette installation.', null);
    }

    const { data, error } = await supabase.functions.invoke('generate', {
      body: { task: 'video_prompts', idea: { title: idea.title, script: idea.script, duration: idea.duration } }
    });

    if (error) {
      const payload = error instanceof FunctionsHttpError ? await error.context.json().catch(() => ({})) : {};
      const credits = typeof payload.credits === 'number' ? payload.credits : null;
      switch (payload.error) {
        case 'not_authenticated':
          throw new AiError('not_authenticated', 'Connectez-vous pour utiliser la génération IA.', credits);
        case 'insufficient_credits':
          throw new AiError('insufficient_credits', `Crédits insuffisants (${credits ?? 0} restant${(credits ?? 0) > 1 ? 's' : ''}).`, credits);
        case 'generation_failed':
          throw new AiError('generation_failed', 'La génération a échoué. Votre crédit a été remboursé.', credits);
        default:
          throw new AiError('unavailable', 'Service IA momentanément indisponible. Réessayez plus tard.', credits);
      }
    }

    const scenes = normalizeScenes(data?.scenes);
    if (scenes.length === 0) {
      throw new AiError('generation_failed', 'La réponse de l\'IA est inexploitable.', typeof data?.credits === 'number' ? data.credits : null);
    }
    return { scenes, credits: data.credits };
  },

  // Free template scenes (no AI call, no credits)
  videoStudioPromptsFallback(idea: Idea): VisualScenePrompt[] {
    // Default template scene prompts
    if (idea.scenePrompts && idea.scenePrompts.length > 0) {
      return idea.scenePrompts;
    }

    // Scene boundaries scaled to the video duration (e.g. 0:00 - 0:02 ... 0:12 - 0:15 for 15s)
    const fmt = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
    const cuts = [0, 0.15, 0.45, 0.8, 1].map(r => Math.round(r * idea.duration));
    const timecode = (i: number) => `${fmt(cuts[i])} - ${fmt(cuts[i + 1])}`;

    // Middle scenes narrate the two halves of the script
    const words = idea.script.split(/\s+/).filter(Boolean);
    const half = Math.ceil(words.length / 2);
    const firstHalf = words.slice(0, half).join(' ');
    const secondHalf = words.slice(half).join(' ');

    return [
      {
        sceneNumber: 1,
        timecode: timecode(0),
        voiceoverLine: idea.hook,
        imagePrompt: `Cinematic vertical shot for "${idea.title}", moody atmospheric lighting, dramatic shadow, high contrast, 8k resolution, cinematic grain, photorealistic --ar 9:16 --v 6.1 --style raw`,
        videoPrompt: 'Slow cinematic push-in towards the central subject, high frame rate, moody atmospheric haze, 24fps vertical video',
        cameraMovement: 'Slow push-in cinématique vers le sujet principal',
        onScreenText: idea.onScreenText?.[0] || idea.title
      },
      {
        sceneNumber: 2,
        timecode: timecode(1),
        voiceoverLine: firstHalf,
        imagePrompt: `A lone figure in deep contemplation, minimalist architecture, cold blue light meeting warm amber edge light, cinematic composition --ar 9:16 --v 6.1`,
        videoPrompt: 'Slow tracking shot from left to right, subtle dust motes floating in light beam, hyper-smooth gimbal motion',
        cameraMovement: 'Travelling latéral lent et fluide',
        onScreenText: idea.onScreenText?.[1] || 'Le silence est une réponse'
      },
      {
        sceneNumber: 3,
        timecode: timecode(2),
        voiceoverLine: secondHalf,
        imagePrompt: `Extreme macro close-up, dramatic reflection in the eye, dark neon highlights, mystery and tension --ar 9:16 --v 6.1`,
        videoPrompt: 'Camera slowly pulls back while zooming in (dolly zoom vertigo effect), rising visual intensity',
        cameraMovement: 'Effet Vertigo / Dolly zoom subtil',
        onScreenText: idea.onScreenText?.[2] || 'Prends conscience'
      },
      {
        sceneNumber: 4,
        timecode: timecode(3),
        voiceoverLine: idea.conclusion,
        imagePrompt: `Silhouette of a person walking into a vast open horizon under a starry night sky, epic cinematography, 9:16 ratio --ar 9:16 --v 6.1`,
        videoPrompt: 'Slow crane shot rising upwards into the night sky as the silhouette fades away',
        cameraMovement: 'Mouvement de grue s\'élevant vers le ciel',
        onScreenText: idea.conclusion
      }
    ];
  }
};

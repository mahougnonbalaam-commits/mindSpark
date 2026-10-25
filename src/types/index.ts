export type Platform = 'tiktok' | 'instagram' | 'youtube' | 'facebook';

export type ContentCategory =
  | 'deep_reflections'       // Réflexions profondes sur la vie
  | 'relationships'          // Relations amoureuses et relations humaines
  | 'psychology'             // Psychologie et comportement humain
  | 'discipline_motivation'  // Discipline, motivation et développement personnel
  | 'hard_truths'            // Vérités difficiles à accepter
  | 'life_lessons'           // Leçons de vie et expériences humaines
  | 'philosophy'             // Questions philosophiques
  | 'short_moral_stories'    // Histoires courtes avec une morale
  | 'surprising_facts'       // Faits surprenants et paradoxes
  | 'respectful_debates'     // Sujets controversés favorisant des débats respectueux
  | 'original_quotes'        // Citations originales avec explication
  | 'faceless_voiceover'     // Idées racontées par voix off avec images IA
  | 'mystery_intrigue'       // Histoires mystérieuses et scénarios intrigants
  | 'educational_facts';     // Contenus éducatifs et faits intéressants

export type Tone =
  | 'deep'
  | 'mysterious'
  | 'emotional'
  | 'provocative'
  | 'motivational'
  | 'philosophical'
  | 'educational';

export type Duration = 15 | 30 | 45 | 60;

export type VideoFormat =
  | 'narration'
  | 'storytelling'
  | 'question'
  | 'list'
  | 'reflection'
  | 'mini_doc';

export type ProductionStatus = 'to_produce' | 'in_progress' | 'published';

export interface TimelineBeat {
  timestamp: string; // e.g. "0:00 - 0:03"
  label: string;     // e.g. "Hook & Accroche visuelle"
  content: string;   // Ce qui se passe ou est dit
}

export interface VisualScenePrompt {
  sceneNumber: number;
  timecode: string;
  voiceoverLine: string;
  imagePrompt: string;       // Prompt optimisé pour Midjourney / FLUX
  videoPrompt: string;       // Prompt de mouvement caméra pour Runway / Kling
  cameraMovement: string;    // ex: "Slow push-in cinématique, 24fps"
  onScreenText?: string;     // Texte affiché à l'écran
}

export interface Idea {
  id: string;
  title: string;
  concept: string;
  hook: string;
  script: string;
  category: ContentCategory;
  platform: Platform;
  language: 'fr' | 'en';
  tone: Tone;
  duration: Duration;
  format: VideoFormat;
  timeline: TimelineBeat[];
  visualSuggestions: string;
  voiceoverText: string;
  onScreenText: string[];
  soundtrackSuggestion: string;
  conclusion: string;
  cta: string;
  caption: string;
  hashtags: string[];
  scenePrompts?: VisualScenePrompt[];
  isFavorite?: boolean;
  status?: ProductionStatus;
  createdAt: string;
  customNotes?: string;
}

export interface UserSettings {
  language: 'fr' | 'en';
  theme: 'dark' | 'light';
}

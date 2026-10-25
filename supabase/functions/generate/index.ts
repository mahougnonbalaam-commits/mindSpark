// Edge Function "generate" : seul endroit qui connaît la clé Gemini.
// Vérifie l'utilisateur, débite ses crédits, appelle l'IA, rembourse en cas d'échec.
//
// Secrets requis (supabase secrets set ...) : GEMINI_API_KEY
// Fournis automatiquement par Supabase : SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from 'jsr:@supabase/supabase-js@2';

const GEMINI_MODEL = 'gemini-2.5-flash';

// Prix de chaque tâche en crédits (grille tarifaire : modifier ici)
const CREDIT_COSTS = {
  video_prompts: 1
} as const;

type Task = keyof typeof CREDIT_COSTS;

const ALLOWED_DURATIONS = [15, 30, 45, 60];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Prompts are built here, never sent by the client, so the key can't be used as a general-purpose LLM
function buildVideoPromptsPrompt(idea: { title: string; script: string; duration: number }): string {
  return `Tu es un réalisateur de films et un expert en IA générative vidéo (Midjourney v6, Runway Gen-3, Kling AI).
Voici le script d'une vidéo courte au format vertical 9:16 :
Titre : "${idea.title}"
Script : "${idea.script}"
Durée : ${idea.duration} secondes

Découpe ce script en 4 scènes consécutives chronométrées.
Pour chaque scène, génère :
- timecode
- voiceoverLine
- imagePrompt (prompt photoréaliste pour Midjourney avec ratio vertical 9:16, style cinématographique, clair-obscur, 8k)
- videoPrompt (prompt d'animation vidéo pour Runway Gen-3 décrivant les mouvements précis de caméra et de lumière)
- cameraMovement (ex: Slow push-in, travelling panoramique lent, contre-plongée)
- onScreenText (phrase essentielle incrustée à l'écran)

Format JSON STRICT :
[
  {
    "sceneNumber": 1,
    "timecode": "0:00 - 0:08",
    "voiceoverLine": "...",
    "imagePrompt": "...",
    "videoPrompt": "...",
    "cameraMovement": "...",
    "onScreenText": "..."
  }
]`;
}

async function callGemini(prompt: string): Promise<unknown> {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) throw new Error('GEMINI_API_KEY manquante côté serveur');

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' }
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gemini HTTP ${res.status}`);
  }
  const data = await res.json();
  const text: string | undefined = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Réponse vide de Gemini');
  return JSON.parse(text.trim().replace(/^```(json)?\s*/i, '').replace(/```\s*$/, ''));
}

function extractScenes(parsed: unknown): unknown[] {
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === 'object') {
    const nested = Object.values(parsed).find(Array.isArray);
    if (nested) return nested as unknown[];
  }
  return [];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' });

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  // 1. Who is calling?
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return json(401, { error: 'not_authenticated' });
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData.user) return json(401, { error: 'not_authenticated' });
  const userId = userData.user.id;

  // 2. Validate the request
  let body: any;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'invalid_json' });
  }
  const task = body?.task as Task;
  if (!(task in CREDIT_COSTS)) return json(400, { error: 'unknown_task' });

  const idea = body?.idea;
  const title = typeof idea?.title === 'string' ? idea.title.slice(0, 300) : '';
  const script = typeof idea?.script === 'string' ? idea.script.slice(0, 5000) : '';
  const duration = ALLOWED_DURATIONS.includes(idea?.duration) ? idea.duration : 30;
  if (!title || !script) return json(400, { error: 'invalid_idea' });

  // 3. Charge first (atomic), so two parallel calls can't spend the same credit
  const cost = CREDIT_COSTS[task];
  const { data: balanceAfterCharge, error: chargeError } = await admin.rpc('consume_credits', {
    p_user_id: userId,
    p_amount: cost,
    p_reason: `generation:${task}`
  });
  if (chargeError) return json(500, { error: 'billing_error' });
  if (balanceAfterCharge === null) {
    const { data: profile } = await admin.from('profiles').select('credits').eq('id', userId).single();
    return json(402, { error: 'insufficient_credits', credits: profile?.credits ?? 0, cost });
  }

  // 4. Generate; refund if anything goes wrong
  try {
    const scenes = extractScenes(await callGemini(buildVideoPromptsPrompt({ title, script, duration })));
    if (scenes.length === 0) throw new Error('Aucune scène dans la réponse');
    return json(200, { scenes, credits: balanceAfterCharge });
  } catch (err) {
    console.error('generation failed', err);
    const { data: refunded } = await admin.rpc('add_credits', {
      p_user_id: userId,
      p_amount: cost,
      p_reason: `refund:${task}`
    });
    return json(502, { error: 'generation_failed', credits: refunded ?? balanceAfterCharge });
  }
});

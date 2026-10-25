# ⚡ MindSpark AI — Studio de Création & Idées de Vidéos Virales

**MindSpark AI** est un assistant intelligent full-stack conçu pour les créateurs de contenu vidéo court (TikTok, Instagram Reels, YouTube Shorts, Facebook) et les créateurs de chaînes sans visage (*faceless creators*).

L'application propose des idées de vidéos à trier façon « swipe », des fiches de script complètes et des directives de production vidéo par IA.

---

## 🌟 Fonctionnalités Clés

### 1. 🃏 Swipe d'idées
- Cartes d'idées à trier : glisser à droite pour **garder**, à gauche pour **passer** (ou flèches ← / → du clavier)
- Filtre par thème (psychologie, réflexions, relations, discipline, mystères…)
- Tiroir des idées **validées** et **passées**, avec restauration possible

### 2. 📋 Fiche Détaillée Interactive
Pour chaque idée générée :
- **Titre accrocheur**
- **Concept & Angle psychologique**
- **Hook (0-3s)** pour stopper le scroll immédiatement
- **Script complet** rédigé mot pour mot et rythmé
- **Déroulement chronométré** (timeline beats)
- **Suggestions visuelles** & plans cinématiques
- **Voix off (TTS clean)** nettoyée de toute didascalie pour ElevenLabs / CapCut
- **Texte à afficher à l'écran** (incrustations texte dynamiques)
- **Ambiance sonore & SFX**
- **Conclusion marquante**
- **Appel à l'action (CTA)** pour déclencher des commentaires
- **Légende** & **Hashtags optimisés**
- **Boutons d'action** : Copie en 1 clic de chaque élément, modification du script en direct, sauvegarde en favori, export Markdown / TXT / JSON.

### 3. 🎬 Assistant de Vidéos IA (Faceless Video Studio)
- Prompts d'images détaillés pour **Midjourney v6** / **FLUX** / **DALL-E 3** au ratio vertical `9:16`
- Prompts vidéo pour **Runway Gen-3** / **Kling AI** / **Luma Dream Machine** avec mouvements de caméra précis
- Découpage scène par scène synchronisé avec l'audio
- Instructions de montage vertical (pacing de 2.5s, sous-titres, étalonnage)

### 4. 🗂️ Bibliothèque Personnelle & Tableau Kanban
- Suivi du statut de chaque projet : *À produire*, *En cours*, *Publiée*
- Filtre par catégorie et recherche par mot-clé
- Éditeur de script intégré avec sauvegarde des notes de tournage
- Persistance automatique dans le navigateur (**LocalStorage**)
- Export individuel ou global en Markdown, TXT ou JSON

### 5. 🎨 Design UX/UI & Internationalisation
- Thème sombre obsidian (`#0B0B0F`) élégant avec accents améthyste (`#8B5CF6`)
- Bascule instantanée en **mode clair**
- Bilingue natif : **Français** (par défaut) et **English**
- Design 100% responsive (bureau, tablette et mobile)

---

## 🚀 Démarrage Rapide

### Prérequis
- [Node.js](https://nodejs.org/) v18+ installé

### Installation

```bash
# 1. Cloner ou naviguer dans le dossier du projet
cd c:\Users\ADMIN\Documents\frida\code

# 2. Installer les dépendances
npm install

# 3. Lancer le serveur de développement
npm run dev
```

L'application sera accessible immédiatement sur :
👉 `http://localhost:3000`

---

## 🔑 Comptes, crédits & IA

Les utilisateurs **ne fournissent aucune clé API**. La clé Gemini est stockée côté serveur (secret Supabase) et n'apparaît jamais dans l'application.

- **Mode catalogue (gratuit, sans compte)** : idées prêtes à l'emploi et prompts vidéo types.
- **Génération IA (payante)** : l'utilisateur se connecte et dépense des crédits. Chaque génération passe par l'Edge Function `generate`, qui vérifie le compte, débite le crédit, appelle Gemini, puis **rembourse automatiquement** si la génération échoue.

### Architecture

```
Navigateur (React)  ──JWT utilisateur──▶  Edge Function "generate"  ──GEMINI_API_KEY──▶  Google Gemini
        │                                        │
        └── lecture seule de son solde ──▶  Postgres (profiles, credit_transactions)
```

Le solde ne peut être modifié que par le serveur : les tables sont en lecture seule pour l'utilisateur (RLS), et les fonctions `consume_credits` / `add_credits` ne sont exécutables qu'avec la clé `service_role`.

### Mise en place (une seule fois)

1. Créer un projet sur [supabase.com](https://supabase.com), puis installer la [CLI Supabase](https://supabase.com/docs/guides/cli).
2. Lier le projet et appliquer le schéma :
   ```bash
   supabase link --project-ref <ref-du-projet>
   supabase db push
   ```
3. Enregistrer la clé Gemini **côté serveur** et déployer la fonction :
   ```bash
   supabase secrets set GEMINI_API_KEY=<votre-clé-gemini>
   supabase functions deploy generate
   ```
4. Copier `.env.example` en `.env` et renseigner `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` (*Project Settings → API*). La clé `anon` est publique par conception, la sécurité repose sur les règles RLS.
5. Dans *Authentication → Providers*, laisser **Email** activé (avec ou sans confirmation de l'adresse).

### Tarifs & crédits

| Réglage | Où le modifier |
|---|---|
| Coût d'une génération | `CREDIT_COSTS` dans `supabase/functions/generate/index.ts` (fait foi) **et** `src/services/pricing.ts` (affichage) |
| Packs de crédits (prix en FCFA) | `CREDIT_PACKS` dans `supabase/functions/_shared/fedapay.ts` (fait foi) **et** `src/services/pricing.ts` (affichage) |
| Crédits offerts à l'inscription | fonction `signup_credits()` dans `supabase/migrations/…_credits.sql` (0 par défaut) |

Pour offrir des crédits à la main (geste commercial, test), depuis le *SQL Editor* de Supabase :

```sql
select public.add_credits(
  (select id from auth.users where email = 'client@exemple.com'),
  100,
  'manual'
);
```

### Paiement FedaPay

L'utilisateur choisit un pack dans **Mon compte** et paie sur la page sécurisée FedaPay (Mobile Money, carte). Les crédits sont ajoutés **une seule fois**, après vérification du statut auprès de l'API FedaPay, soit par le webhook, soit au retour de l'utilisateur sur l'app (le premier arrivé crédite, l'autre ne fait rien).

1. Dans le tableau de bord FedaPay (**mode Sandbox** pour commencer), récupérer la **clé secrète** (*Paramètres → Clés API*).
2. Créer un webhook (*Paramètres → Webhooks*) pointant vers :
   `https://<ref-du-projet>.supabase.co/functions/v1/fedapay-webhook`
   avec au moins les événements `transaction.approved`, `transaction.declined` et `transaction.canceled`, puis copier son **secret** (`wh_sandbox_...`).
3. Enregistrer les secrets et déployer :
   ```bash
   npx supabase secrets set FEDAPAY_SECRET_KEY=sk_sandbox_... FEDAPAY_WEBHOOK_SECRET=wh_sandbox_... FEDAPAY_ENV=sandbox APP_URL=http://localhost:3000
   npx supabase db push
   npx supabase functions deploy payments
   npx supabase functions deploy fedapay-webhook --no-verify-jwt
   ```
4. Tester un achat avec les numéros de test FedaPay, puis vérifier les tables `payments` et `credit_transactions`.
5. **Passage en production** : remplacer par les clés et le secret webhook **live**, `FEDAPAY_ENV=live`, `APP_URL=<adresse de production>`, et recréer le webhook en mode live.

*Ne mettez jamais la clé Gemini dans une variable `VITE_*` : Vite l'intégrerait en clair dans le JavaScript public.*

---

## 📦 Build de Production & Déploiement

Pour générer les fichiers de production optimisés :

```bash
npm run build
```

Pour prévisualiser le build localement :

```bash
npm run preview
```

### Déploiement en 1 clic
- **Vercel** : Importez le dépôt Git, Vercel détecte automatiquement Vite et déploie l'application.
- **Netlify** : Déposez le dossier `dist/` ou connectez votre repo avec la commande de build `npm run build` et le dossier de publication `dist`.

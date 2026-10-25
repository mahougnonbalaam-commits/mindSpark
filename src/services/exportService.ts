import { Idea } from '../types';

// "Vérité cachée !" -> "verite-cachee" (accents folded instead of dropped)
function toSlug(title: string): string {
  const slug = title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 40)
    .replace(/^-+|-+$/g, '');
  return slug || 'idee';
}

export const exportService = {
  // Format as clean Markdown
  toMarkdown(idea: Idea): string {
    return `# ${idea.title}

> **Concept :** ${idea.concept}  
> **Catégorie :** ${idea.category} | **Plateforme :** ${idea.platform.toUpperCase()} | **Durée :** ${idea.duration}s | **Ton :** ${idea.tone}

---

## ⚡ Hook (3 premières secondes)
\`\`\`text
${idea.hook}
\`\`\`

---

## 📜 Script Complet
${idea.script}

---

## ⏱️ Déroulement chronométré
${idea.timeline.map(t => `- **${t.timestamp}** [${t.label}] : ${t.content}`).join('\n')}

---

## 🎙️ Voix Off (TTS Clean)
${idea.voiceoverText}

---

## 🎬 Suggestions Visuelles & Plans
${idea.visualSuggestions}

---

## 🔤 Textes à incruster à l'écran
${idea.onScreenText.map(t => `- "${t}"`).join('\n')}

---

## 🎵 Ambiance Sonore
${idea.soundtrackSuggestion}

---

## 🎯 Conclusion & Appel à l'action (CTA)
- **Conclusion :** ${idea.conclusion}
- **CTA :** ${idea.cta}

---

## 📱 Légende & Hashtags
${idea.caption}

${idea.hashtags.join(' ')}

${idea.scenePrompts && idea.scenePrompts.length > 0 ? `
---

## 🤖 Prompts Vidéo IA (Format 9:16)
${idea.scenePrompts.map(s => `### Scène ${s.sceneNumber} (${s.timecode})
- **Voix off :** "${s.voiceoverLine}"
- **Image Prompt (Midjourney) :** \`${s.imagePrompt}\`
- **Video Prompt (Runway/Kling) :** \`${s.videoPrompt}\`
- **Caméra :** ${s.cameraMovement}
`).join('\n')}
` : ''}
`;
  },

  // Format as plain text
  toPlainText(idea: Idea): string {
    return `TITRE : ${idea.title}
CONCEPT : ${idea.concept}
PLATEFORME : ${idea.platform} (${idea.duration}s)

HOOK (0-3s) :
${idea.hook}

SCRIPT COMPLET :
${idea.script}

VOIX OFF (TTS) :
${idea.voiceoverText}

TEXTE À L'ÉCRAN :
${idea.onScreenText.join('\n')}

SUGGESTIONS VISUELLES :
${idea.visualSuggestions}

AMBIANCE SONORE :
${idea.soundtrackSuggestion}

CONCLUSION : ${idea.conclusion}
CTA : ${idea.cta}

LÉGENDE DU POST :
${idea.caption}

HASHTAGS :
${idea.hashtags.join(' ')}
`;
  },

  // Trigger browser file download
  downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  exportAsMarkdown(idea: Idea) {
    const md = this.toMarkdown(idea);
    const slug = toSlug(idea.title);
    this.downloadFile(md, `${slug}.md`, 'text/markdown;charset=utf-8');
  },

  exportAsTxt(idea: Idea) {
    const txt = this.toPlainText(idea);
    const slug = toSlug(idea.title);
    this.downloadFile(txt, `${slug}.txt`, 'text/plain;charset=utf-8');
  },

  exportAsJson(idea: Idea) {
    const json = JSON.stringify(idea, null, 2);
    const slug = toSlug(idea.title);
    this.downloadFile(json, `${slug}.json`, 'application/json;charset=utf-8');
  }
};

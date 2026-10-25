import { Idea, UserSettings, ProductionStatus } from '../types';
import { POPULAR_IDEAS } from './templates';

const STORAGE_KEYS = {
  IDEAS: 'mindspark_ideas',
  VALIDATED: 'mindspark_validated',
  REJECTED: 'mindspark_rejected',
  FAVORITES: 'mindspark_favorites',
  HISTORY: 'mindspark_history',
  SETTINGS: 'mindspark_settings',
  DELETED_SEEDS: 'mindspark_deleted_seeds',
};

const DEFAULT_SETTINGS: UserSettings = {
  language: 'fr',
  theme: 'light'
};

export const storageService = {
  // Settings
  getSettings(): UserSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!data) return DEFAULT_SETTINGS;
      const { apiKey, apiProvider, modelName, ...rest } = JSON.parse(data);
      const settings: UserSettings = { ...DEFAULT_SETTINGS, ...rest };
      // Wipe API keys saved by older versions (AI keys now live only on the server)
      if (apiKey !== undefined || apiProvider !== undefined || modelName !== undefined) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      }
      return settings;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: Partial<UserSettings>): UserSettings {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving settings to localStorage', e);
    }
    return updated;
  },

  // Ideas & Library
  getIdeas(): Idea[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.IDEAS);
      if (!data) {
        this.saveIdeas(POPULAR_IDEAS);
        return POPULAR_IDEAS;
      }
      const parsed: Idea[] = JSON.parse(data);
      // Add seed ideas shipped after the first launch, but never resurrect ones the user deleted
      const knownIds = new Set([...parsed.map(i => i.id), ...this.getDeletedSeedIds()]);
      const missing = POPULAR_IDEAS.filter(p => !knownIds.has(p.id));
      if (missing.length > 0) {
        const merged = [...parsed, ...missing];
        this.saveIdeas(merged);
        return merged;
      }
      return parsed;
    } catch {
      return POPULAR_IDEAS;
    }
  },

  saveIdeas(ideas: Idea[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.IDEAS, JSON.stringify(ideas));
    } catch (e) {
      console.error('Error saving ideas to localStorage', e);
    }
  },

  addIdea(idea: Idea): Idea[] {
    const ideas = this.getIdeas();
    const exists = ideas.findIndex(i => i.id === idea.id);
    let updated: Idea[];
    if (exists >= 0) {
      updated = [...ideas];
      updated[exists] = idea;
    } else {
      updated = [idea, ...ideas];
    }
    this.saveIdeas(updated);
    this.addToHistory(idea);
    return updated;
  },

  updateIdeaStatus(id: string, status: ProductionStatus): Idea[] {
    const ideas = this.getIdeas();
    const updated = ideas.map(idea => idea.id === id ? { ...idea, status } : idea);
    this.saveIdeas(updated);

    // Also update in validated if present
    const validated = this.getValidatedIdeas();
    if (validated.some(i => i.id === id)) {
      this.saveValidatedIdeas(validated.map(i => i.id === id ? { ...i, status } : i));
    }
    return updated;
  },

  toggleFavorite(id: string): Idea[] {
    const ideas = this.getIdeas();
    const updated = ideas.map(idea => idea.id === id ? { ...idea, isFavorite: !idea.isFavorite } : idea);
    this.saveIdeas(updated);
    return updated;
  },

  updateIdeaScript(id: string, newScript: string, notes?: string): Idea[] {
    const ideas = this.getIdeas();
    const updater = (idea: Idea) => ({
      ...idea,
      script: newScript,
      customNotes: notes !== undefined ? notes : idea.customNotes
    });

    const updated = ideas.map(idea => idea.id === id ? updater(idea) : idea);
    this.saveIdeas(updated);

    // Also update in validated
    const validated = this.getValidatedIdeas();
    if (validated.some(i => i.id === id)) {
      this.saveValidatedIdeas(validated.map(i => i.id === id ? updater(i) : i));
    }
    return updated;
  },

  getDeletedSeedIds(): string[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DELETED_SEEDS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  deleteIdea(id: string): Idea[] {
    const ideas = this.getIdeas();
    const updated = ideas.filter(i => i.id !== id);
    this.saveIdeas(updated);

    if (POPULAR_IDEAS.some(p => p.id === id)) {
      try {
        localStorage.setItem(STORAGE_KEYS.DELETED_SEEDS, JSON.stringify([...this.getDeletedSeedIds(), id]));
      } catch (e) {
        console.error('Error saving deleted seed ids', e);
      }
    }

    // Remove from validated and rejected
    this.removeValidatedIdea(id);
    this.removeRejectedIdea(id);
    return updated;
  },

  // 💚 Validated Ideas (OK / Gardées)
  getValidatedIdeas(): Idea[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.VALIDATED);
      // Ideas only become validated through an explicit swipe right
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveValidatedIdeas(ideas: Idea[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.VALIDATED, JSON.stringify(ideas));
    } catch (e) {
      console.error('Error saving validated ideas', e);
    }
  },

  addValidatedIdea(idea: Idea): Idea[] {
    const list = this.getValidatedIdeas();
    const updated = [idea, ...list.filter(i => i.id !== idea.id)];
    this.saveValidatedIdeas(updated);
    // Also remove from rejected if it was there
    this.removeRejectedIdea(idea.id);
    this.addToHistory(idea);
    return updated;
  },

  removeValidatedIdea(id: string): Idea[] {
    const list = this.getValidatedIdeas();
    const updated = list.filter(i => i.id !== id);
    this.saveValidatedIdeas(updated);
    return updated;
  },

  // ❌ Rejected Ideas (Moins bonnes / Passées)
  getRejectedIdeas(): Idea[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.REJECTED);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveRejectedIdeas(ideas: Idea[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.REJECTED, JSON.stringify(ideas));
    } catch (e) {
      console.error('Error saving rejected ideas', e);
    }
  },

  addRejectedIdea(idea: Idea): Idea[] {
    const list = this.getRejectedIdeas();
    const updated = [idea, ...list.filter(i => i.id !== idea.id)];
    this.saveRejectedIdeas(updated);
    // Also remove from validated if it was there
    this.removeValidatedIdea(idea.id);
    return updated;
  },

  removeRejectedIdea(id: string): Idea[] {
    const list = this.getRejectedIdeas();
    const updated = list.filter(i => i.id !== id);
    this.saveRejectedIdeas(updated);
    return updated;
  },

  restoreRejectedIdea(id: string): { validated: Idea[]; rejected: Idea[] } {
    const rejectedList = this.getRejectedIdeas();
    const target = rejectedList.find(i => i.id === id);
    const newRejected = rejectedList.filter(i => i.id !== id);
    this.saveRejectedIdeas(newRejected);
    let newValidated = this.getValidatedIdeas();
    if (target) {
      newValidated = [{ ...target, isFavorite: true, status: 'to_produce' }, ...newValidated.filter(i => i.id !== target.id)];
      this.saveValidatedIdeas(newValidated);
    }
    return { validated: newValidated, rejected: newRejected };
  },

  // History
  getHistory(): Idea[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  addToHistory(idea: Idea): void {
    try {
      const history = this.getHistory();
      const filtered = history.filter(h => h.id !== idea.id);
      const updated = [idea, ...filtered].slice(0, 20); // Keep last 20
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
    } catch (e) {
      console.error('Error adding to history', e);
    }
  }
};

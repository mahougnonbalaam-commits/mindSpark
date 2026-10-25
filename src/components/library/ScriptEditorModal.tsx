import React, { useState, useEffect } from 'react';
import { X, Save, FileEdit, Sparkles } from 'lucide-react';
import { Idea } from '../../types';

interface ScriptEditorModalProps {
  idea: Idea | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, newScript: string, notes?: string) => void;
  t: any;
}

export const ScriptEditorModal: React.FC<ScriptEditorModalProps> = ({
  idea,
  isOpen,
  onClose,
  onSave,
  t
}) => {
  const [script, setScript] = useState(idea?.script ?? '');
  const [notes, setNotes] = useState(idea?.customNotes ?? '');

  useEffect(() => {
    if (idea) {
      setScript(idea.script);
      setNotes(idea.customNotes || '');
    }
  }, [idea]);

  if (!isOpen || !idea) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(idea.id, script, notes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl glass-panel bg-dark-900 rounded-3xl border border-white/10 p-6 sm:p-7 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-spark-500/10 border border-spark-500/20 flex items-center justify-center text-spark-400">
              <FileEdit className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Modifier le script</h3>
              <p className="text-xs text-zinc-400 truncate max-w-md">{idea.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="mt-5 space-y-4 flex-1 overflow-y-auto pr-1">
          <div>
            <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-1.5">
              Texte du script ({idea.duration} secondes)
            </label>
            <textarea
              rows={8}
              value={script}
              onChange={(e) => setScript(e.target.value)}
              className="w-full bg-dark-850 border border-white/10 rounded-2xl p-4 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-spark-500 font-sans leading-relaxed transition-colors resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-1.5">
              Notes de production personnelles (B-roll, voix, annotations)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Utiliser un micro cravate, ajouter un effet de glitch au moment du twist..."
              className="w-full bg-dark-850 border border-white/10 rounded-2xl p-3.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-spark-500 transition-colors resize-none"
            />
          </div>

          <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-dark-800 hover:bg-dark-750 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-spark-600 hover:bg-spark-500 text-white text-xs font-semibold shadow-lg shadow-spark-600/30 flex items-center gap-1.5 transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{t.actions.saveChanges}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

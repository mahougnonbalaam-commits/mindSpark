import React, { useState } from 'react';
import {
  FolderKanban,
  Search,
  Filter,
  Download,
  Trash2,
  FileEdit,
  Sparkles,
  Clock,
  PlayCircle,
  CheckCircle2,
  Heart,
  Grid,
  ListFilter
} from 'lucide-react';
import { Idea, ProductionStatus, ContentCategory } from '../../types';
import { IdeaCard } from '../generator/IdeaCard';
import { exportService } from '../../services/exportService';

interface LibraryViewProps {
  ideas: Idea[];
  onOpenDetail: (idea: Idea) => void;
  onToggleFavorite: (id: string) => void;
  onUpdateStatus: (id: string, status: ProductionStatus) => void;
  onOpenEdit: (idea: Idea) => void;
  onDeleteIdea: (id: string) => void;
  onOpenStudio: (idea: Idea) => void;
  onCopyText: (text: string, label: string) => void;
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
  t: any;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  ideas,
  onOpenDetail,
  onToggleFavorite,
  onUpdateStatus,
  onOpenEdit,
  onDeleteIdea,
  onOpenStudio,
  onCopyText,
  onShowToast,
  t
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'to_produce' | 'in_progress' | 'published' | 'favorites'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Filter ideas
  const filteredIdeas = ideas.filter(idea => {
    // Tab filter
    if (activeTab === 'favorites' && !idea.isFavorite) return false;
    if (activeTab === 'to_produce' && idea.status !== 'to_produce') return false;
    if (activeTab === 'in_progress' && idea.status !== 'in_progress') return false;
    if (activeTab === 'published' && idea.status !== 'published') return false;

    // Category filter
    if (selectedCategory !== 'all' && idea.category !== selectedCategory) return false;

    // Search query filter
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchTitle = idea.title.toLowerCase().includes(q);
      const matchHook = idea.hook.toLowerCase().includes(q);
      const matchScript = idea.script.toLowerCase().includes(q);
      const matchConcept = idea.concept.toLowerCase().includes(q);
      if (!matchTitle && !matchHook && !matchScript && !matchConcept) return false;
    }

    return true;
  });

  const exportAllFiltered = () => {
    if (filteredIdeas.length === 0) return;
    const combined = filteredIdeas.map((idea, idx) => `=== IDÉE ${idx + 1} : ${idea.title} ===\n${exportService.toPlainText(idea)}`).join('\n\n========================================\n\n');
    exportService.downloadFile(combined, `mindspark-export-${activeTab}.txt`, 'text/plain;charset=utf-8');
    onShowToast(`${filteredIdeas.length} idée(s) exportée(s) !`, 'success');
  };

  const tabs = [
    { id: 'all' as const, label: t.library.all, count: ideas.length, icon: Grid },
    { id: 'to_produce' as const, label: t.library.toProduce, count: ideas.filter(i => i.status === 'to_produce').length, icon: Clock },
    { id: 'in_progress' as const, label: t.library.inProgress, count: ideas.filter(i => i.status === 'in_progress').length, icon: PlayCircle },
    { id: 'published' as const, label: t.library.published, count: ideas.filter(i => i.status === 'published').length, icon: CheckCircle2 },
    { id: 'favorites' as const, label: t.library.favorites, count: ideas.filter(i => i.isFavorite).length, icon: Heart },
  ];

  return (
    <div className="space-y-7 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <FolderKanban className="w-7 h-7 text-spark-400" />
            <span>{t.library.title}</span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Gérez votre pipeline de production de vidéos, triez vos concepts et suivez leur statut.
          </p>
        </div>

        <button
          onClick={exportAllFiltered}
          disabled={filteredIdeas.length === 0}
          className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-dark-800 hover:bg-dark-750 border border-white/10 text-xs font-semibold text-zinc-200 hover:text-white flex items-center gap-2 transition-colors disabled:opacity-40"
        >
          <Download className="w-4 h-4 text-spark-400" />
          <span>Exporter cette vue ({filteredIdeas.length})</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-white/10">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-spark-600 text-white shadow-lg shadow-spark-600/25'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                  isActive ? 'bg-white/20 text-white' : 'bg-dark-800 text-zinc-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.actions.searchPlaceholder}
            className="w-full bg-dark-900 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-spark-500 transition-colors"
          />
        </div>

        {/* Category Filter */}
        <div className="w-full sm:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-dark-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-medium text-zinc-300 focus:outline-none focus:border-spark-500"
          >
            <option value="all">Toutes les catégories</option>
            <option value="deep_reflections">{t.categories.deep_reflections}</option>
            <option value="relationships">{t.categories.relationships}</option>
            <option value="psychology">{t.categories.psychology}</option>
            <option value="discipline_motivation">{t.categories.discipline_motivation}</option>
            <option value="hard_truths">{t.categories.hard_truths}</option>
            <option value="life_lessons">{t.categories.life_lessons}</option>
            <option value="philosophy">{t.categories.philosophy}</option>
            <option value="short_moral_stories">{t.categories.short_moral_stories}</option>
            <option value="surprising_facts">{t.categories.surprising_facts}</option>
            <option value="respectful_debates">{t.categories.respectful_debates}</option>
            <option value="original_quotes">{t.categories.original_quotes}</option>
            <option value="faceless_voiceover">{t.categories.faceless_voiceover}</option>
            <option value="mystery_intrigue">{t.categories.mystery_intrigue}</option>
            <option value="educational_facts">{t.categories.educational_facts}</option>
          </select>
        </div>
      </div>

      {/* Ideas Grid */}
      {filteredIdeas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredIdeas.map((idea) => (
            <div key={idea.id} className="relative group">
              <IdeaCard
                idea={idea}
                onOpenDetail={onOpenDetail}
                onToggleFavorite={onToggleFavorite}
                onUpdateStatus={onUpdateStatus}
                onOpenStudio={onOpenStudio}
                onCopyText={onCopyText}
                t={t}
              />
              {/* Quick delete button */}
              <button
                onClick={() => {
                  if (window.confirm(t.actions.confirmDelete)) {
                    onDeleteIdea(idea.id);
                  }
                }}
                className="absolute top-3 right-12 opacity-0 group-hover:opacity-100 p-2 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all z-10"
                title={t.actions.delete}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-panel p-12 rounded-3xl text-center space-y-3 border border-white/5">
          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-zinc-500 mx-auto">
            <FolderKanban className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-zinc-300">{t.library.empty}</p>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Utilisez le générateur d'idées ou parcourez les inspirations populaires pour enrichir votre bibliothèque.
          </p>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, ActiveTab } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
import { Dashboard } from './components/dashboard/Dashboard';
import { LibraryView } from './components/library/LibraryView';
import { SwipeDeck } from './components/swipe/SwipeDeck';
import { ValidatedIdeasDrawer } from './components/swipe/ValidatedIdeasDrawer';
import { IdeaDetailModal } from './components/generator/IdeaDetailModal';
import { ScriptEditorModal } from './components/library/ScriptEditorModal';
import { AccountModal } from './components/common/AccountModal';
import { AiVideoStudio } from './components/studio/AiVideoStudio';
import { ToastContainer, ToastMessage } from './components/common/Toast';
import { Idea, ProductionStatus, UserSettings } from './types';
import { storageService } from './services/storageService';
import { useAccount } from './services/useAccount';
import { paymentService, readPaymentReturn, clearPaymentReturn } from './services/paymentService';
import { fr } from './locales/fr';
import { en } from './locales/en';

// Unbiased Fisher-Yates shuffle
function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export const App: React.FC = () => {
  // Settings & Theme
  const [settings, setSettings] = useState<UserSettings>(() => storageService.getSettings());
  const t = settings.language === 'en' ? en : fr;

  // Validated / Approved ideas ("OK" ideas)
  const [validatedIdeas, setValidatedIdeas] = useState<Idea[]>(() => {
    return storageService.getValidatedIdeas();
  });

  // Rejected / Passed ideas ("Moins bon" ideas)
  const [rejectedIdeas, setRejectedIdeas] = useState<Idea[]>(() => {
    return storageService.getRejectedIdeas();
  });

  // Deck ideas pool: only cards not yet swiped (neither in validated nor in rejected)
  const [deckIdeas, setDeckIdeas] = useState<Idea[]>(() => {
    const all = storageService.getIdeas();
    const validatedIds = new Set(storageService.getValidatedIdeas().map(i => i.id));
    const rejectedIds = new Set(storageService.getRejectedIdeas().map(i => i.id));
    const unswiped = all.filter(i => !validatedIds.has(i.id) && !rejectedIds.has(i.id));
    // If all cards were already swiped, initialize with all cards shuffled
    return unswiped.length > 0 ? unswiped : shuffle(all);
  });

  // Every idea that has been put in the deck this session, so new ones can be detected
  const deckSeenIds = useRef<Set<string>>(new Set(storageService.getIdeas().map(i => i.id)));

  // Full library (all saved ideas) and recent history, used by the non-swipe views
  const [libraryIdeas, setLibraryIdeas] = useState<Idea[]>(() => storageService.getIdeas());
  const [history, setHistory] = useState<Idea[]>(() => storageService.getHistory());

  // Navigation
  const [activeTab, setActiveTab] = useState<ActiveTab>('swipe');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Category filter for the deck
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerActiveTab, setDrawerActiveTab] = useState<'validated' | 'rejected'>('validated');

  // Modals
  const [selectedIdeaDetail, setSelectedIdeaDetail] = useState<Idea | null>(null);
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const account = useAccount();
  const [studioTargetIdea, setStudioTargetIdea] = useState<Idea | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, type, message }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Reload everything from storage (some views and modals write to it directly)
  const refreshData = () => {
    const all = storageService.getIdeas();
    const allIds = new Set(all.map(i => i.id));
    setLibraryIdeas(all);
    setHistory(storageService.getHistory());
    setValidatedIdeas(storageService.getValidatedIdeas());
    setRejectedIdeas(storageService.getRejectedIdeas());

    // Newly created ideas go to the top of the swipe deck; deleted ones leave it
    const fresh = all.filter(i => !deckSeenIds.current.has(i.id));
    fresh.forEach(i => deckSeenIds.current.add(i.id));
    setDeckIdeas(prev => [...fresh, ...prev.filter(i => allIds.has(i.id))]);
  };

  useEffect(() => {
    refreshData();
  }, [activeTab]);

  // Back from FedaPay: let the server check the real payment status and credit the account.
  // (The webhook credits it too; whichever runs first wins, the other is a no-op.)
  const paymentChecked = useRef(false);
  useEffect(() => {
    const transactionId = readPaymentReturn();
    if (!transactionId || !account.session || paymentChecked.current) return;
    paymentChecked.current = true;
    clearPaymentReturn();

    paymentService.syncPayment(transactionId)
      .then(({ status, credits }) => {
        if (credits !== null) account.setCredits(credits);
        if (status === 'approved') showToast('Paiement confirmé, vos crédits ont été ajoutés ⚡', 'success');
        else if (status === 'pending') showToast('Paiement en cours de validation, vos crédits arriveront dans quelques instants.', 'info');
        else showToast("Le paiement n'a pas abouti. Aucun montant n'a été crédité.", "error");
      })
      .catch(err => showToast(err.message, 'error'));
  }, [account.session]);

  // Sync dark/light theme
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
  }, [settings.theme]);

  // Settings
  const handleSaveSettings = (newSettings: Partial<UserSettings>) => {
    const updated = storageService.saveSettings(newSettings);
    setSettings(updated);
  };

  const handleToggleLanguage = () => {
    const nextLang = settings.language === 'fr' ? 'en' : 'fr';
    handleSaveSettings({ language: nextLang });
    showToast(`Langue : ${nextLang === 'fr' ? 'Français' : 'English'}`, 'info');
  };

  const handleToggleTheme = () => {
    const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
    handleSaveSettings({ theme: nextTheme });
    showToast(`Thème ${nextTheme === 'dark' ? 'sombre' : 'clair'} activé`, 'info');
  };

  // ==========================================
  // SWIPE HANDLERS (CONSUME CARD IMMEDIATELY)
  // ==========================================

  const handleSwipeLeft = (idea: Idea) => {
    // 1. Store in rejected ideas
    const updatedRejected = storageService.addRejectedIdea(idea);
    setRejectedIdeas(updatedRejected);

    // 2. Consume card from current deck so it NEVER returns
    setDeckIdeas(prev => prev.filter(i => i.id !== idea.id));

    // 3. User feedback toast
    showToast(`❌ Passé : « ${idea.title.slice(0, 30)}... »`, 'info');
  };

  const handleSwipeRight = (idea: Idea) => {
    // 1. Store in validated ideas
    const updatedIdea: Idea = {
      ...idea,
      isFavorite: true,
      status: 'to_produce' as ProductionStatus
    };
    const updatedValidated = storageService.addValidatedIdea(updatedIdea);
    setValidatedIdeas(updatedValidated);

    // 2. Consume card from current deck so it NEVER returns
    setDeckIdeas(prev => prev.filter(i => i.id !== idea.id));

    // 3. User feedback toast
    showToast(`💚 Idée validée (« ${idea.title.slice(0, 30)}... »)`, 'success');
  };

  const handleReloadIdeas = () => {
    const all = storageService.getIdeas();
    setDeckIdeas(shuffle(all));
    showToast('Toutes les idées ont été rechargées dans le deck !', 'info');
  };

  // Filtered Deck according to category pill
  const filteredDeck = deckIdeas.filter(idea => {
    if (selectedCategory === 'all') return true;
    return idea.category === selectedCategory;
  });

  // ==========================================
  // SELECTIONS & DRAWER ACTIONS
  // ==========================================

  const handleOpenDrawer = (tab: 'validated' | 'rejected') => {
    setDrawerActiveTab(tab);
    setIsDrawerOpen(true);
  };

  const handleUpdateStatus = (id: string, status: ProductionStatus) => {
    storageService.updateIdeaStatus(id, status);
    refreshData();
    showToast('Statut de production mis à jour', 'success');
  };

  const handleSaveEditedScript = (id: string, newScript: string, notes?: string) => {
    storageService.updateIdeaScript(id, newScript, notes);
    refreshData();
    showToast('Script enregistré avec succès', 'success');
  };

  const handleDeleteIdea = (id: string, fromList: 'validated' | 'rejected') => {
    if (fromList === 'validated') {
      const updated = storageService.removeValidatedIdea(id);
      setValidatedIdeas(updated);
    } else {
      const updated = storageService.removeRejectedIdea(id);
      setRejectedIdeas(updated);
    }
    showToast('Idée retirée', 'info');
  };

  const handleRestoreRejectedIdea = (id: string, target: 'validated' | 'deck') => {
    if (target === 'validated') {
      const res = storageService.restoreRejectedIdea(id);
      setValidatedIdeas(res.validated);
      setRejectedIdeas(res.rejected);
    } else {
      const idea = rejectedIdeas.find(i => i.id === id);
      const updated = storageService.removeRejectedIdea(id);
      setRejectedIdeas(updated);
      if (idea) {
        setDeckIdeas(prev => [idea, ...prev]);
      }
    }
  };

  const handleMoveToRejected = (id: string) => {
    const idea = validatedIdeas.find(i => i.id === id);
    if (idea) {
      const newValidated = storageService.removeValidatedIdea(id);
      const newRejected = storageService.addRejectedIdea(idea);
      setValidatedIdeas(newValidated);
      setRejectedIdeas(newRejected);
    }
  };

  const handleToggleFavorite = (id: string) => {
    storageService.toggleFavorite(id);
    refreshData();
  };

  const handleDeleteFromLibrary = (id: string) => {
    storageService.deleteIdea(id);
    refreshData();
    showToast('Idée supprimée de la bibliothèque', 'info');
  };

  const handleOpenStudio = (idea: Idea) => {
    setStudioTargetIdea(idea);
    setActiveTab('studio');
  };

  const renderView = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            ideas={libraryIdeas}
            history={history}
            onSelectTab={setActiveTab}
            onOpenDetail={setSelectedIdeaDetail}
            onToggleFavorite={handleToggleFavorite}
            onUpdateStatus={handleUpdateStatus}
            onOpenStudio={handleOpenStudio}
            onCopyText={handleCopyText}
            t={t}
          />
        );
      case 'studio':
        return (
          <AiVideoStudio
            initialIdea={studioTargetIdea}
            onCopyText={handleCopyText}
            onShowToast={showToast}
            isLoggedIn={Boolean(account.session)}
            onRequireLogin={() => setIsAccountOpen(true)}
            onCreditsChange={account.setCredits}
            t={t}
          />
        );
      case 'library':
        return (
          <LibraryView
            ideas={libraryIdeas}
            onOpenDetail={setSelectedIdeaDetail}
            onToggleFavorite={handleToggleFavorite}
            onUpdateStatus={handleUpdateStatus}
            onOpenEdit={setEditingIdea}
            onDeleteIdea={handleDeleteFromLibrary}
            onOpenStudio={handleOpenStudio}
            onCopyText={handleCopyText}
            onShowToast={showToast}
            t={t}
          />
        );
      default:
        return null;
    }
  };

  const handleCopyText = async (text: string, label: string) => {
    try {
      // navigator.clipboard is undefined outside secure contexts (e.g. http on a LAN IP)
      await navigator.clipboard.writeText(text);
      showToast(label, 'success');
    } catch {
      showToast('Copie impossible : le presse-papiers n\'est pas accessible (HTTPS ou localhost requis)', 'error');
    }
  };

  return (
    <div className="h-[100dvh] max-h-[100dvh] bg-gradient-to-br from-slate-50 via-purple-50/20 to-indigo-50/30 dark:from-slate-950 dark:via-[#0c101c] dark:to-slate-900 text-slate-800 dark:text-zinc-100 flex flex-col selection:bg-spark-500/25 selection:text-spark-700 dark:selection:text-spark-300 transition-colors duration-300 overflow-hidden relative">
      {/* Luminous Ambient Background Glow Orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-72 sm:h-96 bg-gradient-to-b from-purple-200/40 via-indigo-100/20 to-transparent dark:from-purple-900/15 dark:via-indigo-950/10 pointer-events-none blur-3xl -z-10" />
      <div className="absolute top-1/4 -left-20 w-60 sm:w-80 h-60 sm:h-80 rounded-full bg-emerald-200/25 dark:bg-emerald-900/10 pointer-events-none blur-3xl -z-10" />
      <div className="absolute top-1/2 -right-20 w-60 sm:w-80 h-60 sm:h-80 rounded-full bg-fuchsia-200/20 dark:bg-purple-900/10 pointer-events-none blur-3xl -z-10" />

      {/* Sleek Minimal Navbar with both Validated & Passed counters */}
      <Navbar
        settings={settings}
        validatedCount={validatedIdeas.length}
        rejectedCount={rejectedIdeas.length}
        onOpenDrawer={handleOpenDrawer}
        onOpenAccount={() => setIsAccountOpen(true)}
        isLoggedIn={Boolean(account.session)}
        credits={account.credits}
        onToggleLanguage={handleToggleLanguage}
        onToggleTheme={handleToggleTheme}
        onOpenMobileNav={() => setIsMobileNavOpen(true)}
        t={t}
      />

      <div className="flex-1 flex min-h-0">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onOpenSettings={() => setIsAccountOpen(true)}
          favoritesCount={libraryIdeas.filter(i => i.isFavorite).length}
          toProduceCount={libraryIdeas.filter(i => i.status === 'to_produce').length}
          t={t}
        />

        {activeTab === 'swipe' ? (
          /* Main Tinder Swipe Deck Screen (Centered and scaled to mobile) */
          <main className="flex-1 flex flex-col justify-center items-center w-full px-2 sm:px-4 py-1 sm:py-3 overflow-hidden relative">
            <SwipeDeck
              ideas={filteredDeck}
              onSwipeLeft={handleSwipeLeft}
              onSwipeRight={handleSwipeRight}
              onOpenDetail={setSelectedIdeaDetail}
              onReloadIdeas={handleReloadIdeas}
              onCopyText={handleCopyText}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              validatedCount={validatedIdeas.length}
              rejectedCount={rejectedIdeas.length}
              onOpenDrawerTab={handleOpenDrawer}
              keyboardEnabled={!selectedIdeaDetail && !editingIdea && !isAccountOpen && !isDrawerOpen && !isMobileNavOpen}
              t={t}
            />
          </main>
        ) : (
          /* Creative workshop views (designed for the dark palette, so scoped to it) */
          <main className="dark flex-1 overflow-y-auto bg-slate-950 text-zinc-100">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
              {renderView()}
            </div>
          </main>
        )}
      </div>

      <MobileNav
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenSettings={() => setIsAccountOpen(true)}
        t={t}
      />

      {/* Validated & Passed Ideas Slide-over Drawer */}
      <ValidatedIdeasDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        activeTab={drawerActiveTab}
        onSelectTab={setDrawerActiveTab}
        validatedIdeas={validatedIdeas}
        rejectedIdeas={rejectedIdeas}
        onOpenDetail={setSelectedIdeaDetail}
        onUpdateStatus={handleUpdateStatus}
        onOpenEdit={setEditingIdea}
        onDeleteIdea={handleDeleteIdea}
        onRestoreRejectedIdea={handleRestoreRejectedIdea}
        onMoveToRejected={handleMoveToRejected}
        onOpenStudio={(idea) => {
          setIsDrawerOpen(false);
          handleOpenStudio(idea);
        }}
        onCopyText={handleCopyText}
        onShowToast={showToast}
        t={t}
      />

      {/* Full Script Detail Modal */}
      <IdeaDetailModal
        idea={selectedIdeaDetail}
        isOpen={Boolean(selectedIdeaDetail)}
        onClose={() => setSelectedIdeaDetail(null)}
        onToggleFavorite={handleToggleFavorite}
        onUpdateStatus={handleUpdateStatus}
        onOpenEdit={(idea) => {
          setSelectedIdeaDetail(null);
          setEditingIdea(idea);
        }}
        onOpenStudio={(idea) => {
          setSelectedIdeaDetail(null);
          handleOpenStudio(idea);
        }}
        onCopyText={handleCopyText}
        t={t}
      />

      {/* Script Editor Modal */}
      <ScriptEditorModal
        idea={editingIdea}
        isOpen={Boolean(editingIdea)}
        onClose={() => setEditingIdea(null)}
        onSave={handleSaveEditedScript}
        t={t}
      />

      {/* API Key Modal */}
      <AccountModal
        isOpen={isAccountOpen}
        onClose={() => setIsAccountOpen(false)}
        account={account}
        onShowToast={showToast}
        t={t}
      />

      {/* Global Toasts */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};

export default App;

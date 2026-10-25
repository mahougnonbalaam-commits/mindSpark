import React from 'react';
import { X, UserCircle, Sparkles } from 'lucide-react';
import { ActiveTab, NAV_ICONS, NAV_ORDER } from './Sidebar';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenSettings: () => void;
  t: any;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  onOpenSettings,
  t
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden bg-black/80 backdrop-blur-md animate-fade-in" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-4/5 max-w-xs h-full bg-dark-900 border-r border-white/10 p-5 flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-5 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-spark-600 flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-bold text-white text-base">MindSpark AI</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Links */}
          <div className="mt-5 space-y-1">
            {NAV_ORDER.map(id => {
              const Icon = NAV_ICONS[id];
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => {
                    onSelectTab(id);
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-spark-600 text-white shadow-lg shadow-spark-600/30'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{t.nav[id]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Settings */}
        <div className="pt-4 border-t border-white/10">
          <button
            onClick={() => {
              onOpenSettings();
              onClose();
            }}
            className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <UserCircle className="w-5 h-5" />
            <span>{t.nav.settings}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

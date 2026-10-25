import React from 'react';
import { Sparkles, Zap, User, Globe, Sun, Moon, Check, X, Menu } from 'lucide-react';
import { UserSettings } from '../../types';

interface NavbarProps {
  settings: UserSettings;
  validatedCount: number;
  rejectedCount: number;
  onOpenDrawer: (tab: 'validated' | 'rejected') => void;
  onOpenAccount: () => void;
  isLoggedIn: boolean;
  credits: number | null;
  onToggleLanguage: () => void;
  onToggleTheme: () => void;
  onOpenMobileNav: () => void;
  t: any;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  validatedCount,
  rejectedCount,
  onOpenDrawer,
  onOpenAccount,
  isLoggedIn,
  credits,
  onToggleLanguage,
  onToggleTheme,
  onOpenMobileNav,
  t
}) => {
  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-200/80 dark:border-white/10 bg-white/85 dark:bg-slate-950/85 backdrop-blur-xl transition-colors shrink-0">
      <div className="mx-auto px-3 sm:px-6 h-13 sm:h-16 flex items-center justify-between gap-2 sm:gap-3">
        {/* Left: Mobile menu + Brand Logo */}
        <div className="flex items-center gap-2 select-none shrink-0">
          <button
            onClick={onOpenMobileNav}
            className="md:hidden p-1.5 rounded-xl text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            title="Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-spark-600 via-spark-500 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-spark-500/25">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse-subtle" />
          </div>
          <div>
            <span className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-1">
              MindSpark <span className="text-spark-600 dark:text-spark-400 font-black">Swipe</span>
            </span>
            <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-zinc-400 font-medium hidden xs:block">
              Tinder des idées virales
            </span>
          </div>
        </div>

        {/* Right: Validated & Passed Buttons + Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* 💚 Validées Button */}
          <button
            onClick={() => onOpenDrawer('validated')}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 hover:bg-emerald-100 dark:hover:bg-emerald-500/25 border border-emerald-300 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-[11px] sm:text-xs font-bold transition-all shadow-sm cursor-pointer"
            title="Consulter les idées validées (OK)"
          >
            <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3]" />
            <span className="hidden sm:inline">Validées</span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-white text-[10px] sm:text-[11px] font-black">
              {validatedCount}
            </span>
          </button>

          {/* ❌ Passées Button */}
          <button
            onClick={() => onOpenDrawer('rejected')}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-rose-50 dark:bg-rose-500/15 hover:bg-rose-100 dark:hover:bg-rose-500/25 border border-rose-300 dark:border-rose-500/40 text-rose-700 dark:text-rose-300 text-[11px] sm:text-xs font-bold transition-all shadow-sm cursor-pointer"
            title="Consulter les idées passées (Moins bon)"
          >
            <X className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3]" />
            <span className="hidden sm:inline">Passées</span>
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] sm:text-[11px] font-black">
              {rejectedCount}
            </span>
          </button>

          {/* Account / credits pill */}
          <button
            onClick={onOpenAccount}
            className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl border text-[11px] sm:text-xs font-bold transition-colors cursor-pointer ${
              isLoggedIn
                ? 'bg-spark-500/10 border-spark-500/30 text-spark-700 dark:text-spark-300'
                : 'bg-slate-100 dark:bg-dark-850 border-slate-200 dark:border-white/10 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title={isLoggedIn ? t.account.credits : t.account.login}
          >
            {isLoggedIn ? (
              <>
                <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>{credits ?? '…'}</span>
              </>
            ) : (
              <>
                <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">{t.account.login}</span>
              </>
            )}
          </button>

          {/* Language Switcher */}
          <button
            onClick={onToggleLanguage}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-dark-850 text-[11px] sm:text-xs font-bold text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white transition-colors uppercase cursor-pointer"
            title="Langue"
          >
            <Globe className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-500 dark:text-zinc-400" />
            <span>{settings.language}</span>
          </button>

          {/* Theme Switcher */}
          <button
            onClick={onToggleTheme}
            className="p-1.5 sm:p-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-dark-850 text-slate-700 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            title={settings.theme === 'dark' ? 'Activer le mode lumineux' : 'Activer le mode sombre'}
          >
            {settings.theme === 'dark' ? (
              <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-spark-600" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

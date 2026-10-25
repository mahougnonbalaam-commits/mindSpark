import React, { useState, useEffect } from 'react';
import { X, User, Zap, LogOut, AlertCircle, CreditCard, Loader2 } from 'lucide-react';
import { Account } from '../../services/useAccount';
import { CREDIT_PACKS, formatPrice } from '../../services/pricing';
import { paymentService } from '../../services/paymentService';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: Account;
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
  t: any;
}

export const AccountModal: React.FC<AccountModalProps> = ({ isOpen, onClose, account, onShowToast, t }) => {
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [buyingPack, setBuyingPack] = useState<string | null>(null);

  // Fresh form each time the modal opens
  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError(null);
      setInfo(null);
      setBuyingPack(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setInfo(null);
    try {
      if (mode === 'signIn') {
        await account.signIn(email.trim(), password);
        onShowToast('Connexion réussie', 'success');
        onClose();
      } else {
        const { needsConfirmation } = await account.signUp(email.trim(), password);
        if (needsConfirmation) {
          setInfo(t.account.confirmEmail);
          setMode('signIn');
        } else {
          onShowToast('Compte créé, bienvenue !', 'success');
          onClose();
        }
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBuy = async (packId: string) => {
    setBuyingPack(packId);
    setError(null);
    try {
      await paymentService.startCheckout(packId); // redirects to FedaPay
    } catch (err: any) {
      setError(err.message || 'Paiement impossible pour le moment');
      setBuyingPack(null);
    }
  };

  const handleSignOut = async () => {
    await account.signOut();
    onShowToast('Vous êtes déconnecté', 'info');
    onClose();
  };

  const inputClass = 'w-full bg-slate-50 dark:bg-dark-850 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-spark-500 focus:ring-1 focus:ring-spark-500 transition-colors';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-800 dark:text-zinc-100 overflow-hidden transition-colors"
      >
        <div className="absolute -top-20 -right-20 w-44 h-44 bg-spark-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-spark-500/10 border border-spark-500/20 flex items-center justify-center text-spark-600 dark:text-spark-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t.account.modalTitle}</h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">{account.email ?? t.account.modalSubtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-800 dark:hover:text-white p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!account.configured ? (
          <div className="mt-5 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>{t.account.notConfigured}</p>
          </div>
        ) : account.session ? (
          /* Signed in: balance + purchase + sign out */
          <div className="mt-5 space-y-4">
            <div className="p-4 rounded-2xl bg-spark-500/10 border border-spark-500/20 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 dark:text-zinc-300">{t.account.credits}</span>
              <span className="flex items-center gap-1.5 text-2xl font-black text-spark-700 dark:text-spark-300">
                <Zap className="w-5 h-5" />
                {account.credits ?? '…'}
              </span>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" />
                {t.account.buyCredits}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {CREDIT_PACKS.map(pack => (
                  <button
                    key={pack.id}
                    type="button"
                    onClick={() => handleBuy(pack.id)}
                    disabled={Boolean(buyingPack)}
                    className="p-3 rounded-xl border border-slate-200 dark:border-white/10 hover:border-spark-500 dark:hover:border-spark-500 bg-slate-50 dark:bg-dark-850 hover:bg-spark-500/5 flex flex-col items-center gap-1 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <span className="flex items-center gap-1 text-base font-black text-spark-700 dark:text-spark-300">
                      {buyingPack === pack.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                      {pack.credits}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400">{pack.label}</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-zinc-100">{formatPrice(pack.amount, pack.currency)}</span>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500 text-center">{t.account.paymentNote}</p>
              {error && (
                <p className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-xs text-rose-700 dark:text-rose-300">{error}</p>
              )}
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/5 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              {t.account.signOut}
            </button>
          </div>
        ) : (
          /* Signed out: sign in / sign up form */
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-dark-850">
              {(['signIn', 'signUp'] as const).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => { setMode(m); setError(null); }}
                  className={`py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    mode === m
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
                  }`}
                >
                  {m === 'signIn' ? t.account.signInTab : t.account.signUpTab}
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600 dark:text-zinc-300">{t.account.email}</label>
              <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600 dark:text-zinc-300">{t.account.password}</label>
              <input
                type="password"
                required
                minLength={6}
                autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'signUp' ? t.account.passwordHint : undefined}
                className={inputClass}
              />
            </div>

            {error && (
              <p className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-xs text-rose-700 dark:text-rose-300">{error}</p>
            )}
            {info && (
              <p className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-xs text-emerald-700 dark:text-emerald-300">{info}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl bg-spark-600 hover:bg-spark-500 text-white text-xs font-semibold shadow-lg shadow-spark-600/30 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isSubmitting ? '…' : mode === 'signIn' ? t.account.signInBtn : t.account.signUpBtn}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

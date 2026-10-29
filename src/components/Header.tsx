import React from 'react';
import { PageId, UserProfile, CycleStatus, AuthUser } from '../types';

interface HeaderProps {
  profile: UserProfile;
  cycleStatus: CycleStatus;
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  onOpenQuickLog: () => void;
  onTogglePinLock: () => void;
  authUser: AuthUser | null;
  onOpenAuthModal: () => void;
  isSyncing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  cycleStatus,
  currentPage,
  onNavigate,
  onOpenQuickLog,
  onTogglePinLock,
  authUser,
  onOpenAuthModal,
  isSyncing = false,
}) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const displayName = profile.isAnonymous ? 'CycleCare Friend' : profile.name.split(' ')[0];

  return (
    <header className="sticky top-0 z-20 bg-white/85 backdrop-blur-md border-b border-pink-100/70 px-4 sm:px-8 py-3.5 flex items-center justify-between transition-all">
      {/* Left side: Mobile Brand or Greeting */}
      <div className="flex items-center gap-3">
        {/* Mobile Logo */}
        <div 
          onClick={() => onNavigate('dashboard')}
          className="lg:hidden flex items-center gap-2 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 to-purple-500 p-0.5 shadow-sm">
            <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
              <span className="text-pink-500 text-sm">🌸</span>
            </div>
          </div>
          <span className="font-bold text-lg text-slate-800 tracking-tight">CycleCare</span>
        </div>

        {/* Desktop Greeting */}
        <div className="hidden lg:block">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span>{getGreeting()}, {displayName}</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-pink-50 text-pink-700 border border-pink-200/80">
              Day {cycleStatus.currentCycleDay} of Cycle
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            {cycleStatus.phaseTitle} · {cycleStatus.daysUntilNextPeriod} days until next period
          </p>
        </div>
      </div>

      {/* Right side: Cloud Auth Status Pill, Quick stats, Lock, and Settings */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Supabase Cloud / Demo Mode Pill */}
        <button
          type="button"
          onClick={onOpenAuthModal}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
            authUser
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              : 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100'
          }`}
          title={authUser ? `Signed in as ${authUser.email}. Click for Cloud Vault settings.` : 'Running with local demo data. Click to sign in or connect Supabase.'}
        >
          {isSyncing ? (
            <span className="w-2 h-2 rounded-full border border-purple-600 border-t-transparent animate-spin" />
          ) : authUser ? (
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          ) : (
            <span className="text-[10px]">🧪</span>
          )}
          <span className="hidden md:inline">
            {authUser ? (authUser.email.length > 20 ? `${authUser.email.slice(0, 18)}...` : authUser.email) : 'Demo Mode (Sample Data)'}
          </span>
          <span className="md:hidden">
            {authUser ? 'Cloud' : 'Demo'}
          </span>
        </button>

        {/* Active Phase Badge (Mobile & Desktop) */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-100 text-xs font-medium text-pink-800">
          <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping" />
          <span className="hidden sm:inline font-semibold">{cycleStatus.phaseTitle}</span>
          <span className="sm:hidden font-semibold">Day {cycleStatus.currentCycleDay}</span>
        </div>

        {/* PIN Lock Quick Button */}
        {profile.pinLockEnabled && (
          <button
            onClick={onTogglePinLock}
            title="Lock CycleCare"
            className="p-2 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </button>
        )}

        {/* Quick Log Button */}
        <button
          onClick={onOpenQuickLog}
          className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-pink-500 text-white text-xs font-semibold shadow-sm hover:bg-pink-600 transition-all"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Log</span>
        </button>

        {/* Settings Gear */}
        <button
          onClick={() => onNavigate('settings')}
          className={`p-2 rounded-xl transition-all ${
            currentPage === 'settings' 
              ? 'bg-pink-100 text-pink-700' 
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/70'
          }`}
          aria-label="Settings"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>
    </header>
  );
};

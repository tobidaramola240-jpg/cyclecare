import React from 'react';
import { PageId } from '../types';

interface NavigationProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  onOpenQuickLog: () => void;
  isAnonymous: boolean;
  pinLockEnabled: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentPage,
  onNavigate,
  onOpenQuickLog,
  isAnonymous,
  pinLockEnabled,
}) => {
  const navItems: { id: PageId; label: string; icon: string; badge?: string }[] = [
    { id: 'dashboard', label: 'Today', icon: 'sparkles' },
    { id: 'calendar', label: 'Calendar', icon: 'calendar' },
    { id: 'tracker', label: 'Log Symptoms', icon: 'heart-pulse' },
    { id: 'insights', label: 'Insights', icon: 'bar-chart-2' },
    { id: 'education', label: 'Learn', icon: 'book-open' },
    { id: 'settings', label: 'Settings', icon: 'sliders' },
  ];

  return (
    <>
      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside className="hidden lg:flex flex-col w-64 bg-white/80 backdrop-blur-md border-r border-pink-100/80 p-5 shrink-0 z-30 select-none">
        {/* Brand Logo & Tagline */}
        <div 
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-3 cursor-pointer group mb-8 px-2"
        >
          <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-400 to-purple-400 p-0.5 shadow-md shadow-pink-200/50 group-hover:scale-105 transition-all duration-300">
            <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
              {/* Petal Crescent Logo */}
              <svg className="w-6 h-6 text-pink-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-2.38 1.05-4.52 2.71-6 1.48 3.73 4.96 6.5 9.29 7.08-.2 3.86-3.3 6.92-7.29 6.92z" />
                <circle cx="15.5" cy="8.5" r="2.5" fill="#C084FC" />
              </svg>
            </div>
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              CycleCare
            </span>
            <p className="text-[11px] font-medium text-purple-900/60 tracking-wider uppercase">
              Mindful Cycle Wellness
            </p>
          </div>
        </div>

        {/* Quick Log Action Button */}
        <button
          onClick={onOpenQuickLog}
          className="w-full mb-6 py-3 px-4 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold text-sm shadow-md shadow-pink-200/60 hover:shadow-lg hover:shadow-pink-300/60 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 group"
        >
          <svg className="w-5 h-5 text-white/90 group-hover:rotate-90 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Log Today</span>
        </button>

        {/* Main Nav Items */}
        <nav className="flex-1 space-y-1.5">
          {navItems.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-pink-50 to-purple-50 text-pink-700 font-semibold shadow-sm border border-pink-100/70'
                    : 'text-slate-600 hover:text-pink-600 hover:bg-pink-50/50'
                }`}
              >
                <span className={`transition-colors ${isActive ? 'text-pink-600' : 'text-slate-400'}`}>
                  {item.id === 'dashboard' && (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                      <path d="M2 12h20" />
                    </svg>
                  )}
                  {item.id === 'calendar' && (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  )}
                  {item.id === 'tracker' && (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                    </svg>
                  )}
                  {item.id === 'insights' && (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="20" x2="18" y2="10" />
                      <line x1="12" y1="20" x2="12" y2="4" />
                      <line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                  )}
                  {item.id === 'education' && (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    </svg>
                  )}
                  {item.id === 'settings' && (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                  )}
                </span>
                <span className="flex-1 text-left">{item.label}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Privacy & Mode Status Pill */}
        <div className="mt-auto pt-4 border-t border-pink-100/60">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-pink-50/70 to-purple-50/70 border border-pink-100/80">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-purple-900/80 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-emerald-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-3zm-2 16l-4-4 1.41-1.41L10 15.17l6.59-6.59L18 10l-8 8z" />
                </svg>
                On-Device Vault
              </span>
              {isAnonymous && (
                <span className="text-[10px] bg-purple-200/80 text-purple-800 font-bold px-1.5 py-0.5 rounded-md">
                  ANON
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Encrypted locally. Zero trackers or advertising data collection.
            </p>
          </div>
        </div>
      </aside>

      {/* ================= MOBILE BOTTOM NAVIGATION ================= */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-pink-100/90 px-2 py-1.5 shadow-[0_-4px_20px_rgba(244,114,182,0.12)]">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {navItems.slice(0, 2).map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
                  isActive ? 'text-pink-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <span className="relative">
                  {item.id === 'dashboard' && (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                    </svg>
                  )}
                  {item.id === 'calendar' && (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  )}
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-pink-500 rounded-full" />
                  )}
                </span>
                <span className="text-[10px] font-medium mt-1">{item.label}</span>
              </button>
            );
          })}

          {/* Center Floating Quick Log Button */}
          <button
            onClick={onOpenQuickLog}
            className="-mt-5 w-12 h-12 rounded-full bg-gradient-to-tr from-pink-500 via-rose-500 to-purple-500 text-white shadow-lg shadow-pink-300 flex items-center justify-center active:scale-95 transition-transform"
            aria-label="Quick Log Today"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>

          {navItems.slice(2, 5).map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
                  isActive ? 'text-pink-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <span className="relative">
                  {item.id === 'tracker' && (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                    </svg>
                  )}
                  {item.id === 'insights' && (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                      <line x1="18" y1="20" x2="18" y2="10" />
                      <line x1="12" y1="20" x2="12" y2="4" />
                      <line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                  )}
                  {item.id === 'education' && (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    </svg>
                  )}
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-pink-500 rounded-full" />
                  )}
                </span>
                <span className="text-[10px] font-medium mt-1">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};

import React, { useState, useEffect, useCallback } from 'react';
import { PageId, UserProfile, DailyLog, PastCycle, ToastNotification, AuthUser } from './types';
import { DEFAULT_USER_PROFILE, INITIAL_LOGS, INITIAL_PAST_CYCLES } from './data/sampleData';
import {
  loadStoredProfile,
  saveStoredProfile,
  loadStoredLogs,
  saveStoredLogs,
  loadStoredPastCycles,
  saveStoredPastCycles,
  loadBookmarks,
  saveBookmarks,
  resetToDemoData,
  clearAllData,
} from './utils/storage';
import {
  getStoredSession,
  supabaseSignOut,
  fetchUserProfileCloud,
  fetchCycleLogsCloud,
  fetchPastCyclesCloud,
  upsertUserProfileCloud,
  upsertCycleLogCloud,
  deleteCycleLogCloud,
  pushAllLocalToCloud,
} from './utils/supabaseClient';
import { computeCycleStatus } from './utils/cycleCalculations';

import { Navigation } from './components/Navigation';
import { Header } from './components/Header';
import { WelcomeOnboarding } from './components/WelcomeOnboarding';
import { HomeDashboard } from './components/HomeDashboard';
import { PeriodCalendar } from './components/PeriodCalendar';
import { SymptomTracker } from './components/SymptomTracker';
import { CycleInsights } from './components/CycleInsights';
import { HealthEducation } from './components/HealthEducation';
import { SettingsPrivacy } from './components/SettingsPrivacy';
import { LogModal } from './components/LogModal';
import { DoctorReportModal } from './components/DoctorReportModal';
import { PinLockModal } from './components/PinLockModal';
import { Toast } from './components/Toast';
import { AuthModal } from './components/AuthModal';

export const App: React.FC = () => {
  // 1. Supabase Auth & Cloud Sync State
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => {
    const session = getStoredSession();
    return session ? session.user : null;
  });
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // 2. Core Profile & Navigation State
  const [profile, setProfile] = useState<UserProfile>(loadStoredProfile);
  const [currentPage, setCurrentPage] = useState<PageId>(() => {
    return profile.hasCompletedOnboarding ? 'dashboard' : 'onboarding';
  });

  // 3. Data State
  const [logs, setLogs] = useState<Record<string, DailyLog>>(loadStoredLogs);
  const [pastCycles, setPastCycles] = useState<PastCycle[]>(loadStoredPastCycles);
  const [bookmarkedArticles, setBookmarkedArticles] = useState<string[]>(loadBookmarks);

  // 4. UI & Security Modals
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [quickLogModalOpen, setQuickLogModalOpen] = useState<boolean>(false);
  const [quickLogDate, setQuickLogDate] = useState<string>('2026-10-29');
  const [doctorReportModalOpen, setDoctorReportModalOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Toast Helper
  const addToast = useCallback((message: string, type: ToastNotification['type'] = 'success') => {
    const newToast: ToastNotification = {
      id: `toast-${Date.now()}-${Math.random()}`,
      message,
      type,
    };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
    }, 3500);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Compute live cycle status based on profile, today's date, and past cycles
  const todayDateStr = '2026-10-29';
  const cycleStatus = computeCycleStatus(profile, todayDateStr, pastCycles);
  const todayLog = logs[todayDateStr] || {
    date: todayDateStr,
    isPeriodDay: false,
    flow: 'none',
    symptoms: [],
    moods: [],
    waterGlasses: 6,
    pillTaken: true,
  };

  // State Persistence Effects
  useEffect(() => {
    saveStoredProfile(profile);
  }, [profile]);

  useEffect(() => {
    saveStoredLogs(logs);
  }, [logs]);

  useEffect(() => {
    saveStoredPastCycles(pastCycles);
  }, [pastCycles]);

  useEffect(() => {
    saveBookmarks(bookmarkedArticles);
  }, [bookmarkedArticles]);

  // Synchronize with Cloud when user signs in
  const syncWithCloud = useCallback(async (user: AuthUser) => {
    setIsSyncing(true);
    try {
      // 1. Fetch remote profile
      const remoteProfile = await fetchUserProfileCloud(user.id);
      if (remoteProfile) {
        setProfile((prev) => ({ ...prev, ...remoteProfile }));
      } else {
        // First time cloud sync: push local profile to Supabase
        await upsertUserProfileCloud(user.id, profile);
      }

      // 2. Fetch remote logs
      const remoteLogs = await fetchCycleLogsCloud(user.id);
      if (Object.keys(remoteLogs).length > 0) {
        setLogs(remoteLogs);
      } else {
        // Push local logs if remote is empty
        for (const log of Object.values(logs)) {
          await upsertCycleLogCloud(user.id, log);
        }
      }

      // 3. Fetch past cycles
      const remotePast = await fetchPastCyclesCloud(user.id);
      if (remotePast.length > 0) {
        setPastCycles(remotePast);
      }

      addToast(`Encrypted cloud vault connected for ${user.email} (RLS Active)`);
    } catch (err: any) {
      console.error('Cloud sync error:', err);
      addToast(`Sync notice: ${err.message || 'Offline mode active'}`, 'warning');
    } finally {
      setIsSyncing(false);
    }
  }, [profile, logs, addToast]);

  const handleManualPushCloud = async () => {
    if (!authUser) {
      setAuthModalOpen(true);
      return;
    }
    setIsSyncing(true);
    try {
      await pushAllLocalToCloud(authUser.id, profile, logs, pastCycles);
      addToast('All cycle records successfully pushed to Supabase Cloud! ☁️');
    } catch (err: any) {
      addToast(`Push failed: ${err.message}`, 'warning');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAuthSuccess = (user: AuthUser) => {
    setAuthUser(user);
    syncWithCloud(user);
  };

  const handleSignOut = async () => {
    await supabaseSignOut();
    setAuthUser(null);
    addToast('Signed out of cloud account. Now running in local Demo Mode.');
  };

  // Handlers
  const handleUpdateTodayLog = async (updated: Partial<DailyLog>) => {
    const existing = logs[todayDateStr] || todayLog;
    const merged: DailyLog = { ...existing, ...updated };
    setLogs((prev) => ({ ...prev, [todayDateStr]: merged }));
    addToast('Dashboard updated immediately!');

    // Async cloud sync if logged in
    if (authUser) {
      try {
        await upsertCycleLogCloud(authUser.id, merged);
      } catch (err) {
        console.warn('Background log cloud save error:', err);
      }
    }
  };

  const handleSaveLogForDate = async (log: DailyLog) => {
    setLogs((prev) => ({ ...prev, [log.date]: log }));
    addToast(`Saved entries for ${log.date}!`);

    // Async cloud sync if logged in
    if (authUser) {
      try {
        await upsertCycleLogCloud(authUser.id, log);
      } catch (err) {
        console.warn('Background log cloud save error:', err);
      }
    }
  };

  const handleUpdateLogForDate = async (dateStr: string, logData: Partial<DailyLog>) => {
    const existing = logs[dateStr] || {
      date: dateStr,
      isPeriodDay: false,
      flow: 'none',
      symptoms: [],
      moods: [],
    };
    const merged: DailyLog = { ...existing, ...logData };
    setLogs((prev) => ({ ...prev, [dateStr]: merged }));
    addToast(`Updated record for ${dateStr}`);

    if (authUser) {
      try {
        await upsertCycleLogCloud(authUser.id, merged);
      } catch (err) {
        console.warn('Background log cloud update error:', err);
      }
    }
  };

  const handleDeleteLogForDate = async (dateStr: string) => {
    setLogs((prev) => {
      const next = { ...prev };
      delete next[dateStr];
      return next;
    });
    addToast(`Deleted entry for ${dateStr}`, 'info');

    if (authUser) {
      try {
        await deleteCycleLogCloud(authUser.id, dateStr);
      } catch (err) {
        console.warn('Background log cloud delete error:', err);
      }
    }
  };

  const handleUpdateProfile = async (updated: Partial<UserProfile>) => {
    const nextProfile: UserProfile = { ...profile, ...updated };
    setProfile(nextProfile);
    addToast('Recalculated cycle predictions & updated dashboard!');

    if (authUser) {
      try {
        await upsertUserProfileCloud(authUser.id, nextProfile);
      } catch (err) {
        console.warn('Background profile cloud update error:', err);
      }
    }
  };

  const handleToggleBookmark = (articleId: string) => {
    setBookmarkedArticles((prev) => {
      const exists = prev.includes(articleId);
      const next = exists ? prev.filter((id) => id !== articleId) : [...prev, articleId];
      addToast(exists ? 'Article removed from saved' : 'Article bookmarked! 🔖');
      return next;
    });
  };

  const handleResetToDemo = () => {
    resetToDemoData();
    setProfile(DEFAULT_USER_PROFILE);
    setLogs(INITIAL_LOGS);
    setPastCycles(INITIAL_PAST_CYCLES);
    setBookmarkedArticles(['season-of-cycle', 'ovulation-demystified']);
    setCurrentPage('dashboard');
    addToast('Reset to realistic demo cycle data!');
  };

  const handleClearAll = () => {
    clearAllData();
    setLogs({});
    setPastCycles([]);
    setProfile({
      ...DEFAULT_USER_PROFILE,
      hasCompletedOnboarding: false,
    });
    setCurrentPage('onboarding');
    addToast('All local storage cleared', 'warning');
  };

  const handleOpenQuickLogForDate = (dateStr?: string) => {
    setQuickLogDate(dateStr || todayDateStr);
    setQuickLogModalOpen(true);
  };

  // If onboarding is active and user hasn't finished it
  if (currentPage === 'onboarding' || !profile.hasCompletedOnboarding) {
    return (
      <>
        <WelcomeOnboarding
          onComplete={(newProfile) => {
            setProfile(newProfile);
            setCurrentPage('dashboard');
            addToast('Welcome to CycleCare! Your journey begins.');
          }}
          onUseDemoData={handleResetToDemo}
        />
        <Toast toasts={toasts} onDismiss={removeToast} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF5F7] text-slate-800 flex flex-col font-sans selection:bg-pink-200 selection:text-pink-900">
      {/* PIN Lock Screen if locked */}
      <PinLockModal
        isOpen={isLocked}
        correctPin={profile.pinCode || '1234'}
        onUnlock={() => {
          setIsLocked(false);
          addToast('CycleCare unlocked 🌸');
        }}
      />

      <div className="flex-1 flex flex-col lg:flex-row min-h-screen">
        {/* Desktop Sidebar & Mobile Bottom Navigation */}
        <Navigation
          currentPage={currentPage}
          onNavigate={(page) => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setCurrentPage(page);
          }}
          onOpenQuickLog={() => handleOpenQuickLogForDate(todayDateStr)}
          isAnonymous={profile.isAnonymous}
          pinLockEnabled={profile.pinLockEnabled}
        />

        {/* Main Content Pane */}
        <div className="flex-1 flex flex-col min-w-0">
          <Header
            profile={profile}
            cycleStatus={cycleStatus}
            currentPage={currentPage}
            onNavigate={setCurrentPage}
            onOpenQuickLog={() => handleOpenQuickLogForDate(todayDateStr)}
            onTogglePinLock={() => setIsLocked(true)}
            authUser={authUser}
            onOpenAuthModal={() => setAuthModalOpen(true)}
            isSyncing={isSyncing}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            {currentPage === 'dashboard' && (
              <HomeDashboard
                profile={profile}
                cycleStatus={cycleStatus}
                todayLog={todayLog}
                onUpdateTodayLog={handleUpdateTodayLog}
                onDeleteLogForDate={handleDeleteLogForDate}
                onUpdateProfile={handleUpdateProfile}
                onOpenQuickLog={() => handleOpenQuickLogForDate(todayDateStr)}
                onNavigate={setCurrentPage}
              />
            )}

            {currentPage === 'calendar' && (
              <PeriodCalendar
                profile={profile}
                logs={logs}
                onOpenLogForDate={(dateStr) => handleOpenQuickLogForDate(dateStr)}
                onUpdateLog={handleUpdateLogForDate}
                onDeleteLog={handleDeleteLogForDate}
              />
            )}

            {currentPage === 'tracker' && (
              <SymptomTracker
                initialDate={quickLogDate}
                logs={logs}
                onSaveLog={handleSaveLogForDate}
                onDeleteLog={handleDeleteLogForDate}
              />
            )}

            {currentPage === 'insights' && (
              <CycleInsights
                profile={profile}
                pastCycles={pastCycles}
                logs={logs}
                onOpenDoctorReport={() => setDoctorReportModalOpen(true)}
              />
            )}

            {currentPage === 'education' && (
              <HealthEducation
                bookmarkedIds={bookmarkedArticles}
                onToggleBookmark={handleToggleBookmark}
              />
            )}

            {currentPage === 'settings' && (
              <SettingsPrivacy
                profile={profile}
                logs={logs}
                onUpdateProfile={handleUpdateProfile}
                onResetDemoData={handleResetToDemo}
                onClearAllData={handleClearAll}
                onRevisitOnboarding={() => setCurrentPage('onboarding')}
                authUser={authUser}
                onOpenAuthModal={() => setAuthModalOpen(true)}
                onSignOut={handleSignOut}
                onSyncCloud={handleManualPushCloud}
                isSyncing={isSyncing}
              />
            )}
          </main>
        </div>
      </div>

      {/* Supabase Authentication & Private Vault Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        authUser={authUser}
        onAuthSuccess={handleAuthSuccess}
        onEnterDemoMode={() => {
          setAuthUser(null);
          addToast('Now running in Demo Mode with local sample data.');
        }}
        onSignOut={handleSignOut}
      />

      {/* Quick Log Popup Modal */}
      <LogModal
        isOpen={quickLogModalOpen}
        onClose={() => setQuickLogModalOpen(false)}
        dateStr={quickLogDate}
        existingLog={logs[quickLogDate]}
        onSave={handleSaveLogForDate}
        onDelete={handleDeleteLogForDate}
      />

      {/* Doctor Summary Report Modal */}
      <DoctorReportModal
        isOpen={doctorReportModalOpen}
        onClose={() => setDoctorReportModalOpen(false)}
        profile={profile}
        pastCycles={pastCycles}
        logs={logs}
      />

      {/* Global Toast Alerts */}
      <Toast toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};

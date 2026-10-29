import React, { useState } from 'react';
import { AuthMode, AuthUser, SupabaseConfig } from '../types';
import {
  getSupabaseConfig,
  setSupabaseConfig,
  clearSupabaseConfig,
  supabaseSignIn,
  supabaseSignUp,
  supabaseResetPassword,
  validateSupabaseKey,
} from '../utils/supabaseClient';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  authUser: AuthUser | null;
  onAuthSuccess: (user: AuthUser) => void;
  onEnterDemoMode: () => void;
  onSignOut: () => void;
  initialMode?: AuthMode;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  authUser,
  onAuthSuccess,
  onEnterDemoMode,
  onSignOut,
  initialMode = 'signin',
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Cloud Config fields
  const config = getSupabaseConfig();
  const [customUrl, setCustomUrl] = useState(config.url || '');
  const [customKey, setCustomKey] = useState(config.anonKey || '');

  // Loading & Feedback
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email || !password) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await supabaseSignIn({ email, password });
      onAuthSuccess(res.user);
      setSuccessMessage(`Welcome back, ${res.user.fullName || res.user.email}!`);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to sign in. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email || !password) {
      setErrorMessage('Please provide an email and a secure password.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await supabaseSignUp({
        email,
        password,
        fullName: isAnonymous ? 'CycleCare Friend' : fullName || 'CycleCare Friend',
        isAnonymous,
      });

      if (res.requiresEmailConfirmation) {
        setSuccessMessage('Account created! Please check your email for a confirmation link to activate your vault.');
      } else {
        onAuthSuccess(res.user);
        setSuccessMessage('Account created successfully! Your health records are now isolated via Row Level Security.');
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Account registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email) {
      setErrorMessage('Please provide your registered email address.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await supabaseResetPassword(email);
      setSuccessMessage(res.message);
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to dispatch password reset email.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const validation = validateSupabaseKey(customKey);
    if (!validation.isValid) {
      setErrorMessage(validation.error || 'Invalid Supabase key.');
      return;
    }

    if (!customUrl.startsWith('http://') && !customUrl.startsWith('https://')) {
      setErrorMessage('Supabase URL must start with https://');
      return;
    }

    try {
      setSupabaseConfig(customUrl, customKey);
      setSuccessMessage('Supabase credentials successfully saved! You may now sign up or sign in.');
      setTimeout(() => {
        setMode('signin');
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save Supabase credentials.');
    }
  };

  const handleClearConfig = () => {
    clearSupabaseConfig();
    setCustomUrl('');
    setCustomKey('');
    setSuccessMessage('Supabase credentials cleared. Switched back to environment default.');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-pink-100 shadow-2xl relative my-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition-colors text-sm"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-400 to-purple-500 p-0.5 shadow-md shadow-pink-200/50 mb-3 flex items-center justify-center">
            <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center text-pink-500 text-2xl">
              🌸
            </div>
          </div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
            {authUser ? 'Your Private Health Vault' : 'CycleCare Authentication'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {authUser
              ? `Signed in as ${authUser.email}`
              : 'End-to-end user isolation backed by Supabase Row Level Security (RLS)'}
          </p>
        </div>

        {/* User Already Signed In View */}
        {authUser ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-sm text-emerald-900">
                <span>🛡️</span>
                <span>Active Cloud Session</span>
              </div>
              <p>Email: <strong className="font-semibold">{authUser.email}</strong></p>
              <p>Account ID: <code className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-emerald-200">{authUser.id}</code></p>
              <p className="text-[11px] text-emerald-700 pt-1">
                All cycle entries, symptom logs, and personalized predictions are stored in private Supabase tables protected by Row Level Security.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  onSignOut();
                  onClose();
                }}
                className="w-full py-3 px-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 font-bold text-xs hover:bg-rose-100 transition-colors"
              >
                Sign Out of CycleCare
              </button>
              <button
                type="button"
                onClick={() => {
                  onEnterDemoMode();
                  onClose();
                }}
                className="w-full py-3 px-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors"
              >
                Switch to Demo Mode (Local Sample Data)
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Mode Tabs */}
            <div className="flex rounded-2xl bg-slate-100/80 p-1 mb-5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`flex-1 py-2 rounded-xl transition-all ${
                  mode === 'signin'
                    ? 'bg-white text-pink-600 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`flex-1 py-2 rounded-xl transition-all ${
                  mode === 'signup'
                    ? 'bg-white text-pink-600 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sign Up
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('config');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`flex-1 py-2 rounded-xl transition-all ${
                  mode === 'config'
                    ? 'bg-white text-purple-600 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Cloud Setup
              </button>
            </div>

            {/* Error & Success Alerts */}
            {errorMessage && (
              <div className="p-3.5 mb-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <span className="text-base shrink-0">⚠️</span>
                <div className="leading-snug">{errorMessage}</div>
              </div>
            )}

            {successMessage && (
              <div className="p-3.5 mb-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
                <span className="text-base shrink-0">✨</span>
                <div className="leading-snug">{successMessage}</div>
              </div>
            )}

            {/* TAB 1: Sign In */}
            {mode === 'signin' && (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="maya@example.com"
                    className="w-full px-4 py-2.5 rounded-2xl border border-pink-200 text-xs bg-pink-50/20 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-[11px] font-semibold text-purple-600 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 rounded-2xl border border-pink-200 text-xs bg-pink-50/20 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs shadow-md shadow-pink-200 hover:opacity-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    'Sign In to Private Vault 🔒'
                  )}
                </button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase">
                    <span className="bg-white px-2 text-slate-400 font-semibold">Or Explore</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onEnterDemoMode();
                    onClose();
                  }}
                  className="w-full py-2.5 px-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>🧪</span>
                  <span>Continue in Demo Mode (Local Sample Data)</span>
                </button>
              </form>
            )}

            {/* TAB 2: Sign Up */}
            {mode === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Display Name or Preferred Alias
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Maya Chen (or leave blank for alias)"
                    className="w-full px-4 py-2.5 rounded-2xl border border-pink-200 text-xs bg-pink-50/20 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="maya@example.com"
                    className="w-full px-4 py-2.5 rounded-2xl border border-pink-200 text-xs bg-pink-50/20 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Create Password (min 6 characters)
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 rounded-2xl border border-pink-200 text-xs bg-pink-50/20 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-400"
                  />
                </div>

                <div className="p-3 rounded-2xl bg-purple-50/50 border border-purple-100 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Anonymous Mode</h4>
                    <p className="text-[10px] text-slate-500">Omits personal identifiers from health logs.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs shadow-md shadow-pink-200 hover:opacity-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Creating Secure Vault...</span>
                    </>
                  ) : (
                    'Create Encrypted Account ✨'
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onEnterDemoMode();
                    onClose();
                  }}
                  className="w-full py-2.5 px-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors text-center"
                >
                  Continue in Demo Mode instead
                </button>
              </form>
            )}

            {/* TAB 3: Forgot Password */}
            {mode === 'forgot' && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Enter your registered CycleCare email address to receive password recovery instructions directly from Supabase.
                </p>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="maya@example.com"
                    className="w-full px-4 py-2.5 rounded-2xl border border-pink-200 text-xs bg-pink-50/20 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs shadow-md hover:opacity-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Dispatching Link...</span>
                    </>
                  ) : (
                    'Send Password Reset Link ✉️'
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="w-full py-2 text-xs font-semibold text-pink-600 hover:underline text-center"
                >
                  ← Back to Sign In
                </button>
              </form>
            )}

            {/* TAB 4: Cloud Config */}
            {mode === 'config' && (
              <form onSubmit={handleSaveConfig} className="space-y-4">
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
                  <span className="font-bold block mb-0.5">🔒 Frontend Security Notice:</span>
                  Only provide your public <strong className="underline font-bold">anon</strong> key. Never use or paste the secret <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">service_role</code> key.
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Supabase Project URL
                  </label>
                  <input
                    type="url"
                    required
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://xyzcompany.supabase.co"
                    className="w-full px-4 py-2 rounded-2xl border border-slate-200 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Supabase Public Anon Key
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={customKey}
                    onChange={(e) => setCustomKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full px-3 py-2 rounded-2xl border border-slate-200 text-xs font-mono resize-none"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 rounded-2xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-700 transition-colors"
                  >
                    Save & Test Connection
                  </button>
                  <button
                    type="button"
                    onClick={handleClearConfig}
                    className="py-2.5 px-3 rounded-2xl border border-slate-300 text-slate-600 font-semibold text-xs hover:bg-slate-50"
                  >
                    Clear
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
};

import React, { useState, useId } from 'react';

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface SignUpCredentials {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export interface AuthScreenProps {
  appName?: string;
  appTagline?: string;
  logoIcon?: React.ReactNode;
  initialMode?: 'signin' | 'signup';
  onLogin?: (credentials: LoginCredentials) => Promise<void> | void;
  onSignUp?: (credentials: SignUpCredentials) => Promise<void> | void;
  onForgotPassword?: (email: string) => void;
  onContinueAsGuest?: () => void;
  termsUrl?: string;
  privacyUrl?: string;
  className?: string;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  appName = 'NovaCloud',
  appTagline = 'Empowering your modern workflow',
  logoIcon,
  initialMode = 'signin',
  onLogin,
  onSignUp,
  onForgotPassword,
  onContinueAsGuest,
  termsUrl = '#',
  privacyUrl = '#',
  className = '',
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Field validation errors
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  const emailId = useId();
  const passwordId = useId();
  const nameId = useId();
  const confirmPasswordId = useId();
  const rememberId = useId();
  const termsId = useId();

  // Password strength calculation
  const getPasswordStrength = (pass: string): { score: number; label: string; color: string } => {
    if (!pass) return { score: 0, label: 'Empty', color: 'bg-slate-200' };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    switch (score) {
      case 1:
        return { score: 25, label: 'Weak', color: 'bg-rose-500' };
      case 2:
        return { score: 50, label: 'Fair', color: 'bg-amber-500' };
      case 3:
        return { score: 75, label: 'Good', color: 'bg-blue-500' };
      case 4:
        return { score: 100, label: 'Strong', color: 'bg-emerald-500' };
      default:
        return { score: 15, label: 'Very Weak', color: 'bg-rose-400' };
    }
  };

  const passwordStrength = getPasswordStrength(password);

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!emailRegex.test(email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters long.';
    }

    if (mode === 'signup') {
      if (!fullName.trim()) {
        errors.fullName = 'Full name is required.';
      }
      if (password !== confirmPassword) {
        errors.confirmPassword = 'Passwords do not match.';
      }
      if (!acceptTerms) {
        errors.terms = 'You must agree to the Terms of Service and Privacy Policy.';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      if (mode === 'signin') {
        if (onLogin) {
          await onLogin({ email: email.trim(), password, rememberMe });
        } else {
          // Simulation demo fallback
          await new Promise((res) => setTimeout(res, 800));
          setSuccessMessage(`Welcome back, ${email.trim()}! Successfully signed in.`);
        }
      } else {
        if (onSignUp) {
          await onSignUp({
            fullName: fullName.trim(),
            email: email.trim(),
            password,
            confirmPassword,
            acceptTerms,
          });
        } else {
          // Simulation demo fallback
          await new Promise((res) => setTimeout(res, 800));
          setSuccessMessage(`Account created successfully for ${fullName.trim()}! Please sign in.`);
          setMode('signin');
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected authentication error occurred.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (newMode: 'signin' | 'signup') => {
    setMode(newMode);
    setErrorMessage(null);
    setSuccessMessage(null);
    setFieldErrors({});
  };

  return (
    <div
      className={`min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-50 relative overflow-hidden selection:bg-indigo-500 selection:text-white ${className}`}
    >
      {/* Background Decorative Ambient Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-indigo-300/40 via-purple-300/30 to-pink-200/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-blue-200/30 via-indigo-200/30 to-purple-300/40 blur-3xl pointer-events-none" />

      {/* Main Container Card */}
      <div className="w-full max-w-md bg-white/90 backdrop-blur-xl rounded-3xl border border-slate-200/80 shadow-2xl shadow-indigo-500/5 relative z-10 p-6 sm:p-8 transition-all duration-300">
        
        {/* Brand Header */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30 mb-3.5 transform hover:scale-105 transition-transform duration-200">
            {logoIcon || (
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            )}
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {appName}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {appTagline}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-slate-100 rounded-2xl mb-6 relative">
          <button
            type="button"
            onClick={() => switchMode('signin')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-200 ${
              mode === 'signin'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => switchMode('signup')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-200 ${
              mode === 'signup'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Global Error Notice */}
        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
            <svg className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="flex-1 font-medium leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* Global Success Notice */}
        {successMessage && (
          <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
            <svg className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="flex-1 font-medium leading-relaxed">{successMessage}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          
          {/* Full Name (Sign Up only) */}
          {mode === 'signup' && (
            <div>
              <label htmlFor={nameId} className="block text-xs font-bold text-slate-700 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  id={nameId}
                  type="text"
                  autoComplete="name"
                  placeholder="Alex Morgan"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-50/70 border rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                    fieldErrors.fullName ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-indigo-500'
                  }`}
                />
              </div>
              {fieldErrors.fullName && (
                <p className="mt-1 text-[11px] font-semibold text-rose-600">{fieldErrors.fullName}</p>
              )}
            </div>
          )}

          {/* Email Address */}
          <div>
            <label htmlFor={emailId} className="block text-xs font-bold text-slate-700 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </div>
              <input
                id={emailId}
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-50/70 border rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                  fieldErrors.email ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-indigo-500'
                }`}
              />
            </div>
            {fieldErrors.email && (
              <p className="mt-1 text-[11px] font-semibold text-rose-600">{fieldErrors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor={passwordId} className="block text-xs font-bold text-slate-700">
                Password
              </label>
              {mode === 'signin' && (
                <button
                  type="button"
                  onClick={() => onForgotPassword?.(email)}
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                id={passwordId}
                type={showPassword ? 'text' : 'password'}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full pl-10 pr-10 py-2.5 bg-slate-50/70 border rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                  fieldErrors.password ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-indigo-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.064 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="mt-1 text-[11px] font-semibold text-rose-600">{fieldErrors.password}</p>
            )}

            {/* Password Strength Indicator (Sign Up only) */}
            {mode === 'signup' && password.length > 0 && (
              <div className="mt-2 space-y-1">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-500 font-medium">Password Strength:</span>
                  <span className="font-bold text-slate-700">{passwordStrength.label}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${passwordStrength.score}%` }}
                    className={`h-full ${passwordStrength.color} transition-all duration-300`}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password (Sign Up only) */}
          {mode === 'signup' && (
            <div>
              <label htmlFor={confirmPasswordId} className="block text-xs font-bold text-slate-700 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  id={confirmPasswordId}
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full pl-10 pr-10 py-2.5 bg-slate-50/70 border rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                    fieldErrors.confirmPassword ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-indigo-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showConfirmPassword ? (
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.064 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p className="mt-1 text-[11px] font-semibold text-rose-600">{fieldErrors.confirmPassword}</p>
              )}
            </div>
          )}

          {/* Remember Me (Sign In) or Terms Agreement (Sign Up) */}
          {mode === 'signin' ? (
            <div className="flex items-center justify-between pt-1">
              <label htmlFor={rememberId} className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  id={rememberId}
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 accent-indigo-600 cursor-pointer"
                />
                <span className="text-xs text-slate-600 font-medium">Remember this browser</span>
              </label>
            </div>
          ) : (
            <div className="pt-1">
              <label htmlFor={termsId} className="flex items-start gap-2 cursor-pointer select-none">
                <input
                  id={termsId}
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 accent-indigo-600 cursor-pointer"
                />
                <span className="text-xs text-slate-600 leading-snug">
                  I agree to the{' '}
                  <a href={termsUrl} target="_blank" rel="noreferrer" className="text-indigo-600 font-bold hover:underline">
                    Terms
                  </a>{' '}
                  and{' '}
                  <a href={privacyUrl} target="_blank" rel="noreferrer" className="text-indigo-600 font-bold hover:underline">
                    Privacy Policy
                  </a>
                  .
                </span>
              </label>
              {fieldErrors.terms && (
                <p className="mt-1 text-[11px] font-semibold text-rose-600">{fieldErrors.terms}</p>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-700 hover:via-indigo-800 hover:to-purple-700 text-white font-bold text-xs tracking-wide shadow-md shadow-indigo-500/20 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="w-4 h-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>{mode === 'signin' ? 'Signing In...' : 'Creating Account...'}</span>
              </>
            ) : (
              <span>{mode === 'signin' ? 'Sign In to Account' : 'Create Free Account'}</span>
            )}
          </button>
        </form>

        {/* Guest / Demo Option (Optional) */}
        {onContinueAsGuest && (
          <div className="mt-4 pt-4 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={onContinueAsGuest}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              Continue as Guest / Explore Demo →
            </button>
          </div>
        )}

        {/* Footer Switcher */}
        <div className="mt-6 text-center text-xs text-slate-500">
          {mode === 'signin' ? (
            <>
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors underline decoration-indigo-300"
              >
                Sign up free
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors underline decoration-indigo-300"
              >
                Sign in
              </button>
            </>
          )}
        </div>

      </div>

      {/* Modern Badge */}
      <div className="absolute bottom-4 text-center w-full text-[11px] text-slate-400 font-medium">
        Encrypted with SSL/TLS · Secure Session Handshake
      </div>
    </div>
  );
};

export default AuthScreen;

import React, { useState } from 'react';
import { 
  Sparkles, 
  Calendar, 
  Heart, 
  ShieldCheck, 
  ArrowRight, 
  TrendingUp, 
  Briefcase, 
  Lock, 
  Mail, 
  User, 
  Globe, 
  Check, 
  Loader2, 
  Info,
  ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { googleSignIn } from '../lib/firebase';

interface LandingPageProps {
  onStart: (customName?: string) => void;
}

type AuthMode = 'sign-in' | 'register' | 'google-sso' | 'sandbox-init';

export default function LandingPage({ onStart }: LandingPageProps) {
  // Navigation & Interactive states
  const [showPortal, setShowPortal] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('sign-in');
  
  // Custom credential states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  // Loading & notification overlays
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Authenticate with Google Workspace SSO directly
  const handleGoogleSSO = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const result = await googleSignIn();
      if (result && result.user) {
        setSuccessMsg(`Google Account Connected! Welcoming ${result.user.displayName || 'User'}...`);
        setTimeout(() => {
          setIsLoading(false);
          onStart(result.user.displayName || undefined);
        }, 1200);
      } else {
        throw new Error('SSO Auth connection declined or bypassed.');
      }
    } catch (err: any) {
      console.warn("SSO failure:", err);
      setErrorMsg(err.message || 'Google Single Sign-On registration timed out.');
      setIsLoading(false);
    }
  };

  // Authenticate with custom local credentials (secure offline profile caching)
  const handleLocalCredentialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Basic Input Validations
    if (!email.includes('@') || email.length < 5) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Secret key / password must be at least 6 characters.');
      return;
    }
    if (authMode === 'register' && !fullName.trim()) {
      setErrorMsg('Please specify your profile name.');
      return;
    }

    setIsLoading(true);
    
    // Simulate server side query & secure hashing latency
    setTimeout(() => {
      setIsLoading(false);
      const nameToPass = authMode === 'register' ? fullName.trim() : 'Shivtej';
      setSuccessMsg(authMode === 'register' ? `Welcome registered executive: ${nameToPass}!` : "Welcome back, Shivtej!");
      
      // Store session to local storage for persistent routine lock bypass
      localStorage.setItem('shiv_local_session_active', 'true');
      localStorage.setItem('shiv_local_session_user_name', nameToPass);

      setTimeout(() => {
        onStart(nameToPass);
      }, 1000);
    }, 1400);
  };

  // Launch secure credential-less sandbox mode
  const handleLaunchSandbox = () => {
    setIsLoading(true);
    setSuccessMsg('Initializing sandbox routine tools...');
    setTimeout(() => {
      setIsLoading(false);
      onStart();
    }, 900);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-y-auto overflow-x-hidden relative selection:bg-indigo-500 selection:text-white">
      {/* Decorative ambient background glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/15 blur-[120px] pointer-events-none" />
      <div className="absolute top-[30%] left-[20%] w-[40%] h-[40%] rounded-full bg-cyan-900/10 blur-[140px] pointer-events-none" />

      {/* Header */}
      <header className="px-6 py-6 max-w-7xl mx-auto w-full flex justify-between items-center z-10">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-xl shadow-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-sans font-semibold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            ShivAI
          </span>
        </div>
        <div>
          <button
            onClick={() => { setShowPortal(true); setAuthMode('sign-in'); }}
            id="btn-header-launch"
            className="px-5 py-2 rounded-full border border-slate-800 bg-slate-900/40 hover:bg-slate-900 hover:border-slate-700 text-xs font-semibold uppercase tracking-wider transition duration-300 backdrop-blur-md cursor-pointer text-indigo-400 hover:text-white"
          >
            Access Portal
          </button>
        </div>
      </header>

      {/* Primary Hero / Auth Body Grid */}
      <main className="flex-1 flex flex-col justify-center items-center px-6 text-center max-w-6xl mx-auto z-10 w-full py-8 md:py-16">
        
        {!showPortal ? (
          /* Standard Landing View */
          <div className="flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="px-3.5 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-xs font-semibold text-indigo-400 uppercase tracking-widest inline-flex items-center space-x-1.5 mb-6">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                <span>INTRODUCING</span>
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-sans font-bold text-4xl sm:text-6xl lg:text-7xl tracking-tight text-white mb-6 leading-[1.1]"
            >
              Your Intelligent <br />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Personal AI Workspace
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-slate-400 text-sm sm:text-base max-w-2xl mb-10 leading-relaxed font-sans"
            >
              ShivAI aggregates daily productivity planning, customized habit tracking, health metrics logs, smart budgeting, and AI career acceleration in a gorgeous human-centric workspace.
            </motion.p>

            {/* Main CTA */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="mb-14 flex flex-col sm:flex-row items-center gap-4"
            >
              <button
                onClick={() => { setShowPortal(true); setAuthMode('google-sso'); }}
                id="btn-hero-google-auth"
                className="px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-100 font-sans font-semibold text-xs text-slate-900 transition duration-300 flex items-center space-x-2.5 cursor-pointer shadow-lg active:scale-98"
              >
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4.5 h-4.5 shrink-0">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                </svg>
                <span>Sign In with Google</span>
              </button>

              <button
                onClick={() => { setShowPortal(true); setAuthMode('sign-in'); }}
                id="btn-hero-launch"
                className="px-6 py-3.5 rounded-2xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900 text-white font-sans font-semibold text-xs tracking-wide uppercase transition duration-300 flex items-center space-x-2 cursor-pointer hover:border-slate-700 hover:shadow-[0_0_20px_rgba(99,102,241,0.15)] active:scale-98"
              >
                <span>Custom Credentials Profile</span>
                <ArrowRight className="w-4 h-4 text-indigo-400" />
              </button>
            </motion.div>

            {/* Grid feature cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full text-left mt-4">
              <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/10 backdrop-blur-md">
                <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 w-fit mb-4">
                  <Calendar className="w-5 h-5" />
                </div>
                <h3 className="text-white font-sans font-semibold text-sm uppercase tracking-wide">Strategic Planner</h3>
                <p className="text-slate-400 text-xs leading-relaxed mt-2">
                  Organize daily priorities, set deadlines, and track completion statistics with an integrated Kanban-light agenda.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/10 backdrop-blur-md">
                <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400 w-fit mb-4">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h3 className="text-white font-sans font-semibold text-sm uppercase tracking-wide">Routine &amp; Habit Trackers</h3>
                <p className="text-slate-400 text-xs leading-relaxed mt-2">
                  Track streaks, check daily routines, trace hydration goals, log sleep duration, and capture customized biometric sleep metrics.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/10 backdrop-blur-md">
                <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400 w-fit mb-4">
                  <Briefcase className="w-5 h-5" />
                </div>
                <h3 className="text-white font-sans font-semibold text-sm uppercase tracking-wide">AI Career Accelerator</h3>
                <p className="text-slate-400 text-xs leading-relaxed mt-2">
                  Polish high-impact resume bullets, outline typical STAR interview topics, and draft clear outreach emails with help from Gemini.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Premium Interactive Auth Card Portal UI */
          <motion.div 
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-slate-900/40 backdrop-blur-2xl border border-slate-800 rounded-3xl p-6 sm:p-8 text-left shadow-2xl relative overflow-hidden"
          >
            {/* Top Back Action */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-indigo-400" />
                <span>ShivAI Security Link</span>
              </span>
              <button 
                onClick={() => setShowPortal(false)}
                className="text-4xs uppercase tracking-widest text-slate-500 hover:text-slate-200 font-bold font-mono transition cursor-pointer"
              >
                ← Back
              </button>
            </div>

            {/* Mode Tab Links */}
            <div className="flex border-b border-white/5 mb-6 gap-2">
              <button 
                onClick={() => { setAuthMode('sign-in'); setErrorMsg(null); }}
                className={`pb-2.5 text-xs font-bold uppercase tracking-wide border-b-2 transition ${
                  authMode === 'sign-in' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-350'
                }`}
              >
                Sign In
              </button>
              <button 
                onClick={() => { setAuthMode('register'); setErrorMsg(null); }}
                className={`pb-2.5 text-xs font-bold uppercase tracking-wide border-b-2 transition ${
                  authMode === 'register' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-350'
                }`}
              >
                Register
              </button>
              <button 
                onClick={() => { setAuthMode('google-sso'); setErrorMsg(null); }}
                className={`pb-2.5 text-xs font-bold uppercase tracking-wide border-b-2 transition ${
                  authMode === 'google-sso' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-350'
                }`}
              >
                Google SSO
              </button>
            </div>

            {/* Error & Info alerts */}
            {errorMsg && (
              <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-2xs flex items-start gap-1.5 font-sans">
                <span className="shrink-0 font-bold">⚠️</span>
                <span>{errorMsg}</span>
              </div>
            )}
            
            {successMsg && (
              <div className="p-3 mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-2xs flex items-center gap-1.5 font-sans font-semibold">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Mode: Standard Sign In & Register Forms */}
            {(authMode === 'sign-in' || authMode === 'register') && (
              <form onSubmit={handleLocalCredentialSubmit} className="space-y-4">
                
                {authMode === 'register' && (
                  <div className="space-y-1.5">
                    <label className="text-4xs uppercase tracking-wider text-slate-500 font-bold block">Profile Executive Name</label>
                    <div className="relative flex items-center">
                      <User className="absolute left-3 w-4 h-4 text-slate-500" />
                      <input 
                        type="text"
                        placeholder="e.g. Shivtej"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 text-xs text-white rounded-xl placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition font-sans"
                        required={authMode === 'register'}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-4xs uppercase tracking-wider text-slate-500 font-bold block">Email Address</label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-3 w-4 h-4 text-slate-500" />
                    <input 
                      type="email"
                      placeholder="e.g. kanaseshivtej312@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 text-xs text-white rounded-xl placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition font-sans"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-4xs uppercase tracking-wider text-slate-500 font-bold block">Secret Password / Code Key</label>
                    {authMode === 'sign-in' && (
                      <span className="text-4xs text-indigo-400 font-mono select-none">Pre-seeded profile is active</span>
                    )}
                  </div>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3 w-4 h-4 text-slate-500" />
                    <input 
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 text-xs text-white rounded-xl placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition font-sans"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-sans font-semibold rounded-xl text-xs transition uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-98 disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>{authMode === 'sign-in' ? 'Enter Corporate Assistant' : 'Register Secure Profile'}</span>
                  )}
                  {!isLoading && <ChevronRight className="w-4 h-4" />}
                </button>
              </form>
            )}

            {/* Mode: Google Single Sign-on integration */}
            {authMode === 'google-sso' && (
              <div className="space-y-4 py-3">
                <p className="text-xs text-slate-400 leading-relaxed font-sans text-center mb-4">
                  Connect ShivAI securely using your Google enterprise login. Activates cloud database backups and live Workspace synchronization context.
                </p>

                <button
                  onClick={handleGoogleSSO}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3.5 py-3.5 bg-white hover:bg-slate-100 text-slate-950 font-sans font-semibold rounded-2xl text-xs transition duration-200 cursor-pointer shadow active:scale-98 disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  ) : (
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5 shrink-0">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    </svg>
                  )}
                  <span>{isLoading ? 'Establishing tunnel...' : 'Authorize Workspace Link'}</span>
                </button>
              </div>
            )}

            {/* Quick Bypass / Tester Link info */}
            <div className="mt-6 pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-3xs font-mono text-slate-500">
              <span className="flex items-center gap-1">
                <Globe className="w-3 h-3 text-emerald-400" />
                <span>Simulated Sandbox bypass is available</span>
              </span>
              <button 
                onClick={handleLaunchSandbox}
                title="Bypass cloud constraints for trial preview"
                className="text-indigo-400 hover:text-indigo-300 font-bold uppercase transition hover:underline cursor-pointer"
              >
                Bypass &amp; View Workspace →
              </button>
            </div>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-8 px-6 text-center text-xs text-slate-500 border-t border-slate-900/80 max-w-7xl mx-auto w-full mt-12 flex flex-col sm:flex-row justify-between items-center gap-4 z-10">
        <p>© 2026 ShivAI. Designed for ultimate focus.</p>
        <div className="flex items-center space-x-1.5 text-slate-400 bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-800">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Local Sync Sandbox Mode Ready</span>
        </div>
      </footer>
    </div>
  );
}

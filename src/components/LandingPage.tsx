import React from 'react';
import { Sparkles, Calendar, Heart, ShieldCheck, ArrowRight, TrendingUp, Briefcase } from 'lucide-react';
import { motion } from 'motion/react';

interface LandingPageProps {
  onStart: () => void;
}

export default function LandingPage({ onStart }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-hidden relative selection:bg-indigo-500 selection:text-white">
      {/* Decorative ambient background glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/15 blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] left-[30%] w-[30%] h-[30%] rounded-full bg-cyan-900/10 blur-[100px] pointer-events-none" />

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
            onClick={onStart}
            id="btn-header-launch"
            className="px-5 py-2 rounded-full border border-slate-800 bg-slate-900/40 hover:bg-slate-900 hover:border-slate-700 text-sm font-medium transition duration-300 backdrop-blur-md cursor-pointer"
          >
            Launch Assistant
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center items-center px-6 text-center max-w-5xl mx-auto z-10 w-full py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="px-3.5 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-xs font-semibold text-indigo-400 uppercase tracking-widest inline-flex items-center space-x-1.5 mb-6">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>Introducing Version 1.0</span>
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="font-sans font-bold text-4xl sm:text-6xl lg:text-7xl tracking-tight text-white mb-6 leading-[1.1]"
        >
          Your Intelligent <br />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Personal AI Workspace
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-slate-400 text-base sm:text-xl max-w-2xl mb-10 leading-relaxed font-sans"
        >
          ShivAI aggregates daily productivity planning, customized habit tracking, health metrics logs, smart budgeting, and AI career acceleration in a gorgeous human-centric workspace.
        </motion.p>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-16"
        >
          <button
            onClick={onStart}
            id="btn-hero-launch"
            className="relative group px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 font-sans font-semibold text-base text-white shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:shadow-[0_0_40px_rgba(99,102,241,0.5)] transition duration-300 hover:scale-[1.02] flex items-center space-x-2.5 cursor-pointer"
          >
            <span>Enter Assistant Workspace</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition duration-250" />
          </button>
        </motion.div>

        {/* Grid feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full text-left mt-4">
          <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/30 backdrop-blur-md">
            <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 w-fit mb-4">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="text-white font-sans font-semibold text-lg mb-2">Strategic Planner</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Organize daily priorities, set deadlines, and track completion statistics with an integrated Kanban-light agenda.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/30 backdrop-blur-md">
            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400 w-fit mb-4">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-white font-sans font-semibold text-lg mb-2">Biometric &amp; Habit Trackers</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Track streaks, check daily routines, trace hydration goals, log sleep duration, and capture customized biometric BMI metrics.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/30 backdrop-blur-md">
            <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400 w-fit mb-4">
              <Briefcase className="w-5 h-5" />
            </div>
            <h3 className="text-white font-sans font-semibold text-lg mb-2">Career Accelerator</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Leverage custom Gemini assistance to polish high-impact resume bullets, generate outreach emails, and prepare for interviews.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-6 text-center text-xs text-slate-500 border-t border-slate-900/80 max-w-7xl mx-auto w-full mt-12 flex flex-col sm:flex-row justify-between items-center gap-4 z-10">
        <p>© 2026 ShivAI. Apple-Inspired Minimalist Philosophy. Designed for ultimate focus.</p>
        <div className="flex items-center space-x-1.5 text-slate-400 bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-800">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Local Sync Sandbox Mode</span>
        </div>
      </footer>
    </div>
  );
}

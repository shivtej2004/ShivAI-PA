import React, { useState } from 'react';
import { User, Target, Droplet, DollarSign, Save, ShieldAlert, BadgeInfo } from 'lucide-react';
import { UserProfile } from '../types';

interface SettingsViewProps {
  profile: UserProfile;
  onUpdateProfile: (newProfile: UserProfile) => void;
}

export default function SettingsView({ profile, onUpdateProfile }: SettingsViewProps) {
  const [name, setName] = useState(profile.name);
  const [primaryGoal, setPrimaryGoal] = useState(profile.primaryGoal);
  const [dailyWaterTarget, setDailyWaterTarget] = useState(profile.dailyWaterTarget);
  const [dailyBudget, setDailyBudget] = useState(profile.dailyBudget);
  const [savedMessage, setSavedMessage] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      name: name.trim() || 'User',
      primaryGoal: primaryGoal.trim() || 'Daily wellness and executive productivity',
      dailyWaterTarget: Number(dailyWaterTarget) || 2000,
      dailyBudget: Number(dailyBudget) || 50,
    });
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
      
      {/* Configuration Controls (Left Column) */}
      <div className="lg:col-span-7 p-6 rounded-3xl border border-slate-900 bg-slate-900/15 backdrop-blur-md space-y-6">
        <div>
          <span className="text-2xs font-semibold text-indigo-400 uppercase tracking-widest bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-900/30">
            Profile Config
          </span>
          <h3 className="text-xl font-sans font-bold text-white mt-3">Assistant Profile Settings</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Update your credentials and daily metrics to allow Shiv's neural algorithms to personalize your routine coaching recommendations.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Name input */}
          <div className="space-y-1.5">
            <label className="text-2xs font-bold text-slate-400 tracking-wider uppercase font-sans flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span>Full Name / Handle</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          {/* Target core goal */}
          <div className="space-y-1.5">
            <label className="text-2xs font-bold text-slate-400 tracking-wider uppercase font-sans flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5" />
              <span>Core Productivity Objective</span>
            </label>
            <input
              type="text"
              value={primaryGoal}
              onChange={(e) => setPrimaryGoal(e.target.value)}
              placeholder="e.g., Land a senior frontend role and build daily atomic habits"
              className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          {/* Double column numeric targets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Water hydration goal */}
            <div className="space-y-1.5">
              <label className="text-2xs font-bold text-slate-400 tracking-wider uppercase font-sans flex items-center gap-1.5">
                <Droplet className="w-3.5 h-3.5 text-cyan-400" />
                <span>Water Base Volume (ml)</span>
              </label>
              <input
                type="number"
                min={500}
                max={10000}
                step={250}
                value={dailyWaterTarget}
                onChange={(e) => setDailyWaterTarget(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            {/* Daily spend budget goal */}
            <div className="space-y-1.5">
              <label className="text-2xs font-bold text-slate-400 tracking-wider uppercase font-sans flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-rose-400" />
                <span>Daily Outflow Cap (USD)</span>
              </label>
              <input
                type="number"
                min={5}
                max={5000}
                step={5}
                value={dailyBudget}
                onChange={(e) => setDailyBudget(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-800 text-sm text-white focus:outline-none"
                required
              />
            </div>

          </div>

          <button
            type="submit"
            id="btn-settings-save"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:bg-indigo-600 text-white font-sans font-semibold text-sm transition hover:scale-[1.01] cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(99,102,241,0.2)]"
          >
            <Save className="w-4 h-4" />
            <span>Save Profile Metrics</span>
          </button>
        </form>

        {savedMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs text-center font-semibold font-sans animate-bounce mt-4">
            ✓ Profile preferences successfully synced and persisted!
          </div>
        )}
      </div>

      {/* Diagnostics / Sandboxed Local State metrics (Right Column) */}
      <div className="lg:col-span-5 p-6 rounded-3xl border border-slate-900 bg-slate-900/15 backdrop-blur-md flex flex-col justify-between">
        <div className="space-y-6">
          <div>
            <span className="text-2xs font-semibold text-slate-500 uppercase tracking-widest">
              Diagnostics
            </span>
            <h3 className="text-xl font-sans font-bold text-white mt-3">Sync Sandbox Info</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              ShivAI runs on high-performance Client-Side Local Storage synchronization. This allows fast offline usability and preserves absolute privacy over personal metric streams.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 flex items-start gap-2.5">
              <BadgeInfo className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div className="text-3xs text-slate-400 leading-relaxed">
                <strong>Gemini Cloud Connection:</strong> AI features run on server-side requests backed by Google's multi-modal intelligence models.
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-3xs text-slate-400 leading-relaxed">
                <strong>Zero Cookie Tracking:</strong> Shiv retains metrics within local browser sandboxes unless cleared actively via system controls.
              </div>
            </div>
          </div>
        </div>

        {/* System credits */}
        <div className="pt-6 border-t border-slate-900">
          <p className="text-4xs text-slate-500 text-center leading-relaxed">
            Designed under apple-inspired minimalist specifications. Powered by Gemini Flash 1.0 architecture.
          </p>
        </div>
      </div>

    </div>
  );
}

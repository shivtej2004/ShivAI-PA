import React, { useState } from 'react';
import { 
  Plus, 
  Flame, 
  Check, 
  Sparkles,
  RefreshCw,
  Gift,
  Award,
  HelpCircle
} from 'lucide-react';
import { Habit } from '../types';

interface HabitsViewProps {
  habits: Habit[];
  onAddHabit: (name: string) => void;
  onToggleHabit: (id: string, date: string) => void;
  onDeleteHabit: (id: string) => void;
  onResetHabits: () => void;
}

export default function HabitsView({
  habits,
  onAddHabit,
  onToggleHabit,
  onDeleteHabit,
  onResetHabits
}: HabitsViewProps) {
  const [newHabitName, setNewHabitName] = useState('');
  
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;
    onAddHabit(newHabitName.trim());
    setNewHabitName('');
  };

  // Generate date strings for the last 7 days (including today)
  const getLast7Days = () => {
    const dates: { label: string; raw: string; dayName: string }[] = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const raw = d.toISOString().split('T')[0];
      const label = d.getDate().toString();
      const dayName = days[d.getDay()];
      dates.push({ label, raw, dayName });
    }
    return dates;
  };

  const last7Days = getLast7Days();
  const todayStr = new Date().toISOString().split('T')[0];

  // Simulated heatmap grid data (28 contribution cells over 4 weeks)
  const heatmapData = Array.from({ length: 28 }, (_, i) => {
    // Random activity level 0-3 for cool github-like grid styling
    const level = (i % 7 === 0 || i % 5 === 2) ? Math.min(3, (i % 4)) : 0;
    return { id: i, level };
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
      
      {/* Habit Master Controller (Left Side) */}
      <div className="lg:col-span-4 p-6 rounded-3xl border border-slate-900 bg-slate-900/15 backdrop-blur-md space-y-6 flex flex-col justify-between">
        <div className="space-y-6">
          <div>
            <span className="text-2xs font-semibold text-indigo-400 uppercase tracking-widest bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-900/30">
              Routine Engine
            </span>
            <h3 className="text-xl font-sans font-bold text-white mt-3">Add Custom Habits</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Consistently repeat customized behaviors to lock down streaks and hardwire neural pathways.
            </p>
          </div>

          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-2xs font-bold text-slate-400 tracking-wider uppercase font-sans">Habit Name</label>
              <input
                type="text"
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                placeholder="e.g., Read 15 pages..."
                className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500 placeholder:text-slate-500 font-sans"
                required
              />
            </div>

            <button
              type="submit"
              id="btn-habits-submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 text-white font-sans font-semibold text-sm hover:scale-[1.01] transition duration-200 cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(168,85,247,0.2)]"
            >
              <Plus className="w-4 h-4" />
              <span>Lock Habit Habit</span>
            </button>
          </form>
        </div>

        {/* Heatmap consistent view */}
        <div className="pt-6 border-t border-slate-900 space-y-3">
          <div>
            <p className="text-xs font-bold text-slate-350 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Routine Consistency Heatmap</span>
            </p>
            <p className="text-4xs text-slate-500 mt-0.5 uppercase tracking-wider">Simulating 28-day compliance block</p>
          </div>

          {/* Simple contribution mapping */}
          <div className="grid grid-cols-7 gap-1.5 w-fit">
            {heatmapData.map((cell) => (
              <div
                key={cell.id}
                className={`w-3.5 h-3.5 rounded-sm transition-all duration-200 ${
                  cell.level === 0 ? 'bg-slate-900/80 border border-slate-800' :
                  cell.level === 1 ? 'bg-indigo-950/60 border border-indigo-900/20' :
                  cell.level === 2 ? 'bg-indigo-700' : 'bg-purple-500'
                }`}
                title={`Level ${cell.level} compliance check`}
              />
            ))}
          </div>

          <div className="flex gap-4 text-4xs text-slate-500 items-center">
            <span>Low Compliance</span>
            <div className="flex gap-1">
              <div className="w-2.5 h-2.5 bg-slate-900 rounded-sm" />
              <div className="w-2.5 h-2.5 bg-indigo-950 rounded-sm" />
              <div className="w-2.5 h-2.5 bg-indigo-700 rounded-sm" />
              <div className="w-2.5 h-2.5 bg-purple-500 rounded-sm" />
            </div>
            <span>High Peak</span>
          </div>
        </div>

      </div>

      {/* Habit Grid Streaks List (Right Column) */}
      <div className="lg:col-span-8 p-6 rounded-3xl border border-slate-900 bg-slate-900/15 backdrop-blur-md flex flex-col justify-between">
        <div className="space-y-6">
          
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-sans font-bold text-white">Focus Habits Matrix</h3>
            <span className="text-xs text-slate-500 font-mono">Check off the past 7 days</span>
          </div>

          {habits.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-slate-800 rounded-3xl">
              <p className="text-slate-500 text-sm italic font-sans">No focus habits currently established. Add routines on the left console.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {habits.map((habit) => {
                const completedToday = habit.completedDates.includes(todayStr);
                return (
                  <div 
                    key={habit.id}
                    className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-slate-800 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                      <div>
                        <h4 className="text-sm font-sans font-bold text-white">{habit.name}</h4>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
                          <span className="text-xs font-semibold text-orange-400 font-mono">{habit.streak} Day Streak</span>
                        </div>
                      </div>
                      
                      {/* Delete Trigger */}
                      <button
                        onClick={() => onDeleteHabit(habit.id)}
                        className="text-3xs font-semibold text-slate-500 hover:text-red-400 transition cursor-pointer self-start sm:self-center uppercase tracking-wider"
                      >
                        Retire Routine
                      </button>
                    </div>

                    {/* Past 7 days checkoff grid buttons */}
                    <div className="grid grid-cols-7 gap-1 flex-wrap">
                      {last7Days.map((day) => {
                        const isChecked = habit.completedDates.includes(day.raw);
                        const isToday = day.raw === todayStr;
                        return (
                          <button
                            key={day.raw}
                            onClick={() => onToggleHabit(habit.id, day.raw)}
                            className={`p-2 rounded-xl flex flex-col items-center gap-1 border transition cursor-pointer ${
                              isChecked
                                ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400'
                                : isToday
                                ? 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                                : 'bg-slate-950/40 border-slate-800 text-slate-500 hover:border-slate-800'
                            }`}
                          >
                            <span className="text-4xs font-semibold text-slate-500 uppercase">{day.dayName}</span>
                            <span className="text-xs font-mono font-bold">{day.label}</span>
                            <div className="mt-1">
                              {isChecked ? (
                                <div className="p-0.5 bg-indigo-500 rounded text-slate-900 font-bold text-4xs">✓</div>
                              ) : (
                                <div className="w-3.5 h-3.5 border border-dashed border-slate-700 rounded bg-transparent" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* Global actions */}
        {habits.length > 0 && (
          <div className="pt-6 border-t border-slate-900 flex justify-end">
            <button
              onClick={onResetHabits}
              className="text-3xs text-slate-500 hover:text-red-400 font-semibold uppercase tracking-widest cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset Routine Matrix Metrics</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

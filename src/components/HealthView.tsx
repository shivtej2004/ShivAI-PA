import React, { useState } from 'react';
import { 
  Heart, 
  Moon, 
  Droplet, 
  Activity, 
  Clock, 
  PlusCircle, 
  Bell, 
  Trash2,
  CheckCircle2,
  Sliders
} from 'lucide-react';
import { SleepLog, Medication } from '../types';

interface HealthViewProps {
  sleepLogs: SleepLog[];
  medications: Medication[];
  onAddSleepLog: (bedTime: string, wakeTime: string) => void;
  onDeleteSleepLog: (id: string) => void;
  onAddMedication: (name: string, dosage: string, time: string) => void;
  onToggleMedication: (id: string) => void;
  onDeleteMedication: (id: string) => void;
  waterVol: number;
}

export default function HealthView({
  sleepLogs,
  medications,
  onAddSleepLog,
  onDeleteSleepLog,
  onAddMedication,
  onToggleMedication,
  onDeleteMedication,
  waterVol
}: HealthViewProps) {
  // BMI sliders
  const [weight, setWeight] = useState<number>(70); // kg
  const [height, setHeight] = useState<number>(175); // cm

  // Sleep Logger
  const [bedTime, setBedTime] = useState('22:30');
  const [wakeTime, setWakeTime] = useState('07:00');

  // Medication Reminder Setup
  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('');
  const [medTime, setMedTime] = useState('08:00');
  const [simulatedAlertText, setSimulatedAlertText] = useState<string | null>(null);

  // BMI calculations
  const heightInMeters = height / 100;
  const bmi = Math.round((weight / (heightInMeters * heightInMeters)) * 10) / 10;

  const getBmiStatus = (bmiVal: number) => {
    if (bmiVal < 18.5) return { label: 'Underweight', color: 'text-cyan-400', desc: 'Slightly below general metrics. Aim for complex proteins.' };
    if (bmiVal < 25) return { label: 'Healthy Weight', color: 'text-emerald-400', desc: 'Excellent balance! Excellent metabolic sync.' };
    if (bmiVal < 30) return { label: 'Overweight', color: 'text-amber-400', desc: 'Slightly above standard range. Increase physical cardio.' };
    return { label: 'Obese Range', color: 'text-rose-400', desc: 'Consider consulting routine experts for lifestyle schedules.' };
  };

  const bmiStatus = getBmiStatus(bmi);

  const handleSleepSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bedTime || !wakeTime) return;
    onAddSleepLog(bedTime, wakeTime);
  };

  const handleMedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medName.trim() || !medDosage.trim()) return;
    onAddMedication(medName.trim(), medDosage.trim(), medTime);
    setMedName('');
    setMedDosage('');
  };

  const triggerSimulatedAlarm = (med: Medication) => {
    setSimulatedAlertText(`🔔 [Shiv Notification Alarm]: It is currently ${med.time}! Take ${med.dosage} of "${med.name}" as scheduled.`);
    setTimeout(() => {
      setSimulatedAlertText(null);
    }, 6000);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* alarm notify banner */}
      {simulatedAlertText && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-400 font-sans text-xs flex justify-between items-center shadow-lg animate-bounce">
          <span>{simulatedAlertText}</span>
          <button 
            onClick={() => setSimulatedAlertText(null)} 
            className="text-xs uppercase font-bold cursor-pointer"
          >
            Acknowledge
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* BMI Calculator (Left Column) */}
        <div className="lg:col-span-4 p-6 rounded-3xl border border-slate-900 bg-slate-900/15 backdrop-blur-md space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2.5">
              <Activity className="w-5 h-5 text-indigo-400 animate-pulse" />
              <h3 className="text-lg font-sans font-bold text-white">Biometrics BMI Calculator</h3>
            </div>
            <p className="text-2xs text-slate-400 mt-1 leading-relaxed">
              Slide parameters to analyze body mass composition metrics instantly.
            </p>
          </div>

          <div className="space-y-6 py-4">
            {/* Weight slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-400">Weight Metric</span>
                <span className="text-white font-mono">{weight} kg</span>
              </div>
              <input
                type="range"
                min={40}
                max={150}
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            {/* Height slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-400">Height Metric</span>
                <span className="text-white font-mono">{height} cm</span>
              </div>
              <input
                type="range"
                min={120}
                max={225}
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>
          </div>

          {/* BMI Output Card */}
          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-2 text-center">
            <span className="text-3xs uppercase text-slate-500 font-bold tracking-wider">Calculated BMI Rating</span>
            <p className="text-4xl font-sans font-extrabold text-white tracking-tight">{bmi}</p>
            <p className={`text-xs font-bold leading-none ${bmiStatus.color}`}>{bmiStatus.label}</p>
            <p className="text-3xs text-slate-400 font-sans italic pt-1">{bmiStatus.desc}</p>
          </div>
        </div>

        {/* Sleep duration logger & log history (Middle Column) */}
        <div className="lg:col-span-4 p-6 rounded-3xl border border-slate-900 bg-slate-900/15 backdrop-blur-md space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2.5">
              <Moon className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-sans font-bold text-white">Sleep Duration Logger</h3>
            </div>
            <p className="text-2xs text-slate-400 mt-1 leading-relaxed">
              Track bedtime rest cycles to optimize circadian rhythms. Focus goal: 7.5 - 8.5 hours.
            </p>
          </div>

          <form onSubmit={handleSleepSubmit} className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-3xs font-semibold text-slate-500 uppercase font-sans">Bed Time</label>
                <input
                  type="time"
                  value={bedTime}
                  onChange={(e) => setBedTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-3xs font-semibold text-slate-500 uppercase font-sans">Wake Time</label>
                <input
                  type="time"
                  value={wakeTime}
                  onChange={(e) => setWakeTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900 text-slate-200 hover:text-white text-xs font-semibold transition cursor-pointer"
            >
              Log Sleep Sleep
            </button>
          </form>

          {/* Sleep timeline logs preview */}
          <div className="space-y-2 mt-4">
            <span className="text-3xs uppercase text-slate-500 font-bold tracking-wider">Rest log history</span>
            <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
              {sleepLogs.length === 0 ? (
                <p className="text-slate-500 text-3xs py-3 text-center italic">No rest history logged. Add Rest Logs above!</p>
              ) : (
                sleepLogs.map((log) => (
                  <div key={log.id} className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800 flex justify-between items-center text-xs">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{log.bedTime} to {log.wakeTime}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-indigo-400">{log.duration} hrs</span>
                      <button 
                        onClick={() => onDeleteSleepLog(log.id)}
                        className="text-slate-600 hover:text-red-400 transition cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Medication Scheduler & Reminders (Right Column) */}
        <div className="lg:col-span-4 p-6 rounded-3xl border border-slate-900 bg-slate-900/15 backdrop-blur-md space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2.5">
              <PlusCircle className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-sans font-bold text-white">Medication Scheduler</h3>
            </div>
            <p className="text-2xs text-slate-400 mt-1 leading-relaxed">
              Verify scheduled physical supplementation routines. Trigger alarms to test schedule alerts.
            </p>
          </div>

          <form onSubmit={handleMedSubmit} className="space-y-3">
            <input
              type="text"
              value={medName}
              onChange={(e) => setMedName(e.target.value)}
              placeholder="Medication name e.g., Vitamin C..."
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder:text-slate-500 font-sans"
              required
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={medDosage}
                onChange={(e) => setMedDosage(e.target.value)}
                placeholder="Dosage, e.g. 500mg"
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder:text-slate-500 font-sans"
                required
              />
              <input
                type="time"
                value={medTime}
                onChange={(e) => setMedTime(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none cursor-pointer"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-sans font-semibold text-xs transition hover:scale-[1.01] cursor-pointer"
            >
              Add Schedule Item
            </button>
          </form>

          {/* Active Medication Reminders Area */}
          <div className="space-y-2 mt-4">
            <span className="text-3xs uppercase text-slate-500 font-bold tracking-wider">Configured schedules</span>
            <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
              {medications.length === 0 ? (
                <p className="text-slate-500 text-3xs py-3 text-center italic">No medication schedules configured.</p>
              ) : (
                medications.map((med) => (
                  <div key={med.id} className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center justify-between gap-1">
                    <div className="min-w-0 flex-1">
                      <span className="text-slate-100 font-bold text-xs truncate block leading-none">{med.name}</span>
                      <span className="text-slate-400 text-3xs">{med.dosage} @ {med.time}</span>
                    </div>
                    <div className="flex items-center space-x-1 shrink-0">
                      <button
                        onClick={() => triggerSimulatedAlarm(med)}
                        className="p-1 rounded text-amber-400 hover:bg-slate-900/80 transition cursor-pointer"
                        title="Simulate prompt alert"
                      >
                        <Bell className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteMedication(med.id)}
                        className="p-1 rounded text-slate-500 hover:text-red-400 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

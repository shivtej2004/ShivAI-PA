import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  LayoutDashboard, 
  MessageSquare, 
  Calendar, 
  Flame, 
  Heart, 
  DollarSign, 
  Briefcase, 
  Settings, 
  Power,
  Menu,
  X,
  Clock
} from 'lucide-react';
import LandingPage from './components/LandingPage';
import DashboardView from './components/DashboardView';
import ChatView from './components/ChatView';
import PlannerView from './components/PlannerView';
import HabitsView from './components/HabitsView';
import HealthView from './components/HealthView';
import ExpensesView from './components/ExpensesView';
import CareerView from './components/CareerView';
import SettingsView from './components/SettingsView';
import IndianScheduleView from './components/IndianScheduleView';

import { Task, Habit, Transaction, SleepLog, Medication, ChatMessage, UserProfile } from './types';

// Default mock values to seed on first load
const DEFAULT_TASKS: Task[] = [
  { id: 't1', title: 'Synthesize ShivAI executive goals config', priority: 'high', completed: false, notes: 'Detail product metrics' },
  { id: 't2', title: 'Schedule medical cardiovascular metrics', priority: 'medium', completed: true },
  { id: 't3', title: 'Optimize portfolio resume layout with STAR method', priority: 'high', completed: false }
];

const DEFAULT_HABITS: Habit[] = [
  { id: 'h1', name: 'Drink 2.5L structured water', completedDates: [], createdAt: new Date().toISOString(), streak: 3 },
  { id: 'h2', name: 'Exercise 15 minutes aerobically', completedDates: [], createdAt: new Date().toISOString(), streak: 1 },
  { id: 'h3', name: 'Draft 2 career target bullet lines', completedDates: [], createdAt: new Date().toISOString(), streak: 5 }
];

const DEFAULT_TRANSACTIONS: Transaction[] = [
  { id: 'tr1', type: 'income', amount: 4800, category: 'Freelance', date: '2026-06-18', description: 'Web app architecture client payout' },
  { id: 'tr2', type: 'expense', amount: 120, category: 'Food/Groceries', date: '2026-06-19', description: 'Weekly meal prep box subscription' }
];

const DEFAULT_PROFILE: UserProfile = {
  name: 'Shivtej',
  primaryGoal: 'Personal routine wellness and elite executive career delivery',
  dailyWaterTarget: 2250,
  dailyBudget: 45
};

export default function App() {
  const [visitedLanding, setVisitedLanding] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // States
  const [currency, setCurrency] = useState<'USD' | 'INR'>('INR');
  const [profile, setProfile] = useState<UserProfile>({
    ...DEFAULT_PROFILE,
    dailyBudget: 1200
  });
  const [tasks, setTasks] = useState<Task[]>(DEFAULT_TASKS);
  const [habits, setHabits] = useState<Habit[]>(DEFAULT_HABITS);
  const [transactions, setTransactions] = useState<Transaction[]>(DEFAULT_TRANSACTIONS);
  const [sleepLogs, setSleepLogs] = useState<SleepLog[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);

  // Load from LocalStorage once on startup
  useEffect(() => {
    try {
      const stored = localStorage.getItem('shiv_ai_unified_state');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.profile) setProfile(parsed.profile);
        if (parsed.tasks) setTasks(parsed.tasks);
        if (parsed.habits) setHabits(parsed.habits);
        if (parsed.transactions) setTransactions(parsed.transactions);
        if (parsed.sleepLogs) setSleepLogs(parsed.sleepLogs);
        if (parsed.medications) setMedications(parsed.medications);
        if (parsed.chatMessages) setChatMessages(parsed.chatMessages);
        if (parsed.visitedLanding !== undefined) setVisitedLanding(parsed.visitedLanding);
        if (parsed.currency !== undefined) setCurrency(parsed.currency);
      }
    } catch (error) {
      console.error("Failed to parse localized data backup:", error);
    }
  }, []);

  // Save to LocalStorage sequentially on dependency updates
  useEffect(() => {
    try {
      const stateToSave = {
        profile,
        tasks,
        habits,
        transactions,
        sleepLogs,
        medications,
        chatMessages,
        visitedLanding,
        currency
      };
      localStorage.setItem('shiv_ai_unified_state', JSON.stringify(stateToSave));
    } catch (error) {
      console.error("Could not record unified local state backup:", error);
    }
  }, [profile, tasks, habits, transactions, sleepLogs, medications, chatMessages, visitedLanding, currency]);

  // Handler methods: Tasks
  const addTask = (title: string, priority: 'low' | 'medium' | 'high', notes?: string) => {
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      priority,
      completed: false,
      notes,
      dueDate: new Date().toISOString().split('T')[0]
    };
    setTasks([newTask, ...tasks]);
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const clearTasks = () => {
    setTasks([]);
  };

  // Handler methods: Habits
  const addHabit = (name: string) => {
    const newHabit: Habit = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      completedDates: [],
      createdAt: new Date().toISOString(),
      streak: 0
    };
    setHabits([newHabit, ...habits]);
  };

  const toggleHabit = (id: string, dateStr: string) => {
    setHabits(habits.map(habit => {
      if (habit.id !== id) return habit;
      
      const exists = habit.completedDates.includes(dateStr);
      let updatedDates = [];
      if (exists) {
        updatedDates = habit.completedDates.filter(d => d !== dateStr);
      } else {
        updatedDates = [...habit.completedDates, dateStr];
      }

      // Calculate streak based on current date
      const sortedHistory = [...updatedDates].sort();
      let streak = 0;
      if (sortedHistory.length > 0) {
        streak = sortedHistory.length; // Simplified streak mapping
      }

      return {
        ...habit,
        completedDates: updatedDates,
        streak
      };
    }));
  };

  const deleteHabit = (id: string) => {
    setHabits(habits.filter(h => h.id !== id));
  };

  const resetHabits = () => {
    setHabits(habits.map(h => ({ ...h, completedDates: [], streak: 0 })));
  };

  // Handler methods: Transactions
  const addTransaction = (type: 'income' | 'expense', amount: number, category: string, description: string) => {
    const newTrans: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      amount,
      category,
      date: new Date().toISOString().split('T')[0],
      description
    };
    setTransactions([newTrans, ...transactions]);
  };

  const deleteTransaction = (id: string) => {
    setTransactions(transactions.filter(t => t.id !== id));
  };

  // Handler methods: Sleep Log
  const addSleepLog = (bedTime: string, wakeTime: string) => {
    // calculate durations
    const [bedH, bedM] = bedTime.split(':').map(Number);
    const [wakeH, wakeM] = wakeTime.split(':').map(Number);
    
    let diffMs = (wakeH * 60 + wakeM) - (bedH * 60 + bedM);
    if (diffMs < 0) {
      diffMs += 24 * 60; // next day wake up
    }
    const duration = Math.round((diffMs / 60) * 10) / 10;

    const newLog: SleepLog = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString().split('T')[0],
      bedTime,
      wakeTime,
      duration
    };
    setSleepLogs([newLog, ...sleepLogs]);
  };

  const deleteSleepLog = (id: string) => {
    setSleepLogs(sleepLogs.filter(log => log.id !== id));
  };

  // Handler methods: Medications
  const addMedication = (name: string, dosage: string, time: string) => {
    const newMed: Medication = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      dosage,
      time,
      takenToday: false
    };
    setMedications([newMed, ...medications]);
  };

  const toggleMedication = (id: string) => {
    setMedications(medications.map(m => m.id === id ? { ...m, takenToday: !m.takenToday } : m));
  };

  const deleteMedication = (id: string) => {
    setMedications(medications.filter(m => m.id !== id));
  };

  // Handler methods: Chat messages sending & API call sync
  const handleSendChatMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedHistory = [...chatMessages, userMsg];
    setChatMessages(updatedHistory);
    setIsChatLoading(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: updatedHistory })
      });
      const data = await response.json();
      
      const assistantMsg: ChatMessage = {
        id: Math.random().toString(36).substr(2, 9),
        role: 'model',
        text: data.text || "I apologize, my neural processing systems encountered a temporary synchronization glitch. Please retry!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: Math.random().toString(36).substr(2, 9),
        role: 'model',
        text: "I am running in local offline-first fallback mode today because connection nodes are isolated. Let's work on our agenda together!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const clearChatHistory = () => {
    setChatMessages([]);
  };

  const updateProfile = (newProfile: UserProfile) => {
    setProfile(newProfile);
  };

  // Splash Screen Router
  if (visitedLanding) {
    return (
      <LandingPage 
        onStart={(customName) => {
          if (customName) {
            setProfile(prev => ({ ...prev, name: customName }));
          }
          setVisitedLanding(false);
        }} 
      />
    );
  }

  // Sidebar list configurations
  const menuItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'chat', label: 'Shiv AI Chat', icon: MessageSquare },
    { id: 'schedule', label: 'Schedule & Workspace', icon: Clock },
    { id: 'planner', label: 'Productivity Planner', icon: Calendar },
    { id: 'habits', label: 'Habit Tracker', icon: Flame },
    { id: 'health', label: 'Health Dashboard', icon: Heart },
    { id: 'expenses', label: 'Expense Tracker', icon: DollarSign },
    { id: 'career', label: 'Career Assistant', icon: Briefcase },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const handleSidebarTabSwitch = (id: string) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col md:flex-row font-sans leading-relaxed selection:bg-indigo-500 selection:text-white relative overflow-y-auto md:overflow-hidden md:h-screen md:max-h-screen">
      
      {/* Decorative localized glows */}
      <div className="absolute -top-40 -left-40 w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[150px] pointer-events-none apple-glow-orb" />
      <div className="absolute -bottom-40 -right-40 w-[70%] h-[70%] rounded-full bg-purple-500/10 blur-[180px] pointer-events-none apple-glow-orb" />
      <div className="absolute top-[30%] right-[10%] w-[50%] h-[50%] rounded-full bg-teal-500/5 blur-[160px] pointer-events-none apple-glow-orb" />

      {/* Header for Mobile only */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 border-b border-slate-900/85 bg-slate-950/85 backdrop-blur-xl shrink-0 z-30">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-lg">
            <Sparkles className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="font-semibold text-base tracking-tight text-white font-display">ShivAI</span>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg border border-slate-800 text-slate-400 focus:outline-none"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Primary Sidebar Rail (Desktop) */}
      <aside className={`fixed inset-y-0 left-0 w-64 glass-panel p-6 flex flex-col justify-between z-20 transform transition-transform duration-300 md:relative md:translate-x-0 md:my-5 md:ml-5 md:rounded-3xl md:shadow-2xl md:border md:border-white/5 ${
        mobileMenuOpen ? 'translate-x-0 bg-slate-950' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="space-y-8">
          
          {/* Logo brand */}
          <div className="flex items-center space-x-3 pb-2 border-b border-white/5">
            <div className="p-2 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-xl shadow-lg">
              <Sparkles className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-white font-display text-gradient-apple">ShivAI</span>
              <span className="text-[10px] text-slate-500 block leading-none font-mono tracking-widest mt-0.5 uppercase">Neural Coach</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {menuItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSidebarTabSwitch(item.id)}
                  className={`w-full flex items-center space-x-3.5 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide uppercase transition cursor-pointer duration-200 ${
                    isActive 
                      ? 'bg-indigo-500/15 text-white border border-indigo-500/25 shadow-[0_0_15px_rgba(99,102,241,0.15)]' 
                      : 'text-slate-400 hover:bg-slate-900/40 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-6 border-t border-white/5 space-y-4">
          <div className="flex items-center gap-3.5 px-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow">
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-white block truncate leading-none">{profile.name}</span>
              <span className="text-[9px] text-emerald-450 text-emerald-400 block font-mono mt-1 opacity-80 uppercase tracking-widest">● SANDBOX LIVE</span>
            </div>
          </div>

          <button
            onClick={() => setVisitedLanding(true)}
            className="w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-xl border border-white/5 hover:border-white/10 text-[10px] uppercase font-bold tracking-wider text-slate-500 hover:text-slate-300 transition cursor-pointer"
          >
            <Power className="w-3.5 h-3.5" />
            <span>Return to Landing</span>
          </button>
        </div>
      </aside>

      {/* Main Sandbox Dashboard Content Canvas */}
      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full overflow-y-auto overflow-x-hidden">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {activeTab === 'dashboard' && (
            <DashboardView 
              tasks={tasks}
              habits={habits}
              profile={profile}
              onAddTask={(t, p) => addTask(t, p)}
              onToggleTask={toggleTask}
              onToggleHabitToday={(id) => toggleHabit(id, new Date().toISOString().split('T')[0])}
              onUpdateWater={(amt) => setProfile(prev => ({ ...prev, dailyWaterTarget: Math.max(250, prev.dailyWaterTarget + amt) }))}
              onDeleteTask={deleteTask}
            />
          )}

          {activeTab === 'chat' && (
            <ChatView 
              messages={chatMessages}
              onSendMessage={handleSendChatMessage}
              loading={isChatLoading}
              onClearHistory={clearChatHistory}
            />
          )}

          {activeTab === 'planner' && (
            <PlannerView 
              tasks={tasks}
              onAddTask={addTask}
              onToggleTask={toggleTask}
              onDeleteTask={deleteTask}
              onClearTasks={clearTasks}
            />
          )}

          {activeTab === 'habits' && (
            <HabitsView 
              habits={habits}
              onAddHabit={addHabit}
              onToggleHabit={toggleHabit}
              onDeleteHabit={deleteHabit}
              onResetHabits={resetHabits}
            />
          )}

          {activeTab === 'health' && (
            <HealthView 
              sleepLogs={sleepLogs}
              medications={medications}
              onAddSleepLog={addSleepLog}
              onDeleteSleepLog={deleteSleepLog}
              onAddMedication={addMedication}
              onToggleMedication={toggleMedication}
              onDeleteMedication={deleteMedication}
              waterVol={profile.dailyWaterTarget}
            />
          )}

          {activeTab === 'expenses' && (
            <ExpensesView 
              transactions={transactions}
              profile={profile}
              onAddTransaction={addTransaction}
              onDeleteTransaction={deleteTransaction}
              currency={currency}
            />
          )}

          {activeTab === 'schedule' && (
            <IndianScheduleView 
              currency={currency}
              onUpdateCurrency={(curr) => {
                setCurrency(curr);
                if (curr === 'INR') {
                  setProfile(prev => ({ ...prev, dailyBudget: prev.dailyBudget === 45 ? 1200 : prev.dailyBudget }));
                } else {
                  setProfile(prev => ({ ...prev, dailyBudget: prev.dailyBudget === 1200 ? 45 : prev.dailyBudget }));
                }
              }}
            />
          )}

          {activeTab === 'career' && (
            <CareerView />
          )}

          {activeTab === 'settings' && (
            <SettingsView 
              profile={profile}
              onUpdateProfile={updateProfile}
            />
          )}

        </div>
      </main>

    </div>
  );
}

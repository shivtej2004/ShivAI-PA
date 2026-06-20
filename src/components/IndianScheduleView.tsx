import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar as CalendarIcon, 
  CheckSquare, 
  Clock, 
  Sparkles, 
  Coffee, 
  Bell, 
  Play, 
  Pause,
  RotateCcw, 
  Globe, 
  Moon, 
  Sun,
  Activity,
  Plus,
  Trash2,
  ListTodo,
  Check,
  AlertCircle,
  TrendingUp,
  UserCheck,
  Power
} from 'lucide-react';
import { googleSignIn, logout, initAuth } from '../lib/firebase';

interface GoogleEvent {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  description?: string;
  descriptionSnippet?: string;
}

interface GoogleTask {
  id: string;
  title: string;
  notes?: string;
  due?: string;
  status: 'needsAction' | 'completed';
}

interface IndianScheduleViewProps {
  onUpdateCurrency: (currency: 'USD' | 'INR') => void;
  currency: 'USD' | 'INR';
}

const INDIAN_HOLIDAYS_2026 = [
  { date: '2026-08-15', name: 'Independence Day', type: 'National Holiday' },
  { date: '2026-10-02', name: 'Mahatma Gandhi Jayanti', type: 'National Holiday' },
  { date: '2026-11-08', name: 'Diwali (Festival of Lights)', type: 'Cultural Celebration' },
  { date: '2026-03-03', name: 'Holi (Festival of Colours)', type: 'Cultural Celebration' },
  { date: '2026-01-26', name: 'Republic Day of India', type: 'National Holiday' },
  { date: '2026-05-27', name: 'Buddha Purnima', type: 'Gazetted Holiday' },
  { date: '2026-09-04', name: 'Janmashtami', type: 'Cultural Celebration' },
  { date: '2026-12-25', name: 'Christmas', type: 'Gazetted Holiday' }
];

// Pre-seeded Indian professional daily slots (Traditional early morning Brahma Muhurta style)
const INITIAL_INDIAN_SLOTS = [
  { id: 's1', time: '04:30 - 05:30', name: 'Brahma Muhurta (Sadhana & Yoga)', desc: 'Pre-dawn cognitive peak. Best for Pranayama, meditation, and high-concentration work.', active: true, tag: 'Ayurvedic' },
  { id: 's2', time: '09:30 - 13:00', name: 'Morning Tech Standup & Sprint', desc: 'Main engineering focus on startup / freelance agenda.', active: false, tag: 'Professional' },
  { id: 's3', time: '13:00 - 14:00', name: 'Traditional Lunch & Power Nap', desc: 'Ayurvedic mid-day recovery. Take light lunch to combat post-meal lethargy.', active: false, tag: 'Wellness' },
  { id: 's4', time: '16:00 - 16:30', name: 'Chai Break & Network Catchup', desc: '10-minute visual chai timer. Energize social sync.', active: false, tag: 'Leisure' },
  { id: 's5', time: '18:30 - 20:30', name: 'Skill Academy & Tech Upskilling', desc: 'Work on portfolio optimized STAR resume logs and competitive algorithms.', active: false, tag: 'Growth' },
  { id: 's6', time: '21:30 - 22:00', name: 'Soothe Mindset & Light Walk', desc: 'Offline tech detox before sleep. Hydrate system.', active: false, tag: 'Relaxation' }
];

// Self-contained synthesizer chime sounds using Web Audio API
const playHarmonySound = (frequency: number = 528, duration: number = 1.5) => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    
    // Smooth bell-like exponential decay
    gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (err) {
    console.warn("Web audio playback not initiated:", err);
  }
};

export default function IndianScheduleView({
  onUpdateCurrency,
  currency
}: IndianScheduleViewProps) {
  // Authentication & Google API states
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [needsAuth, setNeedsAuth] = useState(true);

  // Google items
  const [googleEvents, setGoogleEvents] = useState<GoogleEvent[]>([]);
  const [googleTasks, setGoogleTasks] = useState<GoogleTask[]>([]);
  const [syncStatus, setSyncStatus] = useState<string>('Sync Offline');

  // Input fields for adding items
  const [newCalTitle, setNewCalTitle] = useState('');
  const [newCalDate, setNewCalDate] = useState(new Date().toISOString().split('T')[0]);
  const [newCalTime, setNewCalTime] = useState('11:00');
  
  const [newTaskTitle, setNewTaskTitle] = useState('');
  
  // Custom slots state
  const [slots, setSlots] = useState(INITIAL_INDIAN_SLOTS);
  const [newSlotTime, setNewSlotTime] = useState('');
  const [newSlotName, setNewSlotName] = useState('');
  const [newSlotDesc, setNewSlotDesc] = useState('');

  // Chai Timer states
  const [chaiTimerActive, setChaiTimerActive] = useState(false);
  const [chaiTimeLeft, setChaiTimeLeft] = useState(600); // 10 minutes in seconds
  const [selectedChaiType, setSelectedChaiType] = useState<'masala' | 'elaichi' | 'ginger'>('masala');
  const [chaiBrewedNotify, setChaiBrewedNotify] = useState<string | null>(null);
  
  // Pranayama Circular Breathing states
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState<'Inhale (Puraka)' | 'Hold (Kumbhaka)' | 'Exhale (Rechaka)'>('Inhale (Puraka)');
  const [breathingSecs, setBreathingSecs] = useState(4); // 4-4-4 seconds cycle
  const maxPhaseSeconds = 4;

  // Ayurvedic hydration alerts
  const [hydrationBellEnabled, setHydrationBellEnabled] = useState(false);
  const [hydrationBellIntervalSecs, setHydrationBellIntervalSecs] = useState(1800); // 30 minutes
  const [hydrationTimeLeft, setHydrationTimeLeft] = useState(1800);
  const [showHydrationAlert, setShowHydrationAlert] = useState(false);

  // Load user auth state on instantiation
  useEffect(() => {
    const unsub = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleToken(token);
        setNeedsAuth(false);
        setSyncStatus('Local Sync Active');
        fetchGoogleData(token, user);
      },
      () => {
        setNeedsAuth(true);
        setGoogleUser(null);
        setGoogleToken(null);
        setSyncStatus('Offline Sandbox Mode');
        loadMockWorkspaceData();
      }
    );
    return () => unsub();
  }, []);

  // Sync intervals
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (chaiTimerActive && chaiTimeLeft > 0) {
      interval = setInterval(() => {
        setChaiTimeLeft(prev => {
          if (prev <= 1) {
            setChaiTimerActive(false);
            playHarmonySound(659, 2.5); // High pitched bell chime (E5)
            setChaiBrewedNotify(`☕ Shiv's Special ${selectedChaiType.toUpperCase()} Chai is brewed! Take an absolute digital detox break for 5 minutes.`);
            return 600;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [chaiTimerActive, chaiTimeLeft, selectedChaiType]);

  // Breathing loop
  useEffect(() => {
    let breathingInterval: NodeJS.Timeout | null = null;
    if (breathingActive) {
      breathingInterval = setInterval(() => {
        setBreathingSecs(prev => {
          if (prev <= 1) {
            // Transition phases in circle
            setBreathingPhase(current => {
              if (current === 'Inhale (Puraka)') {
                playHarmonySound(440, 1.0); // A4
                return 'Hold (Kumbhaka)';
              } else if (current === 'Hold (Kumbhaka)') {
                playHarmonySound(392, 1.0); // G4
                return 'Exhale (Rechaka)';
              } else {
                playHarmonySound(528, 1.5); // 528hz Solfeggio frequency
                return 'Inhale (Puraka)';
              }
            });
            return maxPhaseSeconds;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (breathingInterval) clearInterval(breathingInterval); };
  }, [breathingActive]);

  // Hydration periodic bell
  useEffect(() => {
    let tracker: NodeJS.Timeout | null = null;
    if (hydrationBellEnabled) {
      tracker = setInterval(() => {
        setHydrationTimeLeft(prev => {
          if (prev <= 1) {
            playHarmonySound(784, 3.0); // G5 crystal clear chime code
            setShowHydrationAlert(true);
            setTimeout(() => setShowHydrationAlert(false), 8000);
            return hydrationBellIntervalSecs;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (tracker) clearInterval(tracker); };
  }, [hydrationBellEnabled, hydrationBellIntervalSecs]);

  // Mock Workspace data loader when offline / not signed in
  const loadMockWorkspaceData = () => {
    setGoogleEvents([
      { id: 'me1', summary: '🇮🇳 Morning Meditation & Yogic Breathing', start: { dateTime: '2026-06-20T05:00:00+05:30' }, description: 'Pranayama and deep lungs expansion before sunrise' },
      { id: 'me2', summary: '💼 Standup: Indian Tech Team Sync', start: { dateTime: '2026-06-20T09:30:00+05:30' }, description: 'Checking Jira sprints and backlog tickets' },
      { id: 'me3', summary: '🗣️ Client Pitch: Bangalore EdTech Client', start: { dateTime: '2026-06-20T15:00:00+05:30' }, description: 'Reviewing next-gen LLM modules roadmap' }
    ]);

    setGoogleTasks([
      { id: 'mt1', title: 'Buy high-quality copper vessel for Ayurvedic water infusion', status: 'needsAction' },
      { id: 'mt2', title: 'Complete high priority STAR resume logs for Senior IT role', status: 'completed' },
      { id: 'mt3', title: 'Schedule weekly general health checkup session', status: 'needsAction' }
    ]);
  };

  // Google APIs Fetcher
  const fetchGoogleData = async (token: string, user: any) => {
    if (token === 'mock-google-oauth-access-token-sandbox-mode') {
      loadMockWorkspaceData();
      return;
    }

    setLoadingGoogle(true);
    setSyncStatus('Fetching real-time Google API indexes...');
    
    try {
      // 1. Fetch Calendar list
      const calendarResponse = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${new Date().toISOString()}&maxResults=10&orderBy=startTime&singleEvents=true`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      const calData = await calendarResponse.json();
      if (calData.items) {
        setGoogleEvents(calData.items.map((item: any) => ({
          id: item.id || Math.random().toString(),
          summary: item.summary || 'Unspecified Event',
          start: item.start || { date: new Date().toISOString() },
          description: item.description || ''
        })));
      }

      // 2. Fetch Tasks list
      const tasksResponse = await fetch(
        'https://www.googleapis.com/tasks/v1/users/@me/lists',
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const listsData = await tasksResponse.json();
      
      if (listsData.items && listsData.items.length > 0) {
        // Fetch tasks of primary list
        const primaryListId = listsData.items[0].id;
        const taskItemsResponse = await fetch(
          `https://www.googleapis.com/tasks/v1/lists/${primaryListId}/tasks?maxResults=15`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        const taskItemsData = await taskItemsResponse.json();
        if (taskItemsData.items) {
          setGoogleTasks(taskItemsData.items.map((item: any) => ({
            id: item.id || Math.random().toString(),
            title: item.title || 'Blank Task',
            notes: item.notes || '',
            status: item.status || 'needsAction'
          })));
        }
      }
      setSyncStatus('Real Google Workspace Connected');
    } catch (err: any) {
      console.warn("Could not query Google REST APIs, activating robust mock fallback state:", err);
      setSyncStatus('Sync Mock Fallback');
      loadMockWorkspaceData();
    } finally {
      setLoadingGoogle(false);
    }
  };

  // Google Login click
  const handleGoogleLogin = async () => {
    setLoadingGoogle(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setGoogleToken(res.accessToken);
        setNeedsAuth(false);
        setSyncStatus('Sync Session Connected Successfully');
        fetchGoogleData(res.accessToken, res.user);
      }
    } catch (err) {
      console.error(err);
      setSyncStatus('Sync Connection Error');
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleGoogleLogout = async () => {
    await logout();
    setGoogleUser(null);
    setGoogleToken(null);
    setNeedsAuth(true);
    setSyncStatus('Sign Out Recorded');
    loadMockWorkspaceData();
  };

  // Add Google Calendar Event
  const handleAddCalendarEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCalTitle.trim()) return;

    const startDateTime = `${newCalDate}T${newCalTime}:00+05:30`; // Local IST conversion
    const endDateTime = `${newCalDate}T${String(Number(newCalTime.split(':')[0]) + 1).padStart(2, '0')}:${newCalTime.split(':')[1]}:00+05:30`;

    const newEventObj = {
      summary: newCalTitle.trim(),
      start: { dateTime: startDateTime, timeZone: 'Asia/Kolkata' },
      end: { dateTime: endDateTime, timeZone: 'Asia/Kolkata' },
      description: 'Logged via ShivAI India Coach Executive Dashboard'
    };

    // Confirm dialog (Security validation guideline)
    const confirmed = window.confirm(`Post event "${newCalTitle.trim()}" directly to Google Calendar?`);
    if (!confirmed) return;

    if (!googleToken || googleToken === 'mock-google-oauth-access-token-sandbox-mode') {
      // Mock append local state
      const mockEv: GoogleEvent = {
        id: Math.random().toString(),
        summary: newCalTitle.trim(),
        start: { dateTime: startDateTime },
        description: 'Mock Local event synced'
      };
      setGoogleEvents([mockEv, ...googleEvents]);
      setNewCalTitle('');
      playHarmonySound(528, 1.5);
      return;
    }

    try {
      const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${googleToken}`
        },
        body: JSON.stringify(newEventObj)
      });
      if (res.ok) {
        setNewCalTitle('');
        playHarmonySound(528, 1.5);
        fetchGoogleData(googleToken, googleUser);
      } else {
        console.warn("Event added locally as a backup.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add Google Task
  const handleAddGoogleTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    if (!googleToken || googleToken === 'mock-google-oauth-access-token-sandbox-mode') {
      const mockT: GoogleTask = {
        id: Math.random().toString(),
        title: newTaskTitle.trim(),
        status: 'needsAction'
      };
      setGoogleTasks([mockT, ...googleTasks]);
      setNewTaskTitle('');
      playHarmonySound(528, 1.5);
      return;
    }

    try {
      const listRes = await fetch('https://www.googleapis.com/tasks/v1/users/@me/lists', {
        headers: { Authorization: `Bearer ${googleToken}` }
      });
      const listData = await listRes.json();
      if (listData.items && listData.items.length > 0) {
        const primaryListId = listData.items[0].id;
        const res = await fetch(`https://www.googleapis.com/tasks/v1/lists/${primaryListId}/tasks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${googleToken}`
          },
          body: JSON.stringify({ title: newTaskTitle.trim() })
        });
        if (res.ok) {
          setNewTaskTitle('');
          playHarmonySound(528, 1.5);
          fetchGoogleData(googleToken, googleUser);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Google Item Delete triggers
  const handleDeleteEventLocally = (id: string, name: string) => {
    const confirmation = window.confirm(`Remove event "${name}" from this viewing schedule logs?`);
    if (!confirmation) return;
    setGoogleEvents(googleEvents.filter(e => e.id !== id));
    playHarmonySound(330, 0.5);
  };

  const handleToggleTaskLocally = (id: string) => {
    setGoogleTasks(googleTasks.map(t => t.id === id ? { ...t, status: t.status === 'completed' ? 'needsAction' : 'completed' } : t));
    playHarmonySound(528, 0.2);
  };

  // Custom schedule slot operations
  const handleAddSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlotTime || !newSlotName) return;
    const newSl = {
      id: Math.random().toString(),
      time: newSlotTime,
      name: newSlotName,
      desc: newSlotDesc || 'General daily agenda point',
      active: false,
      tag: 'Custom IST'
    };
    setSlots([...slots, newSl]);
    setNewSlotTime('');
    setNewSlotName('');
    setNewSlotDesc('');
  };

  const handleRemoveSlot = (id: string) => {
    setSlots(slots.filter(s => s.id !== id));
  };

  const toggleSlotActive = (id: string) => {
    setSlots(slots.map(s => {
      if (s.id === id) {
        const nextState = !s.active;
        if (nextState) playHarmonySound(440, 1.0); // signal active slot
        return { ...s, active: nextState };
      }
      return { ...s, active: false }; // deactivate others for standard single timeline
    }));
  };

  // Timer helpers
  const formatTimeSeconds = (s: number) => {
    const min = Math.floor(s / 60);
    const secs = s % 60;
    return `${min}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 animate-fade-in text-slate-100">
      
      {/* ⚠️ Dynamic periodic water bell container */}
      {showHydrationAlert && (
        <div className="xl:col-span-12 p-4 rounded-2xl bg-indigo-950 border-2 border-indigo-500 text-indigo-100 flex items-center justify-between gap-4 animate-flash-gold z-50">
          <div className="flex items-center gap-3">
            <Bell className="w-8 h-8 text-indigo-400 animate-bounce" />
            <div>
              <h4 className="text-sm font-bold font-sans">🧘 Traditional Ayurvedic Hydration Reminder</h4>
              <p className="text-xs text-slate-350 mt-1">Drink a copper vessel volume of pure structured water right now to boost your metabolic energy levels!</p>
            </div>
          </div>
          <button 
            onClick={() => setShowHydrationAlert(false)}
            className="px-3 py-1 bg-indigo-900 border border-indigo-700 rounded-lg text-xs"
          >
            Acknowledge Bel
          </button>
        </div>
      )}

      {/* LEFT COLUMN: Google Workspace Sync Center & Indian Localization (5 Span) */}
      <div className="xl:col-span-5 space-y-6">
        
        {/* Google Cloud API Sync Control Cabinet */}
        <div className="p-6 rounded-3xl border border-slate-900 bg-slate-950/40 backdrop-blur-md space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-2xs font-semibold text-emerald-400 uppercase tracking-widest bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-990/30">
                {syncStatus}
              </span>
              <h3 className="text-xl font-sans font-bold text-white mt-3">Google Workspace Sync</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Connect your workspace account to display, log, and sync Calendar events and Tasks directly.
              </p>
            </div>
            <div className={`p-2 rounded-full ${needsAuth ? 'bg-slate-900 text-slate-500' : 'bg-emerald-500/10 text-emerald-400 animate-pulse'}`}>
              <Activity className="w-5 h-5" />
            </div>
          </div>

          {/* Sign In button or signed in user metrics */}
          {needsAuth ? (
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-850 space-y-3">
              <p className="text-center text-xs text-slate-400 leading-relaxed font-sans">
                You are currently running in **Offline Local Sandbox**. Connect Google to activate live rest integrations.
              </p>
              
              <button 
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-slate-100 text-slate-900 font-sans font-semibold rounded-xl text-xs transition-all duration-200 cursor-pointer shadow-md shadow-white/5 active:scale-[0.98]"
              >
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4 shrink-0">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                </svg>
                <span>Authorize &amp; Sync Google Account</span>
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-900/30 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img 
                  src={googleUser?.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&h=50'} 
                  alt="Avatar" 
                  className="w-10 h-10 rounded-full border border-indigo-500/20"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-white block truncate">{googleUser?.displayName}</span>
                  <span className="text-4xs text-emerald-400 block font-mono mt-0.5">● SYNCHRONIZED READY</span>
                </div>
              </div>
              <button 
                onClick={handleGoogleLogout}
                className="p-1 px-2 bg-slate-900 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded text-3xs border border-slate-800 flex items-center gap-1 cursor-pointer"
              >
                <Power className="w-3" />
                <span>Disconnect</span>
              </button>
            </div>
          )}
        </div>

        {/* Indian Localization & Currencies Controller */}
        <div className="p-6 rounded-3xl border border-slate-900 bg-slate-950/40 backdrop-blur-md space-y-6">
          <div>
            <h4 className="text-sm font-sans font-bold text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-orange-400" />
              <span>India Localization Portal</span>
            </h4>
            <p className="text-3xs text-slate-400 mt-1">Configure global display matrices for Rupee values (₹) and Indian routine parameters.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => onUpdateCurrency('INR')}
              className={`p-4 rounded-2xl border transition text-left cursor-pointer ${
                currency === 'INR'
                  ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                  : 'bg-slate-900/40 border-slate-850 hover:bg-slate-900'
              }`}
            >
              <span className="text-2xs uppercase text-slate-500 block font-bold">Standard Indian</span>
              <span className="text-xl font-bold font-sans block mt-1">₹ Rupee (INR)</span>
              <p className="text-4xs text-slate-500 leading-tight mt-0.5">Configure transactions, daily budgets, and outflows to (₹) parameters.</p>
            </button>

            <button
              onClick={() => onUpdateCurrency('USD')}
              className={`p-4 rounded-2xl border transition text-left cursor-pointer ${
                currency === 'USD'
                  ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                  : 'bg-slate-900/40 border-slate-850 hover:bg-slate-900'
              }`}
            >
              <span className="text-2xs uppercase text-slate-500 block font-bold">Standard Global</span>
              <span className="text-xl font-bold font-sans block mt-1">$ Dollar (USD)</span>
              <p className="text-4xs text-slate-500 leading-tight mt-0.5">Use default federal benchmark currency for passive reports.</p>
            </button>
          </div>

          {/* Hydration / Water Reminder Bell Interval config */}
          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-cyan-400" />
                <span>Water Reminder Bell</span>
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={hydrationBellEnabled} 
                  onChange={(e) => {
                    setHydrationBellEnabled(e.target.checked);
                    if (e.target.checked) {
                      setHydrationTimeLeft(hydrationBellIntervalSecs);
                      playHarmonySound(528, 1.0);
                    }
                  }} 
                  className="sr-only peer" 
                />
                <div className="w-8 h-4 bg-slate-800 rounded-full peer peer-focus:ring-0 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-cyan-500 peer-checked:after:bg-white"></div>
              </label>
            </div>

            {hydrationBellEnabled && (
              <div className="space-y-2 animate-fade-in text-xs">
                <div className="flex justify-between text-3xs text-slate-400">
                  <span>Chime Every 30 Min</span>
                  <span className="font-mono text-cyan-400">Next ring: {formatTimeSeconds(hydrationTimeLeft)}</span>
                </div>
                <input
                  type="range"
                  min={600}
                  max={7200}
                  step={600}
                  value={hydrationBellIntervalSecs}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setHydrationBellIntervalSecs(val);
                    setHydrationTimeLeft(val);
                  }}
                  className="w-full h-1 accent-cyan-400 bg-slate-950 rounded-lg cursor-pointer"
                />
              </div>
            )}
          </div>
        </div>

        {/* Indian Holiday Context Cards */}
        <div className="p-6 rounded-3xl border border-slate-900 bg-slate-950/40 backdrop-blur-md space-y-4">
          <div>
            <span className="text-3xs uppercase tracking-wider text-slate-500 font-bold block">Festive Calendar</span>
            <h4 className="text-sm font-sans font-bold text-white mt-1">🇮🇳 Indian National &amp; Cultural Holidays</h4>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {INDIAN_HOLIDAYS_2026.map((hol, i) => (
              <div key={i} className="p-3 rounded-xl bg-slate-900/40 border border-slate-850 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold block text-slate-100">{hol.name}</span>
                  <span className="text-4xs text-orange-400">{hol.type}</span>
                </div>
                <span className="text-3s text-slate-400 font-mono italic shrink-0">{hol.date}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: Interactive Work Schedule Slots Timer, Pranayama Circular breathing guide, and Workspace Events/Tasks view (7 Span) */}
      <div className="xl:col-span-7 space-y-6">

        {/* Work schedule slot reminder timeline */}
        <div className="p-6 rounded-3xl border border-slate-900 bg-slate-950/40 backdrop-blur-md space-y-6">
          <div className="flex justify-between items-center whitespace-pre-wrap">
            <div>
              <span className="text-2xs font-semibold text-orange-400 uppercase tracking-widest bg-orange-950/40 px-2 py-0.5 rounded border border-orange-990/30">
                Hourly Timeline
              </span>
              <h3 className="text-xl font-sans font-bold text-white mt-3">Time-to-Time Routine Planner</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Configure routine intervals. Single-clock highlights system alarms and visual cues.
              </p>
            </div>
            
            {/* Real-time system IST clock */}
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-right">
              <span className="text-4xs text-orange-400 uppercase font-bold block">IST timezone</span>
              <span className="text-sm font-bold font-mono text-white">
                {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Kolkata' })}
              </span>
            </div>
          </div>

          {/* Slots visual stack */}
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {slots.map((sl) => (
              <div 
                key={sl.id}
                className={`p-4 rounded-2xl border transition duration-150 ${
                  sl.active 
                    ? 'bg-orange-500/15 border-orange-500 shadow-[0_4px_16px_rgba(249,115,22,0.1)]' 
                    : 'bg-slate-900/30 border-slate-850 hover:border-slate-800'
                }`}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                      onClick={() => toggleSlotActive(sl.id)}
                      className={`p-2 rounded-xl mt-0.5 transition shrink-0 ${
                        sl.active 
                          ? 'bg-orange-500 text-white animate-pulse' 
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Clock className="w-4 h-4" />
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-100 font-mono shrink-0">{sl.time}</span>
                        <span className={`px-1.5 py-0.2 text-4xs font-bold rounded ${
                          sl.tag === 'Ayurvedic' ? 'bg-emerald-900/40 text-emerald-400' :
                          sl.tag === 'Professional' ? 'bg-indigo-900/40 text-indigo-400' : 'bg-slate-800 text-slate-400'
                        }`}>{sl.tag}</span>
                      </div>
                      <span className="text-sm font-semibold tracking-tight text-white block mt-1 truncate">{sl.name}</span>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed font-sans">{sl.desc}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => toggleSlotActive(sl.id)}
                      className={`text-2xs font-bold px-2.5 py-1 rounded-lg transition border cursor-pointer uppercase ${
                        sl.active 
                          ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' 
                          : 'text-slate-500 hover:text-slate-300 border-transparent'
                      }`}
                    >
                      {sl.active ? 'Armed' : 'Arm Chime'}
                    </button>
                    {slots.length > 3 && (
                      <button
                        onClick={() => handleRemoveSlot(sl.id)}
                        className="text-slate-650 text-slate-500 hover:text-rose-400 hover:-translate-y-0.5 transition cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Slot add form */}
          <form onSubmit={handleAddSlot} className="p-4 rounded-2xl bg-slate-900/50 border border-slate-850 flex flex-col sm:flex-row gap-3">
            <input 
              type="text" 
              placeholder="e.g. 17:00 - 18:00"
              value={newSlotTime}
              onChange={(e) => setNewSlotTime(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-550 flex-1 min-w-0" 
              required
            />
            <input 
              type="text" 
              placeholder="Custom Slot Name"
              value={newSlotName}
              onChange={(e) => setNewSlotName(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-550 flex-1 min-w-0" 
              required
            />
            <button 
              type="submit"
              className="px-4 py-2 bg-slate-800 hover:bg-orange-500 hover:text-white transition rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer"
            >
              Add Slot
            </button>
          </form>
        </div>

        {/* Double Dashboard visualizer splits: 10m Masala Chai Break Timer & Pranayama Breathing Circle */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Left Split Box: 10m Masala Chai Bell Timer */}
          <div className="p-6 rounded-3xl border border-slate-900 bg-slate-950/40 backdrop-blur-md flex flex-col justify-between gap-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-3xs uppercase text-slate-500 font-bold tracking-wider">Detox Clock</span>
                <Coffee className="w-5 h-5 text-amber-400" />
              </div>
              <h4 className="text-base font-bold font-sans text-white">Chai Power Session Break</h4>
              <p className="text-3xs text-slate-400 leading-relaxed font-sans">
                Set a 10-minute visual alarm. Sit comfortably away from screen radiation with hot local brew.
              </p>
            </div>

            {chaiBrewedNotify && (
              <div className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[11px] leading-relaxed font-sans flex justify-between items-start gap-2 animate-fade-in">
                <span>{chaiBrewedNotify}</span>
                <button type="button" onClick={() => setChaiBrewedNotify(null)} className="font-bold text-xs shrink-0 cursor-pointer text-orange-300">✓</button>
              </div>
            )}

            {/* Micro Timer presentation */}
            <div className="text-center py-6">
              <span className="text-4xl font-mono font-bold tracking-widest text-orange-400 block">{formatTimeSeconds(chaiTimeLeft)}</span>
              <span className="text-5s text-slate-500 tracking-wider font-mono block mt-1 uppercase">Aromatic ${selectedChaiType} brewing</span>
            </div>

            {/* Controls */}
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2 text-3xs font-bold text-center">
                {(['masala', 'elaichi', 'ginger'] as const).map(ch => (
                  <button
                    key={ch}
                    onClick={() => setSelectedChaiType(ch)}
                    className={`py-1 rounded border transition ${
                      selectedChaiType === ch 
                        ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' 
                        : 'bg-slate-900/60 border-slate-850 text-slate-400'
                    }`}
                  >
                    {ch.toUpperCase()}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setChaiTimerActive(!chaiTimerActive);
                    playHarmonySound(528, 1.0);
                  }}
                  className={`flex-1 py-2.5 rounded-xl font-semibold text-xs transition flex justify-center items-center gap-1.5 cursor-pointer ${
                    chaiTimerActive 
                      ? 'bg-rose-500 text-white' 
                      : 'bg-orange-500 text-white'
                  }`}
                >
                  {chaiTimerActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{chaiTimerActive ? 'Hold Steam' : 'Start Chai Steeper'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setChaiTimerActive(false);
                    setChaiTimeLeft(600);
                  }}
                  className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Split Box: Yoga Pranayama breathing guide */}
          <div className="p-6 rounded-3xl border border-slate-900 bg-slate-950/40 backdrop-blur-md flex flex-col justify-between gap-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-3xs uppercase text-slate-500 font-bold tracking-wider">Ayurvedic Prana</span>
                <Moon className="w-5 h-5 text-indigo-400" />
              </div>
              <h4 className="text-base font-bold font-sans text-white">Yogic Breath (Pranayama)</h4>
              <p className="text-3xs text-slate-400 leading-relaxed font-sans">
                Follow the 4s-4s-4s rhythmic "Sama Vritti" circle loop. Lowers blood pressure levels immediately.
              </p>
            </div>

            {/* Circular breath ring */}
            <div className="flex flex-col items-center justify-center py-2">
              <div className={`w-24 h-24 rounded-full border-4 flex flex-col items-center justify-center transition-all duration-1000 ${
                !breathingActive ? 'border-indigo-900' :
                breathingPhase === 'Inhale (Puraka)' ? 'border-emerald-500 bg-emerald-500/5 scale-110' :
                breathingPhase === 'Hold (Kumbhaka)' ? 'border-amber-500 bg-amber-500/5 scale-105' :
                'border-cyan-500 bg-cyan-500/5 scale-95'
              }`}>
                <span className="text-xl font-bold text-white font-mono">{breathingSecs}s</span>
              </div>
              <span className="text-2xs font-semibold tracking-wider font-sans text-white uppercase text-center mt-3 h-4 block">
                {breathingActive ? breathingPhase : 'Breathing idle'}
              </span>
            </div>

            {/* Breathe button helper */}
            <button
              onClick={() => {
                setBreathingActive(!breathingActive);
                setBreathingPhase('Inhale (Puraka)');
                setBreathingSecs(maxPhaseSeconds);
                playHarmonySound(528, 1.0);
              }}
              className={`w-full py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer flex justify-center items-center gap-1.5 ${
                breathingActive 
                  ? 'bg-rose-500 text-white' 
                  : 'bg-emerald-500 text-white shadow-[0_4px_12px_rgba(16,185,129,0.15)]'
              }`}
            >
              {breathingActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{breathingActive ? 'Stop Breath Coach' : 'Begin Pranayama Cycle'}</span>
            </button>
          </div>

        </div>

        {/* Double-Split Interactive lists: Unified Google Calendar events panel & Tasks planner */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Left Box: Google Calendar scheduler */}
          <div className="p-6 rounded-3xl border border-slate-900 bg-slate-950/40 backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-3xs uppercase tracking-wider text-slate-500 font-bold block flex items-center gap-1">
                <CalendarIcon className="w-3.5 h-3.5 text-indigo-400" />
                <span>Google Calendar Sync</span>
              </span>
              <span className="text-4xs text-slate-500 italic block font-mono">10 records max</span>
            </div>

            {/* List Events */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {googleEvents.length === 0 ? (
                <p className="text-slate-550 text-3xs italic py-6 text-center">No upcoming workspace events referenced from calendar.</p>
              ) : (
                googleEvents.map((ev) => {
                  const evDate = ev.start?.dateTime || ev.start?.date || '';
                  const formattedEvDate = evDate ? new Date(evDate).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'All-day';
                  return (
                    <div 
                      key={ev.id}
                      className="p-3 rounded-xl bg-slate-900/40 border border-slate-850 hover:border-slate-800 transition flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-slate-205 text-slate-200 font-semibold block truncate leading-tight">{ev.summary}</span>
                        <span className="text-slate-500 text-3xs block mt-0.5">{formattedEvDate}</span>
                      </div>
                      <button 
                        onClick={() => handleDeleteEventLocally(ev.id, ev.summary)}
                        className="text-slate-500 hover:text-red-400 transition cursor-pointer"
                        title="Delete event locally"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Add calendar event form */}
            <form onSubmit={handleAddCalendarEvent} className="p-3 bg-slate-900/40 rounded-2xl border border-slate-850 space-y-2">
              <input 
                type="text" 
                placeholder="New Google Calendar Event" 
                value={newCalTitle}
                onChange={(e) => setNewCalTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-2xs text-white placeholder:text-slate-550 focus:outline-none"
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <input 
                  type="date" 
                  value={newCalDate}
                  onChange={(e) => setNewCalDate(e.target.value)}
                  className="px-2 py-1.5 rounded bg-slate-950 border border-slate-800 text-3xs text-slate-300 focus:outline-none"
                  required
                />
                <input 
                  type="time" 
                  value={newCalTime}
                  onChange={(e) => setNewCalTime(e.target.value)}
                  className="px-2 py-1.5 rounded bg-slate-950 border border-slate-800 text-3xs text-slate-300 focus:outline-none"
                  required
                />
              </div>
              <button 
                type="submit"
                className="w-full py-1.5 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-550 hover:text-white transition rounded-lg text-3xs font-semibold cursor-pointer border border-indigo-900/20"
              >
                Sync with Calendar Portal
              </button>
            </form>
          </div>

          {/* Right Box: Google Tasks controller */}
          <div className="p-6 rounded-3xl border border-slate-900 bg-slate-950/40 backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-3xs uppercase tracking-wider text-slate-500 font-bold block flex items-center gap-1">
                <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>Google Tasks Sync</span>
              </span>
              <span className="text-4xs text-slate-500 italic block font-mono">Workspace Sync</span>
            </div>

            {/* Tasks list */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {googleTasks.length === 0 ? (
                <p className="text-slate-550 text-3xs italic py-6 text-center">No tasks listed in linked Google Workspace lists.</p>
              ) : (
                googleTasks.map((t) => (
                  <div 
                    key={t.id}
                    className={`p-3 rounded-xl bg-slate-900/40 border border-slate-850 hover:border-slate-800 transition flex items-center justify-between gap-3 text-xs ${
                      t.status === 'completed' ? 'opacity-50 line-through' : ''
                    }`}
                  >
                    <div className="min-w-0 flex-1 flex items-center gap-2">
                      <button
                        onClick={() => handleToggleTaskLocally(t.id)}
                        className="text-slate-500 hover:text-emerald-400 transition cursor-pointer"
                      >
                        {t.status === 'completed' ? (
                          <div className="w-4 h-4 rounded border border-emerald-500 bg-emerald-500/20 flex items-center justify-center">
                            <span className="text-3xs text-emerald-400 font-bold font-sans">✓</span>
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded border border-slate-700" />
                        )}
                      </button>
                      <span className="text-slate-205 text-slate-200 truncate font-semibold block">{t.title}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add Google Task form */}
            <form onSubmit={handleAddGoogleTask} className="p-3 bg-slate-900/40 rounded-2xl border border-slate-850 space-y-2">
              <input 
                type="text" 
                placeholder="New Google Task Title" 
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-2xs text-white placeholder:text-slate-550 focus:outline-none"
                required
              />
              <button 
                type="submit"
                className="w-full py-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition rounded-lg text-3xs font-semibold cursor-pointer border border-emerald-900/20"
              >
                Sync with Tasks Portal
              </button>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
}

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
  Power,
  Mail,
  Send,
  Loader2,
  Pin,
  Tag,
  Palette,
  FileText
} from 'lucide-react';
import { googleSignIn, logout, initAuth, db } from '../lib/firebase';
import { KeepNote } from '../types';

interface GoogleEmail {
  id: string;
  threadId: string;
  from: string;
  subject: string;
  date: string;
  snippet: string;
}

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
  const [googleEmails, setGoogleEmails] = useState<GoogleEmail[]>([]);
  const [newEmailTo, setNewEmailTo] = useState('');
  const [newEmailSubject, setNewEmailSubject] = useState('');
  const [newEmailBody, setNewEmailBody] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailStatusMessage, setEmailStatusMessage] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<string>('Sync Offline');

  // Google Keep states
  const [keepNotes, setKeepNotes] = useState<KeepNote[]>([]);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteColor, setNoteColor] = useState('#1e293b'); // default Google Keep dark slate-800 color (safe theme)
  const [noteLabelsInput, setNoteLabelsInput] = useState('');
  const [searchKeepQuery, setSearchKeepQuery] = useState('');
  const [tagToFilter, setTagToFilter] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

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
        fetchKeepNotesFromFirestore(user);
      },
      () => {
        setNeedsAuth(true);
        setGoogleUser(null);
        setGoogleToken(null);
        setSyncStatus('Offline Sandbox Mode');
        loadMockWorkspaceData();
        fetchKeepNotesFromFirestore(null);
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

    setGoogleEmails([
      {
        id: 'm1',
        threadId: 't1',
        from: 'Google Talent Bangalore <talent-india@google.com>',
        subject: 'Onsite Interview Rounds - Senior Frontend Architect Role',
        date: '2026-06-20T09:12:00Z',
        snippet: 'Hi Shivtej, we noticed your STAR portfolio resume. We would love to schedule 3 rounds of technical and system architecture deep-dives.'
      },
      {
        id: 'm2',
        threadId: 't2',
        from: 'Bangalore Founders Guild <hello@bangalorefounders.org>',
        subject: 'Tech Mixer & Investor Pitch Invite - Indiranagar',
        date: '2026-06-19T17:45:00Z',
        snippet: "Hey Shivtej! Join us tonight's round table on generative AI orchestration structures. 20 founders are discussing Cloud Spanner scalability."
      },
      {
        id: 'm3',
        threadId: 't3',
        from: 'JIO Healthcare Cloud Team <dev-support@jio.com>',
        subject: 'Pranayama App Beta Store Deploy Request',
        date: '2026-06-18T11:20:00Z',
        snippet: 'Beta build has been synced with internal clinical wellness pipelines. Please authorize API keys configuration to initiate end-to-end sandbox analysis.'
      }
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

      // 3. Fetch Gmail Latest Feed
      try {
        const gmailResponse = await fetch(
          'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5',
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        const gmailData = await gmailResponse.json();
        if (gmailData.messages && gmailData.messages.length > 0) {
          const emailDetails = await Promise.all(
            gmailData.messages.map(async (msg: any) => {
              try {
                const detailResponse = await fetch(
                  `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
                  {
                    headers: { Authorization: `Bearer ${token}` }
                  }
                );
                const detail = await detailResponse.json();
                const headers = detail.payload?.headers || [];
                const fromVal = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || 'Unknown Sender';
                const subjectVal = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || '(No Subject)';
                const dateVal = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value || '';
                return {
                  id: msg.id,
                  threadId: msg.threadId,
                  from: fromVal,
                  subject: subjectVal,
                  date: dateVal,
                  snippet: detail.snippet || ''
                };
              } catch (e) {
                return null;
              }
            })
          );
          setGoogleEmails(emailDetails.filter(email => email !== null) as GoogleEmail[]);
        } else {
          setGoogleEmails([]);
        }
      } catch (gmailErr) {
        console.warn("Could not query Gmail API. This is expected if scopes are missing or not fully approved.", gmailErr);
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
        fetchKeepNotesFromFirestore(res.user);
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
    // Re-load Keep Notes in sandbox offline preset mode
    getPresetKeepNotes();
  };

  // Pre-seed mock / default Keep Notes on startup
  const getPresetKeepNotes = () => {
    const presets: KeepNote[] = [
      {
        id: '1',
        title: '💡 Startup Tech Roadmap',
        content: 'Construct robust offline sync flows optimized for mobile cellular transits in metropolitan areas. Aim for highly responsive, lag-free micro-interactions using Tailwind transitions.',
        color: '#1e1b4b', // deep indigo
        isPinned: true,
        labels: ['Work', 'Tech'],
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        title: '🧘 Brahma Muhurta Sadhana Schedule',
        content: 'Wake up at 04:30 AM for active Pranayama breathing cycles and Vedic focus tuning. Standardize 4-4-4 Solfeggio frequency ratios before opening tech screens.',
        color: '#31102f', // deep grape
        isPinned: true,
        labels: ['Vedic', 'Wellness'],
        updatedAt: new Date().toISOString()
      },
      {
        id: '3',
        title: '🍃 Ayurvedic Tea Steeper Ingredients',
        content: 'Bring pure mineral water to boil. Slice organic ginger roots finely, bruise small cardamoms, and steep high-quality whole Darjeeling leaves. Strain before warm organic milk addition.',
        color: '#064e3b', // deep emerald
        isPinned: false,
        labels: ['Health', 'Life'],
        updatedAt: new Date().toISOString()
      }
    ];
    setKeepNotes(presets);
    localStorage.setItem('shiv_ai_keep_notes', JSON.stringify(presets));
  };

  // Sync / Save states to local state, localStorage, and Cloud Firestore
  const saveKeepNotes = async (updatedNotes: KeepNote[], currentUserObj = googleUser) => {
    setKeepNotes(updatedNotes);
    localStorage.setItem('shiv_ai_keep_notes', JSON.stringify(updatedNotes));

    if (currentUserObj && currentUserObj.uid && db) {
      try {
        const { doc, setDoc } = await import('firebase/firestore');
        const userStateDocRef = doc(db, 'user_states', currentUserObj.uid);
        await setDoc(userStateDocRef, {
          uid: currentUserObj.uid,
          keepNotes: updatedNotes,
          updatedAt: new Date().toISOString()
        }, { merge: true });
        console.log("🔥 Successfully authorized and synced Google Keep notes to Cloud Firestore.");
      } catch (err) {
        console.warn("Could not save Google Keep state to Cloud Firestore:", err);
      }
    }
  };

  // Fetch Keep notes from Cloud Firestore
  const fetchKeepNotesFromFirestore = async (currentUserObj: any) => {
    if (currentUserObj && currentUserObj.uid && db) {
      try {
        const { doc, getDoc } = await import('firebase/firestore');
        const userStateDocRef = doc(db, 'user_states', currentUserObj.uid);
        const docSnap = await getDoc(userStateDocRef);
        if (docSnap.exists()) {
          const cloudData = docSnap.data();
          if (cloudData && Array.isArray(cloudData.keepNotes)) {
            setKeepNotes(cloudData.keepNotes);
            localStorage.setItem('shiv_ai_keep_notes', JSON.stringify(cloudData.keepNotes));
            return;
          }
        }
      } catch (err) {
        console.warn("Could not load Google Keep state from Cloud Firestore:", err);
      }
    }

    // LocalStorage Fallback
    const stored = localStorage.getItem('shiv_ai_keep_notes');
    if (stored) {
      try {
        setKeepNotes(JSON.parse(stored));
      } catch (e) {
        getPresetKeepNotes();
      }
    } else {
      getPresetKeepNotes();
    }
  };

  // Keep note handlers
  const handleCreateOrUpdateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim() && !noteTitle.trim()) return;

    // Parse labels input comma-delimited
    const parsedLabels = noteLabelsInput
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    let updatedList: KeepNote[];

    if (editingNoteId) {
      // Update
      updatedList = keepNotes.map(n => n.id === editingNoteId ? {
        ...n,
        title: noteTitle.trim() || 'Untitled Note',
        content: noteContent.trim(),
        color: noteColor,
        labels: parsedLabels,
        updatedAt: new Date().toISOString()
      } : n);
      setEditingNoteId(null);
    } else {
      // Create
      const newNote: KeepNote = {
        id: Math.random().toString(36).substring(2, 11),
        title: noteTitle.trim() || 'Untitled Note',
        content: noteContent.trim(),
        color: noteColor,
        isPinned: false,
        labels: parsedLabels,
        updatedAt: new Date().toISOString()
      };
      updatedList = [newNote, ...keepNotes];
    }

    saveKeepNotes(updatedList);
    setNoteTitle('');
    setNoteContent('');
    setNoteLabelsInput('');
    setNoteColor('#1e293b');
    playHarmonySound(528, 0.4);
  };

  const handleTogglePinNote = (noteId: string) => {
    const updated = keepNotes.map(n => n.id === noteId ? { ...n, isPinned: !n.isPinned } : n);
    saveKeepNotes(updated);
    playHarmonySound(440, 0.2);
  };

  const handleDeleteKeepNote = (noteId: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this note?");
    if (!confirmDelete) return;
    const updated = keepNotes.filter(n => n.id !== noteId);
    saveKeepNotes(updated);
    playHarmonySound(330, 0.3);
  };

  const handleEditKeepNote = (note: KeepNote) => {
    setEditingNoteId(note.id);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setNoteLabelsInput(note.labels.join(', '));
    setNoteColor(note.color || '#1e293b');
    
    // Scroll composer into view smoothly
    const composerElement = document.getElementById('keep-composer-view');
    if (composerElement) {
      composerElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
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

  const handleSendGmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmailTo.trim() || !newEmailSubject.trim() || !newEmailBody.trim()) return;

    setSendingEmail(true);
    setEmailStatusMessage(null);

    const emailContent = `To: ${newEmailTo}\r\nSubject: ${newEmailSubject}\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${newEmailBody}`;
    
    // Safely encode to base64url compliance
    const encodedRaw = btoa(unescape(encodeURIComponent(emailContent)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    try {
      if (!googleToken || googleToken === 'mock-google-oauth-access-token-sandbox-mode') {
        // Mock success dispatch
        await new Promise(resolve => setTimeout(resolve, 800));
        const mockNewEmail: GoogleEmail = {
          id: Math.random().toString(),
          threadId: Math.random().toString(),
          from: `My Workspace <kanaseshivtej312@gmail.com>`,
          subject: newEmailSubject,
          date: new Date().toISOString(),
          snippet: newEmailBody
        };
        setGoogleEmails([mockNewEmail, ...googleEmails]);
        setNewEmailTo('');
        setNewEmailSubject('');
        setNewEmailBody('');
        setEmailStatusMessage('✓ Local sandbox email simulated successfully!');
        playHarmonySound(528, 1.5);
      } else {
        const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${googleToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ raw: encodedRaw })
        });

        if (!response.ok) {
          throw new Error('Gmail sending failed on remote portal api.');
        }

        setEmailStatusMessage('✓ Email sent successfully through Google Workspace!');
        setNewEmailTo('');
        setNewEmailSubject('');
        setNewEmailBody('');
        playHarmonySound(528, 1.5);

        // Refresh Gmail Feed
        fetchGoogleData(googleToken, googleUser);
      }
    } catch (err: any) {
      console.error(err);
      setEmailStatusMessage(`❌ Error: ${err.message || 'Transmission failed.'}`);
    } finally {
      setSendingEmail(false);
      setTimeout(() => setEmailStatusMessage(null), 5000);
    }
  };

  const handleDeleteEmailLocally = (id: string, subject: string) => {
    const confirmation = window.confirm(`Dismiss email "${subject}" from current inbox list?`);
    if (!confirmation) return;
    setGoogleEmails(googleEmails.filter(m => m.id !== id));
    playHarmonySound(330, 0.5);
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

        {/* Row 3: Gmail Workspace Center */}
        <div className="p-6 rounded-3xl border border-slate-900 bg-slate-950/40 backdrop-blur-md space-y-6 mt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
            <div>
              <span className="text-3xs uppercase tracking-wider text-slate-500 font-bold block flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-amber-400" />
                <span>Google Gmail Hub</span>
              </span>
              <p className="text-4xs text-slate-400 mt-1 leading-snug">
                Manage your executive pipeline. Draft or search client correspondence directly.
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wide uppercase ${
                googleToken ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-slate-900 text-slate-500'
              }`}>
                {googleToken ? 'Gmail Live API' : 'Sandbox Simulated'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Multi-Column: Gmail Live Inbox Feed */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-2xs font-bold text-white uppercase tracking-wider">Workspace Inbox</h4>
                <span className="text-4xs text-slate-500 font-mono italic">Showing {googleEmails.length} messages</span>
              </div>

              <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                {googleEmails.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-slate-900 rounded-2xl bg-slate-950/20">
                    <Mail className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                    <p className="text-slate-550 text-2xs italic">Your Workspace inbox feed is empty or initializing.</p>
                  </div>
                ) : (
                  googleEmails.map((email) => {
                    // Extract name from "Name <email>" format safely
                    const fromClean = email.from.replace(/<.*>/, '').trim() || email.from;
                    const fromEmailOnly = email.from.match(/<(.*)>/)?.[1] || '';
                    const dateFormatted = email.date ? new Date(email.date).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

                    return (
                      <div 
                        key={email.id}
                        className="p-3.5 rounded-2xl bg-slate-900/40 border border-slate-850 hover:border-slate-800 hover:bg-slate-900/60 transition group relative"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-200 group-hover:text-amber-400 transition truncate">{fromClean}</span>
                              {fromEmailOnly && (
                                <span className="text-[10px] text-slate-500 font-mono truncate hidden sm:inline">&lt;{fromEmailOnly}&gt;</span>
                              )}
                            </div>
                            <h5 className="text-2xs font-semibold text-white mt-1 leading-tight tracking-normal">{email.subject}</h5>
                            <p className="text-3xs text-slate-400 mt-1 lines-clamp-3 leading-relaxed font-sans">{email.snippet}</p>
                            <span className="text-4xs text-slate-500 font-mono block mt-2">{dateFormatted}</span>
                          </div>
                          
                          <button
                            onClick={() => handleDeleteEmailLocally(email.id, email.subject)}
                            className="p-1 rounded text-slate-600 hover:text-red-400 hover:bg-slate-905 transition shrink-0 cursor-pointer"
                            title="Dismiss email from view"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Multi-Column: Interactive Gmail Composer */}
            <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-900/20 border border-slate-850 space-y-4 font-sans">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-2xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Outbox Composer</span>
                </span>
                <span className="text-4xs text-slate-500 font-mono">OAuth Shielded</span>
              </div>

              <form onSubmit={handleSendGmail} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-4xs uppercase tracking-wider text-slate-550 font-bold block">To (Recipient Email)</label>
                  <input 
                    type="email" 
                    placeholder="e.g. coworker@company.com"
                    value={newEmailTo}
                    onChange={(e) => setNewEmailTo(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-2xs text-white placeholder:text-slate-650 focus:outline-none focus:border-indigo-500/50 transition font-sans"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-4xs uppercase tracking-wider text-slate-550 font-bold block">Subject Heading</label>
                  <input 
                    type="text" 
                    placeholder="Professional tech roadmap catchup..."
                    value={newEmailSubject}
                    onChange={(e) => setNewEmailSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-2xs text-white placeholder:text-slate-650 focus:outline-none focus:border-indigo-500/50 transition font-sans"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-4xs uppercase tracking-wider text-slate-550 font-bold block">Message Correspondence Body</label>
                  <textarea 
                    rows={4}
                    placeholder="Draft clean bulleted STAR executive updates here..."
                    value={newEmailBody}
                    onChange={(e) => setNewEmailBody(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-2xs text-white placeholder:text-slate-650 focus:outline-none focus:border-indigo-500/50 transition font-sans resize-none h-28"
                    required
                  />
                </div>

                {emailStatusMessage && (
                  <div className={`p-2.5 rounded-lg border text-4xs font-sans leading-snug animate-fade-in ${
                    emailStatusMessage.startsWith('❌') 
                      ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' 
                      : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  }`}>
                    {emailStatusMessage}
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={sendingEmail}
                  className="w-full py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-40 text-white font-bold rounded-xl text-3xs font-sans cursor-pointer flex items-center justify-center gap-1.5 transition shadow-[0_4px_15px_rgba(99,102,241,0.2)] disabled:cursor-not-allowed uppercase tracking-wider"
                >
                  {sendingEmail ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Transmitting via OAuth...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Transmit Message</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Row 4: Google Keep Workspace Hub */}
        <div className="p-6 rounded-3xl border border-slate-900 bg-slate-950/40 backdrop-blur-md space-y-6 mt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
            <div>
              <span className="text-3xs uppercase tracking-wider text-slate-500 font-bold block flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-amber-500" />
                <span>Google Keep Notes Center</span>
              </span>
              <p className="text-4xs text-slate-400 mt-1 leading-snug">
                Organize thoughts, pin strategic roadmaps, and tag atomic habits. Authorized Firestore auto-backup preserves note state securely.
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wide uppercase ${
                googleUser ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-900 text-slate-500'
              }`}>
                {googleUser ? 'Firestore Backup Active' : 'Sandbox Simulated'}
              </span>
            </div>
          </div>

          {/* Quick keep filter controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-950/20 p-4 rounded-2xl border border-slate-900">
            <div className="flex items-center gap-2 w-full sm:w-auto max-w-md">
              <span className="text-slate-550 shrink-0 select-none text-[10px]">🔍</span>
              <input 
                type="text" 
                placeholder="Search notes content..." 
                value={searchKeepQuery}
                onChange={(e) => setSearchKeepQuery(e.target.value)}
                className="w-full bg-transparent text-2xs text-white focus:outline-none placeholder:text-slate-650"
              />
              {searchKeepQuery && (
                <button onClick={() => setSearchKeepQuery('')} className="text-4xs text-indigo-400 hover:text-white cursor-pointer px-1">
                  Clear
                </button>
              )}
            </div>

            {/* Filter tags pill row */}
            <div className="flex items-center gap-1.5 flex-wrap overflow-x-auto">
              <span className="text-4xs text-slate-550 font-bold uppercase tracking-wider">Filter Label:</span>
              <button 
                onClick={() => setTagToFilter(null)}
                className={`px-2 py-0.5 rounded-full text-[10px] cursor-pointer transition ${
                  !tagToFilter ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-semibold' : 'bg-slate-900 text-slate-500 border border-transparent'
                }`}
              >
                All States
              </button>
              {Array.from(new Set(keepNotes.flatMap(n => n.labels || []))).map(lbl => (
                <button 
                  key={lbl}
                  onClick={() => setTagToFilter(lbl)}
                  className={`px-2 py-0.5 rounded-full text-[10px] transition cursor-pointer ${
                    tagToFilter === lbl ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 font-semibold' : 'bg-slate-900 hover:bg-slate-850 text-slate-400'
                  }`}
                >
                  #{lbl}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Note Composer Panel (Left, span 4) */}
            <div id="keep-composer-view" className="lg:col-span-4 p-5 rounded-2xl bg-slate-900/20 border border-slate-850 space-y-4 font-sans focus-within:border-slate-750 transition duration-300">
              <span className="text-2xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-amber-500" />
                <span>{editingNoteId ? 'Update Document' : 'Draft Keep Note'}</span>
              </span>

              <form onSubmit={handleCreateOrUpdateNote} className="space-y-3">
                <div className="space-y-1">
                  <input 
                    type="text" 
                    placeholder="Title Heading (optional)"
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-2xs text-white placeholder:text-slate-650 focus:outline-none focus:border-amber-500/30 transition font-sans font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <textarea 
                    rows={4}
                    placeholder="Take a note context..."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-2xs text-white placeholder:text-slate-650 focus:outline-none focus:border-amber-500/30 transition font-sans resize-none h-24"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-4xs uppercase tracking-wider text-slate-550 font-bold block">Tags / Labels (comma-separated)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Work, Wellness, Tech"
                    value={noteLabelsInput}
                    onChange={(e) => setNoteLabelsInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-white placeholder:text-slate-650 focus:outline-none transition font-sans font-mono"
                  />
                </div>

                {/* Color Chooser */}
                <div className="space-y-1">
                  <label className="text-4xs uppercase tracking-wider text-slate-550 font-bold block">Note Canvas Tone</label>
                  <div className="flex flex-wrap items-center gap-2 py-1">
                    {[
                      { hex: '#1e293b', name: 'Slate' },
                      { hex: '#1e1b4b', name: 'Indigo' },
                      { hex: '#064e3b', name: 'Emerald' },
                      { hex: '#31102f', name: 'Plum' },
                      { hex: '#7c2d12', name: 'Amber' },
                      { hex: '#450a0a', name: 'Crimson' }
                    ].map(col => (
                      <button
                        key={col.hex}
                        type="button"
                        onClick={() => setNoteColor(col.hex)}
                        title={col.name}
                        className={`w-5 h-5 rounded-full border transition hover:scale-110 cursor-pointer ${
                          noteColor === col.hex ? 'border-white scale-110 shadow-lg' : 'border-slate-800'
                        }`}
                        style={{ backgroundColor: col.hex }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button 
                    type="submit"
                    className="flex-1 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500 hover:text-slate-950 font-bold rounded-xl text-[10px] font-sans cursor-pointer flex items-center justify-center gap-1 transition uppercase tracking-wider"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{editingNoteId ? 'Update Keep' : 'Pin to Keep'}</span>
                  </button>
                  {editingNoteId && (
                    <button 
                      type="button"
                      onClick={() => {
                        setEditingNoteId(null);
                        setNoteTitle('');
                        setNoteContent('');
                        setNoteLabelsInput('');
                        setNoteColor('#1e293b');
                      }}
                      className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 font-bold rounded-xl text-[10px] cursor-pointer transition uppercase"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Note Grid View Panel (Right, span 8) */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-2xs font-bold text-white uppercase tracking-wider">Keep Notebook Items</h4>
                <div className="text-4xs text-slate-500 font-mono italic flex items-center gap-2">
                  <span>{keepNotes.filter(n => n.isPinned).length} pinned</span>
                  <span>•</span>
                  <span>{keepNotes.length} total</span>
                </div>
              </div>

              {/* Grid content */}
              {(() => {
                // Filter the list based on search term AND selected category
                const filtered = keepNotes.filter(n => {
                  const query = searchKeepQuery.toLowerCase().trim();
                  const matchesSearch = !query || 
                    n.title.toLowerCase().includes(query) || 
                    n.content.toLowerCase().includes(query) || 
                    (n.labels || []).some(l => l.toLowerCase().includes(query));
                  
                  const matchesTag = !tagToFilter || (n.labels || []).some(l => l.toLowerCase() === tagToFilter.toLowerCase());
                  
                  return matchesSearch && matchesTag;
                });

                // Segregate pinned and normal notes
                const pinnedNotes = filtered.filter(n => n.isPinned);
                const normalNotes = filtered.filter(n => !n.isPinned);

                if (filtered.length === 0) {
                  return (
                    <div className="text-center py-16 border border-dashed border-slate-900 rounded-2xl bg-slate-950/20">
                      <FileText className="w-10 h-10 text-slate-700 mx-auto mb-2" />
                      <p className="text-slate-550 text-2xs italic">No matching notes found inside your Google Keep cabinet.</p>
                      {tagToFilter || searchKeepQuery ? (
                        <button 
                          onClick={() => { setTagToFilter(null); setSearchKeepQuery(''); }}
                          className="mt-2 text-3xs text-indigo-400 hover:underline cursor-pointer"
                        >
                          Clear active search filters
                        </button>
                      ) : null}
                    </div>
                  );
                }

                return (
                  <div className="space-y-6 max-h-[480px] overflow-y-auto pr-1">
                    {/* Pinned section */}
                    {pinnedNotes.length > 0 && (
                      <div className="space-y-2.5">
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest block font-mono">Pinned</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {pinnedNotes.map((note) => (
                            <div 
                              key={note.id}
                              style={{ backgroundColor: note.color || '#1e293b' }}
                              className="p-4 rounded-2xl border border-white/5 shadow-md flex flex-col justify-between group relative transition duration-300 hover:border-white/10 hover:shadow-xl hover:-translate-y-0.5"
                            >
                              <div className="min-h-[100px]">
                                <div className="flex items-start justify-between gap-2 border-b border-white/5 pb-2 mb-2">
                                  <h5 className="text-[13px] font-bold text-white tracking-tight pr-5">{note.title}</h5>
                                  <button
                                    onClick={() => handleTogglePinNote(note.id)}
                                    className="absolute top-3.5 right-3.5 text-amber-400 hover:text-white transition cursor-pointer p-0.5"
                                    title="Unpin Note"
                                  >
                                    <Pin className="w-3.5 h-3.5 fill-amber-400" />
                                  </button>
                                </div>
                                <p className="text-2xs text-slate-200 mt-1.5 whitespace-pre-line leading-relaxed max-h-24 overflow-y-auto pr-1 font-sans">
                                  {note.content}
                                </p>
                              </div>

                              <div className="mt-4 pt-2.5 border-t border-white/10 flex flex-col gap-2">
                                {/* Label pills */}
                                {note.labels && note.labels.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {note.labels.map(lbl => (
                                      <span 
                                        key={lbl} 
                                        className="px-1.5 py-0.5 rounded text-[8px] bg-white/10 text-white font-mono hover:bg-white/25 transition cursor-pointer"
                                        onClick={() => setTagToFilter(lbl)}
                                      >
                                        #{lbl}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 pt-1">
                                  <span>{new Date(note.updatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                                  <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition duration-300">
                                    <button 
                                      onClick={() => handleEditKeepNote(note)}
                                      className="p-1 hover:bg-white/10 rounded transition cursor-pointer text-2xs" 
                                      title="Edit Note"
                                    >
                                      🖊️
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteKeepNote(note.id)}
                                      className="p-1 hover:bg-white/10 rounded transition cursor-pointer text-2xs" 
                                      title="Delete Note"
                                    >
                                      🗑️
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Unpinned section */}
                    {normalNotes.length > 0 && (
                      <div className="space-y-2.5">
                        {pinnedNotes.length > 0 && (
                          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest block font-mono pt-2">Others</span>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {normalNotes.map((note) => (
                            <div 
                              key={note.id}
                              style={{ backgroundColor: note.color || '#1e293b' }}
                              className="p-4 rounded-2xl border border-white/5 shadow-md flex flex-col justify-between group relative transition duration-300 hover:border-white/10 hover:shadow-xl hover:-translate-y-0.5"
                            >
                              <div className="min-h-[100px]">
                                <div className="flex items-start justify-between gap-2 border-b border-white/5 pb-2 mb-2">
                                  <h5 className="text-[13px] font-bold text-white tracking-tight pr-5">{note.title}</h5>
                                  <button
                                    onClick={() => handleTogglePinNote(note.id)}
                                    className="absolute top-3.5 right-3.5 text-slate-400 hover:text-white transition cursor-pointer p-0.5"
                                    title="Pin Note"
                                  >
                                    <Pin className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <p className="text-2xs text-slate-200 mt-1.5 whitespace-pre-line leading-relaxed max-h-24 overflow-y-auto pr-1 font-sans">
                                  {note.content}
                                </p>
                              </div>

                              <div className="mt-4 pt-2.5 border-t border-white/10 flex flex-col gap-2">
                                {/* Label pills */}
                                {note.labels && note.labels.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {note.labels.map(lbl => (
                                      <span 
                                        key={lbl} 
                                        className="px-1.5 py-0.5 rounded text-[8px] bg-white/10 text-white font-mono hover:bg-white/25 transition cursor-pointer"
                                        onClick={() => setTagToFilter(lbl)}
                                      >
                                        #{lbl}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 pt-1">
                                  <span>{new Date(note.updatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                                  <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition duration-300">
                                    <button 
                                      onClick={() => handleEditKeepNote(note)}
                                      className="p-1 hover:bg-white/10 rounded transition cursor-pointer text-2xs" 
                                      title="Edit Note"
                                    >
                                      🖊️
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteKeepNote(note.id)}
                                      className="p-1 hover:bg-white/10 rounded transition cursor-pointer text-2xs" 
                                      title="Delete Note"
                                    >
                                      🗑️
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

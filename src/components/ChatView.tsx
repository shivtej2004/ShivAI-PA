import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  Mic, 
  MicOff, 
  Save, 
  Volume2, 
  VolumeX, 
  ArrowRight, 
  Cpu, 
  Loader2 
} from 'lucide-react';
import { ChatMessage } from '../types';

interface ChatViewProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  loading: boolean;
  onClearHistory: () => void;
}

const PRESET_PROMPTS = [
  { label: "🌅 Morning Ritual Planner", text: "Design a high-productivity 30-minute morning schedule to maximize my focus." },
  { label: "💼 Professional Resume Boost", text: "Help me optimize my resume bullet point: 'Managed web projects and did styling changes.'" },
  { label: "🏃 Quick HIIT Routine", text: "Give me a robust 12-minute HIIT bodyweight athletic exercise routine." },
  { label: "💰 High-Rate Savings Formula", text: "Compose a strategic blueprint to save 20% on monthly food and restaurant budgets." }
];

export default function ChatView({
  messages,
  onSendMessage,
  loading,
  onClearHistory
}: ChatViewProps) {
  const [inputText, setInputText] = useState('');
  const [soundOutputEnabled, setSoundOutputEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const recognitionRef = useRef<any>(null);
  const lastProcessedMessageId = useRef<string | null>(null);

  // Auto-scroll to lowest message on layout changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event: any) => {
        const text = event.results[event.results.length - 1][0].transcript;
        if (text) {
          setInputText(prev => prev ? prev + ' ' + text.trim() : text.trim());
        }
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        if (event.error !== 'no-speech') {
          setIsListening(false);
        }
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // Handle Speech Synthesis (Read answer aloud if sound output is enabled)
  useEffect(() => {
    if (messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role === 'model' && lastMsg.id !== lastProcessedMessageId.current) {
      lastProcessedMessageId.current = lastMsg.id;
      if (soundOutputEnabled && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        
        // Strip markdown and emojis for clean speech pronunciation
        const cleanText = lastMsg.text
          .replace(/[\*\#\`\-\_]/g, '')
          .replace(/[🇮🇳💼🗣️🏃☕🧘]*/g, '')
          .trim();

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        // Match English voice if present
        const voices = window.speechSynthesis.getVoices();
        const idealVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
        if (idealVoice) {
          utterance.voice = idealVoice;
        }

        window.speechSynthesis.speak(utterance);
      }
    }
  }, [messages, soundOutputEnabled]);

  // If silent output is toggled off, immediately cancel speaking voices
  useEffect(() => {
    if (!soundOutputEnabled && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [soundOutputEnabled]);

  // Stop talking when user begins to speak/listen themselves
  useEffect(() => {
    if (isListening && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isListening]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || loading) return;
    triggerSendMessage(inputText.trim());
  };

  const triggerSendMessage = async (text: string) => {
    setInputText('');
    // Stop speaking immediately when a new message is sent
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    await onSendMessage(text);
  };

  const handlePresettedPrompt = (text: string) => {
    setInputText(text);
  };

  const toggleVoiceMode = () => {
    if (!recognitionRef.current) {
      // Robust Fallback Simulation Mode if Web Speech API isn't supported in browser/frame iframe
      const fallbackPrompt = "Hey Shiv, analyze my productivity stats and draft a brief coaching insight for today.";
      setInputText(prev => prev ? prev + ' ' + fallbackPrompt : fallbackPrompt);
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error("Failed to start speech recognition stream:", err);
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-210px)] max-h-[800px] animate-fade-in">
      
      {/* Saved shortcut prompts rail (Left Sidebar) */}
      <div className="lg:col-span-4 p-6 rounded-3xl border border-slate-900 bg-slate-900/10 backdrop-blur-md flex flex-col justify-between">
        <div className="space-y-6">
          <div>
            <span className="text-2xs font-semibold text-indigo-400 uppercase tracking-widest bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-900/30">
              Assisted Templates
            </span>
            <h3 className="text-xl font-sans font-bold text-white mt-3">Prompts Sandbox</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Accelerate your workflow. Tap any preset capsule to construct an executive Gemini instruction sequence.
            </p>
          </div>

          <div className="space-y-2">
            {PRESET_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handlePresettedPrompt(prompt.text)}
                className="w-full text-left p-3.5 rounded-2xl bg-slate-900/30 border border-slate-800/60 hover:bg-slate-900/70 hover:border-slate-700 transition group flex items-start space-x-2.5 cursor-pointer"
              >
                <div className="p-1 bg-indigo-500/10 rounded group-hover:bg-indigo-500/20 text-indigo-400 transition shrink-0 mt-0.5">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-200 block group-hover:text-indigo-300 transition">
                    {prompt.label}
                  </span>
                  <span className="text-3xs text-slate-500 block truncate max-w-[210px] sm:max-w-xs mt-0.5">
                    {prompt.text}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Audio feedback assistant control panel */}
        <div className="pt-6 border-t border-slate-900 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-300">Intelligent Voice Mode</p>
              <p className="text-3xs text-slate-500 mt-0.5">Text-to-speech output narration</p>
            </div>
            <button
              onClick={() => setSoundOutputEnabled(!soundOutputEnabled)}
              className={`p-2 rounded-xl border transition cursor-pointer ${
                soundOutputEnabled 
                  ? 'bg-purple-950/20 border-purple-800 text-purple-400' 
                  : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:text-slate-400'
              }`}
              title={soundOutputEnabled ? "Acoustic audio narration active" : "Audio narration muted"}
            >
              {soundOutputEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>

          {isSpeaking && (
            <div className="p-3 bg-purple-950/30 border border-purple-900/40 rounded-2xl flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
              </span>
              <div className="flex-1">
                <span className="text-2xs text-purple-400 font-semibold block uppercase tracking-wider">Shiv is Speaking</span>
                {/* Audio wave animation */}
                <div className="flex items-end gap-0.5 h-4 mt-1">
                  {[1, 2, 3, 2, 4, 1, 3, 2, 4, 2, 1, 3, 4, 2, 1].map((val, i) => (
                    <div 
                      key={i} 
                      className="bg-gradient-to-t from-purple-500 to-indigo-400 w-1 rounded-full animate-pulse"
                      style={{ 
                        height: `${val * 25}%`,
                        animationDelay: `${i * 100}ms`
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Primary chat workspace window (Right side) */}
      <div className="lg:col-span-8 p-6 rounded-3xl border border-slate-900 bg-slate-900/10 backdrop-blur-md flex flex-col justify-between overflow-hidden">
        
        {/* Chat header context bar */}
        <div className="pb-4 border-b border-slate-900/80 flex justify-between items-center shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-950/30 text-indigo-400 rounded-xl border border-indigo-500/10">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-semibold text-white block">Active Neural Conversator</span>
              <span className="text-3xs text-emerald-400 font-mono">⚡ Gemini Powered - Node Active</span>
            </div>
          </div>
          <button
            onClick={onClearHistory}
            className="text-3xs font-semibold uppercase tracking-wider text-slate-500 hover:text-red-400 transition cursor-pointer"
          >
            Clear History
          </button>
        </div>

        {/* Dynamic messages scroll area */}
        <div className="flex-1 overflow-y-auto py-6 space-y-4 pr-1">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col justify-center items-center text-center px-4 space-y-3">
              <div className="p-4 bg-indigo-950/10 rounded-full text-indigo-400 border border-indigo-900/10">
                <Sparkles className="w-8 h-8 opacity-60 animate-bounce" />
              </div>
              <h4 className="font-sans font-bold text-slate-200">Consult Shiv Neural Core</h4>
              <p className="text-xs text-slate-400 max-w-sm">
                Ask productivity schedules, wellness guidance, code, resume structures, or finance optimization advice. Speak with me!
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none shadow-md'
                      : 'bg-slate-900/60 border border-slate-800 text-slate-300 rounded-bl-none text-left'
                  }`}
                >
                  <p className="whitespace-pre-line font-sans">{msg.text}</p>
                  <span className="text-4xs text-slate-500 font-mono mt-1 block">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-900/60 border border-slate-800 text-slate-400 rounded-2xl rounded-bl-none px-4 py-3 text-sm flex items-center space-x-2.5">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                <span className="font-sans italic">Synthesizing Shiv's executive response...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input prompt entry console */}
        <form onSubmit={handleSubmit} className="pt-4 border-t border-slate-900 shrink-0 flex items-center gap-3">
          
          {/* Animated voice capture toggle button */}
          <button
            type="button"
            onClick={toggleVoiceMode}
            className={`p-3 rounded-2xl border transition cursor-pointer shrink-0 ${
              isListening 
                ? 'bg-rose-950/20 border-rose-800 text-rose-400 animate-pulse' 
                : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-300'
            }`}
            title="Toggle speech voice input"
          >
            {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isListening ? "Listening... Speak naturally or type here..." : "Query Shiv on plan strategy, routines, coaching rules..."}
            className="flex-1 px-4 py-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-500 font-sans focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || loading}
            className="p-3 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white transition hover:scale-105 shrink-0 cursor-pointer disabled:opacity-50 disabled:scale-100"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>

      </div>
    </div>
  );
}

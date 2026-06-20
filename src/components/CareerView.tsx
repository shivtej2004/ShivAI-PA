import React, { useState } from 'react';
import { 
  Sparkles, 
  FileText, 
  Award, 
  Cpu, 
  Loader2, 
  Copy, 
  Check, 
  CornerDownRight, 
  Mail,
  UserCheck
} from 'lucide-react';

export default function CareerView() {
  const [activeTab, setActiveTabTab] = useState<'resume' | 'interview' | 'email'>('resume');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Resume Improver inputs & stats
  const [weakBullet, setWeakBullet] = useState('Managed web projects and did styling changes.');
  const [resumeResults, setResumeResults] = useState<string>('');

  // Interview Guide fields
  const [jobTitle, setJobTitle] = useState('Full Stack Software Engineer');
  const [experienceContext, setExperienceContext] = useState('2 years of React/Node, looking to join a high-growth startup.');
  const [interviewGuide, setInterviewGuide] = useState<string>('');

  // Professional Email fields
  const [emailConcept, setEmailConcept] = useState('Follow up with hiring manager after 2nd round interview.');
  const [emailResult, setEmailResult] = useState<string>('');

  // Primary API execution node
  const handleCareerActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setCopied(false);
    
    let text = "";
    let context = "";
    
    if (activeTab === 'resume') {
      text = weakBullet;
    } else if (activeTab === 'interview') {
      text = jobTitle;
      context = experienceContext;
    } else {
      text = emailConcept;
    }

    try {
      const response = await fetch('/api/gemini/career', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: activeTab, text, context })
      });
      const data = await response.json();
      
      if (data.result) {
        if (activeTab === 'resume') setResumeResults(data.result);
        else if (activeTab === 'interview') setInterviewGuide(data.result);
        else setEmailResult(data.result);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
      
      {/* Tab Control Panel (Left Column) */}
      <div className="lg:col-span-4 p-6 rounded-3xl border border-slate-900 bg-slate-900/15 backdrop-blur-md flex flex-col justify-between">
        <div className="space-y-6">
          <div>
            <span className="text-2xs font-semibold text-indigo-400 uppercase tracking-widest bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-900/30">
              Executive Career Suite
            </span>
            <h3 className="text-2xl font-sans font-bold text-white mt-3">Career Accelerator</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Synthesize interview checklists, polished resume bullet options, or professional template drafts using smart AI suggestions.
            </p>
          </div>

          {/* Quick tab switchers */}
          <div className="space-y-2">
            {[
              { id: 'resume', label: 'Resume Bullet Optimizer', desc: 'Accelerate verb impact and metrics tracking', icon: FileText },
              { id: 'interview', label: 'STAR Interview Guides', desc: 'Generate target analytical case prompts', icon: UserCheck },
              { id: 'email', label: 'Email Content Drafts', desc: 'Structure professional corporate outreach', icon: Mail }
            ].map(tab => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTabTab(tab.id as any)}
                  className={`w-full text-left p-4 rounded-2xl border transition cursor-pointer flex items-start space-x-3 ${
                    activeTab === tab.id
                      ? 'bg-indigo-500/10 border-indigo-500/40'
                      : 'bg-slate-900/40 border-slate-800 hover:bg-slate-900 hover:border-slate-800'
                  }`}
                >
                  <div className={`p-2 rounded-xl mt-0.5 ${activeTab === tab.id ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-800 text-slate-400'}`}>
                    <TabIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className={`text-xs font-semibold block transition ${activeTab === tab.id ? 'text-indigo-400' : 'text-slate-350'}`}>
                      {tab.label}
                    </span>
                    <span className="text-4xs text-slate-500 block leading-tight mt-0.5">
                      {tab.desc}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Informative footer card */}
        <div className="pt-6 border-t border-slate-900 flex items-center space-x-2 bg-indigo-950/10 p-4 rounded-2xl border border-indigo-900/20">
          <Cpu className="w-4 h-4 text-indigo-400" />
          <p className="text-4xs text-slate-400 leading-relaxed font-sans italic">
            Shiv leverages a specialized corporate coaching persona to format outputs in compliance with leading global standards.
          </p>
        </div>
      </div>

      {/* Interactive Terminal Sandbox (Right Column) */}
      <div className="lg:col-span-8 p-6 rounded-3xl border border-slate-900 bg-slate-900/15 backdrop-blur-md flex flex-col justify-between min-h-[500px]">
        <div>
          
          {/* Resume Tab view */}
          {activeTab === 'resume' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h4 className="text-lg font-bold text-white font-sans">Weak Bullet Polish Tool</h4>
                <p className="text-xs text-slate-400 mt-1">Convert descriptive chores into metrics-driven professional bullet summaries.</p>
              </div>

              <form onSubmit={handleCareerActionSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-3xs font-semibold text-slate-400 text-slate-500 uppercase">Input Weak Bullet</label>
                  <textarea
                    value={weakBullet}
                    onChange={(e) => setWeakBullet(e.target.value)}
                    placeholder="e.g. helped modify websites and style buttons"
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-800 text-sm text-slate-200 focus:outline-none placeholder:text-slate-500 resize-none font-sans"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>Polish Resume Bullet Points</span>
                </button>
              </form>

              {/* Polished Result output */}
              {(resumeResults || loading) && (
                <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 relative group">
                  <div className="flex items-center justify-between">
                    <span className="text-3xs uppercase font-bold tracking-wider text-indigo-400">Shiv Optimized Draft suggestions</span>
                    {resumeResults && !loading && (
                      <button 
                        onClick={() => handleCopyClipboard(resumeResults)}
                        className="p-1 px-2 hover:bg-slate-800 rounded transition text-3xs text-slate-400 flex items-center gap-1 cursor-pointer border border-slate-800"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                      </button>
                    )}
                  </div>

                  {loading ? (
                    <div className="flex items-center gap-2 text-slate-400 text-xs py-4">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                      <span>Synthesizing competitive impact verbs using Gemini model...</span>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-wrap max-h-56 overflow-y-auto">
                      {resumeResults}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Interview Checklist Guide tab */}
          {activeTab === 'interview' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h4 className="text-lg font-bold text-white font-sans">Custom STAR Prep Case builder</h4>
                <p className="text-xs text-slate-400 mt-1">Specify your target corporate title and receive a detailed outline of likely STAR questions.</p>
              </div>

              <form onSubmit={handleCareerActionSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-3xs font-semibold text-slate-500 uppercase">Target Job Title</label>
                    <input
                      type="text"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="e.g., Software Architect"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-white focus:outline-none placeholder:text-slate-500 font-sans"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-3xs font-semibold text-slate-500 uppercase">Background Context (Optional)</label>
                    <input
                      type="text"
                      value={experienceContext}
                      onChange={(e) => setExperienceContext(e.target.value)}
                      placeholder="e.g. 1 Year React experience"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-white focus:outline-none placeholder:text-slate-500 font-sans"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>Generate Interview Guide Checklists</span>
                </button>
              </form>

              {/* Guide outcomes */}
              {(interviewGuide || loading) && (
                <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-3xs uppercase font-bold tracking-wider text-indigo-400">STAR Scenario Prompts</span>
                    {interviewGuide && !loading && (
                      <button 
                        onClick={() => handleCopyClipboard(interviewGuide)}
                        className="p-1 px-2 hover:bg-slate-800 rounded transition text-3xs text-slate-400 flex items-center gap-1 cursor-pointer border border-slate-800"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                      </button>
                    )}
                  </div>

                  {loading ? (
                    <div className="flex items-center gap-2 text-slate-400 text-xs py-4">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                      <span>Retrieving interview behavioral questions...</span>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-350 leading-relaxed font-sans whitespace-pre-wrap max-h-56 overflow-y-auto">
                      {interviewGuide}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Professional Outbound email drafting */}
          {activeTab === 'email' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h4 className="text-lg font-bold text-white font-sans">Outbound Email &amp; LinkedIn Drafting</h4>
                <p className="text-xs text-slate-400 mt-1 font-sans">Briefly specify your objective (e.g. follow-up, pitch) and Shiv will draft clean outreach messages.</p>
              </div>

              <form onSubmit={handleCareerActionSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-3xs font-semibold text-slate-500 uppercase">Correspondence Goal</label>
                  <textarea
                    value={emailConcept}
                    onChange={(e) => setEmailConcept(e.target.value)}
                    placeholder="e.g. Ask coordinator for interview update, highlight continued interest."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-800 text-sm text-slate-200 focus:outline-none placeholder:text-slate-500 resize-none font-sans"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>Generate Polished Correspondence</span>
                </button>
              </form>

              {/* Email output */}
              {(emailResult || loading) && (
                <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-3xs uppercase font-bold tracking-wider text-indigo-400">Optimized Text Draft</span>
                    {emailResult && !loading && (
                      <button 
                        onClick={() => handleCopyClipboard(emailResult)}
                        className="p-1 px-2 hover:bg-slate-800 rounded transition text-3xs text-slate-400 flex items-center gap-1 cursor-pointer border border-slate-800"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                      </button>
                    )}
                  </div>

                  {loading ? (
                    <div className="flex items-center gap-2 text-slate-400 text-xs py-4">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                      <span>Formulating outreach templates...</span>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-350 leading-relaxed font-sans whitespace-pre-wrap max-h-56 overflow-y-auto">
                      {emailResult}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

    </div>
  );
}

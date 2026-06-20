import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  CheckSquare, 
  Square,
  AlertCircle,
  Clock,
  Briefcase
} from 'lucide-react';
import { Task } from '../types';

interface PlannerViewProps {
  tasks: Task[];
  onAddTask: (title: string, priority: 'low' | 'medium' | 'high', notes?: string) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onClearTasks: () => void;
}

export default function PlannerView({
  tasks,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onClearTasks
}: PlannerViewProps) {
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [taskNotes, setTaskNotes] = useState('');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    onAddTask(taskTitle.trim(), taskPriority, taskNotes.trim() || undefined);
    setTaskTitle('');
    setTaskNotes('');
  };

  const toggleExpand = (id: string) => {
    setExpandedTaskId(expandedTaskId === id ? null : id);
  };

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const matchesFilter = 
      filter === 'all' || 
      (filter === 'active' && !task.completed) || 
      (filter === 'completed' && task.completed);
      
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (task.notes && task.notes.toLowerCase().includes(searchQuery.toLowerCase()));
                          
    return matchesFilter && matchesSearch;
  });

  // Calculate stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const openTasks = totalTasks - completedTasks;
  const highPriorityLeft = tasks.filter(t => t.priority === 'high' && !t.completed).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
      
      {/* Task Creation Panel (Left Column) */}
      <div className="lg:col-span-5 p-6 rounded-3xl border border-slate-900 bg-slate-900/15 backdrop-blur-md space-y-6">
        <div>
          <span className="text-2xs font-semibold text-indigo-400 uppercase tracking-widest bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-900/30">
            Agenda Builder
          </span>
          <h3 className="text-xl font-sans font-bold text-white mt-3">Add Core Priority</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Record actionable tasks configured with priority tags and optional strategic context notes.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-2xs font-bold text-slate-400 tracking-wider uppercase font-sans">Task Name / Goal</label>
            <input
              type="text"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="e.g., Synthesize Q2 product roadmap..."
              className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500 placeholder:text-slate-500 font-sans"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-2xs font-bold text-slate-400 tracking-wider uppercase font-sans">Task Priority Impact</label>
            <div className="grid grid-cols-3 gap-2">
              {(['high', 'medium', 'low'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setTaskPriority(p)}
                  className={`py-2 rounded-xl text-xs font-semibold capitalize border cursor-pointer transition ${
                    taskPriority === p
                      ? p === 'high'
                        ? 'bg-red-500/15 border-red-500 text-red-400'
                        : p === 'medium'
                        ? 'bg-amber-500/15 border-amber-500 text-amber-400'
                        : 'bg-emerald-500/15 border-emerald-500 text-emerald-400'
                      : 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:bg-slate-900/60'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-2xs font-bold text-slate-400 tracking-wider uppercase font-sans">Action Notes / Context (Optional)</label>
            <textarea
              value={taskNotes}
              onChange={(e) => setTaskNotes(e.target.value)}
              placeholder="Detail key subtopics, blockers, or reference material URL..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 placeholder:text-slate-500 font-sans resize-none"
            />
          </div>

          <button
            type="submit"
            id="btn-planner-submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-650 hover:bg-indigo-600 text-white font-sans font-semibold text-sm hover:scale-[1.01] transition duration-200 cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(99,102,241,0.2)]"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Task Goal</span>
          </button>
        </form>
      </div>

      {/* Task Queue View & Metrics (Right Column) */}
      <div className="lg:col-span-7 p-6 rounded-3xl border border-slate-900 bg-slate-900/15 backdrop-blur-md flex flex-col justify-between">
        <div className="space-y-6">
          
          {/* Analytical header cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-850">
              <span className="text-3xs text-slate-500 font-sans uppercase font-bold tracking-wider">High Alerts</span>
              <span className="text-xl font-sans font-bold text-red-400 block mt-1">{highPriorityLeft} Open</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-850">
              <span className="text-3xs text-slate-500 font-sans uppercase font-bold tracking-wider">Completed</span>
              <span className="text-xl font-sans font-bold text-emerald-400 block mt-1">{completedTasks}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-850">
              <span className="text-3xs text-slate-500 font-sans uppercase font-bold tracking-wider">Completion</span>
              <span className="text-xl font-sans font-bold text-indigo-400 block mt-1">
                {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
              </span>
            </div>
          </div>

          {/* Filtering row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
              {(['all', 'active', 'completed'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilter(t)}
                  className={`px-3 py-1.5 rounded-lg text-2xs font-semibold capitalize transition cursor-pointer ${
                    filter === t
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Live pattern matching textbar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search agenda logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-4 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder:text-slate-500 w-full sm:w-48 font-sans"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
            </div>
          </div>

          {/* Actual task lists */}
          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl">
                <p className="text-slate-500 text-sm italic">No scheduled priorities match your current search constraints.</p>
              </div>
            ) : (
              filteredTasks.map((task) => {
                const isExpanded = expandedTaskId === task.id;
                return (
                  <div 
                    key={task.id}
                    className={`rounded-2xl border transition duration-150 overflow-hidden ${
                      task.completed 
                        ? 'bg-slate-950/20 border-slate-900/40 opacity-50' 
                        : 'bg-slate-900/40 border-slate-850 hover:border-slate-800'
                    }`}
                  >
                    <div className="p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <button
                          onClick={() => onToggleTask(task.id)}
                          className="text-slate-400 hover:text-indigo-400 transition shrink-0 cursor-pointer"
                        >
                          {task.completed ? (
                            <CheckSquare className="w-5 h-5 text-indigo-500" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </button>
                        <div className="min-w-0 flex-1">
                          <span className={`text-sm font-sans tracking-tight font-medium truncate block ${task.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                            {task.title}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 shrink-0">
                        <span className={`px-2 py-0.5 text-4xs font-bold rounded uppercase ${
                          task.priority === 'high' 
                            ? 'bg-red-500/10 text-red-400 border border-red-900/20' 
                            : task.priority === 'medium'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-900/20'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {task.priority}
                        </span>

                        {task.notes && (
                          <button
                            onClick={() => toggleExpand(task.id)}
                            className="p-1 text-slate-400 hover:text-white rounded transition cursor-pointer"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        )}

                        <button
                          onClick={() => onDeleteTask(task.id)}
                          className="p-1 text-slate-500 hover:text-red-400 rounded transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {isExpanded && task.notes && (
                      <div className="px-4 pb-4 pt-1 border-t border-slate-900 bg-slate-950/40">
                        <p className="text-xs text-slate-400 whitespace-pre-line leading-relaxed font-sans italic">
                          "{task.notes}"
                        </p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Global clear trigger */}
        {tasks.length > 0 && (
          <div className="pt-4 border-t border-slate-900 flex justify-end">
            <button
              onClick={onClearTasks}
              className="text-3xs text-slate-500 hover:text-red-400 font-semibold uppercase tracking-widest cursor-pointer"
            >
              Clear All Planner Items
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

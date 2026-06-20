import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  PiggyBank, 
  AlertCircle
} from 'lucide-react';
import { Transaction, UserProfile } from '../types';

interface ExpensesViewProps {
  transactions: Transaction[];
  profile: UserProfile;
  onAddTransaction: (type: 'income' | 'expense', amount: number, category: string, description: string) => void;
  onDeleteTransaction: (id: string) => void;
  currency?: 'USD' | 'INR';
}

export default function ExpensesView({
  transactions,
  profile,
  onAddTransaction,
  onDeleteTransaction,
  currency = 'USD'
}: ExpensesViewProps) {
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  
  // Dynamic categories based on Indian or global context selection
  const isIndian = currency === 'INR';
  const cSymbol = isIndian ? '₹' : '$';

  const CATEGORIES = {
    income: isIndian 
      ? ['Salary', 'Freelance Contract', 'Kirana Dividends', 'Mutual Funds', 'Other Income']
      : ['Salary', 'Freelance', 'Investments', 'Other Income'],
    expense: isIndian 
      ? ['Chai & Snacks ☕', 'Transit / Metro / Auto 🛺', 'Rent & Utilities 🏠', 'Kirana & Groceries 🛒', 'Online Shopping 📦', 'Gifts & Sweets 🍬', 'Other Outflow']
      : ['Food/Groceries', 'Utilities/Rent', 'Leisure/Entertainment', 'Transit/Travel', 'Other Expense']
  };

  const [category, setCategory] = useState(CATEGORIES.expense[0]);
  const [description, setDescription] = useState('');
  
  // Custom savings target slider
  const [savingsTarget, setSavingsTarget] = useState(isIndian ? 50000 : 15000); // target budget
  const [currentSaved, setCurrentSaved] = useState(isIndian ? 26000 : 6200);   // saved amt

  const handleTypeChange = (newType: 'income' | 'expense') => {
    setType(newType);
    setCategory(CATEGORIES[newType][0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;
    onAddTransaction(type, parsedAmount, category, description.trim() || 'Unspecified transaction');
    setAmount('');
    setDescription('');
  };

  // Calculations
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;
  const budgetLimit = profile.dailyBudget * 30; // monthly budget allocation
  const pctBudgetUsed = Math.min((totalExpense / budgetLimit) * 100, 100);

  // Group expenses by category
  const expenseByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const maxExpenseCategoryVal = Math.max(...Object.values(expenseByCategory), 100);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
      
      {/* Transaction Entry Form Console (Left Column) */}
      <div className="lg:col-span-4 p-6 rounded-3xl border border-slate-900 bg-slate-900/15 backdrop-blur-md space-y-6 flex flex-col justify-between">
        <div className="space-y-6">
          <div>
            <span className="text-2xs font-semibold text-indigo-400 uppercase tracking-widest bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-900/30">
              Double-Ledger Engine
            </span>
            <h3 className="text-xl font-sans font-bold text-white mt-3">Post Transaction</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Log periodic expenses and revenue streams to maintain clear liquidity records in {isIndian ? 'Indian Rupees (₹)' : 'US Dollars ($)'}.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Toggle Income vs Expense */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => handleTypeChange('expense')}
                className={`py-2 text-2xs font-bold rounded-lg cursor-pointer transition uppercase ${
                  type === 'expense' 
                    ? 'bg-rose-500/15 text-rose-400 border border-rose-900/20' 
                    : 'text-slate-500 hover:text-slate-350'
                }`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('income')}
                className={`py-2 text-2xs font-bold rounded-lg cursor-pointer transition uppercase ${
                  type === 'income' 
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-900/20' 
                    : 'text-slate-500 hover:text-slate-350'
                }`}
              >
                Income
              </button>
            </div>

            {/* Amount input */}
            <div className="space-y-1.5 animate-fade-in">
              <label className="text-2xs font-bold text-slate-400 tracking-wider uppercase font-sans">Amount ({isIndian ? 'INR ₹' : 'USD $' })</label>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={isIndian ? "e.g. 150" : "e.g. 75.50"}
                  className="w-full pl-8 pr-4 py-3 rounded-xl bg-slate-900/60 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500 placeholder:text-slate-500 font-sans"
                  required
                />
                <span className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 font-bold text-base flex items-center justify-center">
                  {cSymbol}
                </span>
              </div>
            </div>

            {/* Selection category */}
            <div className="space-y-1.5">
              <label className="text-2xs font-bold text-slate-400 tracking-wider uppercase font-sans">Posting Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none cursor-pointer"
              >
                {CATEGORIES[type].map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-2xs font-bold text-slate-400 tracking-wider uppercase font-sans">Description / Memo</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={isIndian ? "e.g. Cutting Chai or Auto ride to metro" : "e.g. Target organic grocery run..."}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none placeholder:text-slate-400 font-sans"
                required
              />
            </div>

            <button
              type="submit"
              className={`w-full py-3 rounded-xl font-sans font-semibold text-sm hover:scale-[1.01] transition duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                type === 'expense' 
                  ? 'bg-rose-500 text-white shadow-[0_4px_12px_rgba(244,63,94,0.2)]'
                  : 'bg-emerald-500 text-white shadow-[0_4px_12px_rgba(16,185,129,0.2)]'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Record Transaction</span>
            </button>
          </form>
        </div>

        {/* Dynamic Savings Target Slider widget (Left Column Footer) */}
        <div className="pt-6 border-t border-slate-900 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-bold flex items-center gap-1">
                <PiggyBank className="w-4 h-4 text-purple-400" />
                <span>Savings Target Slider Goal</span>
              </span>
              <span className="text-white font-semibold font-mono">{cSymbol}{currentSaved.toLocaleString()} / {cSymbol}{savingsTarget.toLocaleString()}</span>
            </div>
            
            <div className="w-full bg-slate-900/80 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-purple-500 h-full rounded-full transition-all duration-300" 
                style={{ width: `${Math.min((currentSaved / savingsTarget) * 100, 100)}%` }}
              />
            </div>

            <input
              type="range"
              min={isIndian ? 10000 : 2000}
              max={isIndian ? 200000 : 30000}
              step={isIndian ? 5000 : 500}
              value={savingsTarget}
              onChange={(e) => setSavingsTarget(Number(e.target.value))}
              className="w-full accent-purple-500 cursor-pointer h-1"
            />
            <p className="text-4xs text-slate-500 italic mt-0.5">Tweak target goals and track passive wealth accumulation.</p>
          </div>
        </div>

      </div>

      {/* Primary ledger lists & SVG analytics data visuals (Right Column) */}
      <div className="lg:col-span-8 p-6 rounded-3xl border border-slate-900 bg-slate-900/15 backdrop-blur-md flex flex-col justify-between gap-6">
        <div className="space-y-6">
          
          {/* Liquidity metrics cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-3xs uppercase text-slate-500 font-bold tracking-wider">Account Balance</span>
                <span className={`text-2xl font-sans font-bold block mt-1 ${balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {cSymbol}{balance.toLocaleString()}
                </span>
              </div>
              <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400">
                <Wallet className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-3xs uppercase text-slate-500 font-bold tracking-wider">Gross Inflows</span>
                <span className="text-2xl font-sans font-bold block text-emerald-450 text-emerald-400 mt-1">
                  +{cSymbol}{totalIncome.toLocaleString()}
                </span>
              </div>
              <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-3xs uppercase text-slate-500 font-bold tracking-wider">Gross Spend</span>
                <span className="text-2xl font-sans font-bold block text-rose-450 text-rose-450 text-rose-400 mt-1">
                  -{cSymbol}{totalExpense.toLocaleString()}
                </span>
              </div>
              <div className="p-2.5 bg-rose-500/10 rounded-xl text-rose-400">
                <TrendingDown className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Budget safety indicator slider */}
          <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1">
              <span className="text-3xs uppercase text-slate-500 font-bold tracking-wider block">Custom Monthly Allocation Cap</span>
              <span className="text-xs text-slate-350 block mt-1">Total spend cap: <strong>{cSymbol}{budgetLimit.toLocaleString()}</strong> ({cSymbol}{profile.dailyBudget}/day)</span>
            </div>
            <div className="w-full sm:w-48">
              <div className="flex justify-between text-4s text-slate-400 mb-1">
                <span>Budget Consumed</span>
                <span className="font-mono">{Math.round(pctBudgetUsed)}%</span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${pctBudgetUsed > 85 ? 'bg-rose-500' : 'bg-indigo-400'}`} 
                  style={{ width: `${pctBudgetUsed}%` }}
                />
              </div>
            </div>
          </div>

          {/* Double Sub-columns: Category Chart lists & recent ledgers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            
            {/* Left Box: Category list */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-3xs uppercase text-slate-500 font-bold tracking-wider">Categorized Outflow Profile</span>
                <span className="text-4xs text-slate-500 italic">Aggregating spends</span>
              </div>

              <div className="space-y-3.5">
                {Object.keys(expenseByCategory).length === 0 ? (
                  <p className="text-slate-500 text-3xs italic py-6 text-center">Add transactional expenses to map spending distributions.</p>
                ) : (
                  Object.entries(expenseByCategory).map(([cat, val]) => {
                    const pctOfMax = (val / maxExpenseCategoryVal) * 100;
                    return (
                      <div key={cat} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-300 font-sans">{cat}</span>
                          <span className="text-slate-400 font-sans font-semibold">{cSymbol}{val.toLocaleString()}</span>
                        </div>
                        {/* Custom visual progress bar */}
                        <div className="w-full bg-slate-900/60 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-indigo-500 bg-indigo-500/70 h-full rounded-full transition-all"
                            style={{ width: `${pctOfMax}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Box: Ledger transaction logs */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xs uppercase text-slate-500 font-bold tracking-wider">Ledger Outflow history</span>
                <span className="text-4xs text-slate-500 italic font-mono">Recent records</span>
              </div>

              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {transactions.length === 0 ? (
                  <p className="text-slate-400 text-3xs italic py-8 text-center flex items-center justify-center gap-1">
                    Your double-ledger sheet is empty.
                  </p>
                ) : (
                  transactions.slice(-10).reverse().map(trans => (
                    <div 
                      key={trans.id}
                      className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 hover:border-slate-800 transition flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-slate-200 font-semibold block truncate leading-tight">{trans.description}</span>
                        <span className="text-slate-500 text-3xs block mt-0.5">{trans.category} • {trans.date}</span>
                      </div>
                      <div className="flex items-center space-x-2.5 shrink-0">
                        <span className={`font-bold font-mono ${trans.type === 'income' ? 'text-emerald-450 text-emerald-400' : 'text-rose-450 text-rose-400'}`}>
                          {trans.type === 'income' ? '+' : '-'}{cSymbol}{trans.amount.toLocaleString()}
                        </span>
                        <button
                          onClick={() => onDeleteTransaction(trans.id)}
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

        </div>
      </div>

    </div>
  );
}

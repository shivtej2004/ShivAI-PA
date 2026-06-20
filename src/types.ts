export interface Task {
  id: string;
  title: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  notes?: string;
  dueDate?: string;
}

export interface Habit {
  id: string;
  name: string;
  completedDates: string[]; // ISO strings format 'YYYY-MM-DD'
  createdAt: string;
  streak: number;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  date: string;
  description: string;
}

export interface SleepLog {
  id: string;
  date: string;
  bedTime: string; // HH:MM
  wakeTime: string; // HH:MM
  duration: number; // hours
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  time: string;
  takenToday: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export interface UserProfile {
  name: string;
  primaryGoal: string;
  dailyWaterTarget: number; // in ml
  dailyBudget: number;
}

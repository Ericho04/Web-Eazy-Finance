import { isDemoMode } from './supabase/info';

// Data structures
export interface Transaction {
  id: string;
  userId: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  subcategory?: string;
  description: string;
  merchant?: string;
  date: string;
  time: string;
  status: 'completed' | 'pending' | 'failed';
  tags?: string[];
  location?: string;
  receiptUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  userId: string;
  category: string;
  allocated: number;
  spent: number;
  period: 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  currency: string;
  language: string;
  timezone: string;
  monthlyIncome?: number;
  preferences: {
    notifications: {
      budgetAlerts: boolean;
      goalReminders: boolean;
      expenseNotifications: boolean;
      weeklyReports: boolean;
    };
    theme: 'light' | 'dark' | 'system';
  };
  createdAt: string;
  updatedAt: string;
}

class DataManager {
  // All methods will work with local storage only in demo mode

  // User Profile Management
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    // Always return null to trigger local data creation in context
    return null;
  }

  async updateUserProfile(userId: string, profile: Partial<UserProfile>): Promise<UserProfile> {
    // In demo mode, this is handled by the context layer
    throw new Error('Demo mode - handled locally');
  }

  // Transaction Management
  async getTransactions(userId: string, filters?: any): Promise<Transaction[]> {
    // Always return empty array to use local storage
    return [];
  }

  async addTransaction(transaction: any): Promise<Transaction> {
    throw new Error('Demo mode - handled locally');
  }

  async updateTransaction(transactionId: string, updates: any): Promise<Transaction> {
    throw new Error('Demo mode - handled locally');
  }

  async deleteTransaction(transactionId: string): Promise<void> {
    throw new Error('Demo mode - handled locally');
  }

  // Budget Management
  async getBudgets(userId: string): Promise<Budget[]> {
    return [];
  }

  async addBudget(budget: any): Promise<Budget> {
    throw new Error('Demo mode - handled locally');
  }

  async updateBudget(budgetId: string, updates: any): Promise<Budget> {
    throw new Error('Demo mode - handled locally');
  }

  async deleteBudget(budgetId: string): Promise<void> {
    throw new Error('Demo mode - handled locally');
  }

  // Goal Management
  async getGoals(userId: string): Promise<Goal[]> {
    return [];
  }

  async addGoal(goal: any): Promise<Goal> {
    throw new Error('Demo mode - handled locally');
  }

  async updateGoal(goalId: string, updates: any): Promise<Goal> {
    throw new Error('Demo mode - handled locally');
  }

  async deleteGoal(goalId: string): Promise<void> {
    throw new Error('Demo mode - handled locally');
  }

  // Analytics and Reports
  async getAnalytics(userId: string, period: string) {
    return {
      totalIncome: 0,
      totalExpenses: 0,
      totalSavings: 0,
      categoryBreakdown: [],
      trends: []
    };
  }

  // AI Suggestions
  async getAISuggestions(userId: string) {
    return [];
  }

  // Category Management
  getDefaultCategories(): { income: string[]; expense: string[] } {
    return {
      income: [
        'Salary',
        'Freelance',
        'Investment Returns',
        'Business Income',
        'Rental Income',
        'Gifts Received',
        'Refunds',
        'Other Income'
      ],
      expense: [
        'Food & Dining',
        'Transportation',
        'Shopping',
        'Bills & Utilities',
        'Entertainment',
        'Healthcare',
        'Education',
        'Travel',
        'Insurance',
        'Investments',
        'Debt Payments',
        'Gifts & Donations',
        'Personal Care',
        'Home Maintenance',
        'Other Expenses'
      ]
    };
  }

  // Local Storage Helpers - These are the core methods for demo mode
  private getLocalKey(userId: string, dataType: string): string {
    return `sfms_${userId}_${dataType}`;
  }

  saveToLocal<T>(userId: string, dataType: string, data: T): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(this.getLocalKey(userId, dataType), JSON.stringify(data));
      }
    } catch (error) {
      console.error('Error saving to local storage:', error);
    }
  }

  getFromLocal<T>(userId: string, dataType: string): T | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const data = localStorage.getItem(this.getLocalKey(userId, dataType));
        return data ? JSON.parse(data) : null;
      }
      return null;
    } catch (error) {
      console.error('Error reading from local storage:', error);
      return null;
    }
  }

  clearLocal(userId: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const keys = Object.keys(localStorage).filter(key => key.startsWith(`sfms_${userId}_`));
        keys.forEach(key => localStorage.removeItem(key));
      }
    } catch (error) {
      console.error('Error clearing local storage:', error);
    }
  }

  // Utility Methods
  generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  formatCurrency(amount: number, currency: string = 'RM'): string {
    return `${currency} ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  }

  calculateProgress(current: number, target: number): number {
    if (target === 0) return 0;
    return Math.min(Math.round((current / target) * 100), 100);
  }

  getDaysBetween(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  formatDate(date: Date | string, format: 'short' | 'medium' | 'long' = 'medium'): string {
    const d = typeof date === 'string' ? new Date(date) : date;

    switch (format) {
      case 'short':
        return d.toLocaleDateString('en-MY', { day: '2-digit', month: 'short' });
      case 'long':
        return d.toLocaleDateString('en-MY', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      default:
        return d.toLocaleDateString('en-MY', {
          year: 'numeric',
          month: 'short',
          day: '2-digit'
        });
    }
  }

  // Demo data generators
  generateDemoTransactions(userId: string): Transaction[] {
    const categories = this.getDefaultCategories();
    const transactions: Transaction[] = [];

    // Generate some sample transactions
    const sampleData = [
      { type: 'income', amount: 5000, category: 'Salary', description: 'Monthly salary', merchant: 'Company ABC' },
      { type: 'expense', amount: 25.50, category: 'Food & Dining', description: 'Lunch', merchant: 'Mamak Corner' },
      { type: 'expense', amount: 120, category: 'Bills & Utilities', description: 'Electricity bill', merchant: 'TNB' },
      { type: 'expense', amount: 50, category: 'Transportation', description: 'Fuel', merchant: 'Petronas' },
      { type: 'expense', amount: 80, category: 'Shopping', description: 'Groceries', merchant: 'AEON' },
      { type: 'income', amount: 500, category: 'Freelance', description: 'Design project', merchant: 'Client XYZ' }
    ];

    sampleData.forEach((item, index) => {
      const date = new Date();
      date.setDate(date.getDate() - index);

      transactions.push({
        id: this.generateId(),
        userId,
        type: item.type as 'income' | 'expense',
        amount: item.amount,
        category: item.category,
        description: item.description,
        merchant: item.merchant,
        date: date.toISOString().split('T')[0],
        time: `${Math.floor(Math.random() * 12) + 8}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
        status: 'completed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    });

    return transactions;
  }

  generateDemoBudgets(userId: string): Budget[] {
    const budgets: Budget[] = [];
    const categories = ['Food & Dining', 'Transportation', 'Entertainment', 'Shopping'];

    categories.forEach(category => {
      budgets.push({
        id: this.generateId(),
        userId,
        category,
        allocated: Math.floor(Math.random() * 500) + 200,
        spent: Math.floor(Math.random() * 300) + 50,
        period: 'monthly',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    });

    return budgets;
  }

  generateDemoGoals(userId: string): Goal[] {
    return [
      {
        id: this.generateId(),
        userId,
        title: 'Emergency Fund',
        description: 'Build 6 months of emergency savings',
        targetAmount: 30000,
        currentAmount: 8500,
        targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        category: 'Emergency Fund',
        priority: 'high',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: this.generateId(),
        userId,
        title: 'Vacation Fund',
        description: 'Save for Japan trip',
        targetAmount: 8000,
        currentAmount: 2300,
        targetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        category: 'Travel',
        priority: 'medium',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }
}

export const dataManager = new DataManager();
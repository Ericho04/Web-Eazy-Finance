import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Eye,
  EyeOff,
  Target,
  Star,
  Calendar,
  Gift,
  ChevronRight,
  DollarSign,
  Utensils,
  Car,
  ShoppingBag,
  Gamepad2,
  Home,
  Heart,
  Coffee,
  Fuel,
  Users,
  Loader2,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../utils/AppContext';
import * as SupabaseModule from '../supabase/supabase.ts';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
const supabase = SupabaseModule.supabase;

interface DashboardProps {
  onNavigate: (section: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { state, getActiveGoals, getTodayTransactions, getRecentTransactions } = useApp();

  const [showBalance, setShowBalance] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    totalCost: 0,
    totalPrizesAwarded: 0,
    totalShopSales: 0,
    prizeDistribution: [] as any[],
    dailyActivity: [] as { date: string; count: number }[]
  });

  const activeGoals = getActiveGoals();
  const todayTransactions = getTodayTransactions();
  const recentTransactions = getRecentTransactions(5);

  // Calculate today's spending
  const todaySpending = todayTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Calculate today's income
  const todayIncome = todayTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  // Calculate current balance (simplified)
  const totalIncome = state.transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = state.transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const currentBalance = totalIncome - totalExpenses;

  // Fetch Dashboard Data from Supabase
  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    setIsLoading(true);
    try {
      // 1. Count user_profiles (Total Users)
      const { count: userCount } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });

      // 2. Count lucky_draw (Total Prizes Awarded)
      const { count: prizesCount } = await supabase
        .from('lucky_draw')
        .select('*', { count: 'exact', head: true });

      // 3. Count redeem (Total Shop Sales)
      const { count: redeemCount } = await supabase
        .from('redeem')
        .select('*', { count: 'exact', head: true });

      // 4. Prize Distribution (group by reward_id)
      const { data: allDraws } = await supabase
        .from('lucky_draw')
        .select(`
          reward_id,
          prizes (id, name, emoji)
        `);

      const prizeMap: { [key: number]: { name: string; emoji: string; count: number } } = {};
      (allDraws || []).forEach((draw: any) => {
        const rewardId = draw.reward_id;
        if (!prizeMap[rewardId]) {
          prizeMap[rewardId] = {
            name: draw.prizes?.name || 'Unknown Prize',
            emoji: draw.prizes?.emoji || '🎁',
            count: 0
          };
        }
        prizeMap[rewardId].count += 1;
      });

      const prizeDistribution = Object.entries(prizeMap)
        .map(([id, data]) => ({
          id: parseInt(id),
          name: data.name,
          emoji: data.emoji,
          count: data.count
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // 5. Fetch lucky_draw records with dates for daily activity
      const { data: luckyDrawRecords } = await supabase
        .from('lucky_draw')
        .select('created_at')
        .order('created_at', { ascending: false });

      // 6. Fetch redeem records with dates for daily activity
      const { data: redeemRecords } = await supabase
        .from('redeem')
        .select('created_at')
        .order('created_at', { ascending: false });

      // Merge lucky_draw + redeem into daily statistics
      const activityMap: { [key: string]: number } = {};

      // Process lucky_draw records
      (luckyDrawRecords || []).forEach((record: any) => {
        if (record.created_at) {
          const date = new Date(record.created_at).toISOString().split('T')[0];
          activityMap[date] = (activityMap[date] || 0) + 1;
        }
      });

      // Process redeem records
      (redeemRecords || []).forEach((record: any) => {
        if (record.created_at) {
          const date = new Date(record.created_at).toISOString().split('T')[0];
          activityMap[date] = (activityMap[date] || 0) + 1;
        }
      });

      // Convert to array and sort by date
      const dailyActivity = Object.entries(activityMap)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-30); // Last 30 days

      setDashboardStats({
        totalUsers: userCount || 0,
        totalCost: 0, // Placeholder
        totalPrizesAwarded: prizesCount || 0,
        totalShopSales: redeemCount || 0,
        prizeDistribution,
        dailyActivity
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const formatCurrency = (amount: number) => {
    return showBalance ? `RM ${amount.toFixed(2)}` : 'RM ****';
  };

  const formatAmount = (amount: number) => {
    return `RM ${amount.toFixed(2)}`;
  };

  // Get daily goals (goals with upcoming deadlines or low progress)
  const dailyGoals = activeGoals
    .filter(goal => {
      const deadline = new Date(goal.deadline);
      const today = new Date();
      const daysUntilDeadline = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 3600 * 24));
      const progress = (goal.currentAmount / goal.targetAmount) * 100;

      return daysUntilDeadline <= 30 || progress < 50; // Show goals due within 30 days or less than 50% complete
    })
    .slice(0, 3); // Show max 3 daily goals

  // Activity Chart Widget
  const ActivityChart = ({ data }: { data: { date: string; count: number }[] }) => {
    if (data.length === 0) {
      return (
        <div className="text-center text-gray-500 text-sm py-8">
          No activity data available
        </div>
      );
    }

    // Format data for chart
    const chartData = data.map(item => ({
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      count: item.count,
      fullDate: item.date
    }));

    const maxCount = Math.max(...chartData.map(d => d.count));
    const colors = ['#a855f7', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

    return (
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickLine={{ stroke: '#e5e7eb' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '8px 12px'
            }}
            labelStyle={{ color: '#374151', fontWeight: 'bold' }}
            formatter={(value: number) => [`${value} activities`, 'Count']}
          />
          <Bar dataKey="count" radius={[8, 8, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="min-h-screen pb-32">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="px-6 pt-8 text-center mb-8"
      >
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
          className="text-5xl mb-3"
        >
          👋
        </motion.div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cartoon-blue to-cartoon-purple bg-clip-text text-transparent mb-2">
          Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}!
        </h1>
        <p className="text-gray-600">Let's check your financial progress</p>
      </motion.div>

      <div className="px-6 space-y-8">
        {/* Balance Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Card className="cartoon-card bg-gradient-to-br from-cartoon-mint/10 to-cartoon-cyan/10 border-cartoon-mint/20 overflow-hidden relative">
            <div className="absolute top-0 right-0 text-6xl opacity-10">💳</div>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-2">Current Balance</p>
                  <div className="flex items-center gap-4">
                    <motion.p 
                      className="text-4xl font-bold text-gray-800"
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                    >
                      {formatCurrency(currentBalance)}
                    </motion.p>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowBalance(!showBalance)}
                      className="cartoon-button bg-white/80 backdrop-blur-sm"
                    >
                      {showBalance ? (
                        <Eye className="w-5 h-5 text-cartoon-mint" />
                      ) : (
                        <EyeOff className="w-5 h-5 text-cartoon-mint" />
                      )}
                    </Button>
                  </div>
                </div>
                
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                  className="w-16 h-16 rounded-full cartoon-gradient-mint flex items-center justify-center shadow-lg"
                >
                  <DollarSign className="w-8 h-8 text-white" />
                </motion.div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <motion.div 
                  className="flex items-center gap-3 p-4 rounded-2xl bg-white/50 backdrop-blur-sm"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <TrendingUp className="w-5 h-5 text-cartoon-mint" />
                  <div>
                    <p className="text-lg font-bold text-cartoon-mint">{formatAmount(todayIncome)}</p>
                    <p className="text-sm text-gray-600">Today's Income</p>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="flex items-center gap-3 p-4 rounded-2xl bg-white/50 backdrop-blur-sm"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <TrendingDown className="w-5 h-5 text-cartoon-pink" />
                  <div>
                    <p className="text-lg font-bold text-cartoon-pink">{formatAmount(todaySpending)}</p>
                    <p className="text-sm text-gray-600">Today's Spending</p>
                  </div>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Platform Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="text-2xl"
            >
              📊
            </motion.div>
            <h2 className="text-xl font-bold text-gray-800">Platform Statistics</h2>
          </div>

          {isLoading ? (
            <Card className="cartoon-card bg-white/80 backdrop-blur-sm border-0">
              <CardContent className="p-6 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="cartoon-card bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200/30">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 flex items-center justify-center">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-800">{dashboardStats.totalUsers}</p>
                        <p className="text-sm text-gray-600">Total Users</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="cartoon-card bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200/30">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center">
                        <Gift className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-800">{dashboardStats.totalPrizesAwarded}</p>
                        <p className="text-sm text-gray-600">Prizes Won</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="cartoon-card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200/30">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-400 to-emerald-400 flex items-center justify-center">
                        <ShoppingBag className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-800">{dashboardStats.totalShopSales}</p>
                        <p className="text-sm text-gray-600">Items Redeemed</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
                className="col-span-2"
              >
                <Card className="cartoon-card bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200/30">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center">
                        <Award className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-gray-800">Prize Distribution</p>
                        <p className="text-xs text-gray-600">Most popular prizes</p>
                      </div>
                    </div>

                    {dashboardStats.prizeDistribution.length > 0 ? (
                      <div className="flex items-center gap-4">
                        {/* Pie Chart */}
                        <div className="relative w-32 h-32 flex-shrink-0">
                          <svg viewBox="0 0 100 100" className="transform -rotate-90">
                            {(() => {
                              const total = dashboardStats.prizeDistribution.reduce((sum, p) => sum + p.count, 0);
                              let currentAngle = 0;
                              const colors = ['#a855f7', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

                              return dashboardStats.prizeDistribution.map((prize, index) => {
                                const percentage = (prize.count / total) * 100;
                                const angle = (percentage / 100) * 360;
                                const startAngle = currentAngle;
                                currentAngle += angle;

                                const x1 = 50 + 40 * Math.cos((startAngle * Math.PI) / 180);
                                const y1 = 50 + 40 * Math.sin((startAngle * Math.PI) / 180);
                                const x2 = 50 + 40 * Math.cos((currentAngle * Math.PI) / 180);
                                const y2 = 50 + 40 * Math.sin((currentAngle * Math.PI) / 180);
                                const largeArc = angle > 180 ? 1 : 0;

                                return (
                                  <path
                                    key={prize.id}
                                    d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                                    fill={colors[index % colors.length]}
                                    className="transition-all hover:opacity-80"
                                  />
                                );
                              });
                            })()}
                          </svg>
                        </div>

                        {/* Legend */}
                        <div className="flex-1 space-y-2 max-h-32 overflow-y-auto">
                          {dashboardStats.prizeDistribution.map((prize, index) => {
                            const total = dashboardStats.prizeDistribution.reduce((sum, p) => sum + p.count, 0);
                            const percentage = ((prize.count / total) * 100).toFixed(1);
                            const colors = ['bg-purple-500', 'bg-pink-500', 'bg-amber-500', 'bg-emerald-500', 'bg-blue-500'];

                            return (
                              <div key={prize.id} className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`}></div>
                                <span className="text-xs">{prize.emoji}</span>
                                <span className="text-xs text-gray-700 flex-1 truncate">{prize.name}</span>
                                <span className="text-xs font-bold text-gray-800">{percentage}%</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 text-sm py-4">
                        No prize data available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-6"
        >
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="text-2xl"
            >
              ⚡
            </motion.div>
            <h2 className="text-xl font-bold text-gray-800">Quick Actions</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                onClick={() => onNavigate('add-expense')}
                className="cartoon-button h-24 w-full cartoon-gradient-pink text-white border-0 flex flex-col items-center justify-center gap-3 shadow-lg hover:shadow-xl"
              >
                <TrendingDown className="w-7 h-7" />
                <span className="font-bold text-base">Add Expense</span>
              </Button>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                onClick={() => onNavigate('add-expense')}
                className="cartoon-button h-24 w-full cartoon-gradient-mint text-white border-0 flex flex-col items-center justify-center gap-3 shadow-lg hover:shadow-xl"
              >
                <TrendingUp className="w-7 h-7" />
                <span className="font-bold text-base">Add Income</span>
              </Button>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                onClick={() => onNavigate('goals')}
                className="cartoon-button h-24 w-full cartoon-gradient-purple text-white border-0 flex flex-col items-center justify-center gap-3 shadow-lg hover:shadow-xl"
              >
                <Target className="w-7 h-7" />
                <span className="font-bold text-base">Goals</span>
              </Button>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                onClick={() => onNavigate('lucky-draw')}
                className="cartoon-button h-24 w-full cartoon-gradient-orange text-white border-0 flex flex-col items-center justify-center gap-3 shadow-lg hover:shadow-xl"
              >
                <Gift className="w-7 h-7" />
                <span className="font-bold text-base">Lucky Draw</span>
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Daily Goals */}
        {dailyGoals.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div
                  className="w-10 h-10 rounded-full cartoon-gradient-purple flex items-center justify-center"
                  whileHover={{ rotate: 180 }}
                  transition={{ duration: 0.5 }}
                >
                  <Target className="w-5 h-5 text-white" />
                </motion.div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Daily Goals Focus</h2>
                  <p className="text-sm text-gray-600">Your priority goals</p>
                </div>
              </div>
              
              <Button
                variant="ghost"
                onClick={() => onNavigate('goals')}
                className="text-cartoon-purple hover:text-cartoon-purple/80 hover:bg-cartoon-purple/10"
              >
                View All
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            
            <div className="space-y-3">
              {dailyGoals.map((goal, index) => {
                const progress = (goal.currentAmount / goal.targetAmount) * 100;
                const deadline = new Date(goal.deadline);
                const today = new Date();
                const daysUntilDeadline = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 3600 * 24));
                
                return (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    onClick={() => onNavigate('goals')}
                    className="cursor-pointer"
                  >
                    <Card className="cartoon-card bg-gradient-to-r from-white to-cartoon-purple/10 border-0 hover:shadow-xl transition-all">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">
                              {goal.category === 'emergency' ? '🆘' : 
                               goal.category === 'travel' ? '✈️' :
                               goal.category === 'technology' ? '💻' : '🎯'}
                            </span>
                            <div>
                              <h4 className="font-bold text-gray-800">{goal.title}</h4>
                              <p className="text-sm text-gray-600">{goal.description}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-cartoon-yellow">
                            <Star className="w-4 h-4 fill-current" />
                            <span className="font-semibold">{goal.pointsReward} pts</span>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <Progress 
                            value={progress} 
                            className="h-3 rounded-full bg-gray-100 [&>div]:cartoon-gradient-purple"
                          />
                          
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                              {formatAmount(goal.currentAmount)} / {formatAmount(goal.targetAmount)}
                            </span>
                            <Badge 
                              className={`text-xs font-semibold ${
                                daysUntilDeadline <= 7 
                                  ? 'bg-cartoon-pink/20 text-cartoon-pink border-cartoon-pink/30' 
                                  : daysUntilDeadline <= 30
                                  ? 'bg-cartoon-yellow/20 text-cartoon-orange border-cartoon-yellow/30'
                                  : 'bg-cartoon-mint/20 text-cartoon-mint border-cartoon-mint/30'
                              }`}
                            >
                              {daysUntilDeadline <= 0 ? 'Overdue' : `${daysUntilDeadline} days left`}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Platform Activity Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="text-2xl"
            >
              📈
            </motion.div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Platform Activity</h2>
              <p className="text-sm text-gray-600">Lucky draws & redemptions (last 30 days)</p>
            </div>
          </div>

          <Card className="cartoon-card bg-white/80 backdrop-blur-sm border-0">
            <CardContent className="p-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                </div>
              ) : (
                <ActivityChart data={dashboardStats.dailyActivity} />
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                className="w-10 h-10 rounded-full cartoon-gradient-blue flex items-center justify-center"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.8 }}
              >
                <Calendar className="w-5 h-5 text-white" />
              </motion.div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Recent Transactions</h2>
                <p className="text-sm text-gray-600">Latest activity</p>
              </div>
            </div>
            
            <Button
              variant="ghost"
              onClick={() => onNavigate('expense-history')}
              className="text-cartoon-blue hover:text-cartoon-blue/80 hover:bg-cartoon-blue/10"
            >
              View All
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          
          <Card className="cartoon-card bg-white/80 backdrop-blur-sm border-0">
            <CardContent className="p-6">
              {recentTransactions.length === 0 ? (
                <motion.div 
                  className="text-center py-12"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="text-6xl mb-4">📝</div>
                  <h3 className="text-lg font-bold text-gray-700 mb-2">No transactions yet</h3>
                  <p className="text-gray-500 mb-6">Start tracking your finances today!</p>
                  <Button
                    onClick={() => onNavigate('add-expense')}
                    className="cartoon-button cartoon-gradient-purple text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Transaction
                  </Button>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  {recentTransactions.map((transaction, index) => (
                    <motion.div
                      key={transaction.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-gray-50 to-white"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          transaction.type === 'expense' 
                            ? 'cartoon-gradient-pink' 
                            : 'cartoon-gradient-mint'
                        }`}>
                          {transaction.type === 'expense' ? (
                            <TrendingDown className="w-5 h-5 text-white" />
                          ) : (
                            <TrendingUp className="w-5 h-5 text-white" />
                          )}
                        </div>
                        
                        <div>
                          <p className="font-bold text-gray-800">{transaction.description}</p>
                          <p className="text-sm text-gray-600">{transaction.category}</p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className={`text-lg font-bold ${
                          transaction.type === 'expense' ? 'text-cartoon-pink' : 'text-cartoon-mint'
                        }`}>
                          {transaction.type === 'expense' ? '-' : '+'}
                          {formatAmount(transaction.amount)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(transaction.date).toLocaleDateString()}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
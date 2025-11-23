import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import {
  Calendar,
  Award,
  Sparkles,
  Loader2
} from 'lucide-react';
import { motion } from 'motion/react';
import * as SupabaseModule from '../supabase/supabase.ts';
const supabase = SupabaseModule.supabase;

interface InsightsProps {
  onNavigate: (section: string) => void;
  user?: any;
}

export function Insights({ onNavigate, user }: InsightsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState({
    transactionHistory: [] as any[],
    prizeDistribution: [] as any[],
    shopPerformance: [] as any[]
  });

  // Fetch Analytics Data from Supabase
  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  async function fetchAnalyticsData() {
    setIsLoading(true);
    try {
      // 1. Recent Transaction History (lucky_draw + redeem merged)
      const { data: luckyDraws } = await supabase
        .from('lucky_draw')
        .select(`
          draw_id,
          reward_id,
          created_at,
          user_profiles (username),
          prizes (id, name, emoji, value)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      const { data: redeems } = await supabase
        .from('redeem')
        .select(`
          redeem_id,
          points_spent,
          created_at,
          user_profiles (username),
          shop_items (id, name, emoji, points_cost)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      // Merge transactions
      const drawTransactions = (luckyDraws || []).map((d: any) => ({
        id: d.draw_id,
        type: 'lucky_draw',
        user: d.user_profiles?.username || 'Unknown User',
        item: d.prizes?.name || 'Unknown Prize',
        emoji: d.prizes?.emoji || '🎁',
        value: d.prizes?.value || '',
        created_at: d.created_at
      }));

      const redeemTransactions = (redeems || []).map((r: any) => ({
        id: r.redeem_id,
        type: 'redeem',
        user: r.user_profiles?.username || 'Unknown User',
        item: r.shop_items?.name || 'Unknown Item',
        emoji: r.shop_items?.emoji || '🛍️',
        value: `${r.points_spent || 0} pts`,
        created_at: r.created_at
      }));

      const transactionHistory = [...drawTransactions, ...redeemTransactions]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 15);

      // 2. Prize Distribution (group by reward_id)
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
          timesWon: data.count
        }))
        .sort((a, b) => b.timesWon - a.timesWon)
        .slice(0, 10);

      // 3. Shop Performance (using VIEW redeem_with_items)
      const { data: allRedeems, error: viewError } = await supabase
        .from('redeem_with_items')
        .select('*');

      if (viewError) {
        console.error("Redeem VIEW ERROR:", viewError);
      }

      const shopMap: any = {};

      (allRedeems || []).forEach((r: any) => {
        const id = r.item_id;

        if (!shopMap[id]) {
          shopMap[id] = {
            name: r.item_name,
            emoji: r.item_emoji || "🛍️",
            category: r.item_category || "Uncategorized",
            redeemCount: 0
          };
        }

        shopMap[id].redeemCount += 1;
      });

      const shopPerformance = Object.entries(shopMap)
        .map(([id, data]: [string, any]) => ({
          id,
          name: data.name,
          emoji: data.emoji,
          category: data.category,
          redeemCount: data.redeemCount,
        }))
        .sort((a, b) => b.redeemCount - a.redeemCount)
        .slice(0, 5);

      setAnalyticsData({
        transactionHistory,
        prizeDistribution,
        shopPerformance
      });

    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="px-4 space-y-6 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 min-h-screen pb-20">
      {/* Header */}
      <div className="pt-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-6"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className="text-4xl mb-2"
          >
            📊
          </motion.div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Platform Insights
          </h1>
          <p className="text-gray-600 mt-1">Real-time analytics and activity tracking</p>
        </motion.div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <Card className="cartoon-card bg-white/80 backdrop-blur-sm border-0">
          <CardContent className="p-6 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-purple-500 mr-2" />
            <span className="text-gray-600">Loading platform insights...</span>
          </CardContent>
        </Card>
      )}

      {/* Prize Distribution (from Supabase) */}
      {!isLoading && analyticsData.prizeDistribution.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="cartoon-card bg-gradient-to-br from-purple-50 to-pink-50 border-0">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="text-lg font-bold text-gray-800">Top Prize Distribution</span>
                  <p className="text-sm text-gray-600 font-normal">Most popular prizes</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {analyticsData.prizeDistribution.slice(0, 5).map((prize, index) => (
                <div key={prize.id} className="flex items-center justify-between p-3 rounded-xl bg-white/50">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{prize.emoji}</span>
                    <div>
                      <p className="font-bold text-gray-800">{prize.name}</p>
                      <p className="text-sm text-gray-600">{prize.timesWon} times won</p>
                    </div>
                  </div>
                  <Badge className="bg-purple-500 text-white">#{index + 1}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Shop Performance (from Supabase) */}
      {!isLoading && analyticsData.shopPerformance.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="cartoon-card bg-gradient-to-br from-green-50 to-emerald-50 border-0">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-400 to-emerald-400 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="text-lg font-bold text-gray-800">Top Shop Performance</span>
                  <p className="text-sm text-gray-600 font-normal">Most redeemed items</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {analyticsData.shopPerformance.map((item, index) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-white/50">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{item.emoji}</span>
                    <div>
                      <p className="font-bold text-gray-800">{item.name}</p>
                      <p className="text-sm text-gray-600">{item.category} · Redeemed {item.redeemCount} times</p>
                    </div>
                  </div>
                  <Badge className="bg-green-500 text-white">#{index + 1}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Recent Transactions (from Supabase) */}
      {!isLoading && analyticsData.transactionHistory.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="cartoon-card bg-gradient-to-br from-blue-50 to-cyan-50 border-0">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="text-lg font-bold text-gray-800">Recent Transaction History</span>
                  <p className="text-sm text-gray-600 font-normal">Latest platform transactions</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-96 overflow-y-auto">
              {analyticsData.transactionHistory.map((tx, index) => (
                <div key={`${tx.type}-${tx.id}`} className="flex items-center justify-between p-3 rounded-xl bg-white/50">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{tx.emoji}</span>
                    <div>
                      <p className="font-medium text-gray-800">{tx.user}</p>
                      <p className="text-sm text-gray-600">
                        {tx.type === 'lucky_draw' ? '🎁 Won' : '🛍️ Redeemed'}: {tx.item}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={tx.type === 'lucky_draw' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}>
                      {tx.value}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Empty State */}
      {!isLoading && analyticsData.transactionHistory.length === 0 && analyticsData.prizeDistribution.length === 0 && analyticsData.shopPerformance.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-lg font-bold text-gray-700 mb-2">No Data Available</h3>
          <p className="text-gray-500">Platform activity will appear here once users start interacting</p>
        </motion.div>
      )}
    </div>
  );
}

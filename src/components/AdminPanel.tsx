import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { toast } from 'sonner@2.0.3';
import {
  Settings,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Gift,
  ShoppingBag,
  Star,
  BarChart3,
  Users,
  TrendingUp,
  ArrowLeft,
  Download,
  Upload,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  Percent,
  Package,
  DollarSign,
  Trophy,
  ShoppingCart,
  Activity,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../supabase/supabase';

interface AdminPanelProps {
  onBack: () => void;
  user?: any;
  defaultTab?: string;
}

interface Prize {
  id: string;
  name: string;
  description: string;
  type: 'voucher' | 'points' | 'cashback' | 'gift';
  value: string;
  probability: number;
  color: string;
  emoji: string;
  isActive: boolean;
}

interface ShopItem {
  id: string;
  name: string;
  description: string;
  category: 'vouchers' | 'cashback' | 'experiences' | 'digital';
  pointsCost: number;
  originalValue: string;
  discount: number;
  emoji: string;
  availability: number;
  isPopular: boolean;
  isLimited: boolean;
  isActive: boolean;
}

// Sample data - in real app this would come from backend
const initialPrizes: Prize[] = [
  {
    id: '1',
    name: 'Cashback',
    description: 'Get money back',
    type: 'cashback',
    value: 'RM 10',
    probability: 25,
    color: 'from-green-400 to-emerald-500',
    emoji: '💰',
    isActive: true
  },
  {
    id: '2',
    name: 'Grab Voucher',
    description: 'Food delivery voucher',
    type: 'voucher',
    value: 'RM 20',
    probability: 20,
    color: 'from-orange-400 to-red-500',
    emoji: '🍔',
    isActive: true
  },
  {
    id: '3',
    name: 'Bonus Points',
    description: 'Extra reward points',
    type: 'points',
    value: '100 pts',
    probability: 30,
    color: 'from-yellow-400 to-orange-500',
    emoji: '⭐',
    isActive: true
  }
];

const initialShopItems: ShopItem[] = [
  {
    id: '1',
    name: 'Grab Food Voucher',
    description: 'RM 20 off on food delivery',
    category: 'vouchers',
    pointsCost: 150,
    originalValue: 'RM 20',
    discount: 25,
    emoji: '🍔',
    availability: 50,
    isPopular: true,
    isLimited: false,
    isActive: true
  },
  {
    id: '2',
    name: 'Starbucks Voucher',
    description: 'RM 15 Starbucks gift card',
    category: 'vouchers',
    pointsCost: 120,
    originalValue: 'RM 15',
    discount: 20,
    emoji: '☕',
    availability: 30,
    isPopular: false,
    isLimited: false,
    isActive: true
  }
];

export function AdminPanel({ onBack, user, defaultTab = 'overview' }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [prizes, setPrizes] = useState<Prize[]>(initialPrizes);
  const [shopItems, setShopItems] = useState<ShopItem[]>(initialShopItems);
  const [editingPrize, setEditingPrize] = useState<Prize | null>(null);
  const [editingShopItem, setEditingShopItem] = useState<ShopItem | null>(null);
  const [showPrizeDialog, setShowPrizeDialog] = useState(false);
  const [showShopDialog, setShowShopDialog] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Form states
  const [prizeForm, setPrizeForm] = useState<Partial<Prize>>({});
  const [shopForm, setShopForm] = useState<Partial<ShopItem>>({});

  // Analytics & Dashboard data from Supabase
  const [luckyDrawRecords, setLuckyDrawRecords] = useState<any[]>([]);
  const [redeemRecords, setRedeemRecords] = useState<any[]>([]);
  const [userProfiles, setUserProfiles] = useState<any[]>([]);
  const [totalPrizesAwarded, setTotalPrizesAwarded] = useState(0);
  const [totalShopSales, setTotalShopSales] = useState(0);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [prizeDistribution, setPrizeDistribution] = useState<any[]>([]);
  const [shopPerformance, setShopPerformance] = useState<any[]>([]);
  const [platformActivity, setPlatformActivity] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all data from Supabase
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      // Fetch prizes from Supabase (id, name, type, value, probability)
      const { data: prizesData, error: prizesError } = await supabase
        .from('prizes')
        .select('*');

      if (prizesError) throw prizesError;
      if (prizesData) {
        const formattedPrizes = prizesData.map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description || '',
          type: p.type,
          value: p.value,
          probability: p.probability || 0,
          color: p.color || 'from-blue-400 to-purple-500',
          emoji: p.emoji || '🎁',
          isActive: p.is_active !== false
        }));
        setPrizes(formattedPrizes);
      }

      // Fetch shop items from Supabase (id, name, points_cost)
      const { data: shopItemsData, error: shopItemsError } = await supabase
        .from('shop_items')
        .select('*');

      if (shopItemsError) throw shopItemsError;
      if (shopItemsData) {
        const formattedShopItems = shopItemsData.map((item: any) => ({
          id: item.id,
          name: item.name,
          description: item.description || '',
          category: item.category || 'vouchers',
          pointsCost: item.points_cost,
          originalValue: item.original_value || '',
          discount: item.discount || 0,
          emoji: item.emoji || '🎁',
          availability: item.availability || 0,
          isPopular: item.is_popular || false,
          isLimited: item.is_limited || false,
          isActive: item.is_active !== false
        }));
        setShopItems(formattedShopItems);
      }

      // Fetch lucky_draw records with JOIN to prizes table
      const { data: luckyDrawData, error: luckyDrawError } = await supabase
        .from('lucky_draw')
        .select(`
          draw_id,
          user_id,
          reward_id,
          prize_won,
          point_used,
          date,
          created_at,
          prizes (
            id,
            name,
            type,
            value,
            emoji
          ),
          user_profiles (
            username
          )
        `)
        .order('created_at', { ascending: false });

      if (luckyDrawError) throw luckyDrawError;
      setLuckyDrawRecords(luckyDrawData || []);
      setTotalPrizesAwarded(luckyDrawData?.length || 0);

      // Fetch redeem records with JOIN to shop_items table
      const { data: redeemData, error: redeemError } = await supabase
        .from('redeem')
        .select(`
          redeem_id,
          user_id,
          item_id,
          item_name,
          points_spent,
          status,
          created_at,
          shop_items (
            id,
            name,
            category,
            points_cost,
            emoji
          ),
          user_profiles (
            username
          )
        `)
        .order('created_at', { ascending: false });

      if (redeemError) throw redeemError;
      setRedeemRecords(redeemData || []);
      setTotalShopSales(redeemData?.length || 0);

      // Fetch user profiles
      const { data: usersData, error: usersError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (usersError) throw usersError;
      setUserProfiles(usersData || []);

      // Calculate recent activity (merge lucky_draw and redeem)
      const drawActivity = (luckyDrawData || []).slice(0, 10).map((d: any) => {
        return {
          id: d.draw_id,
          type: 'lucky_draw',
          user: d.user_profiles?.username ?? `User ${d.user_id}`,
          item: d.prize_won || d.prizes?.name || 'Prize',
          emoji: d.prizes?.emoji || '🎁',
          value: d.prizes?.value || d.prize_won || '',
          createdAt: d.created_at
        };
      });

      const redeemActivity = (redeemData || []).slice(0, 10).map((r: any) => {
        return {
          id: r.redeem_id,
          type: 'redeem',
          user: r.user_profiles?.username ?? `User ${r.user_id}`,
          item: r.item_name || r.shop_items?.name || 'Item',
          emoji: r.shop_items?.emoji || '🛍️',
          value: `${r.points_spent || r.shop_items?.points_cost || 0} pts`,
          createdAt: r.created_at
        };
      });

      const combinedActivity = [...drawActivity, ...redeemActivity]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10);

      setRecentActivity(combinedActivity);

      // Calculate prize distribution (group by reward_id)
      const prizeCount: { [key: string]: { count: number; prizes: any } } = {};
      (luckyDrawData || []).forEach((draw: any) => {
        const rewardId = draw.reward_id;
        if (rewardId) {
          if (!prizeCount[rewardId]) {
            prizeCount[rewardId] = { count: 0, prizes: draw.prizes };
          }
          prizeCount[rewardId].count += 1;
        }
      });

      const prizeDistData = Object.entries(prizeCount).map(([rewardId, data]) => {
        return {
          prizeId: rewardId,
          prizeName: data.prizes?.name ?? 'Unknown',
          emoji: data.prizes?.emoji || '🎁',
          count: data.count,
          percentage: luckyDrawData && luckyDrawData.length > 0
            ? ((data.count / luckyDrawData.length) * 100).toFixed(1)
            : 0
        };
      }).sort((a, b) => b.count - a.count);

      setPrizeDistribution(prizeDistData);

      // Calculate shop performance (group by item_id)
      const shopCount: { [key: string]: { count: number; shop_items: any; totalPoints: number } } = {};
      (redeemData || []).forEach((redeem: any) => {
        const itemId = redeem.item_id;
        if (itemId) {
          if (!shopCount[itemId]) {
            shopCount[itemId] = { count: 0, shop_items: redeem.shop_items, totalPoints: 0 };
          }
          shopCount[itemId].count += 1;
          shopCount[itemId].totalPoints += (redeem.points_spent || redeem.shop_items?.points_cost || 0);
        }
      });

      const shopPerfData = Object.entries(shopCount).map(([itemId, data]) => {
        return {
          itemId,
          itemName: data.shop_items?.name ?? 'Unknown',
          emoji: data.shop_items?.emoji || '🛍️',
          count: data.count,
          totalPoints: data.totalPoints
        };
      }).sort((a, b) => b.count - a.count);

      setShopPerformance(shopPerfData);

      // Calculate platform activity (lucky_draw count per day for last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
      });

      const activityByDay = last7Days.map(day => {
        const count = (luckyDrawData || []).filter((draw: any) => {
          const drawDate = new Date(draw.created_at).toISOString().split('T')[0];
          return drawDate === day;
        }).length;

        return {
          date: day,
          count,
          label: new Date(day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        };
      });

      setPlatformActivity(activityByDay);

    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data from database');
    } finally {
      setIsLoading(false);
    }
  };

  const resetPrizeForm = () => {
    setPrizeForm({
      name: '',
      description: '',
      type: 'points',
      value: '',
      probability: 10,
      color: 'from-blue-400 to-purple-500',
      emoji: '🎁',
      isActive: true
    });
  };

  const resetShopForm = () => {
    setShopForm({
      name: '',
      description: '',
      category: 'vouchers',
      pointsCost: 100,
      originalValue: '',
      discount: 0,
      emoji: '🎁',
      availability: 50,
      isPopular: false,
      isLimited: false,
      isActive: true
    });
  };

  const handleAddPrize = () => {
    setEditingPrize(null);
    resetPrizeForm();
    setShowPrizeDialog(true);
  };

  const handleEditPrize = (prize: Prize) => {
    setEditingPrize(prize);
    setPrizeForm(prize);
    setShowPrizeDialog(true);
  };

  const handleSavePrize = () => {
    if (!prizeForm.name || !prizeForm.value || !prizeForm.probability) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newPrize: Prize = {
      id: editingPrize?.id || Date.now().toString(),
      name: prizeForm.name!,
      description: prizeForm.description!,
      type: prizeForm.type!,
      value: prizeForm.value!,
      probability: prizeForm.probability!,
      color: prizeForm.color!,
      emoji: prizeForm.emoji!,
      isActive: prizeForm.isActive!
    };

    if (editingPrize) {
      setPrizes(prev => prev.map(p => p.id === editingPrize.id ? newPrize : p));
      toast.success('Prize updated successfully');
    } else {
      setPrizes(prev => [...prev, newPrize]);
      toast.success('Prize added successfully');
    }

    setShowPrizeDialog(false);
    setEditingPrize(null);
    resetPrizeForm();
  };

  const handleDeletePrize = (id: string) => {
    setPrizes(prev => prev.filter(p => p.id !== id));
    toast.success('Prize deleted successfully');
  };

  const handleAddShopItem = () => {
    setEditingShopItem(null);
    resetShopForm();
    setShowShopDialog(true);
  };

  const handleEditShopItem = (item: ShopItem) => {
    setEditingShopItem(item);
    setShopForm(item);
    setShowShopDialog(true);
  };

  const handleSaveShopItem = () => {
    if (!shopForm.name || !shopForm.originalValue || !shopForm.pointsCost) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newItem: ShopItem = {
      id: editingShopItem?.id || Date.now().toString(),
      name: shopForm.name!,
      description: shopForm.description!,
      category: shopForm.category!,
      pointsCost: shopForm.pointsCost!,
      originalValue: shopForm.originalValue!,
      discount: shopForm.discount!,
      emoji: shopForm.emoji!,
      availability: shopForm.availability!,
      isPopular: shopForm.isPopular!,
      isLimited: shopForm.isLimited!,
      isActive: shopForm.isActive!
    };

    if (editingShopItem) {
      setShopItems(prev => prev.map(i => i.id === editingShopItem.id ? newItem : i));
      toast.success('Shop item updated successfully');
    } else {
      setShopItems(prev => [...prev, newItem]);
      toast.success('Shop item added successfully');
    }

    setShowShopDialog(false);
    setEditingShopItem(null);
    resetShopForm();
  };

  const handleDeleteShopItem = (id: string) => {
    setShopItems(prev => prev.filter(i => i.id !== id));
    toast.success('Shop item deleted successfully');
  };

  const exportData = () => {
    const data = {
      prizes: prizes,
      shopItems: shopItems,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sfms-admin-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Data exported successfully');
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.prizes) setPrizes(data.prizes);
        if (data.shopItems) setShopItems(data.shopItems);
        toast.success('Data imported successfully');
      } catch (error) {
        toast.error('Failed to import data. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  // Analytics calculations
  const totalActivePrizes = prizes.filter(p => p.isActive).length;
  const totalActiveShopItems = shopItems.filter(i => i.isActive).length;
  const totalProbability = prizes.reduce((sum, p) => sum + (p.isActive ? p.probability : 0), 0);
  const averageShopPrice = shopItems.reduce((sum, i) => sum + i.pointsCost, 0) / shopItems.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button
            onClick={onBack}
            variant="ghost"
            className="cartoon-button bg-white/80 backdrop-blur-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center"
            >
              <Settings className="w-4 h-4 text-white" />
            </motion.div>
            <h1 className="text-xl font-bold text-gray-800">Admin Panel</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            variant="outline"
            className="cartoon-button"
          >
            {isPreviewMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
          
          <Button
            onClick={exportData}
            variant="outline"
            className="cartoon-button"
          >
            <Download className="w-4 h-4" />
          </Button>
          
          <label htmlFor="import-file">
            <Button variant="outline" className="cartoon-button" asChild>
              <span>
                <Upload className="w-4 h-4" />
              </span>
            </Button>
          </label>
          <input
            id="import-file"
            type="file"
            accept=".json"
            onChange={importData}
            className="hidden"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 cartoon-card bg-white/80 backdrop-blur-sm">
          <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
            📊 Overview
          </TabsTrigger>
          <TabsTrigger value="lucky-draw" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white">
            🎰 Lucky Draw
          </TabsTrigger>
          <TabsTrigger value="shop" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-red-500 data-[state=active]:text-white">
            🛒 Shop
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-blue-500 data-[state=active]:text-white">
            📈 Analytics
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="cartoon-card bg-gradient-to-br from-blue-50 to-purple-50">
              <CardContent className="p-4 text-center">
                <Gift className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                <p className="text-2xl font-bold text-purple-600">{isLoading ? '...' : totalActivePrizes}</p>
                <p className="text-sm text-gray-600">Active Prizes</p>
              </CardContent>
            </Card>

            <Card className="cartoon-card bg-gradient-to-br from-pink-50 to-red-50">
              <CardContent className="p-4 text-center">
                <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-pink-500" />
                <p className="text-2xl font-bold text-pink-600">{isLoading ? '...' : totalActiveShopItems}</p>
                <p className="text-sm text-gray-600">Shop Items</p>
              </CardContent>
            </Card>

            <Card className="cartoon-card bg-gradient-to-br from-yellow-50 to-orange-50">
              <CardContent className="p-4 text-center">
                <Trophy className="w-8 h-8 mx-auto mb-2 text-orange-500" />
                <p className="text-2xl font-bold text-orange-600">{isLoading ? '...' : totalPrizesAwarded}</p>
                <p className="text-sm text-gray-600">Prizes Awarded</p>
              </CardContent>
            </Card>

            <Card className="cartoon-card bg-gradient-to-br from-green-50 to-emerald-50">
              <CardContent className="p-4 text-center">
                <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <p className="text-2xl font-bold text-green-600">{isLoading ? '...' : totalShopSales}</p>
                <p className="text-sm text-gray-600">Shop Sales</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="cartoon-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-500" />
                  Platform Activity (Last 7 Days)
                </CardTitle>
                <CardDescription>Lucky Draw spins per day</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-gray-500">Loading...</div>
                ) : platformActivity.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No activity data yet</div>
                ) : (
                  <div className="space-y-3">
                    {platformActivity.map((day, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">{day.label}</span>
                          <span className="text-sm text-gray-600">{day.count} spins</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min((day.count / Math.max(...platformActivity.map(d => d.count), 1)) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="cartoon-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-green-500" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Latest lucky draws and redemptions</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-gray-500">Loading...</div>
                ) : recentActivity.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No activity yet</div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {recentActivity.slice(0, 5).map((activity, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{activity.emoji}</span>
                          <div>
                            <p className="font-medium text-gray-800 text-sm">{activity.item}</p>
                            <p className="text-xs text-gray-600">{activity.user}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={activity.type === 'lucky_draw' ? 'bg-purple-100 text-purple-800 text-xs' : 'bg-green-100 text-green-800 text-xs'}>
                            {activity.type === 'lucky_draw' ? '🎰 Draw' : '🛒 Redeem'}
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">{activity.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Lucky Draw Management Tab */}
        <TabsContent value="lucky-draw" className="space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Lucky Draw Prizes</h2>
              <p className="text-sm text-gray-600">Manage prizes and their probabilities</p>
            </div>
            <Button onClick={handleAddPrize} className="cartoon-button bg-gradient-to-r from-purple-500 to-pink-500 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Prize
            </Button>
          </div>

          <Card className="cartoon-card">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Prize</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Probability</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prizes.map((prize) => (
                    <TableRow key={prize.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{prize.emoji}</span>
                          <div>
                            <p className="font-medium">{prize.name}</p>
                            <p className="text-sm text-gray-600">{prize.description}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          prize.type === 'points' ? 'bg-yellow-100 text-yellow-800' :
                          prize.type === 'voucher' ? 'bg-purple-100 text-purple-800' :
                          prize.type === 'cashback' ? 'bg-green-100 text-green-800' :
                          'bg-pink-100 text-pink-800'
                        }>
                          {prize.type === 'points' && '⭐ Points'}
                          {prize.type === 'voucher' && '🎫 Voucher'}
                          {prize.type === 'cashback' && '💰 Cashback'}
                          {prize.type === 'gift' && '🎁 Gift'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {prize.type === 'points' && (
                          <span className="text-yellow-600">{prize.value}</span>
                        )}
                        {(prize.type === 'voucher' || prize.type === 'cashback') && (
                          <span className="text-green-600">{prize.value}</span>
                        )}
                        {prize.type === 'gift' && (
                          <span className="text-purple-600">{prize.value}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{prize.probability}%</span>
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-purple-500 rounded-full"
                              style={{ width: `${Math.min(prize.probability, 100)}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={prize.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>
                          {prize.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => handleEditPrize(prize)}
                            size="sm"
                            variant="outline"
                            className="cartoon-button"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive" className="cartoon-button">
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Prize</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{prize.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeletePrize(prize.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shop Management Tab */}
        <TabsContent value="shop" className="space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Rewards Shop Items</h2>
              <p className="text-sm text-gray-600">Manage shop items, prices, and availability</p>
            </div>
            <Button onClick={handleAddShopItem} className="cartoon-button bg-gradient-to-r from-pink-500 to-red-500 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>

          <Card className="cartoon-card">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shopItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{item.emoji}</span>
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-gray-600">{item.description}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-purple-100 text-purple-800">{item.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.pointsCost} pts</p>
                          <p className="text-sm text-gray-600">{item.originalValue}</p>
                          {item.discount > 0 && (
                            <Badge className="bg-green-100 text-green-800 text-xs">
                              {item.discount}% OFF
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{item.availability}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {item.isPopular && (
                            <Badge className="bg-orange-100 text-orange-800 text-xs">Popular</Badge>
                          )}
                          {item.isLimited && (
                            <Badge className="bg-red-100 text-red-800 text-xs">Limited</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={item.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>
                          {item.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => handleEditShopItem(item)}
                            size="sm"
                            variant="outline"
                            className="cartoon-button"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive" className="cartoon-button">
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Shop Item</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{item.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteShopItem(item.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recent User Activity */}
            <Card className="cartoon-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  Recent User Activity
                </CardTitle>
                <CardDescription>Latest user sign-ups</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-gray-500">Loading...</div>
                ) : userProfiles.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No users yet</div>
                ) : (
                  <div className="space-y-3">
                    {userProfiles.slice(0, 5).map((user, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                            {user.username?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{user.username || 'Unknown'}</p>
                            <p className="text-xs text-gray-600">{user.email || 'No email'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">
                            {new Date(user.created_at).toLocaleDateString()}
                          </p>
                          <Badge className="bg-blue-100 text-blue-800 text-xs mt-1">
                            {user.points || 0} pts
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Transaction History */}
            <Card className="cartoon-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-500" />
                  Recent Transaction History
                </CardTitle>
                <CardDescription>Lucky draws and redemptions</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-gray-500">Loading...</div>
                ) : recentActivity.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No transactions yet</div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {recentActivity.slice(0, 10).map((activity, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{activity.emoji}</span>
                          <div>
                            <p className="font-medium text-gray-800 text-xs">{activity.item}</p>
                            <p className="text-xs text-gray-500">{activity.user}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={activity.type === 'lucky_draw' ? 'bg-purple-100 text-purple-800 text-xs' : 'bg-green-100 text-green-800 text-xs'}>
                            {activity.type === 'lucky_draw' ? 'Draw' : 'Redeem'}
                          </Badge>
                          <p className="text-xs text-gray-500">{new Date(activity.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Prize Distribution */}
            <Card className="cartoon-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-500" />
                  Top Prize Distribution
                </CardTitle>
                <CardDescription>Most awarded prizes</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-gray-500">Loading...</div>
                ) : prizeDistribution.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No prize data yet</div>
                ) : (
                  <div className="space-y-4">
                    {prizeDistribution.slice(0, 5).map((prize, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{prize.emoji}</span>
                            <span className="text-sm font-medium text-gray-700">{prize.prizeName}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-bold text-purple-600">{prize.count}</span>
                            <span className="text-xs text-gray-500 ml-1">({prize.percentage}%)</span>
                          </div>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(parseFloat(prize.percentage as string), 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Shop Performance */}
            <Card className="cartoon-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-orange-500" />
                  Top Shop Performance
                </CardTitle>
                <CardDescription>Most redeemed items</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-gray-500">Loading...</div>
                ) : shopPerformance.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No redemption data yet</div>
                ) : (
                  <div className="space-y-3">
                    {shopPerformance.slice(0, 5).map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{item.emoji}</span>
                          <div>
                            <p className="font-medium text-gray-800">{item.itemName}</p>
                            <p className="text-xs text-gray-600">{item.count} redemptions</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-orange-600">{item.totalPoints} pts</p>
                          <p className="text-xs text-gray-500">Total value</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Prize Edit Dialog */}
      <Dialog open={showPrizeDialog} onOpenChange={setShowPrizeDialog}>
        <DialogContent className="cartoon-card max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPrize ? 'Edit Prize' : 'Add New Prize'}</DialogTitle>
            <DialogDescription>
              Configure the prize details and probability
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="prize-name">Name *</Label>
              <Input
                id="prize-name"
                value={prizeForm.name || ''}
                onChange={(e) => setPrizeForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Prize name"
              />
            </div>

            <div>
              <Label htmlFor="prize-emoji">Emoji</Label>
              <div className="space-y-2">
                <Select
                  value={prizeForm.emoji}
                  onValueChange={(value) => setPrizeForm(prev => ({ ...prev, emoji: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an emoji">
                      {prizeForm.emoji ? (
                        <span className="text-2xl">{prizeForm.emoji}</span>
                      ) : (
                        "Select an emoji"
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {/* Gifts & Prizes */}
                    <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">Gifts & Prizes</div>
                    <SelectItem value="🎁"><span className="text-2xl mr-2">🎁</span> Gift Box</SelectItem>
                    <SelectItem value="🎉"><span className="text-2xl mr-2">🎉</span> Party Popper</SelectItem>
                    <SelectItem value="🎊"><span className="text-2xl mr-2">🎊</span> Confetti Ball</SelectItem>
                    <SelectItem value="🏆"><span className="text-2xl mr-2">🏆</span> Trophy</SelectItem>
                    <SelectItem value="🥇"><span className="text-2xl mr-2">🥇</span> 1st Place Medal</SelectItem>
                    <SelectItem value="🥈"><span className="text-2xl mr-2">🥈</span> 2nd Place Medal</SelectItem>
                    <SelectItem value="🥉"><span className="text-2xl mr-2">🥉</span> 3rd Place Medal</SelectItem>
                    <SelectItem value="🎖️"><span className="text-2xl mr-2">🎖️</span> Military Medal</SelectItem>

                    {/* Money & Finance */}
                    <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 mt-2">Money & Finance</div>
                    <SelectItem value="💰"><span className="text-2xl mr-2">💰</span> Money Bag</SelectItem>
                    <SelectItem value="💵"><span className="text-2xl mr-2">💵</span> Dollar Banknote</SelectItem>
                    <SelectItem value="💴"><span className="text-2xl mr-2">💴</span> Yen Banknote</SelectItem>
                    <SelectItem value="💶"><span className="text-2xl mr-2">💶</span> Euro Banknote</SelectItem>
                    <SelectItem value="💷"><span className="text-2xl mr-2">💷</span> Pound Banknote</SelectItem>
                    <SelectItem value="💳"><span className="text-2xl mr-2">💳</span> Credit Card</SelectItem>
                    <SelectItem value="💎"><span className="text-2xl mr-2">💎</span> Gem Stone</SelectItem>
                    <SelectItem value="🪙"><span className="text-2xl mr-2">🪙</span> Coin</SelectItem>

                    {/* Food & Drinks */}
                    <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 mt-2">Food & Drinks</div>
                    <SelectItem value="🍔"><span className="text-2xl mr-2">🍔</span> Hamburger</SelectItem>
                    <SelectItem value="🍕"><span className="text-2xl mr-2">🍕</span> Pizza</SelectItem>
                    <SelectItem value="🍗"><span className="text-2xl mr-2">🍗</span> Poultry Leg</SelectItem>
                    <SelectItem value="🍰"><span className="text-2xl mr-2">🍰</span> Cake</SelectItem>
                    <SelectItem value="🍩"><span className="text-2xl mr-2">🍩</span> Doughnut</SelectItem>
                    <SelectItem value="🍦"><span className="text-2xl mr-2">🍦</span> Ice Cream</SelectItem>
                    <SelectItem value="☕"><span className="text-2xl mr-2">☕</span> Coffee</SelectItem>
                    <SelectItem value="🥤"><span className="text-2xl mr-2">🥤</span> Soft Drink</SelectItem>

                    {/* Shopping */}
                    <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 mt-2">Shopping</div>
                    <SelectItem value="🛍️"><span className="text-2xl mr-2">🛍️</span> Shopping Bags</SelectItem>
                    <SelectItem value="🛒"><span className="text-2xl mr-2">🛒</span> Shopping Cart</SelectItem>
                    <SelectItem value="🎫"><span className="text-2xl mr-2">🎫</span> Ticket</SelectItem>
                    <SelectItem value="🏷️"><span className="text-2xl mr-2">🏷️</span> Label</SelectItem>

                    {/* Entertainment */}
                    <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 mt-2">Entertainment</div>
                    <SelectItem value="🎬"><span className="text-2xl mr-2">🎬</span> Movie Camera</SelectItem>
                    <SelectItem value="🎮"><span className="text-2xl mr-2">🎮</span> Video Game</SelectItem>
                    <SelectItem value="🎵"><span className="text-2xl mr-2">🎵</span> Music Note</SelectItem>
                    <SelectItem value="🎸"><span className="text-2xl mr-2">🎸</span> Guitar</SelectItem>
                    <SelectItem value="🎪"><span className="text-2xl mr-2">🎪</span> Circus Tent</SelectItem>

                    {/* Stars & Magic */}
                    <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 mt-2">Stars & Magic</div>
                    <SelectItem value="⭐"><span className="text-2xl mr-2">⭐</span> Star</SelectItem>
                    <SelectItem value="✨"><span className="text-2xl mr-2">✨</span> Sparkles</SelectItem>
                    <SelectItem value="🌟"><span className="text-2xl mr-2">🌟</span> Glowing Star</SelectItem>
                    <SelectItem value="💫"><span className="text-2xl mr-2">💫</span> Dizzy</SelectItem>
                    <SelectItem value="🔮"><span className="text-2xl mr-2">🔮</span> Crystal Ball</SelectItem>

                    {/* Sports & Health */}
                    <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 mt-2">Sports & Health</div>
                    <SelectItem value="⚽"><span className="text-2xl mr-2">⚽</span> Soccer Ball</SelectItem>
                    <SelectItem value="🏀"><span className="text-2xl mr-2">🏀</span> Basketball</SelectItem>
                    <SelectItem value="🎾"><span className="text-2xl mr-2">🎾</span> Tennis</SelectItem>
                    <SelectItem value="💪"><span className="text-2xl mr-2">💪</span> Flexed Biceps</SelectItem>
                    <SelectItem value="🧘"><span className="text-2xl mr-2">🧘</span> Yoga</SelectItem>

                    {/* Technology */}
                    <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 mt-2">Technology</div>
                    <SelectItem value="📱"><span className="text-2xl mr-2">📱</span> Mobile Phone</SelectItem>
                    <SelectItem value="💻"><span className="text-2xl mr-2">💻</span> Laptop</SelectItem>
                    <SelectItem value="⌚"><span className="text-2xl mr-2">⌚</span> Watch</SelectItem>
                    <SelectItem value="🎧"><span className="text-2xl mr-2">🎧</span> Headphone</SelectItem>
                    <SelectItem value="📷"><span className="text-2xl mr-2">📷</span> Camera</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">Or enter a custom emoji below:</p>
                <Input
                  id="prize-emoji-custom"
                  value={prizeForm.emoji || ''}
                  onChange={(e) => setPrizeForm(prev => ({ ...prev, emoji: e.target.value }))}
                  placeholder="🎁 Type any emoji"
                  className="text-2xl text-center"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="prize-description">Description</Label>
              <Textarea
                id="prize-description"
                value={prizeForm.description || ''}
                onChange={(e) => setPrizeForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Prize description"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="prize-type">Type *</Label>
              <Select
                value={prizeForm.type}
                onValueChange={(value) => {
                  setPrizeForm(prev => ({ ...prev, type: value as any }));
                  // Auto-format value based on type
                  if (value === 'points' && prev.value && !prev.value.includes('pts')) {
                    const numericValue = prev.value.replace(/[^0-9]/g, '');
                    setPrizeForm(prev => ({ ...prev, value: numericValue ? `${numericValue} pts` : '' }));
                  } else if ((value === 'voucher' || value === 'cashback') && prev.value && !prev.value.includes('RM')) {
                    const numericValue = prev.value.replace(/[^0-9]/g, '');
                    setPrizeForm(prev => ({ ...prev, value: numericValue ? `RM ${numericValue}` : '' }));
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="points">
                    <div className="flex items-center gap-2">
                      <span>⭐</span>
                      <span>Points</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="voucher">
                    <div className="flex items-center gap-2">
                      <span>🎫</span>
                      <span>Voucher</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="cashback">
                    <div className="flex items-center gap-2">
                      <span>💰</span>
                      <span>Cashback</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="gift">
                    <div className="flex items-center gap-2">
                      <span>🎁</span>
                      <span>Gift</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="prize-value">
                Value *
                {prizeForm.type && (
                  <span className="ml-2 text-xs text-gray-500">
                    {prizeForm.type === 'points' && '(e.g., 100 pts)'}
                    {(prizeForm.type === 'voucher' || prizeForm.type === 'cashback') && '(e.g., RM 10)'}
                    {prizeForm.type === 'gift' && '(e.g., Free Coffee)'}
                  </span>
                )}
              </Label>
              <Input
                id="prize-value"
                value={prizeForm.value || ''}
                onChange={(e) => {
                  let value = e.target.value;

                  // Auto-format based on type
                  if (prizeForm.type === 'points') {
                    // Extract numbers only and add " pts"
                    const num = value.replace(/[^0-9]/g, '');
                    value = num ? `${num} pts` : '';
                  } else if (prizeForm.type === 'voucher' || prizeForm.type === 'cashback') {
                    // Extract numbers only and add "RM "
                    const num = value.replace(/[^0-9]/g, '');
                    value = num ? `RM ${num}` : '';
                  }

                  setPrizeForm(prev => ({ ...prev, value }));
                }}
                placeholder={
                  prizeForm.type === 'points' ? '100' :
                  (prizeForm.type === 'voucher' || prizeForm.type === 'cashback') ? '10' :
                  'Enter description'
                }
              />
              <p className="text-xs text-gray-500 mt-1">
                {prizeForm.type === 'points' && '🔢 Enter number only, format auto-applied (e.g., type "100" → "100 pts")'}
                {(prizeForm.type === 'voucher' || prizeForm.type === 'cashback') && '💵 Enter number only, format auto-applied (e.g., type "10" → "RM 10")'}
                {prizeForm.type === 'gift' && '📝 Enter text description (e.g., "Free Coffee", "T-Shirt")'}
                {!prizeForm.type && '⚠️ Select a type first'}
              </p>
            </div>

            <div>
              <Label htmlFor="prize-probability">Probability (%) *</Label>
              <Input
                id="prize-probability"
                type="number"
                min="0"
                max="100"
                value={prizeForm.probability || ''}
                onChange={(e) => setPrizeForm(prev => ({ ...prev, probability: Number(e.target.value) }))}
                placeholder="10"
              />
            </div>

            <div>
              <Label htmlFor="prize-color">Color Gradient</Label>
              <Select value={prizeForm.color} onValueChange={(value) => setPrizeForm(prev => ({ ...prev, color: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select color" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="from-blue-400 to-purple-500">Blue to Purple</SelectItem>
                  <SelectItem value="from-green-400 to-emerald-500">Green to Emerald</SelectItem>
                  <SelectItem value="from-yellow-400 to-orange-500">Yellow to Orange</SelectItem>
                  <SelectItem value="from-pink-400 to-purple-500">Pink to Purple</SelectItem>
                  <SelectItem value="from-orange-400 to-red-500">Orange to Red</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={prizeForm.isActive}
                onCheckedChange={(checked) => setPrizeForm(prev => ({ ...prev, isActive: checked }))}
              />
              <Label>Active</Label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={() => setShowPrizeDialog(false)} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSavePrize} className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
              {editingPrize ? 'Update' : 'Add'} Prize
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Shop Item Edit Dialog */}
      <Dialog open={showShopDialog} onOpenChange={setShowShopDialog}>
        <DialogContent className="cartoon-card max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingShopItem ? 'Edit Shop Item' : 'Add New Shop Item'}</DialogTitle>
            <DialogDescription>
              Configure the shop item details and pricing
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="shop-name">Name *</Label>
                <Input
                  id="shop-name"
                  value={shopForm.name || ''}
                  onChange={(e) => setShopForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Item name"
                />
              </div>
              <div>
                <Label htmlFor="shop-emoji">Emoji</Label>
                <Input
                  id="shop-emoji"
                  value={shopForm.emoji || ''}
                  onChange={(e) => setShopForm(prev => ({ ...prev, emoji: e.target.value }))}
                  placeholder="🎁"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="shop-description">Description</Label>
              <Textarea
                id="shop-description"
                value={shopForm.description || ''}
                onChange={(e) => setShopForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Item description"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="shop-category">Category</Label>
                <Select value={shopForm.category} onValueChange={(value) => setShopForm(prev => ({ ...prev, category: value as any }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vouchers">Vouchers</SelectItem>
                    <SelectItem value="cashback">Cashback</SelectItem>
                    <SelectItem value="experiences">Experiences</SelectItem>
                    <SelectItem value="digital">Digital</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="shop-value">Original Value *</Label>
                <Input
                  id="shop-value"
                  value={shopForm.originalValue || ''}
                  onChange={(e) => setShopForm(prev => ({ ...prev, originalValue: e.target.value }))}
                  placeholder="RM 20"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="shop-cost">Points Cost *</Label>
                <Input
                  id="shop-cost"
                  type="number"
                  min="1"
                  value={shopForm.pointsCost || ''}
                  onChange={(e) => setShopForm(prev => ({ ...prev, pointsCost: Number(e.target.value) }))}
                  placeholder="100"
                />
              </div>
              <div>
                <Label htmlFor="shop-discount">Discount (%)</Label>
                <Input
                  id="shop-discount"
                  type="number"
                  min="0"
                  max="100"
                  value={shopForm.discount || ''}
                  onChange={(e) => setShopForm(prev => ({ ...prev, discount: Number(e.target.value) }))}
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="shop-availability">Stock Availability</Label>
              <Input
                id="shop-availability"
                type="number"
                min="0"
                value={shopForm.availability || ''}
                onChange={(e) => setShopForm(prev => ({ ...prev, availability: Number(e.target.value) }))}
                placeholder="50"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={shopForm.isPopular}
                  onCheckedChange={(checked) => setShopForm(prev => ({ ...prev, isPopular: checked }))}
                />
                <Label>Popular Item</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={shopForm.isLimited}
                  onCheckedChange={(checked) => setShopForm(prev => ({ ...prev, isLimited: checked }))}
                />
                <Label>Limited Edition</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={shopForm.isActive}
                  onCheckedChange={(checked) => setShopForm(prev => ({ ...prev, isActive: checked }))}
                />
                <Label>Active</Label>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={() => setShowShopDialog(false)} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSaveShopItem} className="flex-1 bg-gradient-to-r from-pink-500 to-red-500 text-white">
              {editingShopItem ? 'Update' : 'Add'} Item
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
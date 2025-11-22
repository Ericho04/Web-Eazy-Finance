
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SimpleEmojiPicker } from './components/SimpleEmojiPicker';

import {
  LayoutDashboard,
  Gift,
  ShoppingCart,
  BarChart3,
  Users,
  Settings,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Bell,
  User,
  LogOut,
  Shield,
  Database,
  TrendingUp,
  Package,
  Percent,
  DollarSign,
  Star,
  Eye,
  EyeOff,
  Copy,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Activity,
  Loader2,
  ArrowDown,
  ArrowUp,
  TrendingDown
} from 'lucide-react';

// --- 导入 Supabase ---
import * as SupabaseModule from './supabase/supabase.ts';
const supabase = SupabaseModule.supabase;

// --- 导入 UI 组件 ---
import { Button } from './components/ui/button.tsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card.tsx';
import { Badge } from './components/ui/badge.tsx';
import { Input } from './components/ui/input.tsx';
import { Label } from './components/ui/label.tsx';
import { Textarea } from './components/ui/textarea.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select.tsx';
import { Switch } from './components/ui/switch.tsx';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog.tsx';
import { Avatar, AvatarFallback, AvatarImage } from './components/ui/avatar.tsx';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './components/ui/dropdown-menu.tsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './components/ui/table.tsx';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './components/ui/tooltip.tsx';
import { SidebarProvider, Sidebar, SidebarContent, SidebarMenuItem, SidebarTrigger, SidebarMenuButton } from './components/ui/sidebar.tsx';
import { toast } from 'sonner';

// --- 数据接口 (Interfaces) ---

interface Prize {
  id: number; // 修复: 数据库中是 BIGINT (数字)
  name: string;
  description: string;
  type: 'voucher' | 'points' | 'cashback' | 'gift';
  value?: string;
  probability: number;
  color: string;
  emoji: string;
  isActive: boolean;
  timesWon: number;
  created_at: string; // 数据库自动添加
  updated_at: string; // 数据库自动添加
}

interface ShopItem {
  id: string; // 数据库中是 UUID (字符串)
  name: string;
  description: string;
  pointsCost: number;
  stock: number;
  category: 'vouchers' | 'cashback' | 'experiences' | 'digital';
  imageUrl: string;
  isActive: boolean;
  isLimited: boolean;
  timesPurchased: number;
  created_at: string; // 数据库自动添加
  updated_at: string; // 数据库自动添加
}

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'super_admin';
  avatar?: string;
  lastLogin: string;
}

interface DashboardStats {
  totalUsers: number;
  totalCost: number;
  totalPrizesAwarded: number;
  totalShopSales: number;
}

interface AnalyticsData {
  userActivity: any[];
  transactionHistory: any[];
  prizeDistribution: any[];
  shopPerformance: any[];
}

interface AdminWebAppProps {
  user: AdminUser;
  onLogout: () => void;
}

export default function AdminWebApp({ user, onLogout }: AdminWebAppProps) {
  const [currentView, setCurrentView] = useState('dashboard');

  // --- 状态变量 (State Variables) ---
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [isLoadingPrizes, setIsLoadingPrizes] = useState(true);
  const [isLoadingShopItems, setIsLoadingShopItems] = useState(true);

  const [showPrizeDialog, setShowPrizeDialog] = useState(false);
  const [showShopDialog, setShowShopDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [prizeForm, setPrizeForm] = useState<Partial<Prize>>({});
  const [shopForm, setShopForm] = useState<Partial<ShopItem>>({});

  const [isPrizeFormValid, setIsPrizeFormValid] = useState(false);
  const [isShopItemFormValid, setIsShopItemFormValid] = useState(false);

  const [isDashboardLoading, setIsDashboardLoading] = useState(true);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(true);

  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalCost: 0,
    totalPrizesAwarded: 0,
    totalShopSales: 0,
  });

  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    userActivity: [],
    transactionHistory: [],
    prizeDistribution: [],
    shopPerformance: [],
  });


  // --- 数据获取 (Data Fetching) ---

  // [已连接] 获取 Dashboard 数据
  async function fetchDashboardData() {
    setIsDashboardLoading(true);
    try {
      const userCountRes = await supabase.from('user_profiles').select('*', { count: 'exact', head: true });
      const prizesRes = await supabase.from('prizes').select('value, timesWon');
      const shopRes = await supabase.from('shop_items').select('pointsCost, timesPurchased');

      const totalUsers = userCountRes.count ?? 0;

      const totalPrizesAwarded = prizesRes.data?.reduce(
        (acc, prize) => acc + (prize.timesWon || 0), 0
      ) ?? 0;

      const totalShopSales = shopRes.data?.reduce(
        (acc, item) => acc + (item.timesPurchased || 0), 0
      ) ?? 0;

      const totalShopCost = shopRes.data?.reduce(
        (acc, item) => acc + (item.pointsCost || 0) * (item.timesPurchased || 0), 0
      ) ?? 0;

      const totalPrizeCost = prizesRes.data?.reduce(
        (acc, prize) => {
          const prizeValue = parseFloat(prize.value) || 0;
          return acc + (prizeValue * (prize.timesWon || 0));
        }, 0
      ) ?? 0;

      const totalCost = totalShopCost + totalPrizeCost;

      setDashboardStats({
        totalUsers,
        totalCost,
        totalPrizesAwarded,
        totalShopSales
      });

    } catch (error) {
      toast.error('Failed to fetch dashboard data', { description: error.message });
      console.error('Dashboard fetch error:', error);
    } finally {
      setIsDashboardLoading(false);
    }
  }

  // [已连接] 获取 Analytics 数据
  async function fetchAnalyticsData() {
    setIsAnalyticsLoading(true);
    try {
      const userActivityRes = await supabase.from('user_profiles')
          .select('id, created_at, full_name, email')
          .order('created_at', { ascending: false })
          .limit(10);

      const transactionHistoryRes = await supabase.from('transactions')
          .select('created_at, description, amount, type, user_profiles(full_name, email)')
          .order('created_at', { ascending: false })
          .limit(10);

      const prizeDistributionRes = await supabase.from('prizes')
          .select('id, name, timesWon, type')
          .order('timesWon', { ascending: false })
          .limit(5);

      const shopPerformanceRes = await supabase.from('shop_items')
          .select('id, name, timesPurchased, pointsCost')
          .order('timesPurchased', { ascending: false })
          .limit(5);

      setAnalyticsData({
        userActivity: userActivityRes.data ?? [],
        transactionHistory: transactionHistoryRes.data ?? [],
        prizeDistribution: prizeDistributionRes.data ?? [],
        shopPerformance: shopPerformanceRes.data ?? [],
      });

    } catch (error) {
      toast.error('Failed to fetch analytics data', { description: error.message });
      console.error('Analytics fetch error:', error);
    } finally {
      setIsAnalyticsLoading(false);
    }
  }

  // [已连接] 从数据库获取 Prizes
  async function fetchPrizes() {
    setIsLoadingPrizes(true);
    const { data, error } = await supabase
      .from('prizes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to fetch prizes', { description: error.message });
      console.error('Fetch prizes error:', error);
      setPrizes([]);
    } else {
      setPrizes(data || []);
    }
    setIsLoadingPrizes(false);
  }

  // [已连接] 从数据库获取 Shop Items
  async function fetchShopItems() {
    setIsLoadingShopItems(true);
    const { data, error } = await supabase
      .from('shop_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to fetch shop items', { description: error.message });
      console.error('Fetch shop items error:', error);
      setShopItems([]);
    } else {
      setShopItems(data || []);
    }
    setIsLoadingShopItems(false);
  }

  // --- 表单验证 (Form Validation) ---
  useEffect(() => {
    const { name, type, probability, color, emoji } = prizeForm;
    setIsPrizeFormValid(
      !!name && !!type && probability != null && probability >= 0 && !!color && !!emoji
    );
  }, [prizeForm]);

  useEffect(() => {
    const { name, description, pointsCost, stock, category, imageUrl } = shopForm;
    setIsShopItemFormValid(
      !!name && !!description && pointsCost != null && pointsCost > 0 && stock != null && stock >= 0 && !!category && !!imageUrl
    );
  }, [shopForm]);

  // --- 视图切换 (View Switching) ---

  // [已连接] 此 useEffect 会在视图切换时获取相应数据
  useEffect(() => {
    fetchDataForView(currentView);
  }, [currentView]);

  // [已连接] 帮助函数，决定获取什么数据
  function fetchDataForView(view: string) {
    if (view === 'dashboard') {
      fetchDashboardData();
    } else if (view === 'analytics') {
      fetchAnalyticsData();
    } else if (view === 'prizes') {
      fetchPrizes(); // <-- 已连接
    } else if (view === 'shop') {
      fetchShopItems(); // <-- 已连接
    }
  }


  // --- CRUD 操作 (CRUD Handlers) ---

  // [已连接] 打开 Prize 对话框
  const handleOpenPrizeDialog = (prize: Prize | null = null) => {
    if (prize) {
      setPrizeForm(prize);
    } else {
      setPrizeForm({
        name: '',
        description: '',
        type: 'points',
        value: '100',
        probability: 10,
        color: 'from-blue-400 to-purple-500',
        emoji: '🎁',
        isActive: true,
      });
    }
    setShowPrizeDialog(true);
  };

  // [已连接] 保存 Prize (创建或更新)
  const handleSavePrize = async () => {
    setIsSaving(true);

    const prizeToSave = {
      ...prizeForm,
      probability: Number(prizeForm.probability) || 0,
    };

    const { error } = await supabase.from('prizes').upsert(prizeToSave);

    if (error) {
      toast.error('Failed to save prize', { description: error.message });
      console.error('Save prize error:', error);
    } else {
      toast.success(`Prize ${prizeForm.id ? 'updated' : 'created'} successfully!`);
      setShowPrizeDialog(false);
      fetchPrizes();
    }
    setIsSaving(false);
  };

  // [已连接] 删除 Prize
  const handleDeletePrize = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this prize?')) {

      const { error } = await supabase.from('prizes').delete().match({ id: id });

      if (error) {
        toast.error('Failed to delete prize', { description: error.message });
        console.error('Delete prize error:', error);
      } else {
        toast.success('Prize deleted successfully!');
        fetchPrizes();
      }
    }
  };

  // [已连接] 打开 Shop 对话框
  const handleOpenShopDialog = (item: ShopItem | null = null) => {
    if (item) {
      setShopForm(item);
    } else {
      setShopForm({
        name: '',
        description: '',
        pointsCost: 1000,
        stock: 100,
        category: 'vouchers',
        imageUrl: '',
        isActive: true,
        isLimited: false,
      });
    }
    setShowShopDialog(true);
  };

  // [已连接] 保存 Shop Item (创建或更新)
  const handleSaveShopItem = async () => {
    setIsSaving(true);

    const itemToSave = {
      ...shopForm,
      pointsCost: Number(shopForm.pointsCost) || 0,
      stock: Number(shopForm.stock) || 0,
    };

    const { error } = await supabase.from('shop_items').upsert(itemToSave);

    if (error) {
      toast.error('Failed to save shop item', { description: error.message });
      console.error('Save shop item error:', error);
    } else {
      toast.success(`Shop item ${shopForm.id ? 'updated' : 'created'} successfully!`);
      setShowShopDialog(false);
      fetchShopItems();
    }
    setIsSaving(false);
  };

  // [已连接] 删除 Shop Item
  const handleDeleteShopItem = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this shop item?')) {

      const { error } = await supabase.from('shop_items').delete().match({ id: id });

      if (error) {
        toast.error('Failed to delete shop item', { description: error.message });
        console.error('Delete shop item error:', error);
      } else {
        toast.success('Shop item deleted successfully!');
        fetchShopItems();
      }
    }
  };

  // 辅助函数
  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} copied to clipboard!`);
  };

  // --- 导航与视图渲染 (Navigation & View Rendering) ---
  const navigationItems = [
    { name: 'Dashboard', icon: LayoutDashboard, view: 'dashboard' },
    { name: 'Prizes', icon: Gift, view: 'prizes' },
    { name: 'Shop Items', icon: ShoppingCart, view: 'shop' },
    { name: 'Analytics', icon: BarChart3, view: 'analytics' },
  ];

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return renderDashboard();
      case 'prizes':
        return renderPrizes();
      case 'shop':
        return renderShop();
      case 'analytics':
        return renderAnalytics();
      case 'users':
      default:
        return <div>Unknown view: {currentView}</div>;
    }
  };


  // =============================================
  // RENDER: DASHBOARD (已连接)
  // =============================================
  const renderDashboard = () => {

    const stats = [ // <-- [修复] 确保这里有 [ ... ]
      { name: 'Total Users', value: dashboardStats.totalUsers, icon: Users, trend: 12, trendType: 'up' },
      { name: 'Total Cost', value: `$${dashboardStats.totalCost.toFixed(2)}`, icon: DollarSign, trend: 5, trendType: 'up' },
      { name: 'Prizes Awarded', value: dashboardStats.totalPrizesAwarded, icon: Gift, trend: 20, trendType: 'up' },
      { name: 'Shop Sales', value: dashboardStats.totalShopSales, icon: ShoppingCart, trend: 3, trendType: 'down' },
    ];

    if (isDashboardLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-gray-300 rounded w-1/3"></div>
                <div className="h-6 w-6 bg-gray-300 rounded-sm"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-300 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-1/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user.name}!</h1>
          <p className="text-muted-foreground">Here's a quick overview of your platform.</p>
        </motion.div>

        {/* Stat Cards */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <motion.div key={stat.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + index * 0.1 }}>
                <Card className="hover:shadow-lg transition-shadow duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.name}</CardTitle>
                    <stat.icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      {stat.trendType === 'up' ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                      +{stat.trend}% from last month
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Chart/Activity Placeholders */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Platform Activity</CardTitle>
                <CardDescription>A chart showing user signups and transactions over time.</CardDescription>
              </CardHeader>
              <CardContent className="h-80 flex items-center justify-center">
                <p className="text-muted-foreground">(Line/Bar Chart Placeholder)</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>A feed of recent platform events.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                  <p className="text-sm">New user <span className="font-medium">"user@example.com"</span> signed up.</p>
                  <span className="text-xs text-muted-foreground ml-auto">10m ago</span>
                </div>
                {/* ... other placeholder activities ... */}
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    );
  };


  // =============================================
  // RENDER: PRIZES (已连接)
  // =============================================
  const renderPrizes = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Manage Prizes</h2>
          <Button onClick={() => handleOpenPrizeDialog(null)}>
            <Plus className="mr-2 h-4 w-4" /> Add New Prize
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Prize List</CardTitle>
            <CardDescription>View and manage all available prizes from the database.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Preview</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Probability</TableHead>
                  <TableHead>Times Won</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingPrizes ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto my-8" />
                    </TableCell>
                  </TableRow>
                ) : prizes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center h-24">
                      No prizes found. Click "Add New Prize" to start.
                    </TableCell>
                  </TableRow>
                ) : prizes.map((prize) => (
                  <TableRow key={prize.id}>
                    <TableCell>
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${prize.color} text-white`}>
                        <span className="text-2xl">{prize.emoji}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{prize.name}</TableCell>
                    <TableCell><Badge variant="outline">{prize.type}</Badge></TableCell>
                    <TableCell>{prize.value || 'N/A'}</TableCell>
                    <TableCell>{prize.probability}%</TableCell>
                    <TableCell>{prize.timesWon}</TableCell>
                    <TableCell>
                      <Badge variant={prize.isActive ? 'default' : 'secondary'}>
                        {prize.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="space-x-2">
                      <Button variant="outline" size="icon" onClick={() => handleOpenPrizeDialog(prize)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDeletePrize(prize.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  };

  // =============================================
  // RENDER: SHOP (已连接)
  // =============================================
  const renderShop = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Manage Shop Items</h2>
          <Button onClick={() => handleOpenShopDialog(null)}>
            <Plus className="mr-2 h-4 w-4" /> Add New Item
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Shop Item List</CardTitle>
            <CardDescription>View and manage all items in the reward shop from the database.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Points Cost</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Times Purchased</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingShopItems ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto my-8" />
                    </TableCell>
                  </TableRow>
                ) : shopItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center h-24">
                      No shop items found. Click "Add New Item" to start.
                    </TableCell>
                  </TableRow>
                ) : shopItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />
                    </TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell><Badge variant="secondary">{item.category}</Badge></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        {item.pointsCost}
                      </div>
                    </TableCell>
                    <TableCell>{item.isLimited ? item.stock : 'Unlimited'}</TableCell>
                    <TableCell>
                      <Badge variant={item.isActive ? 'default' : 'secondary'}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.timesPurchased}</TableCell>
                    <TableCell className="space-x-2">
                      <Button variant="outline" size="icon" onClick={() => handleOpenShopDialog(item)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDeleteShopItem(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  };

  // =============================================
  // RENDER: ANALYTICS (已连接)
  // =============================================
  const renderAnalytics = () => {

    if (isAnalyticsLoading) {
      return (
        <div className="space-y-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-300 rounded w-1/3"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-300 rounded w-full mb-2"></div>
                <div className="h-8 bg-gray-300 rounded w-full mb-2"></div>
                <div className="h-8 bg-gray-300 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">Deep dive into your platform's data.</p>
        </motion.div>

        {/* Recent User Activity */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader>
              <CardTitle>Recent User Activity</CardTitle>
              <CardDescription>New users who signed up recently.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Signed Up</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analyticsData.userActivity.length === 0 ? (
                     <TableRow><TableCell colSpan={3} className="text-center h-24">No user activity found.</TableCell></TableRow>
                  ) : analyticsData.userActivity.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell>{activity.full_name || 'N/A'}</TableCell>
                      <TableCell>{activity.email}</TableCell>
                      <TableCell>{new Date(activity.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Transaction History */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader>
              <CardTitle>Recent Transaction History</CardTitle>
              <CardDescription>Recent transactions from all users.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analyticsData.transactionHistory.length === 0 ? (
                     <TableRow><TableCell colSpan={4} className="text-center h-24">No transaction history found.</TableCell></TableRow>
                  ) : analyticsData.transactionHistory.map((tx, index) => (
                    <TableRow key={index}>
                      <TableCell>{tx.user_profiles?.full_name || 'N/A'}</TableCell>
                      <TableCell>{tx.description}</TableCell>
                      <TableCell className={tx.type === 'income' ? 'text-green-500' : 'text-red-500'}>
                        {tx.type === 'income' ? '+' : '-'}${tx.amount.toFixed(2)}
                      </TableCell>
                      <TableCell>{new Date(tx.created_at).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Prize Distribution */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader>
              <CardTitle>Top Prize Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Prize</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Times Won</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analyticsData.prizeDistribution.length === 0 ? (
                     <TableRow><TableCell colSpan={3} className="text-center h-24">No prizes have been won yet.</TableCell></TableRow>
                  ) : analyticsData.prizeDistribution.map((prize) => (
                    <TableRow key={prize.id}>
                      <TableCell>{prize.name}</TableCell>
                      <TableCell><Badge>{prize.type}</Badge></TableCell>
                      <TableCell>{prize.timesWon}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Shop Performance */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card>
            <CardHeader>
              <CardTitle>Top Shop Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Points Cost</TableHead>
                    <TableHead>Times Purchased</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analyticsData.shopPerformance.length === 0 ? (
                     <TableRow><TableCell colSpan={3} className="text-center h-24">No shop items have been purchased yet.</TableCell></TableRow>
                  ) : analyticsData.shopPerformance.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.pointsCost.toFixed(2)}</TableCell>
                      <TableCell>{item.timesPurchased}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>

      </div>
    );
  };

  // =============================================
  // RENDER: SETTINGS (未连接)
  // =============================================
  const renderSettings = () => {
    // (此部分尚未连接 - 管理员个人资料)
    return (
      <div className="space-y-8 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>

        <Card>
          <CardHeader>
            <CardTitle>Admin Profile</CardTitle>
            <CardDescription>Manage your admin account details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarFallback>{user.name ? user.name.substring(0, 2).toUpperCase() : 'A'}</AvatarFallback>
              </Avatar>
              <Button variant="outline">Change Avatar</Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-name">Name</Label>
              <Input id="admin-name" defaultValue={user.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-email">Email</Label>
              <Input id="admin-email" defaultValue={user.email} disabled />
            </div>
          </CardContent>
          <DialogFooter className="border-t p-4">
            <Button>Save Changes</Button>
          </DialogFooter>
        </Card>
        {/* ... 其他设置卡片 ... */}
      </div>
    );
  };


  // =============================================
  // 主 JSX 结构 (已修复)
  // =============================================
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted/40">

        {/* Sidebar */}
        <Sidebar className="w-64 border-r">
          <SidebarContent className="flex flex-col">
            {/* Sidebar Header */}
            <div className="p-6 border-b">
              <div className="flex items-center gap-3">
                <Shield className="w-8 h-8 text-primary" />
                <span className="text-xl font-semibold">Admin Panel</span>
              </div>
            </div>

            {/* [已修复] 导航菜单 (修复了错误 1) */}
            <nav className="flex-1 p-6 space-y-2">
              {navigationItems.map((item) => (
                (!item.role || (item.role && user.role === 'super_admin')) && (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton
                      onClick={() => setCurrentView(item.view)}
                      isActive={currentView === item.view}
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              ))}
            </nav>

            {/* Sidebar Footer */}
            <div className="mt-auto p-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {user.name ? user.name.substring(0, 2).toUpperCase() : 'A'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </SidebarContent>
        </Sidebar>

        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Header (已修复) */}
          <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-16 items-center px-6">
             <div className="flex items-center gap-4">
               <SidebarTrigger className="lg:hidden" />
               <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search..."
                    className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px]"
                  />
                </div>
             </div>

             <div className="flex items-center gap-4 ml-auto">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Bell className="h-5 w-5" />
                </Button>

                {/* [已修复] 下拉菜单 (修复了错误 2) */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {user.name ? user.name.substring(0, 2).toUpperCase() : 'A'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setCurrentView('settings')}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setCurrentView('settings')}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 overflow-auto p-6" key={currentView}>
            <AnimatePresence mode="wait">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderView()}
              </motion.div>
            </AnimatePresence>
          </main>

          {/* Dialogs */}

          {/* Prize Dialog (已连接) */}
          <Dialog open={showPrizeDialog} onOpenChange={setShowPrizeDialog}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{prizeForm.id ? 'Edit Prize' : 'Add New Prize'}</DialogTitle>
                <DialogDescription>
                  Fill in the details for the prize. Click save when you're done.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="prize-name">Name</Label>
                  <Input id="prize-name" placeholder="E.g., 100 Reward Points" value={prizeForm.name || ''} onChange={(e) => setPrizeForm(prev => ({ ...prev, name: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prize-desc">Description</Label>
                  <Textarea id="prize-desc" placeholder="Brief description of the prize" value={prizeForm.description || ''} onChange={(e) => setPrizeForm(prev => ({ ...prev, description: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="prize-type">Type</Label>
                    <Select value={prizeForm.type} onValueChange={(value) => setPrizeForm(prev => ({ ...prev, type: value as Prize['type'] }))}>
                      <SelectTrigger id="prize-type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="points">Points</SelectItem>
                        <SelectItem value="voucher">Voucher</SelectItem>
                        <SelectItem value="cashback">Cashback</SelectItem>
                        <SelectItem value="gift">Gift</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prize-value">Value</Label>
                    <Input id="prize-value" placeholder="E.g., 100 or 10%" value={prizeForm.value || ''} onChange={(e) => setPrizeForm(prev => ({ ...prev, value: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="prize-prob">Probability (%)</Label>
                    <Input id="prize-prob" type="number" min="0" max="100" placeholder="10" value={prizeForm.probability || 0} onChange={(e) => setPrizeForm(prev => ({ ...prev, probability: parseFloat(e.target.value) }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prize-emoji">Emoji</Label>
                    <SimpleEmojiPicker
                      value={prizeForm.emoji || ''}
                      onChange={(emoji) => setPrizeForm(prev => ({ ...prev, emoji }))}
                      placeholder="🎁"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prize-color">Color (Tailwind)</Label>
                  <Input id="prize-color" placeholder="from-blue-400 to-purple-500" value={prizeForm.color || ''} onChange={(e) => setPrizeForm(prev => ({ ...prev, color: e.target.value }))} />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="prize-active" checked={prizeForm.isActive} onCheckedChange={(checked) => setPrizeForm(prev => ({ ...prev, isActive: checked }))} />
                  <Label htmlFor="prize-active">Active</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowPrizeDialog(false)} disabled={isSaving}>Cancel</Button>
                <Button onClick={handleSavePrize} disabled={isSaving || !isPrizeFormValid}>
                  {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  {isSaving ? 'Saving...' : 'Save Prize'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Shop Item Dialog (已连接) */}
          <Dialog open={showShopDialog} onOpenChange={setShowShopDialog}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{shopForm.id ? 'Edit Shop Item' : 'Add New Shop Item'}</DialogTitle>
                <DialogDescription>
                  Fill in the details for the shop item.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="shop-name">Name</Label>
                  <Input id="shop-name" placeholder="E.g., Grab RM5 Voucher" value={shopForm.name || ''} onChange={(e) => setShopForm(prev => ({ ...prev, name: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shop-desc">Description</Label>
                  <Textarea id="shop-desc" placeholder="Brief description of the item" value={shopForm.description || ''} onChange={(e) => setShopForm(prev => ({ ...prev, description: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shop-image">Image URL</Label>
                  <Input id="shop-image" placeholder="https://example.com/image.png" value={shopForm.imageUrl || ''} onChange={(e) => setShopForm(prev => ({ ...prev, imageUrl: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="shop-price">Price (Points)</Label>
                    {/* [*** 最终修复 ***] */}
                    <Input
                      id="shop-price"
                      type="number"
                      min="0"
                      placeholder="1000"
                      value={shopForm.pointsCost || 0}
                      onChange={(e) => setShopForm(prev => ({ ...prev, pointsCost: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shop-stock">Stock</Label>
                    <Input id="shop-stock" type="number" min="0" placeholder="100" value={shopForm.stock || 0} onChange={(e) => setShopForm(prev => ({ ...prev, stock: parseInt(e.target.value) }))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shop-category">Category</Label>
                  <Select value={shopForm.category} onValueChange={(value) => setShopForm(prev => ({ ...prev, category: value as ShopItem['category'] }))}>
                    <SelectTrigger id="shop-category">
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
                <div className="flex items-center space-x-2">
                  <Switch
                    id="shop-limited"
                    checked={shopForm.isLimited || false}
                    onCheckedChange={(checked) => setShopForm(prev => ({ ...prev, isLimited: checked }))}
                  />
                  <Label htmlFor="shop-limited">Limited Edition</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="shop-active"
                    checked={shopForm.isActive || false}
                    onCheckedChange={(checked) => setShopForm(prev => ({ ...prev, isActive: checked }))}
                  />
                  <Label htmlFor="shop-active">Active</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowShopDialog(false)} disabled={isSaving}>
                  Cancel
                </Button>
                <Button onClick={handleSaveShopItem} disabled={isSaving || !isShopItemFormValid}>
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {isSaving ? 'Saving...' : 'Save Item'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </SidebarProvider>
  );
}
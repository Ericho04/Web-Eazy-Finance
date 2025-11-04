// @ts-nocheck
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
// --- ENGLISH COMMENT ---
// All your original lucide-react imports
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

// --- ENGLISH COMMENT ---
// FIX: This is the "safe" import method for Supabase
import * as SupabaseModule from './supabase/supabase.ts';
const supabase = SupabaseModule.supabase;

// --- ENGLISH COMMENT ---
// All your original ui component imports
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
// FIX: This is the correct spelling from your 'sidebar.tsx' file
import { SidebarProvider, Sidebar, SidebarContent, SidebarMenuItem, SidebarTrigger } from './components/ui/sidebar.tsx';
import { toast } from 'sonner';

// --- ENGLISH COMMENT ---
// All your original interfaces
interface Prize {
  id: string;
  name: string;
  description: string;
  type: 'voucher' | 'points' | 'cashback' | 'gift';
  value?: string;
  probability: number;
  color: string;
  emoji: string;
  isActive: boolean;
  timesWon: number;
  createdAt: string;
  lastModified: string;
}

interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: 'vouchers' | 'cashback' | 'experiences' | 'digital';
  imageUrl: string;
  isActive: boolean;
  isLimited: boolean;
  timesPurchased: number;
  createdAt: string;
  lastModified: string;
}

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'super_admin';
  avatar?: string;
  lastLogin: string;
}

// --- ENGLISH COMMENT ---
// NEW: Interface for our dashboard stats.
interface DashboardStats {
  totalUsers: number;
  totalRevenue: number;
  totalPrizesAwarded: number;
  totalShopSales: number;
}

// --- ENGLISH COMMENT ---
// NEW: Interface for our analytics data.
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

  // --- ENGLISH COMMENT ---
  // All your original state variables
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

  // --- ENGLISH COMMENT ---
  // NEW: State variables for loading and data
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(true);

  // State to hold real dashboard data
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalRevenue: 0,
    totalPrizesAwarded: 0,
    totalShopSales: 0,
  });

  // State to hold real analytics data
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    userActivity: [],
    transactionHistory: [],
    prizeDistribution: [],
    shopPerformance: [],
  });


  // --- ENGLISH COMMENT ---
  //
  // *** THIS IS THE FIX (PART 1) ***
  // We are REMOVING "Promise.all" and fetching one-by-one (sequentially).
  // This prevents the RLS database deadlock (the "infinite spin").
  //
  // =============================================
// [*** 已修复 ***]
async function fetchDashboardData() {
  setIsDashboardLoading(true);
  try {
    const userCountRes = await supabase.from('user_profiles').select('*', { count: 'exact', head: true });
    const prizesRes = await supabase.from('prizes').select('timesWon');
    const shopRes = await supabase.from('shop_items').select('price, timesPurchased');

    // --- 修复开始: 确保所有值 *绝对* 是数字 ---
    const totalUsers = userCountRes.count ?? 0;

    const totalPrizesAwarded = prizesRes.data?.reduce(
      (acc, prize) => acc + (prize.timesWon || 0), 0
    ) ?? 0; // <-- 提供默认值 0

    const totalShopSales = shopRes.data?.reduce(
      (acc, item) => acc + (item.timesPurchased || 0), 0
    ) ?? 0; // <-- 提供默认值 0

    const totalRevenue = shopRes.data?.reduce(
      (acc, item) => acc + (item.price || 0) * (item.timesPurchased || 0), 0
    ) ?? 0; // <-- 提供默认值 0
    // --- 修复结束 ---

    setDashboardStats({
      totalUsers,
      totalRevenue,
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

  // --- ENGLISH COMMENT ---
  //
  // *** THIS IS THE FIX (PART 2) ***
  // We are REMOVING "Promise.all" here as well.
  //
  // =============================================
// [*** 已修复 ***]
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
        .select('id, name, timesPurchased, price')
        .order('timesPurchased', { ascending: false })
        .limit(5);

    // --- 修复开始: 确保所有值 *绝对* 是数组 ---
    // (以防 Supabase 返回 null 而不是 data:[])
    setAnalyticsData({
      userActivity: userActivityRes.data ?? [],
      transactionHistory: transactionHistoryRes.data ?? [],
      prizeDistribution: prizeDistributionRes.data ?? [],
      shopPerformance: shopPerformanceRes.data ?? [],
    });
    // --- 修复结束 ---

  } catch (error) {
    toast.error('Failed to fetch analytics data', { description: error.message });
    console.error('Analytics fetch error:', error);
  } finally {
    setIsAnalyticsLoading(false);
  }
}
  // --- END OF FIX ---


  // --- ENGLISH COMMENT ---
  // All your original useEffects for form validation
  useEffect(() => {
    const { name, type, probability, color, emoji } = prizeForm;
    setIsPrizeFormValid(
      !!name && !!type && probability != null && probability >= 0 && !!color && !!emoji
    );
  }, [prizeForm]);

  useEffect(() => {
    const { name, description, price, stock, category, imageUrl } = shopForm;
    setIsShopItemFormValid(
      !!name && !!description && price != null && price > 0 && stock != null && stock >= 0 && !!category && !!imageUrl
    );
  }, [shopForm]);

  // --- ENGLISH COMMENT ---
  // NEW: Modify useEffect to fetch data on load and view change
  useEffect(() => {
    fetchDataForView(currentView);
  }, [currentView]); // <-- Runs ONCE on mount, and again when currentView changes

  // Helper function to decide which data to fetch
  function fetchDataForView(view: string) {
    if (view === 'dashboard') {
      fetchDashboardData();
    } else if (view === 'analytics') {
      fetchAnalyticsData();
    } else if (view === 'prizes') {
      // (Your original mock data is still used below)
    } else if (view === 'shop') {
      // (Your original mock data is still used below)
    }
  }
  // --- END OF NEW ---


  // --- ENGLISH COMMENT ---
  // All your original data handling functions (UNCHANGED)
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

  const handleSavePrize = async () => {
    setIsSaving(true);
    // ... (Your save logic here)
    console.log('Saving prize:', prizeForm);
    toast.success(`Prize ${prizeForm.id ? 'updated' : 'created'} successfully!`);
    setShowPrizeDialog(false);
    setIsSaving(false);
  };

  const handleDeletePrize = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this prize?')) {
      // ... (Your delete logic here)
      toast.success('Prize deleted successfully!');
    }
  };

  const handleOpenShopDialog = (item: ShopItem | null = null) => {
    if (item) {
      setShopForm(item);
    } else {
      setShopForm({
        name: '',
        description: '',
        price: 10,
        stock: 100,
        category: 'vouchers',
        imageUrl: '',
        isActive: true,
        isLimited: false,
      });
    }
    setShowShopDialog(true);
  };

  const handleSaveShopItem = async () => {
    setIsSaving(true);
    // ... (Your save logic here)
    console.log('Saving shop item:', shopForm);
    toast.success(`Shop item ${shopForm.id ? 'updated' : 'created'} successfully!`);
    setShowShopDialog(false);
    setIsSaving(false);
  };

  const handleDeleteShopItem = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this shop item?')) {
      // ... (Your delete logic here)
      toast.success('Shop item deleted successfully!');
    }
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} copied to clipboard!`);
  };

  // --- ENGLISH COMMENT ---
  // Your original mock data (still used for Prizes/Shop)
  const mockPrizes: Prize[] = [
    { id: '1', name: '100 Reward Points', description: 'Get 100 bonus points!', type: 'points', value: '100', probability: 30, color: 'from-blue-400 to-purple-500', emoji: '✨', isActive: true, timesWon: 120, createdAt: '2023-10-27T10:00:00Z', lastModified: '2023-10-28T10:00:00Z' },
    { id: '2', name: 'RM5 Cashback', description: 'Get RM5 cashback on your next purchase.', type: 'cashback', value: 'RM5', probability: 20, color: 'from-green-400 to-emerald-500', emoji: '💰', isActive: true, timesWon: 80, createdAt: '2023-10-27T10:00:00Z', lastModified: '2023-10-28T10:00:00Z' },
    { id: '3', name: 'Starbucks Voucher', description: 'Free tall-sized drink.', type: 'voucher', value: '1 Free Drink', probability: 10, color: 'from-yellow-400 to-orange-500', emoji: '☕', isActive: false, timesWon: 30, createdAt: '2023-10-27T10:00:00Z', lastModified: '2023-10-28T10:00:00Z' },
  ];

  const mockShopItems: ShopItem[] = [
    { id: '1', name: 'Grab RM10 Voucher', description: 'RM10 off any Grab ride or food order.', price: 1000, stock: 50, category: 'vouchers', imageUrl: 'https://via.placeholder.com/150/008000/FFFFFF?text=Grab', isActive: true, isLimited: true, timesPurchased: 230, createdAt: '2023-10-27T10:00:00Z', lastModified: '2023-10-28T10:00:00Z' },
    { id: '2', name: 'TNG RM5 Reload', description: 'Reload RM5 into your TNG eWallet.', price: 500, stock: 100, category: 'cashback', imageUrl: 'https://via.placeholder.com/150/0000FF/FFFFFF?text=TNG', isActive: true, isLimited: false, timesPurchased: 500, createdAt: '2023-10-27T10:00:00Z', lastModified: '2023-10-28T10:00:00Z' },
    { id: '3', name: 'Netflix 1-Month', description: '1-month basic Netflix subscription.', price: 3500, stock: 20, category: 'digital', imageUrl: 'https://via.placeholder.com/150/FF0000/FFFFFF?text=Netflix', isActive: true, isLimited: true, timesPurchased: 80, createdAt: '2023-10-27T10:00:00Z', lastModified: '2023-10-28T10:00:00Z' },
  ];

  // (We'll use your mock data for now, until you connect fetchPrizes)
  useEffect(() => {
    setPrizes(mockPrizes);
    setIsLoadingPrizes(false);
  }, []);

  // (We'll use your mock data for now)
  useEffect(() => {
    setShopItems(mockShopItems);
    setIsLoadingShopItems(false);
  }, []);

  // --- ENGLISH COMMENT ---
  // All your original navigation and render logic
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
  // RENDER: DASHBOARD (Updated to use real data)
  // =============================================
  const renderDashboard = () => {
    // --- ENGLISH COMMENT ---
    // Use the real data and loading state
    const stats = [
      { name: 'Total Users', value: dashboardStats.totalUsers, icon: Users, trend: 12, trendType: 'up' },
      { name: 'Total Revenue', value: `$${dashboardStats.totalRevenue.toFixed(2)}`, icon: DollarSign, trend: 5, trendType: 'up' },
      { name: 'Prizes Awarded', value: dashboardStats.totalPrizesAwarded, icon: Gift, trend: 20, trendType: 'up' },
      { name: 'Shop Sales', value: dashboardStats.totalShopSales, icon: ShoppingCart, trend: 3, trendType: 'down' },
    ];

    // --- ENGLISH COMMENT ---
    // Show loading skeleton
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

    // --- ENGLISH COMMENT ---
    // This is your original JSX, now populated with real data
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

        {/* Your other original dashboard components */}
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
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>P</AvatarFallback>
                  </Avatar>
                  <p className="text-sm">Prize <span className="font-medium">"RM5 Cashback"</span> awarded.</p>
                  <span className="text-xs text-muted-foreground ml-auto">15m ago</span>
                </div>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>S</AvatarFallback>
                  </Avatar>
                  <p className="text-sm">Item <span className="font-medium">"Grab Voucher"</span> purchased.</p>
                  <span className="text-xs text-muted-foreground ml-auto">1h ago</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    );
  };

  // --- ENGLISH COMMENT ---
  // All your original render functions for other views

  // =============================================
  // RENDER: PRIZES (UNCHANGED from your original)
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
            <CardDescription>View and manage all available prizes.</CardDescription>
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
  // RENDER: SHOP (UNCHANGED from your original)
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
            <CardDescription>View and manage all items in the reward shop.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
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
                        {item.price}
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
  // RENDER: ANALYTICS (Updated to use real data)
  // =============================================
  const renderAnalytics = () => {

    // --- ENGLISH COMMENT ---
    // Show loading skeleton
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

    // --- ENGLISH COMMENT ---
    // This is your original JSX, now populated with real data
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
                  {/* Use REAL data */}
                  {analyticsData.userActivity.map((activity) => (
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
                  {/* Use REAL data */}
                  {analyticsData.transactionHistory.map((tx, index) => (
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

        {/* Prize Distribution */}
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
                  {/* Use REAL data */}
                  {analyticsData.prizeDistribution.map((prize) => (
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

        {/* Shop Performance */}
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
                    <TableHead>Price</TableHead>
                    <TableHead>Times Purchased</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Use REAL data */}
                  {analyticsData.shopPerformance.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>${item.price.toFixed(2)}</TableCell>
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
  // RENDER: USER MANAGEMENT (UNCHANGED from your original)
  // =============================================
  const renderUserManagement = () => {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">User Management</h2>
        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>View, edit, or manage user accounts.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>(User management table placeholder)</p>
          </CardContent>
        </Card>
      </div>
    );
  };

  // =============================================
  // RENDER: SETTINGS (UNCHANGED from your original)
  // =============================================
  const renderSettings = () => {
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

        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>Manage your password and security settings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline">Change Password</Button>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label>Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">Add an extra layer of security to your account.</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };


  // =============================================
  // MAIN RETURN (JSX)
  // (UNCHANGED from your original)
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

            {/* Sidebar Navigation */}
            <nav className="flex-1 p-6 space-y-2">
              {navigationItems.map((item) => (
                // Filter nav items based on the 'user' prop's role
                (!item.role || (item.role && user.role === 'super_admin')) && (
                  // FIX: Using the correct 'SiderbarMenuItem' spelling
                  <SidebarMenuItem
                    key={item.name}
                    onClick={() => setCurrentView(item.view)}
                    isActive={currentView === item.view}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
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

          {/* Header */}
          <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-16 items-center px-6">
             {/* Header Left (Trigger and Search) */}
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

             {/* User Menu (Top Right) */}
             <div className="flex items-center gap-4 ml-auto">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Bell className="h-5 w-5" />
                </Button>

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

          {/* Prize Dialog (UNCHANGED from your original) */}
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
                    <Input id="prize-emoji" placeholder="🎁" value={prizeForm.emoji || ''} onChange={(e) => setPrizeForm(prev => ({ ...prev, emoji: e.target.value }))} />
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

          {/* Shop Item Dialog (UNCHANGED from your original) */}
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
                    <Input id="shop-price" type="number" min="0" placeholder="1000" value={shopForm.price || 0} onChange={(e) => setShopForm(prev => ({ ...prev, price: parseInt(e.target.value) }))} />
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
import { useState, useEffect } from 'react';
import { LoginPage } from './components/auth/LoginPage.tsx';
import AdminWebApp from './AdminWebApp.tsx';
import { AppProvider } from './utils/AppContext.tsx';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { supabase, isSupabaseConfigured } from './supabase/supabase.ts';
import { Session, User } from '@supabase/supabase-js'; // <--- 导入 User 类型

// --- ENGLISH COMMENT as requested ---
// This interface defines the shape of our admin user profile.
// It MUST match the interface in AdminWebApp.tsx.
interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'super_admin';
  avatar?: string;
  lastLogin: string;
}

function AppContent() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);

  // --- ENGLISH COMMENT ---
  // THIS IS THE NEW STATE THAT WAS MISSING.
  // We must store the fetched admin profile separately from the session.
  const [adminProfile, setAdminProfile] = useState<AdminUser | null>(null);

 // [*** 请用这个 *正确* 的版本替换 ***]

//
// [*** 请用这个 *正确* 的、*没有竞争* 的版本替换 ***]
//
//
// [*** 请用这个 *正确* 的、*没有竞争* 的版本替换 ***]
//
useEffect(() => {
  if (!isSupabaseConfigured()) {
    setIsLoading(false);
    return;
  }

  // 我们 *只* 需
  // 要 onAuthStateChange, 它会 100% 处理
  // "初始加载" (如果 session 已存在) 和
  // "登录/登出" 事件

  // 1. 正确地获取 "subscription"
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {

      console.log('Auth Event:', event, session); // (用于调试)

      setSession(session);

      if (session) {
        // 无论事件是 "INITIAL_SESSION" 还是 "SIGNED_IN",
        // 我们都获取 profile
        // (我们不再需要 setIsLoading, fetchAdminProfile 会处理)
        fetchAdminProfile(session.user);
      } else {
        // 无论事件是 "SIGNED_OUT" 还是 "USER_DELETED",
        // 我们都清除 profile
        setAdminProfile(null);
      }

      // 只有在 *所有* 检查完成后才停止加载
      setIsLoading(false);
    }
  );

  // 2. 正确地调用 "subscription.unsubscribe()"
  return () => {
    subscription?.unsubscribe();
  };
}, []); // Empty dependency array is correct

  // --- ENGLISH COMMENT ---
  // THIS IS THE NEW FUNCTION THAT WAS MISSING.
  // It fetches data from the 'admin_users' table in our database.
  async function fetchAdminProfile(user: User) {
    if (!user) return;

    try {
      // THIS IS THE DATABASE QUERY
      // It will only work AFTER we create the 'admin_users' table
      const { data, error } = await supabase
        .from('admin_users') // <--- The table we need to create
        .select('*')
        .eq('id', user.id) // Match the user's auth ID
        .single(); // We expect only one admin profile

      if (error) {
        toast.error('Failed to fetch admin profile.');
        console.error('Profile fetch error:', error);
        // Log out user if profile not found (security measure)
        await supabase.auth.signOut();
      } else if (data) {
        // --- ENGLISH COMMENT ---
        // Profile found, set it in state
        setAdminProfile({
          id: data.id,
          email: data.email,
          name: data.name,
          role: data.role,
          avatar: data.avatar,
          // Use auth last_sign_in_at for accuracy
          lastLogin: new Date(user.last_sign_in_at).toISOString()
        });
      }
    } catch (err) {
      const e = err as Error;
      toast.error(`Profile fetch error: ${e.message}`);
      await supabase.auth.signOut(); // Log out on critical error
    }
  }

  const handleLogout = async () => {
    toast.info("Signing out...");
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(`Logout failed: ${error.message}`);
    }
    // The 'onAuthStateChange' listener will automatically
    // handle clearing the session and adminProfile state.
  };

  if (isLoading) {
    // Show a global loading spinner
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className={`app-container min-h-screen ${isDarkMode ? 'dark' : ''}`}>
      <AnimatePresence mode="wait">

        {/* --- ENGLISH COMMENT --- */}
        {/* THE RENDER LOGIC IS NOW MORE ROBUST */}
        {/* It checks for BOTH session AND the adminProfile */}
        {session && adminProfile ? (
          // --- 状态 1: 已登录 (Session 和 Profile 都存在) ---
          <motion.div
            key="admin-web-app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* --- ENGLISH COMMENT --- */}
            {/* We now pass BOTH the fetched 'user' and 'onLogout' */}
            <AdminWebApp user={adminProfile} onLogout={handleLogout} />
          </motion.div>
        ) : (
          // --- 状态 2: 未登录 (Session 或 Profile 为 null) ---
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <LoginPage
              onNavigate={(dest) => {
                console.log('Navigate attempt to:', dest);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
      <Toaster position="top-center" />
    </div>
  );
}

// App (Provider) 保持不变
export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
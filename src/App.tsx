import { useState, useEffect } from 'react';
import { LoginPage } from './components/auth/LoginPage.tsx';
import { AdminPasswordReset } from './components/auth/AdminPasswordReset.tsx';
import { AdminProfileSetup } from './components/auth/AdminProfileSetup.tsx';
import AdminWebApp from './AdminWebApp.tsx';
import { AppProvider } from './utils/AppContext.tsx';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { supabase, isSupabaseConfigured } from './supabase/supabase.ts';
import { Session, User } from '@supabase/supabase-js'; // <--- 导入 User 类型


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
  const [currentPage, setCurrentPage] = useState<'login' | 'admin-reset-password' | 'admin-profile-setup'>('login');


  const [adminProfile, setAdminProfile] = useState<AdminUser | null>(null);

useEffect(() => {
  if (!isSupabaseConfigured()) {
    setIsLoading(false);
    return;
  }

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {

      console.log('Auth Event:', event, session); // (用于调试)

      setSession(session);

      if (session) {
        fetchAdminProfile(session.user);
      } else {
        setAdminProfile(null);
      }
      setIsLoading(false);
    }
  );

  return () => {
    subscription?.unsubscribe();
  };
}, []);

  async function fetchAdminProfile(user: User) {
    if (!user) return;

    try {

      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', user.id)
        .single();

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
      await supabase.auth.signOut();
    }
  }

  const handleLogout = async () => {
    toast.info("Signing out...");
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(`Logout failed: ${error.message}`);
    }

  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className={`app-container min-h-screen ${isDarkMode ? 'dark' : ''}`}>
      <AnimatePresence mode="wait">

        {session && adminProfile ? (
          <motion.div
            key="admin-web-app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <AdminWebApp user={adminProfile} onLogout={handleLogout} />
          </motion.div>
        ) : (
          <motion.div
            key={currentPage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {currentPage === 'admin-reset-password' ? (
              <AdminPasswordReset
                onNavigate={(dest) => {
                  console.log('Navigate to:', dest);
                  setCurrentPage(dest as any);
                }}
              />
            ) : currentPage === 'admin-profile-setup' ? (
              <AdminProfileSetup
                onNavigate={(dest) => {
                  console.log('Navigate to:', dest);
                  setCurrentPage(dest as any);
                }}
              />
            ) : (
              <LoginPage
                onNavigate={(dest) => {
                  console.log('Navigate to:', dest);
                  setCurrentPage(dest as any);
                }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <Toaster position="top-center" />
    </div>
  );
}


export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
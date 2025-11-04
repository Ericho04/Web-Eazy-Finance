import { supabase, isSupabaseConfigured } from '../supabase/supabase.ts';
import { toast } from 'sonner';

export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  language?: string;
  currency?: string;
  reward_points?: number;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

// Sign up with email and password
export const signUp = async (email: string, password: string, fullName?: string) => {
  if (!isSupabaseConfigured()) {
    toast.error('Database not configured. Please use demo mode or configure Supabase.');
    return { user: null, error: new Error('Database not configured') };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    });

    if (error) {
      toast.error(error.message);
      return { user: null, error };
    }

    if (data.user && !data.user.email_confirmed_at) {
      toast.success('Please check your email to confirm your account');
    }

    return { user: data.user, error: null };
  } catch (error) {
    console.error('Sign up error:', error);
    toast.error('Sign up failed. Please try again.');
    return { user: null, error: error as Error };
  }
};

// Sign in with email and password
export const signIn = async (email: string, password: string) => {
  if (!isSupabaseConfigured()) {
    toast.error('Database not configured. Please use demo mode or configure Supabase.');
    return { user: null, error: new Error('Database not configured') };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
      return { user: null, error };
    }

    toast.success('Welcome back!');
    return { user: data.user, error: null };
  } catch (error) {
    console.error('Sign in error:', error);
    toast.error('Sign in failed. Please try again.');
    return { user: null, error: error as Error };
  }
};

// Sign out
export const signOut = async () => {
  if (!isSupabaseConfigured()) {
    toast.success('Signed out successfully');
    return { error: null };
  }

  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast.error(error.message);
      return { error };
    }

    toast.success('Signed out successfully');
    return { error: null };
  } catch (error) {
    console.error('Sign out error:', error);
    toast.error('Sign out failed. Please try again.');
    return { error: error as Error };
  }
};

// Reset password
export const resetPassword = async (email: string) => {
  if (!isSupabaseConfigured()) {
    toast.error('Database not configured. Password reset not available.');
    return { error: new Error('Database not configured') };
  }

  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast.error(error.message);
      return { error };
    }

    toast.success('Password reset email sent');
    return { data, error: null };
  } catch (error) {
    console.error('Password reset error:', error);
    toast.error('Password reset failed. Please try again.');
    return { error: error as Error };
  }
};

// Update password
export const updatePassword = async (password: string) => {
  if (!isSupabaseConfigured()) {
    toast.error('Database not configured. Password update not available.');
    return { error: new Error('Database not configured') };
  }

  try {
    const { data, error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      toast.error(error.message);
      return { error };
    }

    toast.success('Password updated successfully');
    return { user: data.user, error: null };
  } catch (error) {
    console.error('Password update error:', error);
    toast.error('Password update failed. Please try again.');
    return { error: error as Error };
  }
};

// Get current user session
export const getCurrentSession = async () => {
  if (!isSupabaseConfigured()) {
    return { session: null, error: null };
  }

  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Get session error:', error);
      return { session: null, error };
    }

    return { session, error: null };
  } catch (error) {
    console.error('Get session error:', error);
    return { session: null, error: error as Error };
  }
};

// Get user profile
export const getUserProfile = async (userId: string) => {
  if (!isSupabaseConfigured()) {
    return { profile: null, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Get profile error:', error);
      return { profile: null, error };
    }

    return { profile: data, error: null };
  } catch (error) {
    console.error('Get profile error:', error);
    return { profile: null, error: error as Error };
  }
};

// Update user profile
export const updateUserProfile = async (userId: string, updates: Partial<User>) => {
  if (!isSupabaseConfigured()) {
    toast.error('Database not configured. Profile update not available.');
    return { profile: null, error: new Error('Database not configured') };
  }

  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      toast.error('Failed to update profile');
      return { profile: null, error };
    }

    toast.success('Profile updated successfully');
    return { profile: data, error: null };
  } catch (error) {
    console.error('Update profile error:', error);
    toast.error('Profile update failed. Please try again.');
    return { profile: null, error: error as Error };
  }
};

// Demo login for development and testing
export const demoLogin = async () => {
  if (!isSupabaseConfigured()) {
    // Create a mock demo user for development
    const demoUser: User = {
      id: 'demo-user-id',
      email: 'demo@sfms.app',
      full_name: 'Demo User',
      language: 'en',
      currency: 'MYR',
      reward_points: 150
    };

    toast.success('Demo mode activated! 🎯', {
      description: 'You\'re using SFMS in demo mode. Data won\'t be persisted.'
    });

    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 1000));

    return { user: { ...demoUser, id: `user_${Date.now()}` }, error: null };
  }

  // Real Supabase demo login
  const demoEmail = 'demo@sfms.app';
  const demoPassword = 'demo123456';

  try {
    // Try to sign in first
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: demoEmail,
      password: demoPassword,
    });

    if (signInData.user) {
      toast.success('Demo login successful! 🎯');
      return { user: signInData.user, error: null };
    }

    // If sign in fails, try to create demo user
    if (signInError?.message.includes('Invalid login credentials')) {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: demoEmail,
        password: demoPassword,
        options: {
          data: {
            full_name: 'Demo User'
          }
        }
      });

      if (signUpError) {
        toast.error('Demo setup failed: ' + signUpError.message);
        return { user: null, error: signUpError };
      }

      // If sign up requires email confirmation, sign in directly for demo
      if (signUpData.user && !signUpData.user.email_confirmed_at) {
        toast.success('Demo account created! Welcome to SFMS 🎯');
      }

      return { user: signUpData.user, error: null };
    }

    toast.error('Demo login failed: ' + signInError?.message);
    return { user: null, error: signInError };

  } catch (error) {
    console.error('Demo login error:', error);
    toast.error('Demo login failed');
    return { user: null, error: error as Error };
  }
};

// Listen to auth state changes
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  if (!isSupabaseConfigured()) {
    // Return a mock subscription for demo mode
    return {
      data: {
        subscription: {
          unsubscribe: () => {}
        }
      }
    };
  }

  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      // Get user profile
      const { profile } = await getUserProfile(session.user.id);
      const user: User = {
        id: session.user.id,
        email: session.user.email!,
        full_name: profile?.full_name || session.user.user_metadata?.full_name,
        avatar_url: profile?.avatar_url || session.user.user_metadata?.avatar_url,
        language: profile?.language || 'en',
        currency: profile?.currency || 'MYR',
        reward_points: profile?.reward_points || 0
      };
      callback(user);
    } else {
      callback(null);
    }
  });
};
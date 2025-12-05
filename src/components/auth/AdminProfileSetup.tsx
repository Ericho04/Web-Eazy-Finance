// @ts-nocheck
import { useState, FormEvent } from 'react';
import { motion } from 'motion/react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { UserCog, Loader2, Shield, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@supabase/supabase-js';

interface AdminProfileSetupProps {
  onNavigate: (destination: string) => void;
}

export function AdminProfileSetup({ onNavigate }: AdminProfileSetupProps) {
  const [serviceRoleKey, setServiceRoleKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [profileExists, setProfileExists] = useState(false);
  const [success, setSuccess] = useState(false);

  // Check user and profile
  const handleCheckUser = async (e: FormEvent) => {
    e.preventDefault();
    setChecking(true);
    setUserInfo(null);
    setProfileExists(false);

    try {
      if (!serviceRoleKey.trim()) {
        toast.error('Please Enter Service Role Key');
        setChecking(false);
        return;
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      if (!supabaseUrl) {
        toast.error('Supabase URL not configured');
        setChecking(false);
        return;
      }

      // Create admin client
      const adminClient = createClient(supabaseUrl, serviceRoleKey.trim(), {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });

      // Get all users
      const { data: users, error: listError } = await adminClient.auth.admin.listUsers();

      if (listError) {
        toast.error(`Failed to fetch user details: ${listError.message}`);
        setChecking(false);
        return;
      }

      if (!users.users || users.users.length === 0) {
        toast.error('No users found');
        setChecking(false);
        return;
      }

      toast.success(`Found ${users.users.length} user(s)`);

      console.log('All users:', users.users);

      // Check each user's profile
      for (const user of users.users) {
        const { data: profile, error: profileError } = await adminClient
          .from('admin_users')
          .select('*')
          .eq('id', user.id)
          .single();

        console.log(`User ${user.email} (${user.id}):`, {
          profile,
          profileError
        });
      }

      setUserInfo(users.users);

    } catch (err) {
      const e = err as Error;
      toast.error(`An error occurred: ${e.message}`);
      console.error('Check error:', err);
    } finally {
      setChecking(false);
    }
  };

  // Create admin profile
  const handleCreateProfile = async (userId: string, userEmail: string) => {
    setLoading(true);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const adminClient = createClient(supabaseUrl, serviceRoleKey.trim(), {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });

      // Check if admin_users table exists
      const { error: tableError } = await adminClient
        .from('admin_users')
        .select('id')
        .limit(1);

      if (tableError && tableError.message.includes('relation "public.admin_users" does not exist')) {
        toast.error('admin_users table does not exist! Please create the table first.');
        console.log('TABLE SQL:');
        console.log(`
CREATE TABLE public.admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read admin_users"
  ON public.admin_users
  FOR SELECT
  TO authenticated
  USING (true);
        `);
        setLoading(false);
        return;
      }

      // Try to insert or update record
      const { data, error } = await adminClient
        .from('admin_users')
        .upsert({
          id: userId,
          email: userEmail,
          name: userEmail.split('@')[0],
          role: 'admin',
          avatar: null
        }, {
          onConflict: 'id'
        })
        .select()
        .single();

      if (error) {
        toast.error(`Failed to create profile: ${error.message}`);
        console.error('Insert error:', error);
      } else {
        toast.success(`Successfully created admin profile for ${userEmail}!`);
        console.log('Created profile:', data);
        setSuccess(true);

        // Recheck after creation
        setTimeout(() => {
          handleCheckUser(new Event('submit') as any);
        }, 1000);
      }

    } catch (err) {
      const e = err as Error;
      toast.error(`An error occurred: ${e.message}`);
      console.error('Create error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="flex min-h-screen w-full items-center justify-center bg-gray-100 p-4"
    >
      <Card className="w-full max-w-2xl shadow-2xl bg-white/90 backdrop-blur-lg">
        <CardHeader className="text-center pt-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.2 }}
          >
            <UserCog className="w-16 h-16 text-amber-500 mx-auto" />
          </motion.div>
          <CardTitle className="text-3xl font-bold tracking-tight text-gray-900">
            Admin Profile Setup Tool
          </CardTitle>
          <CardDescription className="text-gray-600">
            Check and create admin_users table records
          </CardDescription>
        </CardHeader>

        <CardContent className="p-8">
          {/* Information Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Tool Description</p>
              <p>This tool is used to check your user accounts and create admin profile records in the admin_users table.</p>
            </div>
          </div>

          <form onSubmit={handleCheckUser} className="space-y-4 mb-6">
            {/* Service Role Key */}
            <div className="space-y-2">
              <Label htmlFor="service-key" className="text-sm font-medium text-gray-700">
                Service Role Key
              </Label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="service-key"
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="pl-10 font-mono text-xs"
                  value={serviceRoleKey}
                  onChange={(e) => setServiceRoleKey(e.target.value)}
                  required
                  disabled={checking || loading}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={checking || loading}
            >
              {checking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <UserCog className="mr-2 w-4 h-4" />
                  Check Users and Profiles
                </>
              )}
            </Button>
          </form>

          {/* User List */}
          {userInfo && userInfo.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Found Users:</h3>
              {userInfo.map((user: any) => (
                <div key={user.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{user.email}</p>
                        <p className="text-xs text-gray-500 font-mono mt-1">ID: {user.id}</p>
                        <p className="text-xs text-gray-500">
                          Created: {new Date(user.created_at).toLocaleString('en-US')}
                        </p>
                        {user.last_sign_in_at && (
                          <p className="text-xs text-gray-500">
                            Last sign in: {new Date(user.last_sign_in_at).toLocaleString('en-US')}
                          </p>
                        )}
                      </div>
                    </div>

                    <Button
                      onClick={() => handleCreateProfile(user.id, user.email)}
                      className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white"
                      disabled={loading}
                      size="sm"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 w-3 h-3" />
                          Create Admin Profile for This User
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {success && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3"
            >
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-green-800">
                <p className="font-semibold mb-1">Profile Created Successfully!</p>
                <p>You can now return to the login page and try logging in.</p>
              </div>
            </motion.div>
          )}

          <div className="mt-6 pt-6 border-t">
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => onNavigate('login')}
              disabled={checking || loading}
            >
              <ArrowLeft className="mr-2 w-4 h-4" />
              Return to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

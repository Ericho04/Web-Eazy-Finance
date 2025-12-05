// @ts-nocheck
import { useState, FormEvent } from 'react';
import { motion } from 'motion/react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { KeyRound, Loader2, Shield, AlertCircle, CheckCircle2, ArrowLeft, Mail, User } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@supabase/supabase-js';

interface AdminPasswordResetProps {
  onNavigate: (destination: string) => void;
}

export function AdminPasswordReset({ onNavigate }: AdminPasswordResetProps) {
  const [userId, setUserId] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [serviceRoleKey, setServiceRoleKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [searchMethod, setSearchMethod] = useState<'id' | 'email'>('email');

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      // Validate password
      if (newPassword !== confirmPassword) {
        toast.error('Passwords do not match');
        setLoading(false);
        return;
      }

      if (newPassword.length < 6) {
        toast.error('Password must be at least 6 characters');
        setLoading(false);
        return;
      }

      // Validate Service Role Key
      if (!serviceRoleKey.trim()) {
        toast.error('Please enter Service Role Key');
        setLoading(false);
        return;
      }

      // Get Supabase URL
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      if (!supabaseUrl) {
        toast.error('Supabase URL not configured');
        setLoading(false);
        return;
      }

      // Create admin client
      const adminClient = createClient(supabaseUrl, serviceRoleKey.trim(), {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });

      let targetUserId = userId.trim();

      // If using email search, find user ID first
      if (searchMethod === 'email') {
        if (!userEmail.trim()) {
          toast.error('Please enter user email');
          setLoading(false);
          return;
        }

        // Find user by email
        const { data: users, error: listError } = await adminClient.auth.admin.listUsers();

        if (listError) {
          toast.error(`Failed to find user: ${listError.message}`);
          setLoading(false);
          return;
        }

        const user = users.users.find(u => u.email === userEmail.trim());

        if (!user) {
          toast.error('No user found with this email');
          setLoading(false);
          return;
        }

        targetUserId = user.id;
        toast.info(`Found user: ${user.email} (ID: ${user.id.substring(0, 8)}...)`);
      }

      if (!targetUserId) {
        toast.error('Please enter user ID');
        setLoading(false);
        return;
      }

      // Update password using Admin API
      const { data, error } = await adminClient.auth.admin.updateUserById(
        targetUserId,
        { password: newPassword }
      );

      if (error) {
        toast.error(`Password reset failed: ${error.message}`);
        console.error('Reset error:', error);
      } else {
        setSuccess(true);
        toast.success('Password reset successful!', {
          duration: 5000,
        });

        // Clear form
        setUserId('');
        setUserEmail('');
        setNewPassword('');
        setConfirmPassword('');
      }

    } catch (err) {
      const e = err as Error;
      toast.error(`An error occurred: ${e.message}`);
      console.error('Reset error:', err);
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
      <Card className="w-full max-w-md shadow-2xl bg-white/90 backdrop-blur-lg cartoon-border">
        <CardHeader className="text-center pt-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.2 }}
          >
            <KeyRound className="w-16 h-16 text-amber-500 mx-auto" />
          </motion.div>
          <CardTitle className="text-3xl font-bold tracking-tight text-gray-900">
            Admin Password Reset
          </CardTitle>
          <CardDescription className="text-gray-600">
            Reset user password using Supabase Admin API
          </CardDescription>
        </CardHeader>

        <CardContent className="p-8">
          {success ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="space-y-6 py-4"
            >
              <div className="text-center">
                <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Password Reset Successful!</h3>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-2">Next Step: Setup Admin Profile</p>
                    <p className="mb-3">If this is your first login, or you encounter a "Failed to fetch admin profile" error when logging in, you need to setup your admin profile first.</p>
                  </div>
                </div>
                <Button
                  onClick={() => onNavigate('admin-profile-setup')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Go to Admin Profile Setup
                </Button>
              </div>

              <div className="text-center pt-4">
                <p className="text-sm text-gray-600 mb-3">Or try logging in directly</p>
                <Button
                  onClick={() => onNavigate('login')}
                  variant="outline"
                  className="w-full"
                >
                  <ArrowLeft className="mr-2 w-4 h-4" />
                  Return to Login Page
                </Button>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {/* Security Warning */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-semibold mb-1">Security Notice</p>
                  <p>This feature requires a Service Role Key. Please ensure you have authorized access. Do not share this key with others.</p>
                </div>
              </div>

              {/* Search Method Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Find User By</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={searchMethod === 'email' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => setSearchMethod('email')}
                    disabled={loading}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Email
                  </Button>
                  <Button
                    type="button"
                    variant={searchMethod === 'id' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => setSearchMethod('id')}
                    disabled={loading}
                  >
                    <User className="w-4 h-4 mr-2" />
                    User ID
                  </Button>
                </div>
              </div>

              {/* User Identifier Input */}
              {searchMethod === 'email' ? (
                <div className="space-y-2">
                  <Label htmlFor="user-email" className="text-sm font-medium text-gray-700">
                    User Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="user-email"
                      type="email"
                      placeholder="user@example.com"
                      className="pl-10"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="user-id" className="text-sm font-medium text-gray-700">
                    User ID
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="user-id"
                      type="text"
                      placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      className="pl-10 font-mono text-sm"
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <p className="text-xs text-gray-500">UUID format user ID</p>
                </div>
              )}

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
                    disabled={loading}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Get from Supabase Dashboard → Settings → API
                </p>
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-sm font-medium text-gray-700">
                  New Password
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={6}
                />
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-sm font-medium text-gray-700">
                  Confirm New Password
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Enter new password again"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={6}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full cartoon-button bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <KeyRound className="mr-2 w-4 h-4" />
                    Reset Password
                  </>
                )}
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 pt-0">
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => onNavigate('login')}
            disabled={loading}
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            Return to Login
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

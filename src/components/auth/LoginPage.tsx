import { useState, FormEvent } from 'react';
import { motion } from 'motion/react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Eye, EyeOff, Mail, Lock, Loader2, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../supabase/supabase';

interface LoginPageProps {
  onNavigate: (destination: string) => void;
}

export function LoginPage({ onNavigate }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');


  const handleAdminSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // --- THIS IS THE NEW SUPABASE LOGIC ---
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        toast.error(`Login failed: ${error.message}`);
        setError(error.message);
      }


    } catch (err) {
      const e = err as Error;
      toast.error(`An unexpected error occurred: ${e.message}`);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
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
            <Shield className="w-16 h-16 text-amber-500 mx-auto" />
          </motion.div>
          <CardTitle className="text-3xl font-bold tracking-tight text-gray-900">
            Admin Panel Access
          </CardTitle>
          <CardDescription className="text-gray-600">
            Please sign in to continue.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">

          {/* --- Admin Login Form --- */}
          <div>
            <form onSubmit={handleAdminSubmit} className="space-y-4"> {/* <--- 确保 onSubmit 绑定正确 */}
              <div className="space-y-2">
                <Label htmlFor="email-admin" className="text-sm font-medium text-gray-700">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="email-admin"
                    type="email"
                    placeholder="admin@sfms.app"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password-admin" className="text-sm font-medium text-gray-700">Password</Label>
                  <button
                    type="button"
                    onClick={() => onNavigate('admin-reset-password')}
                    className="text-xs text-amber-600 hover:text-amber-700 hover:underline"
                    disabled={loading}
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="password-admin"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading} // <--- 增加了 disabled
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-gray-400 hover:text-gray-600"
                    onClick={togglePasswordVisibility}
                    disabled={loading} // <--- 增加了 disabled
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Admin Login Button */}
              <Button
                type="submit"
                className="w-full cartoon-button bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                disabled={loading || !email.trim() || !password.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 w-4 h-4" />
                    Access Admin Panel
                  </>
                )}
              </Button>
            </form>
          </div>

        </CardContent>

        <CardFooter className="flex flex-col space-y-4 pt-0">
          {/* (您的 footer 内容) */}
        </CardFooter>
      </Card>
    </motion.div>
  );
}
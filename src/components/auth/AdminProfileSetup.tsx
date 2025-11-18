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

  // 检查用户和 profile
  const handleCheckUser = async (e: FormEvent) => {
    e.preventDefault();
    setChecking(true);
    setUserInfo(null);
    setProfileExists(false);

    try {
      if (!serviceRoleKey.trim()) {
        toast.error('请输入 Service Role Key');
        setChecking(false);
        return;
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      if (!supabaseUrl) {
        toast.error('未配置 Supabase URL');
        setChecking(false);
        return;
      }

      // 创建管理员客户端
      const adminClient = createClient(supabaseUrl, serviceRoleKey.trim(), {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });

      // 获取所有用户
      const { data: users, error: listError } = await adminClient.auth.admin.listUsers();

      if (listError) {
        toast.error(`获取用户列表失败: ${listError.message}`);
        setChecking(false);
        return;
      }

      if (!users.users || users.users.length === 0) {
        toast.error('未找到任何用户');
        setChecking(false);
        return;
      }

      toast.success(`找到 ${users.users.length} 个用户`);

      // 显示所有用户信息
      console.log('所有用户:', users.users);

      // 检查每个用户的 admin_users 记录
      for (const user of users.users) {
        const { data: profile, error: profileError } = await adminClient
          .from('admin_users')
          .select('*')
          .eq('id', user.id)
          .single();

        console.log(`用户 ${user.email} (${user.id}):`, {
          profile,
          profileError
        });
      }

      setUserInfo(users.users);

    } catch (err) {
      const e = err as Error;
      toast.error(`发生错误: ${e.message}`);
      console.error('Check error:', err);
    } finally {
      setChecking(false);
    }
  };

  // 创建 admin profile
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

      // 检查 admin_users 表是否存在
      const { error: tableError } = await adminClient
        .from('admin_users')
        .select('id')
        .limit(1);

      if (tableError && tableError.message.includes('relation "public.admin_users" does not exist')) {
        toast.error('admin_users 表不存在！请先创建表。');
        console.log('需要创建表的 SQL:');
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

-- 启用 RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- 创建策略允许认证用户读取
CREATE POLICY "Allow authenticated users to read admin_users"
  ON public.admin_users
  FOR SELECT
  TO authenticated
  USING (true);
        `);
        setLoading(false);
        return;
      }

      // 尝试插入或更新记录
      const { data, error } = await adminClient
        .from('admin_users')
        .upsert({
          id: userId,
          email: userEmail,
          name: userEmail.split('@')[0], // 使用邮箱前缀作为名字
          role: 'admin',
          avatar: null
        }, {
          onConflict: 'id'
        })
        .select()
        .single();

      if (error) {
        toast.error(`创建 profile 失败: ${error.message}`);
        console.error('Insert error:', error);
      } else {
        toast.success(`成功创建 ${userEmail} 的管理员资料！`);
        console.log('Created profile:', data);
        setSuccess(true);

        // 重新检查
        setTimeout(() => {
          handleCheckUser(new Event('submit') as any);
        }, 1000);
      }

    } catch (err) {
      const e = err as Error;
      toast.error(`发生错误: ${e.message}`);
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
            管理员资料设置工具
          </CardTitle>
          <CardDescription className="text-gray-600">
            检查和创建 admin_users 表记录
          </CardDescription>
        </CardHeader>

        <CardContent className="p-8">
          {/* 警告提示 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">工具说明</p>
              <p>此工具用于检查您的用户账户并在 admin_users 表中创建管理员资料记录。</p>
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
                  检查中...
                </>
              ) : (
                <>
                  <UserCog className="mr-2 w-4 h-4" />
                  检查用户和资料
                </>
              )}
            </Button>
          </form>

          {/* 用户列表 */}
          {userInfo && userInfo.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">找到的用户：</h3>
              {userInfo.map((user: any) => (
                <div key={user.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{user.email}</p>
                        <p className="text-xs text-gray-500 font-mono mt-1">ID: {user.id}</p>
                        <p className="text-xs text-gray-500">
                          创建时间: {new Date(user.created_at).toLocaleString('zh-CN')}
                        </p>
                        {user.last_sign_in_at && (
                          <p className="text-xs text-gray-500">
                            上次登录: {new Date(user.last_sign_in_at).toLocaleString('zh-CN')}
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
                          创建中...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 w-3 h-3" />
                          为此用户创建管理员资料
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
                <p className="font-semibold mb-1">创建成功！</p>
                <p>现在您可以返回登录页面尝试登录了。</p>
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
              返回登录
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

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
      // 验证密码
      if (newPassword !== confirmPassword) {
        toast.error('两次输入的密码不一致');
        setLoading(false);
        return;
      }

      if (newPassword.length < 6) {
        toast.error('密码长度至少为 6 位');
        setLoading(false);
        return;
      }

      // 验证 Service Role Key
      if (!serviceRoleKey.trim()) {
        toast.error('请输入 Service Role Key');
        setLoading(false);
        return;
      }

      // 获取 Supabase URL
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      if (!supabaseUrl) {
        toast.error('未配置 Supabase URL');
        setLoading(false);
        return;
      }

      // 创建管理员客户端
      const adminClient = createClient(supabaseUrl, serviceRoleKey.trim(), {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });

      let targetUserId = userId.trim();

      // 如果使用邮箱搜索，先查找用户 ID
      if (searchMethod === 'email') {
        if (!userEmail.trim()) {
          toast.error('请输入用户邮箱');
          setLoading(false);
          return;
        }

        // 通过邮箱查找用户
        const { data: users, error: listError } = await adminClient.auth.admin.listUsers();

        if (listError) {
          toast.error(`查找用户失败: ${listError.message}`);
          setLoading(false);
          return;
        }

        const user = users.users.find(u => u.email === userEmail.trim());

        if (!user) {
          toast.error('未找到该邮箱对应的用户');
          setLoading(false);
          return;
        }

        targetUserId = user.id;
        toast.info(`找到用户: ${user.email} (ID: ${user.id.substring(0, 8)}...)`);
      }

      if (!targetUserId) {
        toast.error('请输入用户 ID');
        setLoading(false);
        return;
      }

      // 使用 Admin API 更新密码
      const { data, error } = await adminClient.auth.admin.updateUserById(
        targetUserId,
        { password: newPassword }
      );

      if (error) {
        toast.error(`密码重置失败: ${error.message}`);
        console.error('Reset error:', error);
      } else {
        setSuccess(true);
        toast.success('密码重置成功！您现在可以使用新密码登录了。', {
          duration: 5000,
        });

        // 清空表单
        setUserId('');
        setUserEmail('');
        setNewPassword('');
        setConfirmPassword('');

        // 3秒后跳转到登录页
        setTimeout(() => {
          onNavigate('login');
        }, 3000);
      }

    } catch (err) {
      const e = err as Error;
      toast.error(`发生错误: ${e.message}`);
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
            管理员密码重置
          </CardTitle>
          <CardDescription className="text-gray-600">
            使用 Supabase Admin API 重置用户密码
          </CardDescription>
        </CardHeader>

        <CardContent className="p-8">
          {success ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-8"
            >
              <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">重置成功！</h3>
              <p className="text-gray-600">即将跳转到登录页面...</p>
            </motion.div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {/* 警告提示 */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-semibold mb-1">安全提示</p>
                  <p>此功能需要 Service Role Key，请确保您有权访问。请勿与他人分享此密钥。</p>
                </div>
              </div>

              {/* 搜索方式选择 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">查找用户方式</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={searchMethod === 'email' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => setSearchMethod('email')}
                    disabled={loading}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    邮箱
                  </Button>
                  <Button
                    type="button"
                    variant={searchMethod === 'id' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => setSearchMethod('id')}
                    disabled={loading}
                  >
                    <User className="w-4 h-4 mr-2" />
                    用户 ID
                  </Button>
                </div>
              </div>

              {/* 用户标识输入 */}
              {searchMethod === 'email' ? (
                <div className="space-y-2">
                  <Label htmlFor="user-email" className="text-sm font-medium text-gray-700">
                    用户邮箱
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
                    用户 ID
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
                  <p className="text-xs text-gray-500">UUID 格式的用户 ID</p>
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
                  从 Supabase Dashboard → Settings → API 获取
                </p>
              </div>

              {/* 新密码 */}
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-sm font-medium text-gray-700">
                  新密码
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="至少 6 位字符"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={6}
                />
              </div>

              {/* 确认密码 */}
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-sm font-medium text-gray-700">
                  确认新密码
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="再次输入新密码"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={6}
                />
              </div>

              {/* 提交按钮 */}
              <Button
                type="submit"
                className="w-full cartoon-button bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    重置中...
                  </>
                ) : (
                  <>
                    <KeyRound className="mr-2 w-4 h-4" />
                    重置密码
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
            返回登录
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

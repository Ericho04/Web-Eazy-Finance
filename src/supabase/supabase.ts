// src/supabase/supabase.ts
import { createClient } from '@supabase/supabase-js';

// 🔧 重要：确保环境变量名称正确
// Vite 使用 VITE_ 前缀
// Next.js 使用 NEXT_PUBLIC_ 前缀

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// 检查配置是否完整
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey && 
           supabaseUrl !== '' && 
           supabaseAnonKey !== '' &&
           supabaseUrl.includes('supabase.co'));
};

// 创建 Supabase 客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// 导出类型（方便其他文件使用）
export type { User, Session } from '@supabase/supabase-js';

// 调试信息（仅在开发环境）
if (import.meta.env.DEV) {
  console.log('Supabase配置状态:', {
    已配置: isSupabaseConfigured(),
    URL存在: !!supabaseUrl,
    Key存在: !!supabaseAnonKey,
    URL前缀: supabaseUrl.substring(0, 20) + '...'
  });
}
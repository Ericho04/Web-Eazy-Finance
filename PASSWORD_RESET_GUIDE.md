# 管理员密码重置功能使用指南

## 概述

由于您的账户使用的是假邮箱，无法通过常规的邮件重置密码流程，因此我们添加了一个管理员密码重置功能，使用 Supabase Admin API 来直接重置用户密码。

## 功能位置

在登录页面的密码输入框右上角，您会看到一个**"忘记密码？"**链接，点击即可进入管理员密码重置页面。

## 使用步骤

### 1. 获取 Supabase Service Role Key

这是最重要的一步！您需要从 Supabase Dashboard 获取 Service Role Key：

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择您的项目：`ugrcqjjovugagaknjwoa`
3. 点击左侧菜单 **Settings** → **API**
4. 在 **Project API keys** 部分，找到 **service_role** key
5. 点击 "Reveal" 按钮显示完整的 key
6. 复制这个 key（以 `eyJ` 开头的长字符串）

### 2. 配置环境变量（可选）

如果您想预先配置 Service Role Key 以便快速使用，可以将其添加到 `.env` 文件：

```bash
# 编辑 .env 文件
VITE_SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key_here
```

**⚠️ 重要安全提示：**
- Service Role Key 拥有完整的数据库访问权限
- 请勿将包含此 key 的 `.env` 文件提交到公开仓库
- 建议将 `.env` 添加到 `.gitignore`（通常已默认添加）

### 3. 使用密码重置功能

#### 方式 A：通过邮箱查找用户

1. 点击登录页面的 **"忘记密码？"** 链接
2. 选择 **"邮箱"** 查找方式
3. 输入您的用户邮箱
4. 输入 Service Role Key（从步骤1获取）
5. 输入新密码（至少6位字符）
6. 确认新密码
7. 点击 **"重置密码"** 按钮

#### 方式 B：通过 User ID 查找用户

1. 点击登录页面的 **"忘记密码？"** 链接
2. 选择 **"用户 ID"** 查找方式
3. 输入您的用户 UUID（格式：`xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`）
4. 输入 Service Role Key
5. 输入新密码（至少6位字符）
6. 确认新密码
7. 点击 **"重置密码"** 按钮

### 4. 获取您的 User ID

如果您不知道自己的 User ID，可以通过以下方式获取：

#### 方法 1：通过 Supabase Dashboard

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择您的项目
3. 点击左侧 **Authentication** → **Users**
4. 找到您的邮箱，复制对应的 User ID

#### 方法 2：通过浏览器控制台（如果您能登录）

1. 登录系统
2. 打开浏览器开发者工具（F12）
3. 在 Console 输入：
   ```javascript
   (await supabase.auth.getSession()).data.session.user.id
   ```
4. 复制显示的 UUID

## 重置成功后

密码重置成功后，系统会：
1. 显示成功提示
2. 自动在 3 秒后跳转回登录页面
3. 您可以使用新密码登录

## 故障排除

### 问题：提示 "查找用户失败"

**可能原因：**
- Service Role Key 不正确
- Service Role Key 已过期或被撤销

**解决方案：**
- 重新从 Supabase Dashboard 获取 Service Role Key
- 确保复制了完整的 key

### 问题：提示 "未找到该邮箱对应的用户"

**可能原因：**
- 邮箱地址输入错误
- 该邮箱未在系统中注册

**解决方案：**
- 检查邮箱拼写
- 尝试使用 User ID 方式查找

### 问题：提示 "密码重置失败"

**可能原因：**
- User ID 格式不正确
- 用户不存在
- 网络连接问题

**解决方案：**
- 确认 User ID 是正确的 UUID 格式
- 检查网络连接
- 查看浏览器控制台的错误信息

## 技术细节

### 使用的 API

```typescript
// 创建管理员客户端
const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// 更新用户密码
const { data, error } = await adminClient.auth.admin.updateUserById(
  userId,
  { password: newPassword }
);
```

### 文件修改清单

1. **`.env`** - 添加了 Service Role Key 配置说明
2. **`src/components/auth/AdminPasswordReset.tsx`** - 新建密码重置组件
3. **`src/components/auth/LoginPage.tsx`** - 添加"忘记密码？"链接
4. **`src/App.tsx`** - 添加密码重置页面路由

## 安全建议

1. **不要在生产环境中暴露 Service Role Key**
   - 此功能主要用于开发/测试环境
   - 生产环境应使用 Supabase Edge Functions 来实现密码重置

2. **定期更换 Service Role Key**
   - 如果怀疑 key 泄露，立即在 Supabase Dashboard 中重新生成

3. **使用强密码**
   - 新密码应包含大小写字母、数字和特殊字符
   - 避免使用常见密码

4. **考虑实现邮箱验证**
   - 未来可以添加邮箱验证功能
   - 使用真实邮箱以便通过正规流程重置密码

## 后续改进建议

如果您想在生产环境中使用类似功能，建议：

1. **创建 Supabase Edge Function**
   ```bash
   # 创建 Edge Function
   supabase functions new reset-password-admin
   ```

2. **实施额外的验证**
   - 添加验证问题
   - 要求提供其他身份验证信息
   - 实现多因素认证（MFA）

3. **使用真实邮箱**
   - 设置真实的邮箱地址
   - 配置 Supabase 邮件服务
   - 使用标准的邮件重置流程

## 联系支持

如果您在使用过程中遇到问题，请：
1. 查看浏览器控制台的错误信息
2. 检查 Supabase Dashboard 的 Logs
3. 确认网络连接正常
4. 验证 Service Role Key 的有效性

---

**最后更新日期：** 2025-11-18
**版本：** 1.0.0

# 用户管理模块 - 技术文档

## 目录
1. [架构概述](#架构概述)
2. [组件结构](#组件结构)
3. [API 接口规范](#api-接口规范)
4. [数据结构](#数据结构)
5. [业务逻辑](#业务逻辑)
6. [安全机制](#安全机制)

## 架构概述

用户管理模块采用组件化架构，主要包含以下部分：

```
UserList (主容器)
├── UserSearchBar (搜索栏)
├── UserTable (用户表格)
├── UserFormDrawer (新增/编辑用户抽屉)
└── ResetPasswordModal (重置密码弹窗)
```

### 技术栈
- React 18
- Ant Design 5
- Redux (用户状态管理)
- dayjs (日期处理)
- Less (样式预处理)

## 组件结构

### 1. UserList.jsx
**主容器组件**，负责协调所有子组件和管理全局状态。

#### 权限检查
```javascript
const isAdmin = () => {
  if (!currentUser || !currentUser.roles) return false;
  return currentUser.roles.includes('admin');
};
```

如果用户不是管理员，显示403无权限页面。

#### State
```javascript
{
  loading: false,              // 加载状态
  users: [],                   // 用户列表
  pagination: {                // 分页信息
    current: 1,
    pageSize: 10,
    total: 0
  },
  searchParams: {},            // 搜索参数
  formDrawerVisible: false,    // 表单抽屉显示状态
  resetPasswordModalVisible: false,  // 重置密码弹窗显示状态
  editData: null,              // 编辑数据
  selectedUser: null           // 选中的用户
}
```

#### 主要方法
- `fetchUsers()` - 获取用户列表
- `handleSearch(params)` - 处理搜索
- `handleReset()` - 重置搜索
- `handleAddUser()` - 打开新增用户抽屉
- `handleEditUser(user)` - 打开编辑用户抽屉
- `handleResetPassword(user)` - 打开重置密码弹窗
- `handleRefresh()` - 刷新用户列表

### 2. UserSearchBar.jsx
**搜索栏组件**，提供用户搜索和筛选功能。

#### Props
```javascript
{
  onSearch: Function,     // 搜索回调
  onReset: Function,      // 重置回调
  onAddUser: Function     // 新增用户回调
}
```

#### 搜索参数
- `keyword` - 关键词（用户名、姓名）
- `role` - 角色筛选

### 3. UserTable.jsx
**用户表格组件**，显示用户列表并提供操作入口。

#### Props
```javascript
{
  data: Array,              // 用户数据
  loading: Boolean,         // 加载状态
  pagination: Object,       // 分页配置
  onPageChange: Function,   // 分页变化回调
  onEdit: Function,         // 编辑回调
  onResetPassword: Function, // 重置密码回调
  onRefresh: Function       // 刷新回调
}
```

#### 表格列
1. 用户名 (username)
2. 姓名 (realName)
3. 角色 (roles) - 多标签显示
4. 邮箱 (email)
5. 电话 (phone)
6. 状态 (status) - 开关组件
7. 创建时间 (createTime) - 可排序
8. 操作按钮

#### 状态切换逻辑
```javascript
const handleStatusToggle = (record, checked) => {
  Modal.confirm({
    title: `确认${checked ? '启用' : '禁用'}用户`,
    content: '禁用后该用户将无法登录系统',
    onOk: async () => {
      await toggleUserStatus(record.userId, checked ? 'active' : 'disabled');
      onRefresh();
    }
  });
};
```

### 4. UserFormDrawer.jsx
**用户表单抽屉**，支持新增和编辑。

#### Props
```javascript
{
  visible: Boolean,      // 显示状态
  editData: Object,      // 编辑数据（null为新增模式）
  onClose: Function,     // 关闭回调
  onSuccess: Function    // 成功回调
}
```

#### 表单字段
- `username` - 用户名（必填，3-20字符，唯一性校验）
- `realName` - 姓名（必填，最多20字符）
- `password` - 密码（仅新增模式，自动生成）
- `roles` - 角色（必填，多选）
- `email` - 邮箱（可选，格式校验）
- `phone` - 电话（可选，格式校验）
- `remark` - 备注（可选，最多200字符）

#### 密码生成
```javascript
const generateRandomPassword = (length = 8) => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*';
  let password = '';

  // 确保包含大写、小写、数字
  password += upper[Math.floor(Math.random() * upper.length)];
  password += lower[Math.floor(Math.random() * lower.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];

  // 填充剩余字符并打乱
  for (let i = password.length; i < length; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }

  return password.split('').sort(() => Math.random() - 0.5).join('');
};
```

#### 用户名唯一性校验
```javascript
const validateUsername = async (_, value) => {
  if (!value || isEditMode) {
    return Promise.resolve();
  }

  const res = await checkUsernameExists(value);
  if (res.data.exists) {
    return Promise.reject(new Error('该用户名已存在'));
  }
  return Promise.resolve();
};
```

### 5. ResetPasswordModal.jsx
**重置密码弹窗**，生成并展示新密码。

#### Props
```javascript
{
  visible: Boolean,      // 显示状态
  user: Object,          // 用户对象
  onCancel: Function,    // 取消回调
  onSuccess: Function    // 成功回调
}
```

#### 工作流程
1. 显示用户信息和警告提示
2. 用户确认后调用重置密码接口
3. 后端生成新密码并返回
4. 在弹窗中显示新密码
5. 提供复制功能
6. 关闭窗口后无法再次查看

## API 接口规范

### 获取用户列表

**GET** `/api/users`

查询参数：
```javascript
{
  page: 1,                    // 页码
  limit: 10,                  // 每页数量
  keyword: '',                // 关键词（用户名、姓名）
  role: 'photographer',       // 角色筛选
  sort_by: 'createTime',      // 排序字段
  sort_order: 'desc'          // 排序方向
}
```

响应格式：
```javascript
{
  code: 200,
  message: 'success',
  data: {
    data: [
      {
        userId: 1,
        username: 'zhangsan',
        realName: '张三',
        roles: ['photographer'],
        email: 'zhangsan@example.com',
        phone: '13800138000',
        status: 'active',  // active/disabled
        createTime: '2025-01-01 10:00:00',
        remark: '备注信息'
      }
    ],
    page: 1,
    limit: 10,
    total: 100
  }
}
```

### 获取用户详情

**GET** `/api/users/:id`

响应格式：
```javascript
{
  code: 200,
  data: {
    userId: 1,
    username: 'zhangsan',
    realName: '张三',
    roles: ['photographer'],
    email: 'zhangsan@example.com',
    phone: '13800138000',
    status: 'active',
    createTime: '2025-01-01 10:00:00',
    remark: '备注信息'
  }
}
```

### 创建用户

**POST** `/api/users`

请求体：
```javascript
{
  username: 'zhangsan',
  realName: '张三',
  password: 'Abc12345',  // 前端生成的密码
  roles: ['photographer'],
  email: 'zhangsan@example.com',
  phone: '13800138000',
  remark: '备注信息'
}
```

响应格式：
```javascript
{
  code: 201,
  message: '用户创建成功',
  data: {
    userId: 1
  }
}
```

### 更新用户

**PUT** `/api/users/:id`

请求体：
```javascript
{
  realName: '张三',
  roles: ['photographer', 'retoucher'],
  email: 'zhangsan@example.com',
  phone: '13800138000',
  remark: '备注信息'
}
```

注意：不包含 `username` 和 `password` 字段。

### 检查用户名是否存在

**GET** `/api/users/check-username`

查询参数：
```javascript
{
  username: 'zhangsan'
}
```

响应格式：
```javascript
{
  code: 200,
  data: {
    exists: false  // true 表示已存在，false 表示不存在
  }
}
```

### 重置用户密码

**POST** `/api/users/:id/reset-password`

响应格式：
```javascript
{
  code: 200,
  message: '密码重置成功',
  data: {
    password: 'Xyz78901'  // 后端生成的新密码
  }
}
```

**重要**：后端需要返回明文密码，前端才能展示给管理员。密码在数据库中应该是加密存储的。

### 更新用户状态

**PUT** `/api/users/:id/status`

请求体：
```javascript
{
  status: 'disabled'  // active/disabled
}
```

响应格式：
```javascript
{
  code: 200,
  message: '状态更新成功'
}
```

### 删除用户

**DELETE** `/api/users/:id`

响应格式：
```javascript
{
  code: 200,
  message: '用户删除成功'
}
```

### 获取角色列表

**GET** `/api/roles`

响应格式：
```javascript
{
  code: 200,
  data: [
    {
      roleId: 1,
      roleName: 'admin',
      roleLabel: '管理员'
    },
    {
      roleId: 2,
      roleName: 'photographer',
      roleLabel: '摄影师'
    }
  ]
}
```

### 获取操作日志

**GET** `/api/users/operation-logs`

查询参数：
```javascript
{
  page: 1,
  limit: 20,
  userId: 1,  // 可选，筛选特定用户的操作
  action: 'create',  // 可选，筛选操作类型
  startDate: '2025-01-01',
  endDate: '2025-01-31'
}
```

响应格式：
```javascript
{
  code: 200,
  data: {
    data: [
      {
        logId: 1,
        operatorId: 1,
        operatorName: '管理员',
        action: 'create',  // create/update/disable/reset_password
        targetUserId: 2,
        targetUsername: 'zhangsan',
        description: '创建用户 zhangsan',
        operationTime: '2025-01-01 10:00:00',
        ipAddress: '192.168.1.1'
      }
    ],
    page: 1,
    limit: 20,
    total: 100
  }
}
```

## 数据结构

### 用户状态枚举
```javascript
const USER_STATUS = {
  ACTIVE: 'active',      // 启用
  DISABLED: 'disabled'   // 禁用
};
```

### 角色枚举
```javascript
const USER_ROLES = {
  ADMIN: 'admin',                      // 管理员
  CLIENT_MANAGER: 'client_manager',    // 客户对接人
  PHOTOGRAPHER: 'photographer',        // 摄影师
  RETOUCHER: 'retoucher',             // 后期
  FINANCE: 'finance'                   // 财务
};
```

### 操作类型枚举
```javascript
const OPERATION_TYPE = {
  CREATE: 'create',              // 创建用户
  UPDATE: 'update',              // 更新用户
  DISABLE: 'disable',            // 禁用用户
  ENABLE: 'enable',              // 启用用户
  RESET_PASSWORD: 'reset_password',  // 重置密码
  DELETE: 'delete'               // 删除用户
};
```

## 业务逻辑

### 1. 用户创建流程

```
1. 管理员点击"新增用户"
2. 打开表单抽屉
3. 填写用户信息
4. 系统自动生成8位随机密码
5. 验证表单（用户名唯一性、邮箱格式、手机号格式）
6. 提交创建请求
7. 后端创建用户（密码加密存储）
8. 前端显示创建成功弹窗，展示初始密码
9. 管理员复制密码并告知用户
10. 记录操作日志
```

### 2. 用户编辑流程

```
1. 管理员点击"编辑"按钮
2. 打开表单抽屉，加载用户数据
3. 用户名字段禁用（不可修改）
4. 修改其他字段（姓名、角色、邮箱、电话、备注）
5. 验证表单
6. 提交更新请求
7. 后端更新用户信息
8. 刷新用户列表
9. 记录操作日志
```

### 3. 密码重置流程

```
1. 管理员点击"重置密码"按钮
2. 打开重置密码弹窗，显示用户信息
3. 显示警告提示（旧密码将失效）
4. 管理员确认重置
5. 后端生成新的8位随机密码
6. 后端更新数据库（密码加密）
7. 后端返回明文密码给前端
8. 前端在弹窗中显示新密码
9. 管理员复制密码
10. 管理员将新密码告知用户
11. 关闭弹窗后密码不再显示
12. 记录操作日志
```

### 4. 用户禁用流程

```
1. 管理员关闭用户的"启用"开关
2. 弹出确认对话框（警告禁用后无法登录）
3. 管理员确认禁用
4. 后端更新用户状态为 disabled
5. 用户状态变更，开关显示为禁用
6. 该用户尝试登录时会被拒绝
7. 记录操作日志
```

### 5. 用户启用流程

```
1. 管理员打开用户的"启用"开关
2. 弹出确认对话框
3. 管理员确认启用
4. 后端更新用户状态为 active
5. 用户状态变更，开关显示为启用
6. 该用户可以正常登录
7. 记录操作日志
```

## 安全机制

### 1. 权限控制

```javascript
// 页面级权限
if (!currentUser.roles.includes('admin')) {
  return <Result status="403" />;
}
```

### 2. 用户名唯一性

- 新增用户时实时校验
- 编辑用户时不允许修改用户名

### 3. 密码安全

#### 密码生成规则
- 长度：8位
- 包含：大写字母、小写字母、数字
- 可选：特殊字符 `!@#$%&*`
- 避免混淆字符：0/O, 1/I/l

#### 密码存储（后端实现）
```javascript
// 使用 bcrypt 或类似算法加密
const hashedPassword = await bcrypt.hash(password, 10);
```

#### 密码传输
- 仅在创建用户和重置密码时传输明文
- 传输过程使用 HTTPS
- 密码展示后不再保存在前端

### 4. 操作确认

- 禁用用户：二次确认弹窗
- 删除用户：二次确认弹窗（如果实现）
- 重置密码：警告提示

### 5. 操作日志

记录以下操作：
- 创建用户（记录创建人、创建时间、IP）
- 更新用户（记录修改人、修改时间、修改内容）
- 禁用用户（记录操作人、操作时间）
- 启用用户（记录操作人、操作时间）
- 重置密码（记录操作人、操作时间）
- 删除用户（记录删除人、删除时间）

### 6. 状态控制

```javascript
// 禁用用户后的登录验证
if (user.status === 'disabled') {
  return { success: false, message: '该账号已被禁用，请联系管理员' };
}
```

## 性能优化建议

1. **分页加载**：用户列表使用服务端分页
2. **防抖**：搜索框输入使用防抖
3. **缓存**：角色列表可缓存
4. **懒加载**：表单抽屉按需加载

## 错误处理

所有 API 调用都应包含错误处理：

```javascript
try {
  const res = await apiFunction();
  if (res.code === 200) {
    // 成功处理
  } else {
    message.error(res.message || '操作失败');
  }
} catch (error) {
  console.error('Error:', error);
  message.error('操作失败');
}
```

## 测试建议

### 功能测试
1. 用户列表加载
2. 搜索和筛选
3. 创建用户（包括密码生成）
4. 编辑用户
5. 重置密码（包括密码复制）
6. 启用/禁用用户
7. 权限控制

### 边界测试
1. 空用户列表
2. 用户名重复
3. 无效的邮箱格式
4. 无效的手机号格式
5. 禁用已禁用的用户
6. 非管理员访问

### 安全测试
1. 非管理员尝试访问
2. 密码强度
3. 用户名注入攻击
4. SQL注入防护

---

**文档版本**: v1.0.0
**最后更新**: 2025-01-05
**维护人员**: 开发团队

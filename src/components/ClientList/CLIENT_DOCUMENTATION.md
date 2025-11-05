# 客户管理模块 - 技术文档

## 目录
1. [架构概述](#架构概述)
2. [组件结构](#组件结构)
3. [API 接口规范](#api-接口规范)
4. [数据结构](#数据结构)
5. [权限控制](#权限控制)
6. [业务逻辑](#业务逻辑)

## 架构概述

客户管理模块采用组件化架构，主要包含以下部分：

```
ClientList (主容器)
├── ClientSearchBar (搜索栏)
├── ClientTable (客户表格)
├── ClientFormDrawer (新增/编辑客户抽屉)
└── ClientDetailDrawer (客户详情抽屉)
    ├── 基础信息标签页
    ├── 标签管理标签页
    ├── 历史订单标签页
    └── 消费趋势标签页
```

### 技术栈
- React 18
- Ant Design 5
- Redux (用户状态管理)
- Recharts 2 (消费趋势图)
- dayjs (日期处理)
- Less (样式预处理)

## 组件结构

### 1. ClientList.jsx
**主容器组件**，负责协调所有子组件和管理全局状态。

#### State
```javascript
{
  loading: false,
  clients: [],
  pagination: {
    current: 1,
    pageSize: 15,
    total: 0
  },
  searchParams: {},
  formDrawerVisible: false,
  detailDrawerVisible: false,
  editData: null,
  selectedClientId: null
}
```

### 2. ClientSearchBar.jsx
**搜索栏组件**，提供客户搜索和筛选功能。

#### 搜索参数
- `keyword` - 客户名称关键词
- `tags` - 标签ID数组（多选）
- `client_level` - 客户等级 (normal/vip)

### 3. ClientTable.jsx
**客户表格组件**，显示客户列表并提供操作入口。

#### 表格列
1. 客户名称 (clientName) + VIP图标
2. 联系人 (contactPerson)
3. 电话 (phone)
4. 客户等级 (clientLevel)
5. 标签 (tags) - 最多显示3个
6. 订单数 (orderCount) - 可排序
7. 累计消费 (totalConsumption) - 可排序
8. 未收款金额 (unpaidAmount) - 仅财务角色可见
9. 最近下单 (lastOrderTime) - 可排序
10. 操作按钮

### 4. ClientFormDrawer.jsx
**客户表单抽屉**，支持新增和编辑。

#### 表单字段验证
- `clientName` - 必填、最多50字符、唯一性校验
- `contactPerson` - 必填、最多20字符
- `phone` - 必填、手机号格式（11位，1开头）
- `email` - 可选、邮箱格式
- `address` - 可选
- `clientLevel` - 必填（normal/vip）
- `tags` - 可选、多选、支持自定义
- `remark` - 可选、最多200字符

### 5. ClientDetailDrawer.jsx
**客户详情抽屉**，包含4个标签页。

#### Tab 1: 基础信息
- 客户基本信息展示
- 统计信息（订单总数、累计消费、未收款金额）
- 编辑按钮（权限控制）

#### Tab 2: 标签管理
- 标签多选组件
- 支持添加/删除标签
- 支持输入新标签（自动创建）

#### Tab 3: 历史订单
- 订单列表表格
- 显示订单编号、金额、状态、下单时间
- 按时间倒序排列

#### Tab 4: 消费趋势
- Recharts折线图
- 双Y轴：左侧消费金额、右侧订单数量
- X轴：近12个月
- 数据点：每月消费金额和订单数

## API 接口规范

### 获取客户列表

**GET** `/api/clients`

查询参数：
```javascript
{
  page: 1,
  limit: 15,
  keyword: '',                  // 客户名称关键词
  tags: [1, 2, 3],             // 标签ID数组
  client_level: 'vip',         // normal/vip
  sort_by: 'totalConsumption', // 排序字段
  sort_order: 'desc'           // asc/desc
}
```

响应格式：
```javascript
{
  code: 200,
  data: {
    data: [
      {
        clientId: 1,
        clientName: 'ABC服装公司',
        contactPerson: '张三',
        phone: '13800138000',
        email: 'abc@example.com',
        address: '北京市朝阳区',
        clientLevel: 'vip',
        tags: [
          { tagId: 1, tagName: '鞋类客户' },
          { tagId: 2, tagName: '月结客户' }
        ],
        orderCount: 10,
        totalConsumption: 50000.00,
        unpaidAmount: 5000.00,
        lastOrderTime: '2025-01-01',
        createTime: '2024-01-01 10:00:00',
        remark: '备注信息'
      }
    ],
    page: 1,
    limit: 15,
    total: 100
  }
}
```

### 获取客户详情

**GET** `/api/clients/:id`

响应格式：同客户列表中的单个客户数据。

### 创建客户

**POST** `/api/clients`

请求体：
```javascript
{
  clientName: 'ABC服装公司',
  contactPerson: '张三',
  phone: '13800138000',
  email: 'abc@example.com',
  address: '北京市朝阳区',
  clientLevel: 'vip',
  tags: [1, 2],  // 标签ID数组
  remark: '备注信息'
}
```

### 更新客户

**PUT** `/api/clients/:id`

请求体：同创建客户。

### 删除客户

**DELETE** `/api/clients/:id`

注意：后端需要检查客户是否有历史订单，有订单的客户不允许删除。

### 检查客户名称是否存在

**GET** `/api/clients/check-name`

查询参数：
```javascript
{
  clientName: 'ABC服装公司'
}
```

响应格式：
```javascript
{
  code: 200,
  data: {
    exists: false  // true/false
  }
}
```

### 获取客户历史订单

**GET** `/api/clients/:id/orders`

查询参数：
```javascript
{
  page: 1,
  limit: 20,
  sort_by: 'orderDate',
  sort_order: 'desc'
}
```

响应格式：
```javascript
{
  code: 200,
  data: {
    data: [
      {
        orderId: 1,
        orderNo: 'ORD20250105001',
        finalAmount: 5000.00,
        orderStatus: 4,
        orderDate: '2025-01-05'
      }
    ],
    page: 1,
    limit: 20,
    total: 10
  }
}
```

### 获取客户消费趋势

**GET** `/api/clients/:id/consumption-trend`

查询参数：
```javascript
{
  months: 12  // 获取近N个月的数据
}
```

响应格式：
```javascript
{
  code: 200,
  data: [
    {
      month: '2024-01',
      amount: 5000.00,
      orderCount: 2
    },
    {
      month: '2024-02',
      amount: 8000.00,
      orderCount: 3
    }
  ]
}
```

### 获取所有标签

**GET** `/api/clients/tags`

响应格式：
```javascript
{
  code: 200,
  data: [
    {
      tagId: 1,
      tagName: '鞋类客户'
    },
    {
      tagId: 2,
      tagName: '月结客户'
    }
  ]
}
```

### 创建新标签

**POST** `/api/clients/tags`

请求体：
```javascript
{
  tagName: '新标签名称'
}
```

响应格式：
```javascript
{
  code: 201,
  data: {
    tagId: 3,
    tagName: '新标签名称'
  }
}
```

### 更新客户标签

**PUT** `/api/clients/:id/tags`

请求体：
```javascript
{
  tags: [1, 2, 3]  // 标签ID数组
}
```

### 获取客户统计数据

**GET** `/api/clients/:id/statistics`

响应格式：
```javascript
{
  code: 200,
  data: {
    orderCount: 10,
    totalConsumption: 50000.00,
    unpaidAmount: 5000.00,
    avgOrderAmount: 5000.00
  }
}
```

## 数据结构

### 客户等级枚举
```javascript
const CLIENT_LEVEL = {
  NORMAL: 'normal',    // 普通客户
  VIP: 'vip'          // VIP客户
};
```

### 订单状态枚举
```javascript
const ORDER_STATUS = {
  PENDING: 1,         // 待确认
  IN_PROGRESS: 2,     // 进行中
  REVIEWING: 3,       // 待验收
  COMPLETED: 4,       // 已完成
  CANCELLED: 5        // 已取消
};
```

## 权限控制

### 权限检查函数

```javascript
// 检查编辑权限
const hasEditPermission = () => {
  return currentUser.roles.includes('admin') ||
         currentUser.roles.includes('client_manager');
};

// 检查是否是财务角色
const isFinanceRole = () => {
  return currentUser.roles.includes('finance');
};
```

### 权限矩阵

| 功能 | admin | client_manager | photographer | retoucher | finance |
|------|-------|----------------|--------------|-----------|---------|
| 查看列表 | ✓ | ✓ | ✓ | ✓ | ✓ |
| 查看详情 | ✓ | ✓ | ✓ | ✓ | ✓ |
| 新增客户 | ✓ | ✓ | ✗ | ✗ | ✗ |
| 编辑客户 | ✓ | ✓ | ✗ | ✗ | ✗ |
| 删除客户 | ✓ | ✓ | ✗ | ✗ | ✗ |
| 管理标签 | ✓ | ✓ | ✗ | ✗ | ✗ |
| 查看未收款金额 | ✓ | ✓ | ✗ | ✗ | ✓ |

## 业务逻辑

### 1. 客户创建流程

```
1. 用户点击"新增客户"
2. 打开表单抽屉
3. 填写客户信息
4. 验证表单（客户名称唯一性、电话格式、邮箱格式）
5. 选择标签（可输入新标签）
6. 提交创建请求
7. 后端创建客户记录
8. 前端刷新客户列表
```

### 2. 标签筛选流程

```
1. 用户在搜索栏选择多个标签
2. 点击"搜索"按钮
3. 前端将标签ID数组传递给后端
4. 后端筛选出包含所有选中标签的客户
5. 返回筛选结果
6. 前端展示筛选后的客户列表
```

### 3. 标签管理流程

```
1. 用户打开客户详情
2. 切换到"标签管理"标签页
3. 在Select组件中选择标签或输入新标签
4. 输入新标签后回车：
   - 调用创建标签接口
   - 将新标签加入系统标签库
   - 自动关联到当前客户
5. 删除标签：
   - 从Select中移除标签
   - 调用更新客户标签接口
```

### 4. 客户删除流程

```
1. 用户点击"删除"按钮
2. 前端检查客户是否有历史订单
3. 如果有订单：
   - 显示警告弹窗（无法删除）
   - 提示订单数量
4. 如果无订单：
   - 显示确认弹窗
   - 用户确认后删除
   - 刷新客户列表
```

### 5. 消费趋势图渲染流程

```
1. 用户打开客户详情
2. 切换到"消费趋势"标签页
3. 前端请求近12个月的消费数据
4. 后端返回每月的消费金额和订单数
5. 前端使用Recharts绘制折线图：
   - X轴：月份（YYYY-MM格式）
   - Y轴左侧：消费金额（蓝色线）
   - Y轴右侧：订单数量（绿色线）
```

## 性能优化建议

1. **分页加载**：客户列表使用服务端分页
2. **防抖**：搜索框输入使用防抖
3. **缓存**：标签列表可缓存
4. **懒加载**：详情抽屉按需加载
5. **并行请求**：详情抽屉打开时并行请求多个接口

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
1. 客户列表加载
2. 搜索和筛选（包括标签多选）
3. 创建客户（包括客户名称唯一性）
4. 编辑客户
5. 删除客户（有/无订单）
6. 标签管理（添加/删除/创建新标签）
7. 消费趋势图展示
8. 权限控制

### 边界测试
1. 空客户列表
2. 客户名称重复
3. 无效的电话/邮箱格式
4. 删除有订单的客户
5. 无消费趋势数据

### 兼容性测试
1. 不同浏览器
2. 不同屏幕尺寸
3. 不同网络状况

---

**文档版本**: v1.0.0
**最后更新**: 2025-01-05
**维护人员**: 开发团队

# 订单管理模块 - 技术文档

## 目录
1. [架构概述](#架构概述)
2. [组件结构](#组件结构)
3. [API 接口规范](#api-接口规范)
4. [数据结构](#数据结构)
5. [状态管理](#状态管理)
6. [权限控制](#权限控制)
7. [业务逻辑](#业务逻辑)

## 架构概述

订单管理模块采用组件化架构，主要包含以下部分：

```
OrderList (主容器)
├── OrderSearchBar (搜索栏)
├── OrderTable (订单表格)
├── CreateOrderModal (创建/编辑弹窗)
└── OrderDetailDrawer (详情抽屉)
    ├── 产品明细标签页
    ├── 任务分配标签页
    ├── 收款记录标签页
    ├── 附件文件标签页
    └── 操作历史标签页
```

### 技术栈
- React 18
- Ant Design 5
- Redux (用户状态管理)
- dayjs (日期处理)
- Less (样式预处理)

## 组件结构

### 1. OrderList.jsx
**主容器组件**，负责协调所有子组件和管理全局状态。

#### Props
无（从 Redux 获取用户信息）

#### State
```javascript
{
  loading: false,           // 加载状态
  orders: [],              // 订单列表
  pagination: {            // 分页信息
    current: 1,
    pageSize: 10,
    total: 0
  },
  searchParams: {},        // 搜索参数
  createModalVisible: false,    // 创建弹窗显示状态
  detailDrawerVisible: false,   // 详情抽屉显示状态
  editData: null,          // 编辑数据
  selectedOrderId: null    // 选中的订单ID
}
```

#### 主要方法
- `fetchOrders()` - 获取订单列表
- `handleSearch(params)` - 处理搜索
- `handleReset()` - 重置搜索
- `handlePageChange(params)` - 处理分页变化
- `handleCreate()` - 打开创建弹窗
- `handleEdit(record)` - 打开编辑弹窗
- `handleView(record)` - 打开详情抽屉
- `handleRefresh()` - 刷新列表

### 2. OrderSearchBar.jsx
**搜索栏组件**，提供订单搜索和筛选功能。

#### Props
```javascript
{
  onSearch: Function,           // 搜索回调
  onReset: Function,            // 重置回调
  onCreate: Function,           // 创建订单回调
  hasCreatePermission: Boolean  // 是否有创建权限
}
```

#### 搜索参数
- `keyword` - 关键词（订单编号、客户名称）
- `order_status` - 订单状态 (1-5)
- `payment_status` - 支付状态 (1-3)
- `client_id` - 客户ID
- `start_date` - 开始日期 (YYYY-MM-DD)
- `end_date` - 结束日期 (YYYY-MM-DD)

### 3. OrderTable.jsx
**订单表格组件**，显示订单列表并提供操作入口。

#### Props
```javascript
{
  data: Array,              // 订单数据
  loading: Boolean,         // 加载状态
  pagination: Object,       // 分页配置
  onPageChange: Function,   // 分页变化回调
  onView: Function,         // 查看详情回调
  onEdit: Function,         // 编辑回调
  onRefresh: Function,      // 刷新回调
  currentUser: Object       // 当前用户信息
}
```

#### 表格列
1. 订单编号 (orderNo)
2. 客户名称 (clientName)
3. 创建日期 (orderDate) - 可排序
4. 交付日期 (deliveryDate)
5. 总件数 (totalPieces)
6. 最终金额 (finalAmount) - 可排序
7. 订单状态 (orderStatus) - 可筛选
8. 支付状态 (paymentStatus) - 可筛选
9. 优先级 (priority)
10. 操作按钮

#### 状态流转
```
待确认(1) → 进行中(2) → 待验收(3) → 已完成(4)
   ↓           ↓           ↓
已取消(5)    已取消(5)    已取消(5)
```

### 4. CreateOrderModal.jsx
**创建/编辑订单弹窗**，支持复杂的订单表单。

#### Props
```javascript
{
  visible: Boolean,      // 显示状态
  onCancel: Function,    // 取消回调
  onSuccess: Function,   // 成功回调
  editData: Object       // 编辑数据（null为创建模式）
}
```

#### 表单结构

##### 基本信息
- `clientId` - 客户ID (必填)
- `shootingType` - 拍摄类型
- `priority` - 优先级 (1-5，默认3)
- `remark` - 备注

##### 产品明细（动态数组）
每行包含：
- `effectType` - 效果类型 (必填)
- `quantity` - 数量 (必填，≥1)
- `unitPrice` - 单价 (必填，>0)

##### 金额信息
- `discountType` - 折扣类型 (percentage/fixed)
- `discountValue` - 折扣值
- 额外费用（动态数组）
  - `name` - 费用名称 (必填)
  - `amount` - 金额 (必填)

#### 金额计算公式
```javascript
baseAmount = Σ(quantity × unitPrice)  // 基础金额
discountAmount = discountType === 'percentage'
  ? baseAmount × (discountValue / 100)
  : discountValue                      // 折扣金额
extraAmount = Σ(extraFee.amount)       // 额外费用
finalAmount = baseAmount - discountAmount + extraAmount  // 最终金额
```

### 5. OrderDetailDrawer.jsx
**订单详情抽屉**，包含5个标签页。

#### Props
```javascript
{
  visible: Boolean,      // 显示状态
  orderId: Number,       // 订单ID
  onClose: Function,     // 关闭回调
  currentUser: Object    // 当前用户信息
}
```

#### 标签页

##### Tab 1: 产品明细
- 订单基本信息
- 金额信息汇总
- 产品明细表格

##### Tab 2: 任务分配
- 任务列表表格
- 任务进度更新（仅任务负责人可操作）
- 任务状态：待开始(1)、进行中(2)、已完成(3)、已暂停(4)

##### Tab 3: 收款记录
- 收款记录表格
- 添加收款记录（仅财务角色可操作）
- 收款统计：总额、已收款、待收款

##### Tab 4: 附件文件
- 文件上传
- 附件列表（支持图片预览）
- 文件下载/删除

##### Tab 5: 操作历史
- 时间轴展示
- 操作人、操作时间、操作内容
- 详细变更信息

## API 接口规范

### 订单列表

**GET** `/api/orders`

查询参数：
```javascript
{
  page: 1,                    // 页码
  limit: 10,                  // 每页数量
  keyword: '',                // 关键词
  order_status: 1,            // 订单状态
  payment_status: 1,          // 支付状态
  client_id: 1,              // 客户ID
  start_date: '2025-01-01',  // 开始日期
  end_date: '2025-01-31',    // 结束日期
  sort_by: 'orderDate',      // 排序字段
  sort_order: 'desc'         // 排序方向 (asc/desc)
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
        orderId: 1,
        orderNo: 'ORD20250105001',
        clientId: 1,
        clientName: '客户名称',
        orderDate: '2025-01-05',
        deliveryDate: '2025-01-10',
        shootingType: '夏装',
        priority: 3,
        totalPieces: 100,
        baseAmount: 1000.00,
        discountAmount: 50.00,
        extraAmount: 100.00,
        finalAmount: 1050.00,
        paidAmount: 500.00,
        orderStatus: 2,
        paymentStatus: 2,
        remark: '备注信息'
      }
    ],
    page: 1,
    limit: 10,
    total: 100
  }
}
```

### 订单详情

**GET** `/api/orders/:id`

响应格式：
```javascript
{
  code: 200,
  message: 'success',
  data: {
    orderId: 1,
    orderNo: 'ORD20250105001',
    // ... 基本字段
    items: [  // 产品明细
      {
        itemId: 1,
        effectType: '平铺',
        quantity: 50,
        unitPrice: 5.00
      }
    ],
    extras: [  // 额外费用
      {
        extraId: 1,
        name: '加急费',
        amount: 100.00
      }
    ]
  }
}
```

### 创建订单

**POST** `/api/orders`

请求体：
```javascript
{
  clientId: 1,
  shootingType: '夏装',
  priority: 3,
  remark: '备注',
  items: [
    {
      effectType: 1,
      quantity: 50,
      unitPrice: 5.00
    }
  ],
  extras: [
    {
      name: '加急费',
      amount: 100.00
    }
  ],
  discountType: 'percentage',
  discountValue: 5,
  baseAmount: 1000.00,
  discountAmount: 50.00,
  extraAmount: 100.00,
  finalAmount: 1050.00
}
```

响应格式：
```javascript
{
  code: 201,
  message: '订单创建成功',
  data: {
    orderId: 1,
    orderNo: 'ORD20250105001'
  }
}
```

### 更新订单

**PUT** `/api/orders/:id`

请求体：同创建订单

响应格式：
```javascript
{
  code: 200,
  message: '订单更新成功',
  data: {
    orderId: 1
  }
}
```

### 更新订单状态

**PUT** `/api/orders/:id/status`

请求体：
```javascript
{
  status: 2  // 新状态
}
```

### 获取客户列表

**GET** `/api/clients`

查询参数：
```javascript
{
  page: 1,
  limit: 100
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
        clientName: '客户名称',
        contactPerson: '联系人',
        phone: '13800138000'
      }
    ],
    page: 1,
    limit: 100,
    total: 50
  }
}
```

### 获取客户详情

**GET** `/api/clients/:id`

响应格式：
```javascript
{
  code: 200,
  data: {
    clientId: 1,
    clientName: '客户名称',
    contactPerson: '联系人',
    phone: '13800138000',
    email: 'client@example.com',
    address: '地址'
  }
}
```

### 获取效果类型

**GET** `/api/effect-types`

响应格式：
```javascript
{
  code: 200,
  data: [
    {
      id: 1,
      name: '平铺',
      minPrice: 2,
      maxPrice: 5
    },
    {
      id: 2,
      name: '挂拍',
      minPrice: 3,
      maxPrice: 8
    }
  ]
}
```

### 获取订单任务

**GET** `/api/orders/:id/tasks`

响应格式：
```javascript
{
  code: 200,
  data: [
    {
      taskId: 1,
      taskType: 'photography',
      assigneeId: 1,
      assigneeName: '摄影师A',
      status: 2,
      progress: 60,
      startTime: '2025-01-05 09:00:00',
      endTime: null
    }
  ]
}
```

### 更新任务进度

**PUT** `/api/orders/:orderId/tasks/:taskId/progress`

请求体：
```javascript
{
  progress: 80,
  remark: '进度说明'
}
```

### 获取收款记录

**GET** `/api/orders/:id/payments`

响应格式：
```javascript
{
  code: 200,
  data: [
    {
      paymentId: 1,
      paymentDate: '2025-01-05',
      amount: 500.00,
      paymentMethod: 'bank_transfer',
      remark: '首付款',
      createdBy: '财务A'
    }
  ]
}
```

### 添加收款记录

**POST** `/api/orders/:id/payments`

请求体：
```javascript
{
  amount: 500.00,
  paymentMethod: 'bank_transfer',
  remark: '首付款'
}
```

### 获取附件列表

**GET** `/api/orders/:id/attachments`

响应格式：
```javascript
{
  code: 200,
  data: [
    {
      attachmentId: 1,
      fileName: 'sample.jpg',
      fileUrl: 'https://example.com/files/sample.jpg',
      fileType: 'image/jpeg',
      fileSize: 102400,
      uploadTime: '2025-01-05 10:00:00',
      uploaderName: '用户A'
    }
  ]
}
```

### 上传附件

**POST** `/api/orders/:id/attachments`

请求头：
```
Content-Type: multipart/form-data
```

请求体：
```javascript
FormData {
  file: File  // 文件对象
}
```

### 删除附件

**DELETE** `/api/orders/:orderId/attachments/:attachmentId`

### 获取历史记录

**GET** `/api/orders/:id/history`

响应格式：
```javascript
{
  code: 200,
  data: [
    {
      operationTime: '2025-01-05 09:00:00',
      operatorName: '管理员A',
      operationType: 'create',
      operationDesc: '创建了订单',
      details: '订单编号：ORD20250105001\n客户：客户A\n金额：¥1050.00'
    }
  ]
}
```

## 数据结构

### 订单状态枚举
```javascript
const ORDER_STATUS = {
  PENDING: 1,      // 待确认
  IN_PROGRESS: 2,  // 进行中
  REVIEWING: 3,    // 待验收
  COMPLETED: 4,    // 已完成
  CANCELLED: 5     // 已取消
};
```

### 支付状态枚举
```javascript
const PAYMENT_STATUS = {
  UNPAID: 1,        // 未付款
  PARTIAL_PAID: 2,  // 部分付款
  PAID: 3           // 已付清
};
```

### 优先级枚举
```javascript
const PRIORITY = {
  HIGHEST: 1,  // 最高
  HIGH: 2,     // 高
  NORMAL: 3,   // 普通
  LOW: 4,      // 低
  LOWEST: 5    // 最低
};
```

### 任务状态枚举
```javascript
const TASK_STATUS = {
  PENDING: 1,      // 待开始
  IN_PROGRESS: 2,  // 进行中
  COMPLETED: 3,    // 已完成
  PAUSED: 4        // 已暂停
};
```

## 状态管理

### Redux State 要求
```javascript
{
  user: {
    currentUser: {
      userId: Number,
      userName: String,
      roles: Array<String>  // ['admin', 'client_manager', 'photographer', 'retoucher', 'finance']
    }
  }
}
```

## 权限控制

### 角色权限矩阵

| 功能 | admin | client_manager | photographer | retoucher | finance |
|------|-------|----------------|--------------|-----------|---------|
| 查看订单列表 | ✓ | ✓ | ✓ | ✓ | ✓ |
| 创建订单 | ✓ | ✓ | ✗ | ✗ | ✗ |
| 编辑订单 | ✓ | ✓ | ✗ | ✗ | ✗ |
| 查看订单详情 | ✓ | ✓ | ✓ | ✓ | ✓ |
| 更新订单状态 | ✓ | ✓ | ✗ | ✗ | ✗ |
| 更新任务进度 | ✓ | 仅自己的任务 | 仅自己的任务 | 仅自己的任务 | ✗ |
| 添加收款记录 | ✓ | ✗ | ✗ | ✗ | ✓ |
| 上传/删除附件 | ✓ | ✓ | ✓ | ✓ | ✓ |

### 权限检查函数

```javascript
// 检查编辑权限
const hasEditPermission = () => {
  return currentUser.roles.includes('admin') ||
         currentUser.roles.includes('client_manager');
};

// 检查财务权限
const hasFinancePermission = () => {
  return currentUser.roles.includes('admin') ||
         currentUser.roles.includes('finance');
};

// 检查任务更新权限
const canUpdateTaskProgress = (task) => {
  if (currentUser.roles.includes('admin')) return true;
  return task.assigneeId === currentUser.userId;
};
```

## 业务逻辑

### 1. 订单状态流转规则

```javascript
const statusFlow = {
  1: [2, 5],     // 待确认 → 进行中、已取消
  2: [3, 5],     // 进行中 → 待验收、已取消
  3: [2, 4, 5],  // 待验收 → 进行中、已完成、已取消
  4: [],         // 已完成（终态）
  5: []          // 已取消（终态）
};
```

### 2. 支付状态自动计算

支付状态根据已收款金额和订单总额自动计算：

```javascript
if (paidAmount === 0) {
  paymentStatus = 1;  // 未付款
} else if (paidAmount < finalAmount) {
  paymentStatus = 2;  // 部分付款
} else {
  paymentStatus = 3;  // 已付清
}
```

### 3. 产品明细验证

- 效果类型：必选
- 数量：必填，≥1
- 单价：必填，>0，建议范围根据效果类型的 minPrice 和 maxPrice

### 4. 金额计算时机

实时计算触发条件：
- 产品明细变化（数量、单价）
- 折扣值变化
- 折扣类型切换
- 额外费用变化
- Form 的 onValuesChange 事件

### 5. 文件上传限制

- 单个文件大小：≤10MB
- 支持文件类型：图片、文档
- 支持多文件上传

### 6. 历史记录追踪

记录以下操作：
- 订单创建
- 订单修改（记录变更详情）
- 状态更新
- 收款记录添加
- 任务进度更新
- 附件上传/删除

## 性能优化建议

1. **懒加载**: 详情抽屉中的数据按需加载
2. **防抖**: 搜索框输入使用防抖
3. **分页**: 订单列表使用服务端分页
4. **缓存**: 客户列表、效果类型列表可缓存
5. **并行请求**: 详情抽屉打开时并行请求多个接口

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
1. 订单创建流程
2. 订单编辑流程
3. 状态流转
4. 权限控制
5. 金额计算准确性
6. 文件上传/下载

### 边界测试
1. 空数据列表
2. 单条产品明细
3. 最大产品明细数量
4. 大额订单
5. 文件大小限制

### 兼容性测试
1. 不同浏览器
2. 不同屏幕尺寸
3. 不同网络状况

## 维护说明

### 添加新的效果类型
1. 后端添加效果类型数据
2. 前端自动从 API 获取，无需修改代码

### 修改状态流转规则
修改 `OrderTable.jsx` 中的 `getAvailableStatuses` 函数：

```javascript
const getAvailableStatuses = (currentStatus) => {
  const statusFlow = {
    // 修改这里的映射关系
  };
  return statusFlow[currentStatus] || [];
};
```

### 添加新的权限角色
1. 在权限检查函数中添加新角色的判断
2. 更新权限矩阵文档

---

**文档版本**: v1.0.0
**最后更新**: 2025-01-05
**维护人员**: 开发团队

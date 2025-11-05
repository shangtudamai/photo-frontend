# 订单管理模块

## 快速开始

### 1. 导入组件

```javascript
import OrderList from '@/components/OrderList';
```

### 2. 在路由中使用

```javascript
import OrderList from '@/components/OrderList';

// 在路由配置中
{
  path: '/orders',
  element: <OrderList />,
  meta: {
    title: '订单管理',
    requiresAuth: true
  }
}
```

### 3. 权限配置

确保你的 Redux store 中包含用户信息：

```javascript
// Redux state 结构
{
  user: {
    currentUser: {
      userId: 1,
      userName: '张三',
      roles: ['admin', 'client_manager'] // 角色列表
    }
  }
}
```

## 功能说明

### 主要功能

1. **订单搜索与筛选**
   - 关键词搜索（订单编号、客户名称）
   - 订单状态筛选
   - 支付状态筛选
   - 客户筛选
   - 日期范围筛选

2. **订单列表展示**
   - 分页展示订单列表
   - 按日期、金额排序
   - 状态标签显示
   - 权限控制的操作按钮

3. **创建/编辑订单**
   - 客户选择（自动显示联系信息）
   - 动态添加产品明细
   - 实时金额计算
   - 折扣设置（百分比/固定金额）
   - 额外费用添加
   - 表单验证

4. **订单详情查看**
   - 产品明细查看
   - 任务分配记录
   - 收款记录管理
   - 附件上传与管理
   - 操作历史查看

5. **订单状态管理**
   - 状态流转控制（待确认→进行中→待验收→已完成）
   - 权限控制的状态更新

### 权限说明

| 角色 | 权限 |
|------|------|
| admin | 所有操作 |
| client_manager | 创建、编辑、查看订单；更新订单状态 |
| photographer | 查看订单详情；更新自己的任务进度 |
| retoucher | 查看订单详情；更新自己的任务进度 |
| finance | 查看订单详情；添加收款记录 |

## API 接口要求

订单管理模块需要以下后端 API 接口支持：

### 订单相关
- `GET /api/orders` - 获取订单列表
- `GET /api/orders/:id` - 获取订单详情
- `POST /api/orders` - 创建订单
- `PUT /api/orders/:id` - 更新订单
- `PUT /api/orders/:id/status` - 更新订单状态
- `DELETE /api/orders/:id` - 删除订单

### 客户相关
- `GET /api/clients` - 获取客户列表
- `GET /api/clients/:id` - 获取客户详情

### 任务相关
- `GET /api/orders/:id/tasks` - 获取订单任务列表
- `PUT /api/orders/:orderId/tasks/:taskId/progress` - 更新任务进度

### 收款相关
- `GET /api/orders/:id/payments` - 获取收款记录
- `POST /api/orders/:id/payments` - 添加收款记录

### 附件相关
- `GET /api/orders/:id/attachments` - 获取附件列表
- `POST /api/orders/:id/attachments` - 上传附件
- `DELETE /api/orders/:orderId/attachments/:attachmentId` - 删除附件

### 其他
- `GET /api/orders/:id/history` - 获取历史记录
- `GET /api/effect-types` - 获取效果类型列表
- `POST /api/orders/calculate-amount` - 计算订单金额（可选）

详细的 API 接口规范请参考 `ORDER_DOCUMENTATION.md`。

## 样式自定义

所有 LESS 变量都可以通过修改对应的 `.less` 文件进行自定义：

- `OrderList.less` - 主容器样式
- `OrderSearchBar.less` - 搜索栏样式
- `OrderTable.less` - 表格样式
- `CreateOrderModal.less` - 创建/编辑弹窗样式
- `OrderDetailDrawer.less` - 详情抽屉样式

## 常见问题

### 1. 订单列表不显示数据
- 检查 API 返回数据格式是否正确
- 确认后端接口是否正常
- 查看浏览器控制台是否有错误信息

### 2. 创建订单时单价验证失败
- 确保后端返回的效果类型包含 `minPrice` 和 `maxPrice` 字段
- 如果后端不支持，组件会使用默认的价格范围

### 3. 文件上传失败
- 检查后端是否支持 `multipart/form-data`
- 确认文件大小是否超过限制（默认10MB）
- 查看网络请求响应错误信息

### 4. 权限控制不生效
- 确认 Redux store 中的用户信息格式正确
- 检查 `currentUser.roles` 数组是否包含正确的角色标识

## 更新日志

### v1.0.0 (2025-01-05)
- 初始版本
- 完整的订单管理功能
- 权限控制
- 文件上传
- 历史记录追踪

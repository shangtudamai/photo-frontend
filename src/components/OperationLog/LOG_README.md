# 用户操作日志模块

## 快速开始

### 1. 后端配置

#### 创建数据库表

```bash
mysql -u root -p your_database < backend/database/operation_logs.sql
```

#### 注册路由

在后端 `app.js` 中注册日志路由：

```javascript
const logRoutes = require('./routes/logRoutes');
app.use('/api/logs', logRoutes);
```

#### 安装依赖

```bash
npm install exceljs
```

### 2. 在控制器中使用日志中间件

在需要记录日志的路由中添加日志中间件：

```javascript
const {
  logOrderCreate,
  logOrderUpdate,
  logTaskAssign
} = require('../middleware/operationLog');

// 订单创建
router.post('/', logOrderCreate, orderController.createOrder);

// 订单更新
router.put('/:id', logOrderUpdate, orderController.updateOrder);

// 任务分配
router.post('/:id/assign', logTaskAssign, taskController.assignTask);
```

### 3. 前端路由配置

```javascript
import OperationLog from '@/components/OperationLog';

{
  path: '/logs',
  element: <OperationLog />,
  meta: {
    title: '操作日志',
    requiresAuth: true,
    requiresAdmin: true  // 仅管理员可访问
  }
}
```

## 功能说明

### 主要功能

1. **日志记录**
   - 自动拦截关键API请求
   - 记录操作人、操作类型、操作对象、详情、IP地址
   - 异步写入，不阻塞主业务流程

2. **日志查询**
   - 按操作人、操作类型、对象类型、时间范围筛选
   - 分页加载（默认20条/页）
   - 支持查看详细变更记录

3. **日志导出**
   - 导出Excel格式
   - 限制最大导出1000条
   - 包含所有关键信息

4. **详情查看**
   - 展开查看操作的具体变更（旧值 → 新值）
   - 支持JSON格式详情展示

### 记录的关键操作

| 操作对象 | 记录的操作 |
|---------|-----------|
| 订单 | 创建、修改（金额/件数）、状态变更 |
| 任务 | 分配、进度更新、退回 |
| 客户 | 创建、删除、关键信息修改 |
| 收款记录 | 创建、金额修改 |
| 用户 | 创建、权限变更 |
| 系统参数 | 参数配置修改 |

### 权限控制

| 角色 | 权限 |
|------|------|
| admin | 查看日志、导出日志 |
| 其他角色 | 无权访问（显示403页面） |

## 使用示例

### 1. 在订单控制器中记录日志

```javascript
// orderController.js
const {
  logOrderUpdate,
  generateChangeDetails,
  FIELD_CONFIGS
} = require('../middleware/operationLog');

exports.updateOrder = async (req, res) => {
  try {
    const orderId = req.params.id;

    // 获取旧订单数据
    const oldOrder = await Order.findById(orderId);

    // 更新订单
    await Order.update(orderId, req.body);

    // 将旧数据添加到req对象（供日志中间件使用）
    req.oldOrderData = oldOrder;

    res.json({
      code: 200,
      message: '订单更新成功'
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '订单更新失败'
    });
  }
};

// 在路由中使用日志中间件
router.put('/:id', logOrderUpdate, orderController.updateOrder);
```

### 2. 自定义日志中间件

```javascript
const { logOperation, generateChangeDetails } = require('../middleware/operationLog');

// 自定义日志中间件
const logCustomAction = logOperation({
  operationType: 'custom_action',
  targetType: 'custom_target',
  getTargetId: (req, data) => data.data?.id,
  getTargetName: (req, data) => data.data?.name,
  getDetails: (req) => ({
    action: 'custom action description',
    params: req.body
  })
});

router.post('/custom', logCustomAction, customController.handleCustomAction);
```

### 3. 查询日志

```javascript
// 前端调用
import { getLogs } from '@/services/logService';

const logs = await getLogs({
  operationType: 'update',
  targetType: 'order',
  startTime: '2025-01-01 00:00:00',
  endTime: '2025-01-31 23:59:59',
  page: 1,
  limit: 20
});
```

### 4. 导出日志

```javascript
// 前端调用
import { exportLogs } from '@/services/logService';

const blob = await exportLogs({
  operationType: 'update',
  targetType: 'order',
  startTime: '2025-01-01 00:00:00',
  endTime: '2025-01-31 23:59:59'
});

// 创建下载链接
const url = window.URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = `logs_${Date.now()}.xlsx`;
link.click();
```

## 日志详情格式

### 字段变更记录

```json
{
  "changes": [
    {
      "field": "orderStatus",
      "fieldName": "订单状态",
      "oldValue": "1",
      "oldValueText": "待确认",
      "newValue": "2",
      "newValueText": "进行中"
    },
    {
      "field": "finalAmount",
      "fieldName": "最终金额",
      "oldValue": "5000",
      "newValue": "5500"
    }
  ],
  "remark": "备注信息"
}
```

### 简单详情

```json
{
  "clientName": "ABC服装公司",
  "finalAmount": 5000,
  "productCount": 10
}
```

## 性能优化

### 数据库分区

日志表按月份分区，查询时自动使用对应分区：

```sql
PARTITION BY RANGE (YEAR(created_at) * 100 + MONTH(created_at)) (
  PARTITION p202501 VALUES LESS THAN (202502),
  PARTITION p202502 VALUES LESS THAN (202503),
  ...
)
```

### 索引优化

已创建的索引：
- `idx_user_id`: 按用户查询
- `idx_operation_type`: 按操作类型查询
- `idx_target_type`: 按对象类型查询
- `idx_created_at`: 按时间查询
- `idx_user_operation`: 组合索引（用户+操作类型+时间）
- `idx_target_operation`: 组合索引（对象类型+对象ID+时间）

### 异步写入

日志写入使用 `setImmediate` 异步执行，不阻塞主业务：

```javascript
res.json = function(data) {
  if (data.code === 200) {
    setImmediate(async () => {
      await createLog({ /* 日志数据 */ });
    });
  }
  return originalJson(data);
};
```

### 分页加载

前端默认每页20条，支持自定义：

```javascript
const result = await getLogs({
  page: 1,
  limit: 20  // 可调整为 50, 100
});
```

### 导出限制

单次最多导出1000条记录，防止服务器压力过大。

## 常见问题

### 1. 日志未记录

**原因**：
- 中间件未添加到路由
- 响应code不是200或201
- 用户信息缺失

**解决方案**：
- 检查路由配置
- 确保响应格式正确
- 确保req.user存在

### 2. 详情信息不完整

**原因**：
- 未将旧数据添加到req对象
- getDetails函数未正确实现

**解决方案**：
```javascript
// 在controller中添加旧数据
const oldData = await Model.findById(id);
req.oldModelData = oldData;
```

### 3. 导出失败

**原因**：
- exceljs依赖未安装
- 查询数据量过大

**解决方案**：
```bash
npm install exceljs
```
- 使用时间范围限制查询

### 4. 性能问题

**原因**：
- 日志量过大
- 缺少索引

**解决方案**：
- 定期清理过期日志
- 使用时间范围查询
- 检查索引是否正常

## 维护建议

### 定期清理过期日志

建议保留6个月的日志，定期清理：

```javascript
const { deleteExpiredLogs } = require('./services/logService');

// 删除6个月前的日志
await deleteExpiredLogs(6);
```

### 添加定时任务

使用cron定时清理：

```javascript
const cron = require('node-cron');

// 每月1号凌晨2点清理过期日志
cron.schedule('0 2 1 * *', async () => {
  console.log('Cleaning expired logs...');
  await deleteExpiredLogs(6);
});
```

### 监控日志量

定期检查日志表大小：

```sql
SELECT
  TABLE_NAME,
  ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) AS 'Size (MB)'
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'your_database'
AND TABLE_NAME = 'operation_logs';
```

## 更新日志

### v1.0.0 (2025-01-05)
- 初始版本
- 支持订单、任务、客户、收款、用户、系统参数等操作日志记录
- 支持日志查询、筛选、导出
- 支持详情查看（字段变更对比）
- 数据库分区优化
- 异步写入
- 限制导出1000条

---

**文档版本**: v1.0.0
**最后更新**: 2025-01-05
**维护人员**: 开发团队

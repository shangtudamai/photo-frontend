# 用户操作日志模块 - 技术文档

## 目录
1. [架构概述](#架构概述)
2. [数据库设计](#数据库设计)
3. [日志记录流程](#日志记录流程)
4. [中间件实现](#中间件实现)
5. [前端实现](#前端实现)
6. [性能优化](#性能优化)
7. [安全机制](#安全机制)

## 架构概述

### 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                      前端应用                              │
│  ┌──────────────────────────────────────────────────┐   │
│  │         OperationLog Component                    │   │
│  │  ┌────────────────────────────────────────────┐  │   │
│  │  │  LogFilter   LogTable   LogDetailModal    │  │   │
│  │  └────────────────────────────────────────────┘  │   │
│  │                                                   │   │
│  │  ┌────────────────────────────────────────────┐  │   │
│  │  │        logService.js (API)                 │  │   │
│  │  │  - getLogs()                               │  │   │
│  │  │  - exportLogs()                            │  │   │
│  │  │  - getStatistics()                         │  │   │
│  │  └────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          ↕ HTTP/HTTPS
┌─────────────────────────────────────────────────────────┐
│                      后端服务                              │
│  ┌──────────────────────────────────────────────────┐   │
│  │       logController.js                            │   │
│  │  - getLogs()                                      │   │
│  │  - exportLogs() (ExcelJS)                         │   │
│  │  - getStatistics()                                │   │
│  └──────────────────────────────────────────────────┘   │
│                          ↕                               │
│  ┌──────────────────────────────────────────────────┐   │
│  │     operationLog.js (Middleware)                  │   │
│  │  - logOperation() - 中间件工厂函数                │   │
│  │  - generateChangeDetails() - 变更详情生成          │   │
│  │  - 预定义中间件:                                   │   │
│  │    * logOrderCreate / logOrderUpdate              │   │
│  │    * logTaskAssign / logTaskProgress              │   │
│  │    * logPaymentCreate / logClientDelete           │   │
│  └──────────────────────────────────────────────────┘   │
│                          ↕                               │
│  ┌──────────────────────────────────────────────────┐   │
│  │       logService.js                               │   │
│  │  - createLog() - 创建日志                          │   │
│  │  - getLogs() - 查询日志                            │   │
│  │  - exportLogs() - 导出日志                         │   │
│  │  - deleteExpiredLogs() - 清理过期日志              │   │
│  └──────────────────────────────────────────────────┘   │
│                          ↕                               │
│  ┌──────────────────────────────────────────────────┐   │
│  │              MySQL Database                       │   │
│  │  - operation_logs (按月分区)                      │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 技术栈

**后端**：
- Node.js + Express
- MySQL 数据库（分区表）
- ExcelJS（Excel导出）

**前端**：
- React 18
- Ant Design 5
- Redux (用户状态管理)
- dayjs (日期处理)
- Less (样式预处理)

## 数据库设计

### operation_logs 表

```sql
CREATE TABLE operation_logs (
  log_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  user_name VARCHAR(50),
  operation_type VARCHAR(20) NOT NULL,
  target_type VARCHAR(20) NOT NULL,
  target_id INT,
  target_name VARCHAR(100),
  details JSON,
  ip_address VARCHAR(45),
  user_agent VARCHAR(200),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  -- 索引
  KEY idx_user_id (user_id),
  KEY idx_operation_type (operation_type),
  KEY idx_target_type (target_type),
  KEY idx_created_at (created_at),
  KEY idx_user_operation (user_id, operation_type, created_at DESC),
  KEY idx_target_operation (target_type, target_id, created_at DESC)
) PARTITION BY RANGE (YEAR(created_at) * 100 + MONTH(created_at));
```

### 分区策略

按月份分区，提高查询性能：

```sql
PARTITION BY RANGE (YEAR(created_at) * 100 + MONTH(created_at)) (
  PARTITION p202501 VALUES LESS THAN (202502),  -- 2025年1月
  PARTITION p202502 VALUES LESS THAN (202503),  -- 2025年2月
  ...
  PARTITION p_future VALUES LESS THAN MAXVALUE  -- 未来分区
);
```

**优势**：
- 查询时自动定位到对应分区
- 可独立删除/归档旧分区
- 减少索引大小

### details 字段格式

**字段变更格式**：

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
    }
  ],
  "remark": "备注信息"
}
```

**简单格式**：

```json
{
  "clientName": "ABC服装公司",
  "finalAmount": 5000,
  "productCount": 10
}
```

## 日志记录流程

### 整体流程

```
1. 客户端发起请求
   ↓
2. 经过身份验证中间件
   ↓
3. 经过日志记录中间件 (logOperation)
   ├─ 保存原始 res.json 方法
   ├─ 重写 res.json 方法
   └─ 传递给下一个中间件
   ↓
4. 业务控制器处理请求
   ├─ 执行业务逻辑
   ├─ 将旧数据添加到 req 对象（可选）
   └─ 调用 res.json 返回响应
   ↓
5. 执行重写的 res.json 方法
   ├─ 检查响应code（200/201）
   ├─ 使用 setImmediate 异步记录日志
   └─ 调用原始 res.json 方法
   ↓
6. 返回响应给客户端
   ↓
7. 异步写入日志到数据库
```

### 关键代码

**中间件实现**：

```javascript
function logOperation(options) {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = function(data) {
      // 只在成功响应时记录日志
      if (data.code === 200 || data.code === 201) {
        // 异步记录日志（不阻塞响应）
        setImmediate(async () => {
          try {
            const userId = req.user?.userId;
            const userName = req.user?.userName;

            const targetId = options.getTargetId ? options.getTargetId(req, data) : null;
            const targetName = options.getTargetName ? options.getTargetName(req, data) : null;
            const details = options.getDetails ? options.getDetails(req, data) : null;

            const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            const userAgent = req.headers['user-agent'];

            await createLog({
              userId,
              userName,
              operationType: options.operationType,
              targetType: options.targetType,
              targetId,
              targetName,
              details,
              ipAddress,
              userAgent
            });
          } catch (error) {
            console.error('[Log Middleware] Error creating log:', error);
          }
        });
      }

      return originalJson(data);
    };

    next();
  };
}
```

## 中间件实现

### 中间件工厂函数

`logOperation(options)` 是一个工厂函数，接收配置参数并返回中间件：

**参数说明**：

| 参数 | 类型 | 说明 |
|------|------|------|
| operationType | string | 操作类型（create/update/delete等） |
| targetType | string | 操作对象类型（order/task/client等） |
| getTargetId | function | 获取目标ID的函数 |
| getTargetName | function | 获取目标名称的函数 |
| getDetails | function | 获取操作详情的函数 |

**使用示例**：

```javascript
const logOrderCreate = logOperation({
  operationType: 'create',
  targetType: 'order',
  getTargetId: (req, data) => data.data?.orderId,
  getTargetName: (req, data) => data.data?.orderNo,
  getDetails: (req) => ({
    clientName: req.body.clientName,
    finalAmount: req.body.finalAmount
  })
});

router.post('/', logOrderCreate, orderController.createOrder);
```

### 变更详情生成

`generateChangeDetails(oldData, newData, fields)` 用于生成字段变更详情：

```javascript
function generateChangeDetails(oldData, newData, fields) {
  const changes = [];

  fields.forEach(field => {
    const { key, name, valueMap } = field;

    const oldValue = oldData ? oldData[key] : null;
    const newValue = newData ? newData[key] : null;

    if (oldValue !== newValue) {
      const change = {
        field: key,
        fieldName: name,
        oldValue: String(oldValue),
        newValue: String(newValue)
      };

      // 如果有值映射，添加文本描述
      if (valueMap) {
        change.oldValueText = valueMap[oldValue] || oldValue;
        change.newValueText = valueMap[newValue] || newValue;
      }

      changes.push(change);
    }
  });

  return changes.length > 0 ? { changes } : null;
}
```

**使用示例**：

```javascript
const logOrderUpdate = logOperation({
  operationType: 'update',
  targetType: 'order',
  getTargetId: (req) => req.params.id,
  getDetails: (req) => {
    const oldData = req.oldOrderData;
    const newData = req.body;

    return generateChangeDetails(oldData, newData, [
      {
        key: 'orderStatus',
        name: '订单状态',
        valueMap: {
          1: '待确认',
          2: '进行中',
          3: '待验收',
          4: '已完成'
        }
      },
      {
        key: 'finalAmount',
        name: '最终金额'
      }
    ]);
  }
});
```

### 预定义字段配置

```javascript
const FIELD_CONFIGS = {
  orderStatus: {
    key: 'orderStatus',
    name: '订单状态',
    valueMap: {
      1: '待确认',
      2: '进行中',
      3: '待验收',
      4: '已完成',
      5: '已取消'
    }
  },
  taskStatus: {
    key: 'taskStatus',
    name: '任务状态',
    valueMap: {
      1: '未开始',
      2: '进行中',
      3: '已完成',
      4: '已退回'
    }
  }
  // ...更多字段配置
};
```

## 前端实现

### 主组件（OperationLog）

```javascript
function OperationLog() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });
  const [filters, setFilters] = useState({
    startTime: dayjs().subtract(7, 'day').format('YYYY-MM-DD 00:00:00'),
    endTime: dayjs().format('YYYY-MM-DD 23:59:59')
  });

  // 加载日志
  const loadLogs = async (page = 1, pageSize = 20, customFilters = filters) => {
    const res = await getLogs({
      ...customFilters,
      page,
      limit: pageSize
    });

    if (res.code === 200) {
      setLogs(res.data.data);
      setPagination({
        current: res.data.page,
        pageSize: res.data.limit,
        total: res.data.total
      });
    }
  };

  return (
    <div>
      <LogFilter onSearch={handleSearch} onExport={handleExport} />
      <LogTable
        logs={logs}
        pagination={pagination}
        onViewDetail={handleViewDetail}
      />
      <LogDetailModal visible={detailModalVisible} log={selectedLog} />
    </div>
  );
}
```

### 筛选组件（LogFilter）

```javascript
function LogFilter({ onSearch, onExport }) {
  const [form] = Form.useForm();

  const handleSearch = () => {
    const values = form.getFieldsValue();
    onSearch({
      operationType: values.operationType,
      targetType: values.targetType,
      startTime: values.timeRange[0].format('YYYY-MM-DD 00:00:00'),
      endTime: values.timeRange[1].format('YYYY-MM-DD 23:59:59')
    });
  };

  return (
    <Form form={form}>
      <Form.Item name="operationType">
        <Select placeholder="操作类型" />
      </Form.Item>
      <Form.Item name="targetType">
        <Select placeholder="操作对象类型" />
      </Form.Item>
      <Form.Item name="timeRange">
        <RangePicker />
      </Form.Item>
      <Button onClick={handleSearch}>搜索</Button>
      <Button onClick={onExport}>导出</Button>
    </Form>
  );
}
```

### 详情弹窗（LogDetailModal）

```javascript
function LogDetailModal({ visible, log, onClose }) {
  const renderDetails = () => {
    if (log.details.changes) {
      // 显示变更表格
      return (
        <Table
          dataSource={log.details.changes}
          columns={[
            { title: '字段', dataIndex: 'fieldName' },
            { title: '旧值', dataIndex: 'oldValue' },
            { title: '新值', dataIndex: 'newValue' }
          ]}
        />
      );
    }
    // 显示JSON格式
    return <pre>{JSON.stringify(log.details, null, 2)}</pre>;
  };

  return (
    <Modal visible={visible} onCancel={onClose}>
      <Descriptions>
        <Descriptions.Item label="操作人">{log.userName}</Descriptions.Item>
        <Descriptions.Item label="操作时间">{log.createdAt}</Descriptions.Item>
      </Descriptions>
      {renderDetails()}
    </Modal>
  );
}
```

## 性能优化

### 1. 数据库优化

**分区表**：
- 按月分区，查询时自动定位到对应分区
- 减少全表扫描

**索引优化**：
- 单列索引：`user_id`, `operation_type`, `target_type`, `created_at`
- 组合索引：`(user_id, operation_type, created_at)`, `(target_type, target_id, created_at)`

**查询优化**：
```sql
-- 使用索引
SELECT * FROM operation_logs
WHERE operation_type = 'update'
AND created_at >= '2025-01-01'
AND created_at <= '2025-01-31'
ORDER BY created_at DESC
LIMIT 20;
```

### 2. 异步写入

使用 `setImmediate` 异步写入日志：

```javascript
setImmediate(async () => {
  await createLog({ /* 日志数据 */ });
});
```

**优势**：
- 不阻塞主业务流程
- 即使日志写入失败也不影响业务

### 3. 批量操作

导出时限制最大1000条：

```javascript
const sql = `
  SELECT * FROM operation_logs
  WHERE ...
  ORDER BY created_at DESC
  LIMIT 1000
`;
```

### 4. 分页加载

前端默认20条/页：

```javascript
const result = await getLogs({
  page: 1,
  limit: 20
});
```

## 安全机制

### 1. 权限控制

**后端验证**：

```javascript
exports.getLogs = async (req, res) => {
  if (!req.user.roles.includes('admin')) {
    return res.status(403).json({
      code: 403,
      message: '无权限：仅管理员可以查看操作日志'
    });
  }
  // 执行查询
};
```

**前端验证**：

```javascript
const hasAdminPermission = () => {
  return currentUser?.roles?.includes('admin');
};

if (!hasAdminPermission()) {
  return <Result status="403" />;
}
```

### 2. SQL注入防护

使用参数化查询：

```javascript
const [rows] = await db.query(
  'SELECT * FROM operation_logs WHERE user_id = ?',
  [userId]
);
```

### 3. 数据脱敏

敏感信息不记录到日志：

```javascript
// 不记录密码等敏感字段
const logUserUpdate = logOperation({
  getDetails: (req) => {
    const { password, ...safeData } = req.body;
    return safeData;
  }
});
```

### 4. 日志完整性

记录关键审计信息：
- IP地址
- User-Agent
- 操作时间（不可修改）
- 操作人（外键关联users表）

## 维护建议

### 定期清理

建议保留6个月的日志：

```javascript
// 每月执行一次
const { deleteExpiredLogs } = require('./services/logService');
await deleteExpiredLogs(6);
```

### 分区管理

定期添加新分区：

```sql
-- 添加2025年12月分区
ALTER TABLE operation_logs
ADD PARTITION (
  PARTITION p202512 VALUES LESS THAN (202601)
);

-- 删除旧分区（如2024年1月）
ALTER TABLE operation_logs
DROP PARTITION p202401;
```

### 监控告警

监控日志量异常增长：

```sql
SELECT
  DATE(created_at) as date,
  COUNT(*) as count
FROM operation_logs
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

**文档版本**: v1.0.0
**最后更新**: 2025-01-05
**维护人员**: 开发团队

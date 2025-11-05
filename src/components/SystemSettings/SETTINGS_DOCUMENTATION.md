# 系统参数配置模块 - 技术文档

## 目录
1. [架构概述](#架构概述)
2. [数据库设计](#数据库设计)
3. [后端实现](#后端实现)
4. [前端实现](#前端实现)
5. [缓存机制](#缓存机制)
6. [业务逻辑刷新](#业务逻辑刷新)
7. [安全机制](#安全机制)

## 架构概述

### 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                      前端应用                              │
│  ┌──────────────────────────────────────────────────┐   │
│  │         SystemSettings Component                  │   │
│  │  ┌────────────────────────────────────────────┐  │   │
│  │  │  CapacitySettings   FinanceSettings        │  │   │
│  │  │  RewardSettings     WorkTimeSettings       │  │   │
│  │  │  ChangeLogModal                            │  │   │
│  │  └────────────────────────────────────────────┘  │   │
│  │                                                   │   │
│  │  ┌────────────────────────────────────────────┐  │   │
│  │  │        settingService.js (API)             │  │   │
│  │  │  - getAllParameters()                      │  │   │
│  │  │  - batchUpdateParameters()                 │  │   │
│  │  │  - resetToDefaults()                       │  │   │
│  │  │  - getChangeLogs()                         │  │   │
│  │  └────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          ↕ HTTP/HTTPS
┌─────────────────────────────────────────────────────────┐
│                      后端服务                              │
│  ┌──────────────────────────────────────────────────┐   │
│  │       settingController.js                        │   │
│  │  - getAllParameters()                             │   │
│  │  - batchUpdateParameters()                        │   │
│  │  - resetToDefaults()                              │   │
│  │  - getChangeLogs()                                │   │
│  └──────────────────────────────────────────────────┘   │
│                          ↕                               │
│  ┌──────────────────────────────────────────────────┐   │
│  │       settingService.js                           │   │
│  │  ┌────────────────────────────────────────────┐  │   │
│  │  │       ParameterCache (内存缓存)             │  │   │
│  │  │  - Map<key, value>                         │  │   │
│  │  │  - init() / get() / set() / refresh()     │  │   │
│  │  └────────────────────────────────────────────┘  │   │
│  │                                                   │   │
│  │  - getAllParameters()                             │   │
│  │  - batchUpdateParameters()                        │   │
│  │  - resetToDefaults()                              │   │
│  │  - getChangeLogs()                                │   │
│  │  - triggerRefreshLogic()                          │   │
│  └──────────────────────────────────────────────────┘   │
│                          ↕                               │
│  ┌──────────────────────────────────────────────────┐   │
│  │              MySQL Database                       │   │
│  │  - system_parameters                              │   │
│  │  - parameter_change_logs                          │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 技术栈

**后端**：
- Node.js + Express
- MySQL 数据库
- 内存缓存（Map）

**前端**：
- React 18
- Ant Design 5
- Redux (用户状态管理)
- dayjs (日期处理)
- Less (样式预处理)

## 数据库设计

### 1. system_parameters 表

系统参数配置表，存储所有系统参数。

```sql
CREATE TABLE system_parameters (
  parameter_id INT PRIMARY KEY AUTO_INCREMENT,
  category VARCHAR(50) NOT NULL COMMENT '参数类别: capacity/finance/reward/worktime',
  parameter_key VARCHAR(100) NOT NULL COMMENT '参数键（唯一标识）',
  parameter_value TEXT NOT NULL COMMENT '参数值（JSON格式存储复杂数据）',
  data_type VARCHAR(20) NOT NULL DEFAULT 'string' COMMENT '数据类型: string/number/json/boolean',
  description VARCHAR(200) COMMENT '参数描述',
  default_value TEXT COMMENT '默认值',
  updated_by INT COMMENT '更新人ID',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_parameter_key (parameter_key),
  KEY idx_category (category),
  KEY idx_category_key (category, parameter_key)
);
```

**字段说明**：
- `category`: 参数类别（capacity/finance/reward/worktime）
- `parameter_key`: 参数的唯一键（如 `base_time_per_tile`）
- `parameter_value`: 参数值（简单类型存字符串，复杂类型存JSON）
- `data_type`: 数据类型（用于解析参数值）
- `default_value`: 默认值（用于恢复默认功能）

**索引设计**：
- 主键索引：`parameter_id`
- 唯一索引：`parameter_key`（保证参数键唯一）
- 普通索引：`category`（按类别查询）
- 组合索引：`(category, parameter_key)`（优化查询）

### 2. parameter_change_logs 表

参数变更日志表，记录所有参数修改历史。

```sql
CREATE TABLE parameter_change_logs (
  log_id INT PRIMARY KEY AUTO_INCREMENT,
  parameter_key VARCHAR(100) NOT NULL,
  old_value TEXT,
  new_value TEXT NOT NULL,
  change_reason VARCHAR(200),
  updated_by INT NOT NULL,
  updated_by_name VARCHAR(50),
  ip_address VARCHAR(45),
  user_agent VARCHAR(200),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_parameter_key (parameter_key),
  KEY idx_updated_by (updated_by),
  KEY idx_created_at (created_at),
  KEY idx_key_time (parameter_key, created_at DESC)
);
```

**字段说明**：
- `old_value`: 修改前的值
- `new_value`: 修改后的值
- `change_reason`: 变更原因（可选）
- `ip_address`: 操作者IP地址
- `user_agent`: 浏览器信息

**索引设计**：
- 组合索引：`(parameter_key, created_at DESC)`（查询某个参数的历史变更）
- 普通索引：`updated_by`（查询某人的操作记录）

## 后端实现

### 1. ParameterCache 类（缓存管理）

```javascript
class ParameterCache {
  constructor() {
    this.cache = new Map(); // parameter_key -> parameter_value
    this.initialized = false;
  }

  // 初始化缓存
  async init() {
    const [rows] = await db.query(
      'SELECT parameter_key, parameter_value, data_type FROM system_parameters'
    );

    this.cache.clear();

    rows.forEach(row => {
      const value = this.parseValue(row.parameter_value, row.data_type);
      this.cache.set(row.parameter_key, value);
    });

    this.initialized = true;
  }

  // 获取参数值
  get(key, defaultValue = null) {
    return this.cache.has(key) ? this.cache.get(key) : defaultValue;
  }

  // 解析参数值
  parseValue(value, dataType) {
    switch (dataType) {
      case 'number':
        return parseFloat(value);
      case 'json':
        return JSON.parse(value);
      case 'boolean':
        return value === 'true' || value === '1';
      default:
        return value;
    }
  }
}
```

**设计要点**：
- 使用 Map 数据结构（O(1)查询时间复杂度）
- 根据 `data_type` 自动解析参数值
- 初始化标志 `initialized` 防止重复初始化

### 2. 批量更新参数

```javascript
async function batchUpdateParameters(parameters, userId, userName, ipAddress, userAgent) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const changeLogs = [];

    for (const param of parameters) {
      // 获取旧值
      const [oldRows] = await connection.query(
        'SELECT parameter_value FROM system_parameters WHERE parameter_key = ?',
        [param.parameterKey]
      );

      const oldValue = oldRows.length > 0 ? oldRows[0].parameter_value : null;

      // 更新参数
      await connection.query(
        `UPDATE system_parameters
         SET parameter_value = ?, updated_by = ?, updated_at = NOW()
         WHERE parameter_key = ?`,
        [newValueStr, userId, param.parameterKey]
      );

      // 记录变更日志
      changeLogs.push({
        parameterKey: param.parameterKey,
        oldValue,
        newValue: newValueStr,
        changeReason: param.changeReason,
        userId,
        userName,
        ipAddress,
        userAgent
      });
    }

    // 批量插入变更日志
    await connection.query(
      `INSERT INTO parameter_change_logs
       (parameter_key, old_value, new_value, change_reason, updated_by, updated_by_name, ip_address, user_agent)
       VALUES ?`,
      [logValues]
    );

    await connection.commit();

    // 刷新缓存
    await refreshCache();

    // 触发相关业务逻辑刷新
    await triggerRefreshLogic(parameters);

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
```

**设计要点**：
- 使用事务保证数据一致性
- 记录旧值和新值到变更日志
- 更新完成后刷新缓存
- 触发相关业务逻辑刷新

### 3. 恢复默认值

```javascript
async function resetToDefaults(category, userId, userName, ipAddress, userAgent) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 获取该类别的所有参数
    const [parameters] = await connection.query(
      'SELECT parameter_key, parameter_value, default_value FROM system_parameters WHERE category = ?',
      [category]
    );

    for (const param of parameters) {
      // 更新为默认值
      await connection.query(
        `UPDATE system_parameters
         SET parameter_value = default_value, updated_by = ?, updated_at = NOW()
         WHERE parameter_key = ?`,
        [userId, param.parameter_key]
      );

      // 记录变更日志
      // ...
    }

    await connection.commit();
    await refreshCache();

  } catch (error) {
    await connection.rollback();
    throw error;
  }
}
```

### 4. 触发业务逻辑刷新

```javascript
async function triggerRefreshLogic(parameters) {
  // 检查是否有产能参数变更
  const capacityParams = parameters.filter(p => p.parameterKey.startsWith('capacity'));

  if (capacityParams.length > 0) {
    console.log('[Parameter Service] Capacity parameters changed, triggering employee load recalculation...');

    // 调用产能计算服务重新计算所有员工的负载
    // await employeeService.recalculateAllEmployeeLoads();
  }

  // 检查是否有奖罚参数变更
  const rewardParams = parameters.filter(p => p.parameterKey.startsWith('reward'));

  if (rewardParams.length > 0) {
    console.log('[Parameter Service] Reward parameters changed, triggering performance recalculation...');

    // 调用绩效计算服务重新计算员工绩效
    // await performanceService.recalculatePerformance();
  }
}
```

## 前端实现

### 1. 主容器组件（SystemSettings）

```javascript
function SystemSettings() {
  const currentUser = useSelector((state) => state.user?.currentUser);
  const [parameters, setParameters] = useState({
    capacity: [],
    finance: [],
    reward: [],
    worktime: []
  });

  // 权限检查
  const hasAdminPermission = () => {
    return currentUser?.roles?.includes('admin');
  };

  // 加载参数
  const loadParameters = async () => {
    const res = await getAllParameters();
    if (res.code === 200) {
      setParameters(res.data);
    }
  };

  // 如果不是管理员，显示403页面
  if (!hasAdminPermission()) {
    return <Result status="403" title="403" subTitle="仅管理员可访问" />;
  }

  return (
    <div className="system-settings-container">
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="产能参数" key="capacity">
          <CapacitySettings parameters={parameters.capacity} />
        </TabPane>
        {/* 其他标签页 */}
      </Tabs>
    </div>
  );
}
```

### 2. 参数表单组件（以 CapacitySettings 为例）

```javascript
function CapacitySettings({ parameters, onUpdateSuccess }) {
  const [form] = Form.useForm();

  // 初始化表单值
  useEffect(() => {
    if (parameters && parameters.length > 0) {
      const initialValues = {};

      parameters.forEach(param => {
        // 处理JSON格式参数
        if (param.parameterKey === 'effect_coefficients') {
          initialValues.effect_simple = param.parameterValue.simple;
          initialValues.effect_standard = param.parameterValue.standard;
          // ...
        } else {
          initialValues[param.parameterKey] = param.parameterValue;
        }
      });

      form.setFieldsValue(initialValues);
    }
  }, [parameters, form]);

  // 保存配置
  const handleSubmit = async () => {
    const values = await form.validateFields();

    // 构建参数数组
    const updateParams = [];

    // 基础参数
    updateParams.push({
      parameterKey: 'base_time_per_tile',
      parameterValue: values.base_time_per_tile,
      changeReason: '更新产能参数'
    });

    // JSON格式参数
    updateParams.push({
      parameterKey: 'effect_coefficients',
      parameterValue: {
        simple: values.effect_simple,
        standard: values.effect_standard,
        advanced: values.effect_advanced,
        premium: values.effect_premium
      },
      changeReason: '更新效果系数'
    });

    // 批量更新
    const res = await batchUpdateParameters(updateParams);

    if (res.code === 200) {
      message.success('保存成功');
      if (onUpdateSuccess) onUpdateSuccess();
    }
  };

  return (
    <Form form={form}>
      <Form.Item
        label="平铺基准耗时"
        name="base_time_per_tile"
        rules={[
          { required: true, message: '请输入平铺基准耗时' },
          { type: 'number', min: 1, max: 60, message: '请输入1-60之间的数值' }
        ]}
      >
        <InputNumber addonAfter="分钟" />
      </Form.Item>
      {/* 其他字段 */}
    </Form>
  );
}
```

### 3. 变更日志弹窗（ChangeLogModal）

```javascript
function ChangeLogModal({ visible, onClose }) {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });

  // 加载日志
  const loadLogs = async (page = 1, limit = 20, parameterKey = null) => {
    const res = await getChangeLogs(parameterKey, page, limit);

    if (res.code === 200) {
      setLogs(res.data.data);
      setPagination({
        current: res.data.page,
        pageSize: res.data.limit,
        total: res.data.total
      });
    }
  };

  useEffect(() => {
    if (visible) {
      loadLogs();
    }
  }, [visible]);

  return (
    <Modal title="参数变更日志" open={visible} onCancel={onClose} width={1200}>
      <Table
        dataSource={logs}
        columns={columns}
        pagination={pagination}
        onChange={handleTableChange}
      />
    </Modal>
  );
}
```

## 缓存机制

### 缓存初始化

**时机**：应用启动时

```javascript
// server.js
const { initParameterCache } = require('./middleware/parameterCache');

app.listen(3000, async () => {
  console.log('Server running on port 3000');

  // 初始化参数缓存
  await initParameterCache();
});
```

### 缓存读取

**优先级**：内存缓存 > 数据库

```javascript
async function getParameter(key) {
  // 优先从缓存获取
  if (parameterCache.initialized) {
    const cachedValue = parameterCache.get(key);
    if (cachedValue !== null) {
      return cachedValue;
    }
  }

  // 缓存未命中，从数据库查询
  const [rows] = await db.query(
    'SELECT parameter_value, data_type FROM system_parameters WHERE parameter_key = ?',
    [key]
  );

  if (rows.length === 0) {
    return null;
  }

  const value = parameterCache.parseValue(rows[0].parameter_value, rows[0].data_type);

  // 更新缓存
  parameterCache.set(key, value);

  return value;
}
```

### 缓存刷新

**触发时机**：
1. 参数批量更新后
2. 恢复默认值后
3. 手动触发刷新（管理员操作）

```javascript
async function refreshCache() {
  console.log('[Parameter Service] Refreshing cache...');
  await parameterCache.init();
  console.log('[Parameter Service] Cache refreshed successfully');
}
```

## 业务逻辑刷新

### 刷新策略

当参数变更后，根据参数类别触发相关业务逻辑刷新：

| 参数类别 | 触发的业务逻辑 |
|---------|--------------|
| capacity | 重新计算所有员工的负载 |
| reward | 重新计算员工绩效 |
| finance | 发送通知给财务人员 |
| worktime | 重新计算工作日历 |

### 实现示例

```javascript
async function triggerRefreshLogic(parameters) {
  const capacityParams = parameters.filter(p => p.parameterKey.startsWith('capacity'));

  if (capacityParams.length > 0) {
    // TODO: 调用产能计算服务
    // await employeeService.recalculateAllEmployeeLoads();
  }
}
```

## 安全机制

### 1. 权限控制

**后端验证**：

```javascript
exports.batchUpdateParameters = async (req, res) => {
  // 权限检查：仅管理员可以修改参数
  if (!req.user.roles.includes('admin')) {
    return res.status(403).json({
      code: 403,
      message: '无权限：仅管理员可以修改系统参数'
    });
  }

  // 执行更新
  // ...
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

### 2. 参数验证

**前端表单验证**：

```javascript
<Form.Item
  name="base_time_per_tile"
  rules={[
    { required: true, message: '请输入平铺基准耗时' },
    { type: 'number', min: 1, max: 60, message: '请输入1-60之间的数值' }
  ]}
>
  <InputNumber />
</Form.Item>
```

**后端验证**：

```javascript
if (!parameters || !Array.isArray(parameters) || parameters.length === 0) {
  return res.status(400).json({
    code: 400,
    message: '参数格式错误：parameters 必须是非空数组'
  });
}

for (const param of parameters) {
  if (!param.parameterKey || param.parameterValue === undefined) {
    return res.status(400).json({
      code: 400,
      message: '参数格式错误：每个参数必须包含 parameterKey 和 parameterValue'
    });
  }
}
```

### 3. 审计日志

**记录内容**：
- 参数键
- 旧值 → 新值
- 变更原因
- 更新人ID和姓名
- IP地址
- 浏览器User-Agent
- 变更时间

**查询和分析**：
- 支持按参数键搜索
- 支持按更新人查询
- 支持按时间范围查询

## 性能优化

### 1. 数据库优化

**索引设计**：
- 唯一索引：`parameter_key`（快速查找参数）
- 组合索引：`(category, parameter_key)`（按类别查询）
- 组合索引：`(parameter_key, created_at DESC)`（查询变更日志）

**查询优化**：
```sql
-- 优化前
SELECT * FROM system_parameters WHERE category = 'capacity';

-- 优化后（使用索引）
SELECT parameter_id, category, parameter_key, parameter_value
FROM system_parameters
WHERE category = 'capacity'
ORDER BY parameter_id;
```

### 2. 缓存优化

**Map 数据结构**：
- 查询时间复杂度 O(1)
- 内存占用小

**缓存刷新策略**：
- 仅在参数更新时刷新
- 避免频繁重新加载

### 3. 批量操作

**批量更新**：
```javascript
// 一次性更新多个参数
await batchUpdateParameters([
  { parameterKey: 'base_time_per_tile', parameterValue: 6 },
  { parameterKey: 'order_switch_buffer_hours', parameterValue: 5 }
]);
```

**批量插入日志**：
```javascript
// 使用VALUES语法批量插入
await connection.query(
  `INSERT INTO parameter_change_logs
   (parameter_key, old_value, new_value, updated_by, updated_by_name)
   VALUES ?`,
  [logValues]  // 二维数组
);
```

---

**文档版本**: v1.0.0
**最后更新**: 2025-01-05
**维护人员**: 开发团队

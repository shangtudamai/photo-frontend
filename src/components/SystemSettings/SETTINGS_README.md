# 系统参数配置模块

## 快速开始

### 1. 导入组件

```javascript
import SystemSettings from '@/components/SystemSettings';
```

### 2. 在路由中使用

```javascript
import SystemSettings from '@/components/SystemSettings';

// 在路由配置中
{
  path: '/settings',
  element: <SystemSettings />,
  meta: {
    title: '系统设置',
    requiresAuth: true,
    requiresAdmin: true  // 仅管理员可访问
  }
}
```

### 3. 后端配置

在后端应用启动时初始化参数缓存：

```javascript
// server.js
const { initParameterCache } = require('./middleware/parameterCache');

// 应用启动时初始化参数缓存
app.listen(3000, async () => {
  console.log('Server running on port 3000');

  // 初始化参数缓存
  await initParameterCache();
});
```

在后端路由中注册设置路由：

```javascript
// app.js
const settingRoutes = require('./routes/settingRoutes');

app.use('/api/settings', settingRoutes);
```

### 4. 数据库初始化

执行以下 SQL 文件创建数据库表和初始数据：

```bash
mysql -u root -p your_database < backend/database/system_parameters.sql
mysql -u root -p your_database < backend/database/parameter_change_logs.sql
```

## 功能说明

### 主要功能

1. **产能参数配置**
   - 平铺基准耗时（分钟）
   - 效果系数（简单/标准/高级/精修）
   - 订单切换缓冲时间（小时）
   - 摄影任务单次最大耗时（小时）
   - 修图任务单张平均耗时（分钟）
   - 员工每日最大产能（小时）
   - 产能预警阈值（%）
   - 产能严重预警阈值（%）

2. **财务参数配置**
   - 各效果类型单价区间（最低价、最高价、默认单价）
     - 简单效果
     - 标准效果
     - 高级效果
     - 精修效果
   - 坏账超期阈值（天）
   - 收款预警阈值（天）
   - 订单折扣上限（%）
   - 最低订单金额（元）

3. **奖罚参数配置**
   - 完成率奖励阶梯（可动态添加/删除）
     - 完成率阈值 → 奖励分数 + 描述
   - 延迟处罚阶梯（可动态添加/删除）
     - 延迟天数 → 扣分 + 描述
   - 质量评分权重
     - 优秀/良好/一般/差
   - 月度绩效奖金基数（元）

4. **工作时间参数配置**
   - 每日有效工作时间（小时）
   - 工作日配置（周一至周日多选）
   - 工作时间段
     - 上班时间、下班时间
     - 午休开始时间、午休结束时间
   - 法定节假日列表（支持加载预设）
   - 加班费系数
   - 周末加班费系数

5. **参数变更日志**
   - 查看所有参数变更记录
   - 按参数键搜索
   - 显示旧值、新值、变更原因、更新人、IP地址、变更时间

### 权限控制

| 角色 | 权限 |
|------|------|
| admin | 查看、修改、恢复默认值、查看变更日志 |
| 其他角色 | 无权访问（显示403页面） |

## 使用示例

### 修改产能参数流程

```
1. 访问系统设置页面（/settings）
2. 切换到"产能参数"标签页
3. 修改参数值：
   - 平铺基准耗时：5 → 6 分钟
   - 简单效果系数：0.8 → 0.7
4. 点击"保存配置"按钮
5. 系统提示"产能参数保存成功"
6. 参数立即生效，缓存自动刷新
7. 后端触发相关业务逻辑刷新（如重新计算员工负载）
```

### 配置价格区间流程

```
1. 访问系统设置页面
2. 切换到"财务参数"标签页
3. 修改简单效果价格区间：
   - 最低价：5 → 8 元
   - 最高价：15 → 18 元
   - 默认单价：10 → 12 元
4. 点击"保存配置"
5. 财务参数保存成功
```

### 管理完成率奖励阶梯流程

```
1. 访问系统设置页面
2. 切换到"奖罚参数"标签页
3. 在完成率奖励阶梯表格中：
   - 修改现有阶梯：100% → 5分
   - 点击"添加奖励阶梯"按钮
   - 填写新阶梯：130% → 20分，"提前30%完成"
4. 点击"保存配置"
5. 奖罚参数保存成功
```

### 配置工作时间流程

```
1. 访问系统设置页面
2. 切换到"工作时间参数"标签页
3. 配置工作日：勾选周一至周五
4. 配置工作时间段：
   - 上班时间：09:00
   - 下班时间：18:00
   - 午休：12:00-13:00
5. 点击"加载2025年法定节假日"
6. 系统自动加载25个节假日
7. 点击"保存配置"
```

### 恢复默认值流程

```
1. 访问系统设置页面
2. 选择任意标签页
3. 点击"恢复默认"按钮
4. 确认弹窗提示："此操作将恢复所有产能参数为系统默认值，是否继续？"
5. 点击"确认"
6. 系统提示"已恢复默认值"
7. 所有参数恢复为初始默认值
```

### 查看变更日志流程

```
1. 访问系统设置页面
2. 点击右上角"查看变更日志"按钮
3. 弹出变更日志弹窗
4. 可选：输入参数键进行搜索（如"base_time_per_tile"）
5. 查看历史变更记录：
   - 参数键
   - 旧值 → 新值
   - 变更原因
   - 更新人
   - IP地址
   - 变更时间
6. 点击"×"关闭弹窗
```

## 参数缓存机制

### 缓存流程

1. **应用启动时**：
   - 调用 `initParameterCache()` 初始化缓存
   - 从数据库加载所有参数到内存 Map

2. **参数读取时**：
   - 优先从内存缓存读取（O(1)时间复杂度）
   - 缓存未命中则从数据库查询

3. **参数更新时**：
   - 更新数据库
   - 记录变更日志
   - 刷新内存缓存
   - 触发相关业务逻辑刷新

### 在业务代码中使用参数

```javascript
// backend/services/orderService.js
const { getParameter } = require('./settingService');

// 获取最低订单金额
const minOrderAmount = await getParameter('min_order_amount');

// 获取价格区间（JSON格式）
const priceRanges = await getParameter('price_ranges');
const defaultPrice = priceRanges.standard.default;

// 获取产能预警阈值
const warningThreshold = await getParameter('capacity_warning_threshold');
```

## 常见问题

### 1. 参数更新后未立即生效

**原因**：
- 缓存未刷新
- 业务代码未重新读取参数

**解决方案**：
- 参数更新后会自动刷新缓存
- 如果仍未生效，点击"刷新缓存"按钮（仅管理员可见）

### 2. 无法访问系统设置页面

**原因**：
- 用户不是管理员角色

**解决方案**：
- 确认用户角色为 `admin`
- 检查 Redux store 中的 `currentUser.roles`

### 3. 价格区间配置错误

**原因**：
- 最低价 > 最高价
- 默认单价不在区间内

**解决方案**：
- 确保最低价 < 默认单价 < 最高价
- 前端会进行表单验证

### 4. 节假日配置无效

**原因**：
- 日期格式错误
- 未点击保存

**解决方案**：
- 使用 YYYY-MM-DD 格式（如 2025-01-01）
- 配置完成后点击"保存配置"按钮

### 5. 变更日志查询慢

**原因**：
- 日志数据量大
- 未添加索引

**解决方案**：
- 数据库已创建组合索引 `idx_key_time`
- 使用参数键搜索可提高查询速度

## 样式自定义

所有 LESS 变量都可以通过修改 `SystemSettings.less` 文件进行自定义：

```less
.system-settings-container {
  padding: 24px;
  background: #f0f2f5;

  .page-header {
    background: white;
    padding: 24px;
    border-radius: 8px;
  }

  .settings-card {
    background: white;
    border-radius: 8px;
  }
}
```

## 更新日志

### v1.0.0 (2025-01-05)
- 初始版本
- 支持4类参数配置（产能、财务、奖罚、工作时间）
- 参数变更日志记录
- 内存缓存机制
- 恢复默认值功能
- 权限控制（仅管理员）
- 参数变更后触发业务逻辑刷新

---

**文档版本**: v1.0.0
**最后更新**: 2025-01-05
**维护人员**: 开发团队

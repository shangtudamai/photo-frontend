# TopPhoto ERP 仪表盘页面文档

## 概述

仪表盘是TopPhoto ERP系统的核心页面，为用户提供系统运营数据的全局概览，包括订单统计、任务进度、员工负载、项目时间线和财务概况。

## 功能模块

### 1. 顶部统计卡片

展示4个核心指标：

- **今日订单数** - 今天创建的订单总数，点击跳转到今日订单列表
- **总待处理任务** - 所有待处理的任务数量，点击跳转到待处理任务列表
- **今日营收** - 今天确认的收款总额，点击跳转到今日营收详情
- **逾期未收款** - 所有逾期未收款的金额，点击跳转到逾期账款列表

**交互特性：**
- 所有卡片支持点击跳转
- 悬停时有阴影效果
- 加载时显示骨架屏

### 2. 最近订单列表

展示最近10个订单的关键信息：

**显示字段：**
- 订单编号
- 客户名称
- 总件数
- 订单状态（待确认/进行中/待验收/已完成/已取消）
- 支付状态（未付款/部分付款/已付清）
- 进度条（基于订单状态和完成件数计算）

**交互特性：**
- 点击行查看订单详情
- 悬停时高亮显示
- 右上角"查看全部"链接跳转到订单列表页

### 3. 员工产能负载表

展示所有员工（摄影师/后期）的工作负载情况：

**显示信息：**
- 员工姓名和角色
- 当前工作量占比（进度条）
- 状态标签：
  - 🔴 过载（≥80%）- 红色
  - 🔵 正常（50%-79%）- 蓝色
  - 🟢 空闲（<50%）- 绿色
- 当前任务数
- 待处理件数

**权限控制：**
- 管理员/客户经理：查看所有员工
- 摄影师/后期：仅查看自己的数据

### 4. 项目全局进度甘特图

可视化展示所有未完成订单的时间线和进度：

**功能特性：**
- 横轴显示日期范围
- 每个订单显示为一个条形
- 今日标记线（红色虚线）
- 颜色代表进度：
  - 绿色：100% 已完成
  - 蓝色：50%-99% 进行中
  - 黄色：0%-49% 刚开始
- 鼠标悬停显示订单详情：
  - 订单编号
  - 客户名称
  - 开始/结束日期
  - 进度百分比
  - 已完成件数/总件数

**交互特性：**
- 左右箭头按钮切换时间段（每次7天）
- 周末高亮显示
- 支持拖拽滚动（待实现）

**权限控制：**
- 管理员/客户经理：查看所有订单
- 摄影师/后期：仅查看与自己相关的订单

### 5. 财务概览图表

展示近7天的营收趋势（**仅管理员和客户经理可见**）：

**图表内容：**
- 营收趋势线（蓝色实线）
- 实收趋势线（绿色实线）
- 支出趋势线（红色虚线）

**统计摘要：**
- 7天总营收
- 7天总实收
- 7天总支出

**交互特性：**
- 悬停显示详细数值
- 数值自动格式化（万元）
- 响应式图表（自适应容器宽度）

## 技术实现

### 组件结构

```
Dashboard/
├── Dashboard.jsx              # 主组件
├── Dashboard.less            # 主样式
├── StatisticsCards.jsx       # 统计卡片
├── StatisticsCards.less
├── RecentOrders.jsx          # 最近订单
├── RecentOrders.less
├── EmployeeWorkload.jsx      # 员工负载
├── EmployeeWorkload.less
├── ProjectGantt.jsx          # 甘特图
├── ProjectGantt.less
├── FinancialChart.jsx        # 财务图表
├── FinancialChart.less
└── index.js                  # 导出文件
```

### 依赖库

```json
{
  "dependencies": {
    "react": "^18.0.0",
    "react-router-dom": "^6.0.0",
    "react-redux": "^8.0.0",
    "antd": "^5.0.0",
    "recharts": "^2.5.0",
    "dayjs": "^1.11.0"
  }
}
```

**注意：** 如果项目中没有 `recharts`，需要安装：

```bash
npm install recharts
# 或
yarn add recharts
```

### API接口

所有API接口定义在 `src/services/dashboardService.js`：

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/dashboard/stats` | GET | 获取统计数据 |
| `/api/dashboard/recent-orders` | GET | 获取最近订单 |
| `/api/dashboard/employee-workloads` | GET | 获取员工负载 |
| `/api/dashboard/financial-summary` | GET | 获取财务概览 |
| `/api/dashboard/gantt-data` | GET | 获取甘特图数据 |

### 数据刷新机制

- **初始加载：** 页面mounted时自动请求所有数据
- **自动刷新：** 每5分钟自动刷新一次数据
- **手动刷新：** 用户可刷新浏览器强制更新

实现代码：

```javascript
useEffect(() => {
  fetchDashboardData();

  // 每5分钟刷新一次
  const refreshInterval = setInterval(() => {
    fetchDashboardData();
  }, 5 * 60 * 1000);

  return () => clearInterval(refreshInterval);
}, [fetchDashboardData]);
```

### 权限控制

使用Redux获取当前用户信息，根据角色过滤数据：

```javascript
const currentUser = useSelector((state) => state.auth.user);

const hasAdminAccess = () => {
  if (!currentUser || !currentUser.roles) return false;
  return currentUser.roles.includes('admin') ||
         currentUser.roles.includes('client_manager');
};
```

**权限矩阵：**

| 功能模块 | admin | client_manager | photographer | retoucher |
|---------|-------|----------------|--------------|-----------|
| 统计卡片 | ✅ 全部 | ✅ 全部 | ✅ 部分 | ✅ 部分 |
| 最近订单 | ✅ 全部 | ✅ 全部 | ✅ 相关 | ✅ 相关 |
| 员工负载 | ✅ 全部 | ✅ 全部 | ✅ 自己 | ✅ 自己 |
| 甘特图 | ✅ 全部 | ✅ 全部 | ✅ 相关 | ✅ 相关 |
| 财务图表 | ✅ | ✅ | ❌ | ❌ |

## 使用方法

### 路由配置

在 `src/App.js` 或路由配置文件中添加：

```javascript
import Dashboard from './components/Dashboard';

// 在路由配置中
<Route path="/dashboard" element={<Dashboard />} />
```

### Redux配置

确保Redux store中有用户认证信息：

```javascript
// store结构示例
{
  auth: {
    user: {
      userId: 1,
      username: 'admin',
      realName: '管理员',
      roles: ['admin']
    }
  }
}
```

### 样式主题

仪表盘使用Ant Design主题，可在 `src/App.less` 中自定义：

```less
@primary-color: #1890ff;
@success-color: #52c41a;
@warning-color: #faad14;
@error-color: #ff4d4f;
```

## 响应式设计

仪表盘支持不同屏幕尺寸：

**断点：**
- **xs:** <576px - 手机竖屏
- **sm:** ≥576px - 手机横屏
- **md:** ≥768px - 平板
- **lg:** ≥992px - 小桌面
- **xl:** ≥1200px - 大桌面

**布局调整：**
- 小屏幕：统计卡片2列，订单和负载上下排列
- 大屏幕：统计卡片4列，订单和负载左右排列

## 性能优化

1. **懒加载组件**
   ```javascript
   const ProjectGantt = React.lazy(() => import('./ProjectGantt'));
   ```

2. **数据缓存**
   - 使用React Query或SWR缓存API响应
   - 减少不必要的网络请求

3. **虚拟滚动**
   - 订单列表和员工负载使用Ant Design Table的虚拟滚动

4. **防抖/节流**
   - 甘特图滚动使用节流优化

## 常见问题

### Q1: 财务图表不显示

**A:** 检查用户权限，只有admin和client_manager可见。

### Q2: 数据加载慢

**A:**
- 检查网络连接
- 优化后端API性能
- 考虑添加数据缓存

### Q3: 甘特图显示不全

**A:**
- 使用左右箭头切换时间段
- 调整浏览器窗口宽度
- 检查数据日期范围

### Q4: 自动刷新不工作

**A:**
- 检查useEffect依赖
- 确认定时器正确清理
- 检查浏览器控制台错误

## 后续优化建议

1. **实时数据**
   - 使用WebSocket实现实时数据推送
   - 避免轮询造成的性能损耗

2. **数据导出**
   - 添加导出Excel功能
   - 支持PDF报表生成

3. **自定义仪表盘**
   - 允许用户自定义显示模块
   - 支持拖拽排序

4. **移动端优化**
   - 开发专门的移动端布局
   - 优化触摸交互

5. **数据可视化增强**
   - 添加更多图表类型
   - 支持数据钻取

## 文件清单

### 新增文件（15个）

**组件文件（8个）：**
- ✅ `src/components/Dashboard/Dashboard.jsx`
- ✅ `src/components/Dashboard/StatisticsCards.jsx`
- ✅ `src/components/Dashboard/RecentOrders.jsx`
- ✅ `src/components/Dashboard/EmployeeWorkload.jsx`
- ✅ `src/components/Dashboard/ProjectGantt.jsx`
- ✅ `src/components/Dashboard/FinancialChart.jsx`
- ✅ `src/components/Dashboard/index.js`

**样式文件（6个）：**
- ✅ `src/components/Dashboard/Dashboard.less`
- ✅ `src/components/Dashboard/StatisticsCards.less`
- ✅ `src/components/Dashboard/RecentOrders.less`
- ✅ `src/components/Dashboard/EmployeeWorkload.less`
- ✅ `src/components/Dashboard/ProjectGantt.less`
- ✅ `src/components/Dashboard/FinancialChart.less`

**服务文件（1个）：**
- ✅ `src/services/dashboardService.js`

**总计：15个文件**

## 代码统计

| 文件类型 | 行数 |
|---------|------|
| 组件 JSX | ~800 行 |
| 样式 LESS | ~400 行 |
| 服务 JS | ~60 行 |
| **总计** | **~1260 行** |

---

**版本：** v1.0.0
**更新日期：** 2025-01-15
**维护团队：** TopPhoto前端团队

**项目状态：** ✅ 已完成，可投入使用

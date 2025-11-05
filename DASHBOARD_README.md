# TopPhoto ERP 仪表盘

> 基于 React + Ant Design 的全功能仪表盘页面

## 🚀 快速开始

### 1. 安装依赖

```bash
# 安装图表库（如果尚未安装）
npm install recharts
# 或
yarn add recharts
```

### 2. 路由配置

```javascript
import Dashboard from './components/Dashboard';

<Route path="/dashboard" element={<Dashboard />} />
```

### 3. 访问页面

```
http://localhost:3000/dashboard
```

---

## ✨ 功能模块

### 📊 顶部统计卡片

- **今日订单数** - 点击跳转到今日订单列表
- **总待处理任务** - 点击跳转到待处理任务列表
- **今日营收** - 点击跳转到今日营收详情
- **逾期未收款** - 点击跳转到逾期账款列表

### 📋 最近订单列表

展示最近10个订单，包含：
- 订单编号、客户名称、总件数
- 订单状态、支付状态
- 进度条可视化
- 点击行查看订单详情

### 👥 员工产能负载表

展示所有员工的工作负载：
- 摄影师/后期人员姓名
- 当前工作量占比（进度条）
- 状态标签：
  - 🔴 过载（≥80%）
  - 🔵 正常（50%-79%）
  - 🟢 空闲（<50%）

### 📅 项目全局进度甘特图

可视化展示所有未完成订单的时间线：
- 支持拖拽查看不同时间段
- 鼠标悬停显示订单详情
- 今日标记线
- 周末高亮

### 💰 财务概览图表

近7天营收趋势折线图（**仅管理员/客户经理可见**）：
- 营收、实收、支出三条趋势线
- 统计摘要（7天总计）
- 响应式图表

---

## 🔐 权限控制

| 功能模块 | admin | client_manager | photographer | retoucher |
|---------|-------|----------------|--------------|-----------|
| 统计卡片 | ✅ 全部 | ✅ 全部 | ✅ 部分 | ✅ 部分 |
| 最近订单 | ✅ 全部 | ✅ 全部 | ✅ 相关 | ✅ 相关 |
| 员工负载 | ✅ 全部 | ✅ 全部 | ✅ 自己 | ✅ 自己 |
| 甘特图 | ✅ 全部 | ✅ 全部 | ✅ 相关 | ✅ 相关 |
| 财务图表 | ✅ | ✅ | ❌ | ❌ |

**权限说明：**
- **全部** - 查看所有数据
- **相关** - 仅查看与自己相关的数据
- **自己** - 仅查看自己的数据

---

## 🔄 自动刷新

- ✅ 页面加载时自动请求数据
- ✅ 每5分钟自动刷新一次
- ✅ 支持手动刷新（刷新浏览器）

---

## 📦 组件结构

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
└── index.js
```

---

## 🛠️ 技术栈

- **React 18** - UI框架
- **Ant Design 5** - UI组件库
- **Recharts 2** - 图表库
- **React Router 6** - 路由管理
- **Redux** - 状态管理
- **dayjs** - 日期处理
- **Less** - CSS预处理器

---

## 📊 API接口

所有接口定义在 `src/services/dashboardService.js`：

```javascript
getDashboardStats()        // 获取统计数据
getRecentOrders(10)        // 获取最近10个订单
getEmployeeWorkloads()     // 获取员工负载
getFinancialSummary(7)     // 获取近7天财务数据
getGanttData()             // 获取甘特图数据
```

---

## 💡 使用示例

### 在App.js中引入

```javascript
import Dashboard from './components/Dashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        {/* 其他路由 */}
      </Routes>
    </Router>
  );
}
```

### Redux Store配置

确保store中有用户信息：

```javascript
{
  auth: {
    user: {
      userId: 1,
      username: 'admin',
      realName: '管理员',
      roles: ['admin']  // 或 ['client_manager', 'photographer', 'retoucher']
    }
  }
}
```

---

## 📱 响应式设计

- ✅ 支持手机、平板、桌面端
- ✅ 自适应布局
- ✅ 触摸友好

**断点：**
- xs: <576px
- sm: ≥576px
- md: ≥768px
- lg: ≥992px
- xl: ≥1200px

---

## 🐛 常见问题

### Q: 财务图表不显示？

**A:** 检查用户权限，只有 `admin` 和 `client_manager` 可见。

### Q: 如何自定义刷新间隔？

**A:** 在 `Dashboard.jsx` 中修改：

```javascript
const refreshInterval = setInterval(() => {
  fetchDashboardData();
}, 5 * 60 * 1000); // 改为你需要的毫秒数
```

### Q: 甘特图显示不全？

**A:** 使用左右箭头按钮切换时间段。

---

## 🎯 后续优化

- [ ] WebSocket实时数据推送
- [ ] 数据导出（Excel/PDF）
- [ ] 自定义仪表盘布局
- [ ] 移动端专属布局
- [ ] 数据钻取功能

---

## 📖 文档

- 📘 [完整文档](./DASHBOARD_DOCUMENTATION.md) - 详细的技术文档和API说明

---

**版本：** v1.0.0
**更新日期：** 2025-01-15
**状态：** ✅ 已完成，可投入使用

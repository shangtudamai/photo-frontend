# 任务管理模块 - 技术文档

## 目录
1. [架构概述](#架构概述)
2. [组件结构](#组件结构)
3. [API 接口规范](#api-接口规范)
4. [数据结构](#数据结构)
5. [业务逻辑](#业务逻辑)
6. [产能检查机制](#产能检查机制)
7. [数据联动](#数据联动)

## 架构概述

任务管理模块采用组件化架构，主要包含以下部分：

```
TaskList (主容器)
├── TaskFilter (筛选器 + 标签切换)
├── TaskTable (任务表格)
├── AssignTaskModal (分配任务弹窗)
├── ProgressUpdateModal (进度更新弹窗)
├── ReturnTaskModal (任务退回弹窗)
└── TaskDetailDrawer (任务详情抽屉)
    ├── 任务详情标签页
    ├── 进度记录标签页
    └── 成果上传标签页
```

### 技术栈
- React 18
- Ant Design 5
- Redux (用户状态管理)
- dayjs (日期处理)
- Less (样式预处理)

## 组件结构

### 1. TaskList.jsx
**主容器组件**，负责协调所有子组件和管理全局状态。

#### State
```javascript
{
  loading: false,           // 加载状态
  tasks: [],               // 任务列表
  pagination: {            // 分页信息
    current: 1,
    pageSize: 10,
    total: 0
  },
  filters: {},             // 筛选条件
  currentTab: 'my',        // 当前标签 (my/all)
  taskStats: null,         // 任务统计数据
  assignModalVisible: false,      // 分配任务弹窗状态
  progressModalVisible: false,    // 进度更新弹窗状态
  returnModalVisible: false,      // 退回任务弹窗状态
  detailDrawerVisible: false,     // 详情抽屉状态
  currentTask: null,       // 当前操作的任务
  selectedTaskId: null     // 选中的任务ID
}
```

#### 主要方法
- `fetchTasks()` - 获取任务列表（根据currentTab决定调用哪个接口）
- `fetchTaskStats()` - 获取任务统计数据
- `handleTabChange(tab)` - 处理标签切换
- `handleFilterChange(filters)` - 处理筛选条件变化
- `handleAssignTask()` - 打开分配任务弹窗
- `handleUpdateProgress(task)` - 打开进度更新弹窗
- `handleReturnTask(task)` - 打开退回任务弹窗
- `handleViewTask(task)` - 打开任务详情抽屉
- `handleRefresh()` - 刷新任务列表

### 2. TaskFilter.jsx
**筛选器组件**，提供标签切换和任务筛选功能。

#### Props
```javascript
{
  onFilterChange: Function,     // 筛选变化回调
  onTabChange: Function,        // 标签切换回调
  onAssignTask: Function,       // 分配任务回调
  onRefresh: Function,          // 刷新回调
  currentUser: Object,          // 当前用户信息
  taskStats: Object             // 任务统计数据
}
```

#### 标签页
- **我的任务**: 显示分配给当前用户的任务
- **所有任务**: 显示所有任务（仅管理员可见）

#### 筛选条件
- `status` - 任务状态 (1-4)
- `taskType` - 任务类型 (photography/retouching)

### 3. TaskTable.jsx
**任务表格组件**，显示任务列表并提供操作入口。

#### Props
```javascript
{
  data: Array,              // 任务数据
  loading: Boolean,         // 加载状态
  pagination: Object,       // 分页配置
  onPageChange: Function,   // 分页变化回调
  onView: Function,         // 查看详情回调
  onUpdateProgress: Function, // 更新进度回调
  onReturn: Function,       // 退回任务回调
  currentUser: Object       // 当前用户信息
}
```

#### 表格列
1. 任务ID (taskId)
2. 订单编号 (orderNo)
3. 任务类型 (taskType)
4. 负责人 (assigneeName)
5. 分配日期 (assignDate) - 可排序
6. 截止日期 (deadline) - 可排序，带逾期提醒
7. 进度 (progress) - 进度条，颜色根据逾期状态变化
8. 状态 (status) - 可筛选
9. 操作按钮

#### 截止日期提醒逻辑
```javascript
const getDeadlineStatus = (deadline) => {
  const hoursLeft = dayjs(deadline).diff(dayjs(), 'hour');

  if (hoursLeft < 0) {
    return { type: 'overdue', color: 'red', text: '已逾期' };
  } else if (hoursLeft < 24) {
    return { type: 'urgent', color: 'orange', text: '即将逾期' };
  }
  return { type: 'normal', color: 'default', text: '' };
};
```

### 4. AssignTaskModal.jsx
**分配任务弹窗**，支持产能检查。

#### Props
```javascript
{
  visible: Boolean,      // 显示状态
  onCancel: Function,    // 取消回调
  onSuccess: Function    // 成功回调
}
```

#### 表单字段
- `orderId` - 关联订单 (必填)
- `taskType` - 任务类型 (必填, photography/retouching)
- `assigneeId` - 负责人 (必填，根据任务类型自动筛选)
- `deadline` - 截止日期 (必填)
- `description` - 任务描述

#### 产能检查流程
1. 用户选择负责人和截止日期
2. 自动触发产能检查
3. 显示检查结果：
   - **可分配** (available): 绿色，产能充足
   - **产能紧张** (warning): 橙色，接近满载
   - **产能超载** (overload): 红色，已超载
4. 如果超载，提供"强制分配"选项
5. 提交时验证是否勾选强制分配

#### 员工筛选逻辑
```javascript
const getFilteredEmployees = () => {
  const taskType = form.getFieldValue('taskType');
  const roleMap = {
    'photography': ['photographer'],
    'retouching': ['retoucher']
  };

  const allowedRoles = roleMap[taskType] || [];
  return employees.filter(emp =>
    emp.roles?.some(role => allowedRoles.includes(role))
  );
};
```

### 5. ProgressUpdateModal.jsx
**进度更新弹窗**，支持滑块设置进度。

#### Props
```javascript
{
  visible: Boolean,      // 显示状态
  task: Object,          // 任务对象
  onCancel: Function,    // 取消回调
  onSuccess: Function    // 成功回调
}
```

#### 表单字段
- `progress` - 进度百分比 (0-100，必填)
- `remark` - 进度说明 (必填)

#### 自动状态更新
```javascript
if (progress === 0) {
  status = 1; // 未开始
} else if (progress === 100) {
  status = 3; // 已完成
} else {
  status = 2; // 进行中
}
```

### 6. ReturnTaskModal.jsx
**任务退回弹窗**，支持多种退回类型。

#### Props
```javascript
{
  visible: Boolean,      // 显示状态
  task: Object,          // 任务对象
  onCancel: Function,    // 取消回调
  onSuccess: Function    // 成功回调
}
```

#### 表单字段
- `returnType` - 退回类型 (必填)
  - `reshoot` - 重拍
  - `retouch` - 重修
  - `supplement` - 补拍/补修
- `reason` - 退回原因 (必填，最少10个字)

#### 退回影响
- 任务状态更新为"已退回" (status = 4)
- 任务进度重置为 0%
- 负责人收到通知
- 截止日期可能需要重新协商

### 7. TaskDetailDrawer.jsx
**任务详情抽屉**，包含3个标签页。

#### Props
```javascript
{
  visible: Boolean,      // 显示状态
  taskId: Number,        // 任务ID
  onClose: Function,     // 关闭回调
  currentUser: Object    // 当前用户信息
}
```

#### 标签页

##### Tab 1: 任务详情
- 任务基本信息
- 订单信息
- 负责人信息
- 截止日期状态
- 退回信息（如果已退回）

##### Tab 2: 进度记录
- 时间轴展示所有进度更新记录
- 显示更新人、更新时间、进度值、说明

##### Tab 3: 成果上传
- 文件上传（JPG/PNG/MP4，<10MB）
- 成果列表（网格布局）
- 图片预览
- 文件下载/删除

## API 接口规范

### 任务列表

**GET** `/api/tasks`

查询参数：
```javascript
{
  page: 1,                    // 页码
  limit: 10,                  // 每页数量
  status: 1,                  // 任务状态
  taskType: 'photography',    // 任务类型
  sort_by: 'assignDate',      // 排序字段
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
        taskId: 1,
        orderId: 1,
        orderNo: 'ORD20250105001',
        clientName: '客户名称',
        taskType: 'photography',
        assigneeId: 1,
        assigneeName: '摄影师A',
        assignDate: '2025-01-05 10:00:00',
        deadline: '2025-01-10 18:00:00',
        progress: 60,
        status: 2,
        description: '任务描述'
      }
    ],
    page: 1,
    limit: 10,
    total: 100
  }
}
```

### 我的任务

**GET** `/api/tasks/my-tasks`

查询参数：同任务列表

### 任务详情

**GET** `/api/tasks/:id`

响应格式：
```javascript
{
  code: 200,
  data: {
    taskId: 1,
    orderId: 1,
    orderNo: 'ORD20250105001',
    clientName: '客户名称',
    taskType: 'photography',
    assigneeId: 1,
    assigneeName: '摄影师A',
    assignerId: 2,
    assignerName: '管理员',
    assignDate: '2025-01-05 10:00:00',
    deadline: '2025-01-10 18:00:00',
    progress: 60,
    status: 2,
    description: '任务描述',
    returnInfo: {  // 如果已退回
      returnType: 'reshoot',
      reason: '退回原因',
      returnTime: '2025-01-08 10:00:00',
      returnByName: '管理员'
    }
  }
}
```

### 创建任务（分配任务）

**POST** `/api/tasks`

请求体：
```javascript
{
  orderId: 1,
  taskType: 'photography',
  assigneeId: 1,
  deadline: '2025-01-10 18:00:00',
  description: '任务描述',
  forceAssign: false  // 是否强制分配
}
```

响应格式：
```javascript
{
  code: 201,
  message: '任务分配成功',
  data: {
    taskId: 1
  }
}
```

### 更新任务进度

**PUT** `/api/tasks/:id/progress`

请求体：
```javascript
{
  progress: 80,
  remark: '进度说明'
}
```

响应格式：
```javascript
{
  code: 200,
  message: '进度更新成功',
  data: {
    taskId: 1,
    status: 2,  // 更新后的状态
    progress: 80
  }
}
```

### 退回任务

**POST** `/api/tasks/:id/return`

请求体：
```javascript
{
  returnType: 'reshoot',  // reshoot/retouch/supplement
  reason: '退回原因说明'
}
```

响应格式：
```javascript
{
  code: 200,
  message: '任务退回成功',
  data: {
    taskId: 1,
    status: 4  // 已退回
  }
}
```

### 产能检查

**POST** `/api/tasks/check-capacity`

请求体：
```javascript
{
  employeeId: 1,
  deadline: '2025-01-10 18:00:00'
}
```

响应格式：
```javascript
{
  code: 200,
  data: {
    status: 'warning',  // available/warning/overload
    currentLoad: 8,     // 当前负载
    maxLoad: 10,        // 最大负载
    availableSlots: 2,  // 可用槽位
    message: '该员工产能接近满载，建议谨慎分配'
  }
}
```

### 进度历史记录

**GET** `/api/tasks/:id/progress-history`

响应格式：
```javascript
{
  code: 200,
  data: [
    {
      updateTime: '2025-01-05 14:00:00',
      updaterName: '摄影师A',
      progress: 50,
      remark: '已完成一半',
      statusChange: '未开始 → 进行中'
    }
  ]
}
```

### 任务成果

**GET** `/api/tasks/:id/results`

响应格式：
```javascript
{
  code: 200,
  data: [
    {
      resultId: 1,
      fileName: 'photo1.jpg',
      fileUrl: 'https://example.com/files/photo1.jpg',
      fileType: 'image/jpeg',
      fileSize: 2048000,
      uploadTime: '2025-01-06 10:00:00',
      uploaderName: '摄影师A'
    }
  ]
}
```

**POST** `/api/tasks/:id/results`

请求头：
```
Content-Type: multipart/form-data
```

请求体：
```javascript
FormData {
  file: File
}
```

**DELETE** `/api/tasks/:taskId/results/:resultId`

### 任务统计

**GET** `/api/tasks/statistics`

响应格式：
```javascript
{
  code: 200,
  data: {
    myTasks: 5,      // 我的任务数量
    allTasks: 20     // 所有任务数量
  }
}
```

### 员工列表

**GET** `/api/employees`

查询参数：
```javascript
{
  page: 1,
  limit: 100,
  status: 'active'  // 只获取在职员工
}
```

响应格式：
```javascript
{
  code: 200,
  data: {
    data: [
      {
        employeeId: 1,
        employeeName: '张三',
        department: '摄影部',
        roles: ['photographer']
      }
    ],
    page: 1,
    limit: 100,
    total: 20
  }
}
```

## 数据结构

### 任务状态枚举
```javascript
const TASK_STATUS = {
  NOT_STARTED: 1,    // 未开始
  IN_PROGRESS: 2,    // 进行中
  COMPLETED: 3,      // 已完成
  RETURNED: 4        // 已退回
};
```

### 任务类型枚举
```javascript
const TASK_TYPE = {
  PHOTOGRAPHY: 'photography',  // 拍摄
  RETOUCHING: 'retouching'     // 后期
};
```

### 产能状态枚举
```javascript
const CAPACITY_STATUS = {
  AVAILABLE: 'available',      // 可分配
  WARNING: 'warning',          // 产能紧张
  OVERLOAD: 'overload'         // 产能超载
};
```

## 业务逻辑

### 1. 任务分配流程

```
1. 管理员点击"分配任务"按钮
2. 打开分配任务弹窗
3. 选择订单 → 显示订单信息
4. 选择任务类型 → 自动筛选对应角色的员工
5. 选择负责人 + 截止日期 → 触发产能检查
6. 查看产能检查结果：
   - 可分配 → 直接提交
   - 产能紧张 → 查看警告，决定是否继续
   - 产能超载 → 必须勾选"强制分配"才能提交
7. 提交任务分配请求
8. 成功后刷新任务列表
```

### 2. 进度更新流程

```
1. 负责人点击"更新进度"按钮
2. 打开进度更新弹窗，显示当前任务信息
3. 拖动滑块设置进度（0-100%）
4. 填写进度说明
5. 提交进度更新请求
6. 后端根据进度自动更新状态：
   - 0% → 未开始
   - 1-99% → 进行中
   - 100% → 已完成
7. 刷新任务列表
8. 触发数据联动（同步订单进度）
```

### 3. 任务退回流程

```
1. 管理员点击"退回"按钮
2. 打开退回任务弹窗，显示任务信息
3. 选择退回类型（重拍/重修/补拍补修）
4. 填写详细退回原因（至少10个字）
5. 确认退回影响说明
6. 提交退回请求
7. 后端处理：
   - 任务状态 → 已退回
   - 进度 → 0%
   - 发送通知给负责人
8. 刷新任务列表
```

## 产能检查机制

### 检查算法

```javascript
// 后端实现示例
function checkEmployeeCapacity(employeeId, deadline) {
  // 1. 获取员工在截止日期前的所有任务
  const tasks = getEmployeeTasksBeforeDeadline(employeeId, deadline);

  // 2. 计算当前负载（根据任务数量和预估工时）
  const currentLoad = calculateLoad(tasks);

  // 3. 获取员工最大负载（根据员工设置或默认值）
  const maxLoad = getEmployeeMaxLoad(employeeId);

  // 4. 计算可用槽位
  const availableSlots = maxLoad - currentLoad;

  // 5. 判断产能状态
  let status;
  if (currentLoad < maxLoad * 0.7) {
    status = 'available';  // <70% 可分配
  } else if (currentLoad < maxLoad) {
    status = 'warning';    // 70-100% 产能紧张
  } else {
    status = 'overload';   // >100% 产能超载
  }

  return {
    status,
    currentLoad,
    maxLoad,
    availableSlots,
    message: getStatusMessage(status)
  };
}
```

### 产能计算规则

1. **任务权重**：
   - 拍摄任务：1个单位
   - 后期任务：1个单位
   - 可根据实际情况调整权重

2. **时间范围**：
   - 只计算截止日期之前的任务
   - 考虑任务的预估完成时间

3. **员工最大负载**：
   - 默认值：10个任务单位/周
   - 可根据员工能力调整

## 数据联动

### 1. 任务进度 → 订单进度

```javascript
// 当任务进度更新时
function updateOrderProgress(orderId) {
  // 1. 获取该订单的所有任务
  const tasks = getOrderTasks(orderId);

  // 2. 计算平均进度
  const totalProgress = tasks.reduce((sum, task) => sum + task.progress, 0);
  const averageProgress = totalProgress / tasks.length;

  // 3. 更新订单进度
  updateOrder(orderId, { progress: averageProgress });
}
```

### 2. 任务完成 → 订单状态

```javascript
// 当任务完成时
function updateOrderStatus(orderId, completedTask) {
  // 1. 获取该订单的所有任务
  const tasks = getOrderTasks(orderId);

  // 2. 判断任务类型和完成情况
  if (completedTask.taskType === 'photography') {
    // 拍摄任务完成 → 订单状态改为"待后期"
    updateOrder(orderId, { status: ORDER_STATUS.PENDING_RETOUCHING });
  } else if (completedTask.taskType === 'retouching') {
    // 后期任务完成 → 订单状态改为"待验收"
    updateOrder(orderId, { status: ORDER_STATUS.PENDING_REVIEW });
  }

  // 3. 如果所有任务都完成，订单状态改为"待验收"
  const allCompleted = tasks.every(task => task.status === TASK_STATUS.COMPLETED);
  if (allCompleted) {
    updateOrder(orderId, { status: ORDER_STATUS.PENDING_REVIEW });
  }
}
```

### 3. 任务状态变更 → 实时通知

```javascript
// 当任务状态变更时
function sendTaskNotification(task, action) {
  let recipients = [];
  let message = '';

  switch (action) {
    case 'assign':
      // 任务分配 → 通知负责人
      recipients = [task.assigneeId];
      message = `您有新的${task.taskType}任务，订单号：${task.orderNo}`;
      break;

    case 'progress':
      // 进度更新 → 通知管理员
      recipients = getAdmins();
      message = `${task.assigneeName}更新了任务进度至${task.progress}%`;
      break;

    case 'return':
      // 任务退回 → 通知负责人
      recipients = [task.assigneeId];
      message = `您的任务已被退回，原因：${task.returnInfo.reason}`;
      break;

    case 'complete':
      // 任务完成 → 通知管理员和客户
      recipients = [...getAdmins(), task.clientId];
      message = `任务已完成：${task.orderNo} - ${task.taskType}`;
      break;
  }

  // 发送通知
  sendNotifications(recipients, message);
}
```

## 性能优化建议

1. **懒加载**: 任务详情中的数据按需加载
2. **防抖**: 产能检查使用防抖，避免频繁请求
3. **分页**: 任务列表使用服务端分页
4. **缓存**: 员工列表、订单列表可缓存
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
1. 任务分配流程（包括产能检查）
2. 进度更新流程（包括自动状态更新）
3. 任务退回流程
4. 成果上传/下载/删除
5. 权限控制

### 边界测试
1. 空任务列表
2. 产能满载/超载
3. 文件大小/格式限制
4. 逾期任务显示
5. 进度100%自动完成

### 兼容性测试
1. 不同浏览器
2. 不同屏幕尺寸
3. 不同网络状况

---

**文档版本**: v1.0.0
**最后更新**: 2025-01-05
**维护人员**: 开发团队

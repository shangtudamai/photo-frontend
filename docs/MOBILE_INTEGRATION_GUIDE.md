# 移动端适配 - 集成指南

## 项目集成步骤

### Step 1: 安装依赖

确保项目已安装以下依赖:

```bash
npm install antd dayjs
npm install less less-loader --save-dev
```

### Step 2: 配置 Less

在 `config/webpack.config.js` 或 `craco.config.js` 中配置 Less:

```javascript
// craco.config.js (使用 Create React App)
const CracoLessPlugin = require('craco-less');

module.exports = {
  plugins: [
    {
      plugin: CracoLessPlugin,
      options: {
        lessLoaderOptions: {
          lessOptions: {
            javascriptEnabled: true,
          },
        },
      },
    },
  ],
};
```

### Step 3: 配置路径别名

在 `jsconfig.json` 或 `tsconfig.json` 中配置:

```json
{
  "compilerOptions": {
    "baseUrl": "src",
    "paths": {
      "@/*": ["*"]
    }
  }
}
```

### Step 4: 引入响应式样式

在 `src/App.jsx` 或 `src/index.jsx` 中引入全局样式:

```javascript
import 'antd/dist/antd.less';
import '@/styles/responsive.less';
import '@/styles/mobile-form.less';
```

### Step 5: 集成底部导航

修改 `src/App.jsx`:

```javascript
import React from 'react';
import { Layout } from 'antd';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MobileTabBar from '@/components/MobileTabBar';
import { useDeviceType } from '@/utils/responsive';

const { Sider, Content } = Layout;

function App() {
  const deviceType = useDeviceType();

  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
        {/* 桌面端侧边栏 */}
        {deviceType !== 'mobile' && (
          <Sider width={200}>
            {/* 桌面导航菜单 */}
          </Sider>
        )}

        <Layout>
          <Content style={{ padding: deviceType === 'mobile' ? '12px' : '24px' }}>
            <Routes>
              {/* 路由配置 */}
            </Routes>
          </Content>
        </Layout>

        {/* 移动端底部导航 */}
        <MobileTabBar />
      </Layout>
    </Router>
  );
}

export default App;
```

---

## 页面适配示例

### 1. 列表页面适配

```javascript
// pages/TaskList/index.jsx
import React, { useState, useEffect } from 'react';
import { Button, Space } from 'antd';
import ResponsiveTable from '@/components/ResponsiveTable';
import { renderMobileTaskCard, MobileTaskFilter } from '@/components/TaskList/TaskListMobile';
import { useDeviceType } from '@/utils/responsive';
import { getTaskList } from '@/services/taskService';
import './TaskList.less';

function TaskList() {
  const deviceType = useDeviceType();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ taskStatus: null });

  useEffect(() => {
    fetchTasks();
  }, [filters]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await getTaskList(filters);
      setTasks(response.data);
    } finally {
      setLoading(false);
    }
  };

  // 桌面端表格列定义
  const columns = [
    { title: '任务编号', dataIndex: 'taskId', key: 'taskId' },
    { title: '订单编号', dataIndex: 'orderNo', key: 'orderNo' },
    { title: '任务类型', dataIndex: 'taskType', key: 'taskType' },
    { title: '状态', dataIndex: 'taskStatus', key: 'taskStatus' },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button onClick={() => handleViewDetail(record)}>查看</Button>
          <Button type="primary" onClick={() => handleUpdateProgress(record)}>
            更新进度
          </Button>
        </Space>
      ),
    },
  ];

  const handleViewDetail = (task) => {
    // 查看详情逻辑
  };

  const handleUpdateProgress = (task) => {
    // 更新进度逻辑
  };

  return (
    <div className="task-list-page">
      {/* 移动端筛选器 */}
      {deviceType === 'mobile' && (
        <MobileTaskFilter
          filters={filters}
          onSearch={setFilters}
          onReset={() => setFilters({ taskStatus: null })}
        />
      )}

      {/* 桌面端筛选器 */}
      {deviceType !== 'mobile' && (
        <div className="desktop-filter">
          {/* 桌面端筛选表单 */}
        </div>
      )}

      {/* 响应式表格 */}
      <ResponsiveTable
        columns={columns}
        dataSource={tasks}
        loading={loading}
        renderMobileCard={(task) =>
          renderMobileTaskCard(task, handleViewDetail, handleUpdateProgress)
        }
        pagination={{ pageSize: deviceType === 'mobile' ? 10 : 20 }}
      />
    </div>
  );
}

export default TaskList;
```

### 2. 表单页面适配

```javascript
// pages/OrderForm/index.jsx
import React from 'react';
import { Form, Input, Select, DatePicker, Button, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useDeviceType } from '@/utils/responsive';
import { createOrder } from '@/services/orderService';
import '@/styles/mobile-form.less';
import './OrderForm.less';

function OrderForm() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const deviceType = useDeviceType();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      await createOrder(values);
      message.success('订单创建成功');
      navigate('/orders');
    } catch (error) {
      message.error(error.message || '创建失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`order-form-page ${deviceType}-view`}>
      <Form
        form={form}
        layout={deviceType === 'mobile' ? 'vertical' : 'horizontal'}
        className={deviceType === 'mobile' ? 'mobile-form card-mobile-form' : ''}
        labelCol={deviceType !== 'mobile' ? { span: 6 } : undefined}
        wrapperCol={deviceType !== 'mobile' ? { span: 18 } : undefined}
        onFinish={handleSubmit}
      >
        {/* 基本信息 */}
        <div className={deviceType === 'mobile' ? 'form-section' : ''}>
          {deviceType === 'mobile' && <div className="section-title">基本信息</div>}

          <Form.Item
            label="客户姓名"
            name="clientName"
            rules={[{ required: true, message: '请输入客户姓名' }]}
          >
            <Input placeholder="请输入客户姓名" />
          </Form.Item>

          <Form.Item
            label="联系电话"
            name="phone"
            rules={[
              { required: true, message: '请输入联系电话' },
              { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' },
            ]}
          >
            <Input placeholder="请输入联系电话" type="tel" />
          </Form.Item>
        </div>

        {/* 订单信息 */}
        <div className={deviceType === 'mobile' ? 'form-section' : ''}>
          {deviceType === 'mobile' && <div className="section-title">订单信息</div>}

          <Form.Item
            label="服装类型"
            name="clothingType"
            rules={[{ required: true, message: '请选择服装类型' }]}
          >
            <Select placeholder="请选择服装类型">
              <Select.Option value="1">连衣裙</Select.Option>
              <Select.Option value="2">T恤</Select.Option>
              <Select.Option value="3">裤装</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="拍摄日期"
            name="shootDate"
            rules={[{ required: true, message: '请选择拍摄日期' }]}
          >
            <DatePicker style={{ width: '100%' }} placeholder="请选择拍摄日期" />
          </Form.Item>
        </div>

        {/* 提交按钮 */}
        {deviceType === 'mobile' ? (
          <div className="form-footer-fixed">
            <Button size="large" onClick={() => navigate(-1)}>
              取消
            </Button>
            <Button type="primary" size="large" htmlType="submit" loading={loading}>
              提交
            </Button>
          </div>
        ) : (
          <Form.Item wrapperCol={{ offset: 6, span: 18 }}>
            <Space>
              <Button onClick={() => navigate(-1)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                提交
              </Button>
            </Space>
          </Form.Item>
        )}
      </Form>
    </div>
  );
}

export default OrderForm;
```

### 3. 上传页面适配

```javascript
// pages/TaskResultUpload/index.jsx
import React, { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import MobileUpload from '@/components/MobileUpload';
import { submitTaskResult, uploadFile } from '@/services/taskService';
import '@/styles/mobile-form.less';

function TaskResultUpload() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { taskId } = useParams();
  const [loading, setLoading] = useState(false);

  const handleUpload = async (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('taskId', taskId);

    const response = await uploadFile(formData, {
      onUploadProgress: (e) => {
        const percent = Math.round((e.loaded * 100) / e.total);
        onProgress(percent);
      },
    });

    return {
      url: response.data.url,
      fileId: response.data.fileId,
    };
  };

  const handleSubmit = async (values) => {
    const readyFiles = values.images?.filter((f) => f.status === 'ready') || [];
    if (readyFiles.length > 0) {
      message.warning('请先上传所有图片');
      return;
    }

    const uploadedUrls = values.images
      ?.filter((f) => f.status === 'success')
      .map((f) => f.url) || [];

    if (uploadedUrls.length === 0) {
      message.warning('请至少上传一张图片');
      return;
    }

    setLoading(true);
    try {
      await submitTaskResult({
        taskId,
        description: values.description,
        images: uploadedUrls,
      });

      message.success('提交成功');
      navigate(-1);
    } catch (error) {
      message.error(error.message || '提交失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="task-result-upload-page" style={{ padding: 16 }}>
      <Form form={form} layout="vertical" onFinish={handleSubmit} className="mobile-form">
        <Form.Item
          label="成果说明"
          name="description"
          rules={[{ required: true, message: '请输入成果说明' }]}
        >
          <Input.TextArea
            rows={4}
            placeholder="请描述您的工作成果..."
            maxLength={500}
            showCount
          />
        </Form.Item>

        <Form.Item
          label="成果图片"
          name="images"
          rules={[
            {
              validator: (_, value) => {
                const uploaded = value?.filter((f) => f.status === 'success') || [];
                if (uploaded.length === 0) {
                  return Promise.reject(new Error('请至少上传一张图片'));
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <MobileUpload maxCount={9} compress={true} compressQuality={0.8} onUpload={handleUpload} />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block size="large" loading={loading}>
            提交成果
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}

export default TaskResultUpload;
```

---

## 样式适配示例

### 页面容器样式

```less
// TaskList.less
@import '~@/styles/responsive.less';

.task-list-page {
  padding: 24px;
  background: #f5f5f5;
  min-height: 100vh;

  .mobile({
    padding: 12px;
    padding-bottom: 72px; // 为底部导航留出空间
  });

  .desktop-filter {
    background: #fff;
    padding: 16px;
    margin-bottom: 16px;
    border-radius: 4px;

    .mobile({
      display: none;
    });
  }
}
```

### 响应式栅格布局

```less
// Dashboard.less
@import '~@/styles/responsive.less';

.dashboard-container {
  .statistics-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 24px;

    .tablet({
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    });

    .mobile({
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-bottom: 12px;
    });
  }

  .stat-card {
    background: #fff;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);

    .mobile({
      padding: 16px;
    });
  }
}
```

---

## API 适配

### 条件请求参数

```javascript
import { useDeviceType } from '@/utils/responsive';

function useTaskList() {
  const deviceType = useDeviceType();

  const fetchTasks = async (filters) => {
    // 移动端减少返回字段
    const params = {
      ...filters,
      fields: deviceType === 'mobile'
        ? 'taskId,orderNo,taskStatus,deadline,progress' // 简化字段
        : '*', // 全部字段
      pageSize: deviceType === 'mobile' ? 10 : 20,
    };

    return await getTaskList(params);
  };

  return { fetchTasks };
}
```

### 图片 URL 适配

```javascript
function getImageUrl(url, deviceType) {
  if (!url) return '';

  const sizeMap = {
    mobile: 'thumbnail', // 缩略图
    tablet: 'medium',    // 中等尺寸
    desktop: 'original', // 原图
  };

  const size = sizeMap[deviceType] || 'original';
  return `${url}?size=${size}`;
}

// 使用
const deviceType = useDeviceType();
const imageUrl = getImageUrl(task.imageUrl, deviceType);
```

---

## 性能优化

### 1. 代码分割

```javascript
import React, { lazy, Suspense } from 'react';
import { useDeviceType } from '@/utils/responsive';

// 按设备类型懒加载组件
const DesktopDashboard = lazy(() => import('./DesktopDashboard'));
const MobileDashboard = lazy(() => import('./MobileDashboard'));

function Dashboard() {
  const deviceType = useDeviceType();

  return (
    <Suspense fallback={<div>加载中...</div>}>
      {deviceType === 'mobile' ? <MobileDashboard /> : <DesktopDashboard />}
    </Suspense>
  );
}
```

### 2. 图片懒加载

```javascript
import React, { useState, useEffect, useRef } from 'react';

function LazyImage({ src, alt, placeholder }) {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const imgRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setImageSrc(src);
          observer.unobserve(entry.target);
        }
      });
    });

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [src]);

  return <img ref={imgRef} src={imageSrc} alt={alt} loading="lazy" />;
}
```

### 3. 虚拟滚动

```javascript
import React from 'react';
import { FixedSizeList } from 'react-window';
import { useDeviceType } from '@/utils/responsive';

function VirtualTaskList({ tasks }) {
  const deviceType = useDeviceType();

  // 移动端使用虚拟滚动优化长列表
  if (deviceType === 'mobile' && tasks.length > 50) {
    return (
      <FixedSizeList
        height={window.innerHeight - 200}
        itemCount={tasks.length}
        itemSize={120}
        width="100%"
      >
        {({ index, style }) => (
          <div style={style}>
            <TaskCard task={tasks[index]} />
          </div>
        )}
      </FixedSizeList>
    );
  }

  // 桌面端或数据量少时使用普通渲染
  return tasks.map((task) => <TaskCard key={task.id} task={task} />);
}
```

---

## 调试技巧

### 1. Chrome DevTools 设备模拟

1. 打开 Chrome DevTools (F12)
2. 点击设备工具栏图标(Ctrl+Shift+M)
3. 选择目标设备: iPhone 14 Pro, iPad, etc.
4. 测试响应式布局

### 2. 添加调试信息

```javascript
import { useDeviceType, useBreakpoint } from '@/utils/responsive';

function DebugInfo() {
  const deviceType = useDeviceType();
  const breakpoint = useBreakpoint();

  // 仅在开发环境显示
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div style={{ position: 'fixed', bottom: 60, right: 10, background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '8px 12px', borderRadius: 4, fontSize: 12, zIndex: 9999 }}>
      <div>Device: {deviceType}</div>
      <div>Breakpoint: {breakpoint}</div>
      <div>Width: {window.innerWidth}px</div>
    </div>
  );
}

// 在 App.jsx 中使用
<DebugInfo />
```

### 3. 日志断点

```javascript
const deviceType = useDeviceType();

useEffect(() => {
  console.log('[Responsive] Device type changed:', deviceType);
  console.log('[Responsive] Window size:', window.innerWidth, 'x', window.innerHeight);
}, [deviceType]);
```

---

## 部署注意事项

### 1. 构建配置

```javascript
// package.json
{
  "scripts": {
    "build": "react-scripts build",
    "build:analyze": "ANALYZE=true react-scripts build" // 分析打包体积
  }
}
```

### 2. Nginx 配置

```nginx
# 针对移动设备优化
location ~* \.(jpg|jpeg|png|gif|webp)$ {
  expires 30d;
  add_header Cache-Control "public, immutable";

  # 根据设备类型返回不同尺寸图片
  set $image_size "original";
  if ($http_user_agent ~* "Mobile") {
    set $image_size "thumbnail";
  }
}

# 启用 gzip 压缩
gzip on;
gzip_types text/css application/javascript application/json;
gzip_min_length 1000;
```

### 3. CDN 配置

```javascript
// config-overrides.js
module.exports = {
  webpack: (config) => {
    if (process.env.NODE_ENV === 'production') {
      config.output.publicPath = 'https://cdn.example.com/';
    }
    return config;
  },
};
```

---

## 常见错误排查

### 1. 样式不生效

**问题**: 移动端样式没有应用

**排查**:
```bash
# 检查 Less 是否正确编译
# 确认导入路径正确
@import '~@/styles/responsive.less'; # 正确
@import '@/styles/responsive.less';  # 错误(缺少 ~)
```

### 2. 响应式 Hook 不工作

**问题**: `useDeviceType` 返回值不变

**排查**:
```javascript
// 检查是否正确引入
import { useDeviceType } from '@/utils/responsive'; // 正确
import useDeviceType from '@/utils/responsive';     // 错误

// 检查路径别名配置
// 确认 jsconfig.json 或 tsconfig.json 中配置了 @/ 别名
```

### 3. 底部导航被遮挡

**问题**: 页面内容被底部导航遮挡

**解决**:
```less
.page-content {
  .mobile({
    padding-bottom: 60px; // 为底部导航留出空间
  });
}
```

---

## 总结

完成以上步骤后,你的项目应该已经具备完整的移动端适配能力。

**核心要点:**
1. 使用 `useDeviceType` Hook 检测设备类型
2. 使用 Less 混合宏(`mobile`, `tablet`, `desktop`)编写响应式样式
3. 使用 `ResponsiveTable` 组件适配表格
4. 使用 `mobile-form` 样式类适配表单
5. 集成 `MobileTabBar` 底部导航
6. 使用 `MobileUpload` 支持相机拍摄

**下一步:**
- 参考 [完整文档](./MOBILE_ADAPTATION.md) 了解更多细节
- 查看 [快速开始](./MOBILE_QUICKSTART.md) 快速上手
- 运行示例代码测试各个组件

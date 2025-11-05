# 移动端适配文档

## 目录
- [概述](#概述)
- [技术架构](#技术架构)
- [响应式断点](#响应式断点)
- [核心组件](#核心组件)
- [使用指南](#使用指南)
- [最佳实践](#最佳实践)
- [常见问题](#常见问题)

---

## 概述

本系统提供了完整的移动端适配方案,支持手机(320px-428px)和平板(768px-1024px)设备。

### 主要特性

- **响应式布局**: 基于 Ant Design Grid 系统 + CSS 媒体查询
- **触摸优化**: 最小 48x48px 触摸目标,手势支持
- **组件适配**: 表格→卡片、表单→单列、导航→底部标签栏
- **图片上传**: 支持调用手机相机直接拍摄
- **性能优化**: 图片压缩、懒加载、按需渲染

### 支持的设备尺寸

| 设备类型 | 屏幕宽度 | 典型设备 |
|---------|---------|---------|
| 手机(竖屏) | 320px - 428px | iPhone SE, iPhone 14 Pro Max |
| 平板(竖屏) | 768px - 834px | iPad, iPad Pro |
| 平板(横屏) | 1024px - 1366px | iPad Pro |
| 桌面 | 1366px+ | PC, Mac |

---

## 技术架构

### 文件结构

```
frontend/src/
├── utils/
│   └── responsive.js              # 响应式工具函数和 React Hooks
├── styles/
│   ├── responsive.less            # Less 响应式混合宏
│   ├── mobile-form.less           # 移动端表单样式
│   └── mobile-form-examples.jsx   # 表单使用示例
├── components/
│   ├── MobileTabBar/              # 移动端底部导航
│   │   ├── MobileTabBar.jsx
│   │   ├── MobileTabBar.less
│   │   └── index.js
│   ├── ResponsiveTable/           # 响应式表格组件
│   │   ├── ResponsiveTable.jsx
│   │   ├── ResponsiveTable.less
│   │   └── index.js
│   ├── MobileUpload/              # 移动端上传组件
│   │   ├── MobileUpload.jsx
│   │   ├── MobileUpload.less
│   │   ├── MobileUploadExample.jsx
│   │   └── index.js
│   ├── TaskList/
│   │   ├── TaskListMobile.jsx     # 任务列表移动端渲染
│   │   └── TaskListMobile.less
│   └── Dashboard/
│       └── DashboardMobile.less   # 仪表盘移动端样式
```

### 技术栈

- **React Hooks**: 自定义响应式检测 Hooks
- **Less**: CSS 预处理器,提供混合宏
- **Ant Design**: UI 组件库,Grid 系统
- **媒体查询**: CSS @media 响应式断点

---

## 响应式断点

### 断点定义

```javascript
// utils/responsive.js
export const BREAKPOINTS = {
  xs: 480,   // 超小屏幕(手机竖屏)
  sm: 576,   // 小屏幕(手机横屏)
  md: 768,   // 中等屏幕(平板竖屏)
  lg: 992,   // 大屏幕(平板横屏)
  xl: 1200,  // 超大屏幕(小桌面)
  xxl: 1600  // 超超大屏幕(大桌面)
};
```

### Less 混合宏

```less
// styles/responsive.less

// 移动端样式(≤576px)
.mobile(@rules) {
  @media (max-width: @screen-sm) {
    @rules();
  }
}

// 平板样式(577px-992px)
.tablet(@rules) {
  @media (min-width: (@screen-sm + 1)) and (max-width: @screen-lg) {
    @rules();
  }
}

// 桌面样式(≥993px)
.desktop(@rules) {
  @media (min-width: (@screen-lg + 1)) {
    @rules();
  }
}
```

### React Hooks

```javascript
import { useDeviceType, useBreakpoint, useMediaQuery } from '@/utils/responsive';

function MyComponent() {
  // 获取设备类型: 'mobile' | 'tablet' | 'desktop'
  const deviceType = useDeviceType();

  // 获取当前断点: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'
  const breakpoint = useBreakpoint();

  // 自定义媒体查询
  const isMobile = useMediaQuery('(max-width: 576px)');

  return (
    <div>
      当前设备: {deviceType}
    </div>
  );
}
```

---

## 核心组件

### 1. MobileTabBar - 底部导航栏

移动端专用的底部标签导航,替代桌面端的侧边栏。

**使用示例:**

```javascript
import MobileTabBar from '@/components/MobileTabBar';

function App() {
  return (
    <div>
      {/* 页面内容 */}
      <MobileTabBar />
    </div>
  );
}
```

**特性:**
- 自动检测设备类型,仅在移动端显示
- 固定在底部,不占用内容区域
- 支持路由高亮
- 触摸友好的 56px 高度

---

### 2. ResponsiveTable - 响应式表格

自动根据设备类型切换表格/卡片列表显示。

**使用示例:**

```javascript
import ResponsiveTable from '@/components/ResponsiveTable';

function OrderList() {
  const columns = [
    { title: '订单编号', dataIndex: 'orderNo', key: 'orderNo' },
    { title: '客户', dataIndex: 'clientName', key: 'clientName' },
    { title: '状态', dataIndex: 'status', key: 'status' }
  ];

  const renderMobileCard = (record) => (
    <div className="mobile-card-item">
      <div className="card-header">
        <span className="card-title">{record.orderNo}</span>
        <Tag color="blue">{record.status}</Tag>
      </div>
      <div className="card-body">
        <div className="card-row">
          <span className="label">客户:</span>
          <span className="value">{record.clientName}</span>
        </div>
      </div>
    </div>
  );

  return (
    <ResponsiveTable
      columns={columns}
      dataSource={orders}
      renderMobileCard={renderMobileCard}
      pagination={{ pageSize: 10 }}
    />
  );
}
```

**特性:**
- 桌面端显示标准表格
- 移动端显示卡片列表
- 保留分页、加载状态
- 自定义卡片渲染

---

### 3. MobileUpload - 移动端上传组件

支持相机拍摄和相册选择的上传组件。

**使用示例:**

```javascript
import MobileUpload from '@/components/MobileUpload';

function TaskResultUpload() {
  const uploadFile = async (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post('/api/upload', formData, {
      onUploadProgress: (e) => {
        const percent = Math.round((e.loaded * 100) / e.total);
        onProgress(percent);
      }
    });

    return { url: response.data.url };
  };

  return (
    <Form.Item label="成果图片" name="images">
      <MobileUpload
        maxCount={9}
        compress={true}
        compressQuality={0.8}
        onUpload={uploadFile}
      />
    </Form.Item>
  );
}
```

**特性:**
- 相机直接拍摄 (`capture="environment"`)
- 相册选择
- 图片压缩(默认 1920px 宽度, 0.8 质量)
- 上传进度显示
- 预览、删除功能
- 3列网格布局

**Props:**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| value | Array | [] | 文件列表 |
| onChange | Function | - | 文件列表变化回调 |
| maxCount | Number | 9 | 最大上传数量 |
| maxSize | Number | 10MB | 单文件最大尺寸 |
| compress | Boolean | true | 是否压缩图片 |
| compressQuality | Number | 0.8 | 压缩质量 0-1 |
| onUpload | Function | - | 上传函数 |
| accept | String | 'image/*' | 文件类型 |

---

### 4. TaskListMobile - 任务列表移动端渲染

提供任务卡片渲染函数和筛选组件。

**使用示例:**

```javascript
import { renderMobileTaskCard, MobileTaskFilter } from '@/components/TaskList/TaskListMobile';
import { useDeviceType } from '@/utils/responsive';

function TaskList() {
  const deviceType = useDeviceType();
  const [filters, setFilters] = useState({ taskStatus: null });

  return (
    <div>
      {deviceType === 'mobile' ? (
        <>
          <MobileTaskFilter
            filters={filters}
            onSearch={setFilters}
            onReset={() => setFilters({ taskStatus: null })}
          />
          <div className="task-list">
            {tasks.map(task => renderMobileTaskCard(
              task,
              handleViewDetail,
              handleUpdateProgress
            ))}
          </div>
        </>
      ) : (
        <Table columns={columns} dataSource={tasks} />
      )}
    </div>
  );
}
```

**特性:**
- 卡片式布局
- 进度条可视化
- 紧急/逾期标记
- 大按钮触摸友好
- 简化筛选器

---

## 使用指南

### 1. 在组件中使用响应式样式

**方式一: Less 混合宏**

```less
// MyComponent.less
@import '~@/styles/responsive.less';

.my-component {
  padding: 24px;
  font-size: 16px;

  .mobile({
    padding: 12px;
    font-size: 14px;
  });

  .tablet({
    padding: 16px;
    font-size: 15px;
  });
}
```

**方式二: React Hooks**

```javascript
import { useDeviceType } from '@/utils/responsive';

function MyComponent() {
  const deviceType = useDeviceType();

  return (
    <div className={`my-component ${deviceType}-view`}>
      {deviceType === 'mobile' ? (
        <MobileView />
      ) : (
        <DesktopView />
      )}
    </div>
  );
}
```

**方式三: Ant Design Grid**

```javascript
import { Row, Col } from 'antd';

function MyComponent() {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} md={8} lg={6}>
        内容
      </Col>
    </Row>
  );
}
```

---

### 2. 表单移动端适配

**引入移动端表单样式:**

```javascript
import '@/styles/mobile-form.less';

function MyForm() {
  return (
    <Form layout="vertical" className="mobile-form">
      <Form.Item label="姓名" name="name">
        <Input placeholder="请输入姓名" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" block size="large">
          提交
        </Button>
      </Form.Item>
    </Form>
  );
}
```

**样式类:**

- `.mobile-form`: 基础移动表单样式
- `.responsive-form`: 响应式布局(桌面水平,移动垂直)
- `.compact-mobile-form`: 紧凑型移动表单
- `.card-mobile-form`: 卡片式分组表单
- `.search-mobile-form`: 搜索筛选表单

**固定底部按钮:**

```javascript
<div className="form-footer-fixed">
  <Button size="large" onClick={handleCancel}>取消</Button>
  <Button type="primary" size="large" htmlType="submit">提交</Button>
</div>
```

---

### 3. 表格移动端适配

**方式一: 使用 ResponsiveTable 组件**

```javascript
import ResponsiveTable from '@/components/ResponsiveTable';

<ResponsiveTable
  columns={columns}
  dataSource={dataSource}
  renderMobileCard={(record) => <MobileCard data={record} />}
/>
```

**方式二: 条件渲染**

```javascript
import { useDeviceType } from '@/utils/responsive';

function MyTable() {
  const deviceType = useDeviceType();

  if (deviceType === 'mobile') {
    return (
      <div className="mobile-card-list">
        {dataSource.map(item => <MobileCard key={item.id} data={item} />)}
      </div>
    );
  }

  return <Table columns={columns} dataSource={dataSource} />;
}
```

---

### 4. 导航适配

**App.jsx 集成:**

```javascript
import MobileTabBar from '@/components/MobileTabBar';
import { useDeviceType } from '@/utils/responsive';

function App() {
  const deviceType = useDeviceType();

  return (
    <Layout>
      {deviceType !== 'mobile' && <Sider />} {/* 桌面侧边栏 */}
      <Layout>
        <Content>{/* 内容区域 */}</Content>
      </Layout>
      <MobileTabBar /> {/* 移动底部导航,自动检测 */}
    </Layout>
  );
}
```

---

## 最佳实践

### 1. 触摸目标尺寸

**最小 48x48px:**

```less
.touch-friendly-button {
  min-width: 48px;
  min-height: 48px;
  padding: 12px 16px;
}
```

**使用 Less 混合宏:**

```less
@import '~@/styles/responsive.less';

.my-button {
  .touch-friendly-button();
}
```

---

### 2. 防止 iOS 自动缩放

```less
.mobile({
  input, textarea, select {
    font-size: 16px !important; // 防止 iOS 聚焦时自动缩放
  }
});
```

---

### 3. 移动端隐藏/显示

**CSS 方式:**

```less
.hide-mobile {
  .mobile({ display: none !important; });
}

.show-mobile-only {
  display: none !important;
  .mobile({ display: block !important; });
}
```

**React 方式:**

```javascript
import { useDeviceType } from '@/utils/responsive';

function MyComponent() {
  const deviceType = useDeviceType();

  return (
    <>
      {deviceType !== 'mobile' && <DesktopOnlyContent />}
      {deviceType === 'mobile' && <MobileOnlyContent />}
    </>
  );
}
```

---

### 4. 图片优化

**响应式图片:**

```html
<img
  src="image-mobile.jpg"
  srcset="
    image-mobile.jpg 480w,
    image-tablet.jpg 768w,
    image-desktop.jpg 1200w
  "
  sizes="(max-width: 576px) 480px, (max-width: 992px) 768px, 1200px"
  alt="描述"
/>
```

**懒加载:**

```javascript
<img src="image.jpg" loading="lazy" alt="描述" />
```

---

### 5. 性能优化

**按需渲染:**

```javascript
import { useDeviceType } from '@/utils/responsive';

function ExpensiveComponent() {
  const deviceType = useDeviceType();

  // 移动端不渲染复杂图表
  if (deviceType === 'mobile') {
    return <SimplifiedView />;
  }

  return <ComplexChart />;
}
```

**虚拟滚动:**

```javascript
import { List } from 'react-virtualized';

// 移动端长列表使用虚拟滚动
<List
  width={width}
  height={height}
  rowCount={items.length}
  rowHeight={80}
  rowRenderer={({ index, key, style }) => (
    <div key={key} style={style}>
      {items[index]}
    </div>
  )}
/>
```

---

## 常见问题

### 1. 移动端底部导航被内容遮挡

**解决方案:**

```less
.page-content {
  .mobile({
    padding-bottom: 60px; // 为底部导航留出空间
  });
}
```

---

### 2. 表单固定底部按钮与键盘冲突

**解决方案:**

```javascript
useEffect(() => {
  // 监听键盘显示/隐藏
  const handleResize = () => {
    const footer = document.querySelector('.form-footer-fixed');
    if (footer) {
      const isKeyboardOpen = window.innerHeight < window.screen.height * 0.75;
      footer.style.position = isKeyboardOpen ? 'static' : 'fixed';
    }
  };

  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

---

### 3. iOS Safari 滚动卡顿

**解决方案:**

```less
.scrollable-container {
  -webkit-overflow-scrolling: touch; // iOS 平滑滚动
  overflow-y: auto;
}
```

---

### 4. Android 点击延迟 300ms

**解决方案:**

```css
* {
  touch-action: manipulation; /* 禁用双击缩放,消除延迟 */
}
```

或使用 FastClick 库。

---

### 5. 横竖屏切换适配

**监听方向变化:**

```javascript
useEffect(() => {
  const handleOrientationChange = () => {
    const isLandscape = window.innerWidth > window.innerHeight;
    console.log('当前方向:', isLandscape ? '横屏' : '竖屏');
  };

  window.addEventListener('orientationchange', handleOrientationChange);
  return () => window.removeEventListener('orientationchange', handleOrientationChange);
}, []);
```

---

## 测试清单

### 设备测试

- [ ] iPhone SE (375x667)
- [ ] iPhone 14 Pro (393x852)
- [ ] iPhone 14 Pro Max (430x932)
- [ ] iPad (768x1024)
- [ ] iPad Pro (1024x1366)
- [ ] Android 小屏手机 (360x640)
- [ ] Android 大屏手机 (414x896)

### 功能测试

- [ ] 底部导航切换正常
- [ ] 表格/卡片切换正常
- [ ] 表单输入无缩放
- [ ] 相机拍照上传正常
- [ ] 相册选择上传正常
- [ ] 图片压缩生效
- [ ] 触摸按钮响应灵敏
- [ ] 横竖屏切换适配
- [ ] 下拉刷新正常
- [ ] 滚动流畅无卡顿

### 兼容性测试

- [ ] iOS Safari 14+
- [ ] Android Chrome 90+
- [ ] 微信内置浏览器
- [ ] 支付宝内置浏览器

---

## 参考资料

- [Ant Design Mobile](https://mobile.ant.design/)
- [响应式设计指南](https://developer.mozilla.org/zh-CN/docs/Learn/CSS/CSS_layout/Responsive_Design)
- [Touch-friendly Design](https://web.dev/accessible-tap-targets/)
- [HTML5 Camera API](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/capture)

---

## 技术支持

如有问题,请联系技术团队或查看项目 Wiki。

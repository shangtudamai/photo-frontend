# 移动端适配 - 快速开始

## 5分钟快速集成

### 1. 引入响应式工具

```javascript
// 在你的组件中
import { useDeviceType } from '@/utils/responsive';

function MyComponent() {
  const deviceType = useDeviceType(); // 'mobile' | 'tablet' | 'desktop'

  return (
    <div>当前设备: {deviceType}</div>
  );
}
```

### 2. 使用移动端组件

#### 底部导航栏

```javascript
// App.jsx
import MobileTabBar from '@/components/MobileTabBar';

function App() {
  return (
    <>
      {/* 你的页面内容 */}
      <MobileTabBar />
    </>
  );
}
```

#### 响应式表格

```javascript
import ResponsiveTable from '@/components/ResponsiveTable';

// 桌面显示表格,移动端显示卡片
<ResponsiveTable
  columns={columns}
  dataSource={data}
  renderMobileCard={(record) => (
    <div className="card">
      <h3>{record.title}</h3>
      <p>{record.description}</p>
    </div>
  )}
/>
```

#### 移动端上传

```javascript
import MobileUpload from '@/components/MobileUpload';

<MobileUpload
  maxCount={9}
  compress={true}
  onUpload={async (file) => {
    // 上传逻辑
    return { url: 'uploaded-url' };
  }}
/>
```

### 3. 表单移动适配

```javascript
import '@/styles/mobile-form.less';

<Form layout="vertical" className="mobile-form">
  <Form.Item label="姓名" name="name">
    <Input placeholder="请输入" />
  </Form.Item>
  <Form.Item>
    <Button type="primary" block size="large" htmlType="submit">
      提交
    </Button>
  </Form.Item>
</Form>
```

### 4. Less 响应式样式

```less
@import '~@/styles/responsive.less';

.my-component {
  padding: 24px;

  // 移动端样式
  .mobile({
    padding: 12px;
  });

  // 平板样式
  .tablet({
    padding: 16px;
  });
}
```

## 常用模式

### 条件渲染

```javascript
const deviceType = useDeviceType();

{deviceType === 'mobile' ? <MobileView /> : <DesktopView />}
```

### 隐藏/显示

```less
// 移动端隐藏
.hide-mobile {
  .mobile({ display: none !important; });
}

// 仅移动端显示
.show-mobile-only {
  display: none !important;
  .mobile({ display: block !important; });
}
```

## 完整文档

查看 [移动端适配完整文档](./MOBILE_ADAPTATION.md)

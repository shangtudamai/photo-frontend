/**
 * 移动端表单使用示例
 */

import React from 'react';
import {
  Form,
  Input,
  Select,
  DatePicker,
  Radio,
  Checkbox,
  Switch,
  Slider,
  InputNumber,
  Button,
  Space,
  message
} from 'antd';
import '@/styles/mobile-form.less';

/**
 * 基础移动表单示例
 */
export const BasicMobileFormExample = () => {
  const [form] = Form.useForm();

  const handleSubmit = (values) => {
    console.log('表单数据:', values);
    message.success('提交成功');
  };

  return (
    <div style={{ padding: 16, background: '#f5f5f5', minHeight: '100vh' }}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        className="mobile-form"
      >
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
            { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
          ]}
        >
          <Input placeholder="请输入联系电话" type="tel" />
        </Form.Item>

        <Form.Item
          label="服装类型"
          name="clothingType"
          rules={[{ required: true, message: '请选择服装类型' }]}
        >
          <Select placeholder="请选择服装类型">
            <Select.Option value="1">连衣裙</Select.Option>
            <Select.Option value="2">T恤</Select.Option>
            <Select.Option value="3">裤装</Select.Option>
            <Select.Option value="4">外套</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="拍摄日期"
          name="shootDate"
          rules={[{ required: true, message: '请选择拍摄日期' }]}
        >
          <DatePicker style={{ width: '100%' }} placeholder="请选择拍摄日期" />
        </Form.Item>

        <Form.Item
          label="服装数量"
          name="quantity"
          rules={[{ required: true, message: '请输入服装数量' }]}
        >
          <InputNumber
            min={1}
            max={9999}
            placeholder="请输入服装数量"
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item
          label="修图效果"
          name="effectType"
          rules={[{ required: true, message: '请选择修图效果' }]}
        >
          <Radio.Group>
            <Radio value="1">简单</Radio>
            <Radio value="2">标准</Radio>
            <Radio value="3">高级</Radio>
            <Radio value="4">精修</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item label="额外服务" name="extraServices">
          <Checkbox.Group>
            <Checkbox value="background">背景更换</Checkbox>
            <Checkbox value="color">色彩调整</Checkbox>
            <Checkbox value="detail">细节优化</Checkbox>
          </Checkbox.Group>
        </Form.Item>

        <Form.Item
          label="备注说明"
          name="remark"
          extra="最多输入200个字符"
        >
          <Input.TextArea
            rows={4}
            placeholder="请输入备注说明"
            maxLength={200}
            showCount
          />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block size="large">
            提交订单
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

/**
 * 卡片式分组表单示例
 */
export const CardMobileFormExample = () => {
  const [form] = Form.useForm();

  const handleSubmit = (values) => {
    console.log('表单数据:', values);
    message.success('保存成功');
  };

  return (
    <div style={{ padding: 16, background: '#f5f5f5', minHeight: '100vh' }}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        className="mobile-form card-mobile-form"
      >
        {/* 基本信息 */}
        <div className="form-section">
          <div className="section-title">基本信息</div>

          <Form.Item
            label="订单编号"
            name="orderNo"
            rules={[{ required: true, message: '请输入订单编号' }]}
          >
            <Input placeholder="请输入订单编号" />
          </Form.Item>

          <Form.Item
            label="客户姓名"
            name="clientName"
            rules={[{ required: true, message: '请输入客户姓名' }]}
          >
            <Input placeholder="请输入客户姓名" />
          </Form.Item>
        </div>

        {/* 拍摄信息 */}
        <div className="form-section">
          <div className="section-title">拍摄信息</div>

          <Form.Item
            label="服装数量"
            name="clothingCount"
            rules={[{ required: true, message: '请输入服装数量' }]}
          >
            <InputNumber
              min={1}
              placeholder="请输入服装数量"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            label="单件耗时(分钟)"
            name="timePerPiece"
          >
            <Slider
              min={5}
              max={60}
              step={5}
              marks={{ 5: '5分', 30: '30分', 60: '60分' }}
            />
          </Form.Item>
        </div>

        {/* 价格信息 */}
        <div className="form-section">
          <div className="section-title">价格信息</div>

          <Form.Item
            label="单价"
            name="unitPrice"
            rules={[{ required: true, message: '请输入单价' }]}
          >
            <InputNumber
              min={0}
              precision={2}
              placeholder="请输入单价"
              style={{ width: '100%' }}
              prefix="¥"
            />
          </Form.Item>

          <Form.Item label="是否需要发票" name="needInvoice" valuePropName="checked">
            <Switch checkedChildren="是" unCheckedChildren="否" />
          </Form.Item>
        </div>

        {/* 固定底部按钮 */}
        <div className="form-footer-fixed">
          <Button size="large" onClick={() => form.resetFields()}>
            重置
          </Button>
          <Button type="primary" size="large" htmlType="submit">
            保存
          </Button>
        </div>
      </Form>
    </div>
  );
};

/**
 * 搜索筛选表单示例
 */
export const SearchMobileFormExample = () => {
  const [form] = Form.useForm();

  const handleSearch = (values) => {
    console.log('搜索条件:', values);
    message.success('搜索成功');
  };

  const handleReset = () => {
    form.resetFields();
    message.info('已重置');
  };

  return (
    <div style={{ padding: 16, background: '#f5f5f5' }}>
      <Form
        form={form}
        onFinish={handleSearch}
        className="search-mobile-form"
      >
        <Form.Item name="keyword">
          <Input.Search
            placeholder="搜索订单编号、客户姓名"
            enterButton="搜索"
            size="large"
            onSearch={() => form.submit()}
          />
        </Form.Item>

        <Form.Item label="订单状态" name="status">
          <div className="filter-tags">
            <Checkbox.Group>
              <Checkbox.Button value="1">待确认</Checkbox.Button>
              <Checkbox.Button value="2">进行中</Checkbox.Button>
              <Checkbox.Button value="3">已完成</Checkbox.Button>
              <Checkbox.Button value="4">已取消</Checkbox.Button>
            </Checkbox.Group>
          </div>
        </Form.Item>

        <Space style={{ width: '100%' }}>
          <Button onClick={handleReset}>重置</Button>
          <Button type="primary" htmlType="submit">
            应用筛选
          </Button>
        </Space>
      </Form>
    </div>
  );
};

export default {
  BasicMobileFormExample,
  CardMobileFormExample,
  SearchMobileFormExample
};

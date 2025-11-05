/**
 * 财务参数配置表单
 */

import React, { useState, useEffect } from 'react';
import { Form, InputNumber, Button, Space, message, Modal, Row, Col } from 'antd';
import { SaveOutlined, UndoOutlined } from '@ant-design/icons';
import { batchUpdateParameters, resetToDefaults } from '@/services/settingService';

const { confirm } = Modal;

function FinanceSettings({ parameters, onUpdateSuccess }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // 初始化表单值
  useEffect(() => {
    if (parameters && parameters.length > 0) {
      const initialValues = {};

      parameters.forEach(param => {
        const key = param.parameterKey;
        let value = param.parameterValue;

        // 处理价格区间（JSON格式）
        if (key === 'price_ranges') {
          initialValues.price_simple_min = value.simple?.min || 5;
          initialValues.price_simple_max = value.simple?.max || 15;
          initialValues.price_simple_default = value.simple?.default || 10;

          initialValues.price_standard_min = value.standard?.min || 10;
          initialValues.price_standard_max = value.standard?.max || 30;
          initialValues.price_standard_default = value.standard?.default || 20;

          initialValues.price_advanced_min = value.advanced?.min || 20;
          initialValues.price_advanced_max = value.advanced?.max || 50;
          initialValues.price_advanced_default = value.advanced?.default || 35;

          initialValues.price_premium_min = value.premium?.min || 40;
          initialValues.price_premium_max = value.premium?.max || 100;
          initialValues.price_premium_default = value.premium?.default || 60;
        } else {
          initialValues[key] = value;
        }
      });

      form.setFieldsValue(initialValues);
    }
  }, [parameters, form]);

  // 保存配置
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      setLoading(true);

      // 构建参数数组
      const updateParams = [];

      // 价格区间参数（组合为JSON）
      if (
        values.price_simple_min !== undefined &&
        values.price_simple_max !== undefined &&
        values.price_simple_default !== undefined &&
        values.price_standard_min !== undefined &&
        values.price_standard_max !== undefined &&
        values.price_standard_default !== undefined &&
        values.price_advanced_min !== undefined &&
        values.price_advanced_max !== undefined &&
        values.price_advanced_default !== undefined &&
        values.price_premium_min !== undefined &&
        values.price_premium_max !== undefined &&
        values.price_premium_default !== undefined
      ) {
        updateParams.push({
          parameterKey: 'price_ranges',
          parameterValue: {
            simple: {
              min: values.price_simple_min,
              max: values.price_simple_max,
              default: values.price_simple_default
            },
            standard: {
              min: values.price_standard_min,
              max: values.price_standard_max,
              default: values.price_standard_default
            },
            advanced: {
              min: values.price_advanced_min,
              max: values.price_advanced_max,
              default: values.price_advanced_default
            },
            premium: {
              min: values.price_premium_min,
              max: values.price_premium_max,
              default: values.price_premium_default
            }
          },
          changeReason: '更新价格区间'
        });
      }

      // 其他基础参数
      const basicParams = [
        'bad_debt_days_threshold',
        'payment_warning_days',
        'max_discount_percentage',
        'min_order_amount'
      ];

      basicParams.forEach(key => {
        if (values[key] !== undefined) {
          updateParams.push({
            parameterKey: key,
            parameterValue: values[key],
            changeReason: '更新财务参数'
          });
        }
      });

      // 调用批量更新接口
      const res = await batchUpdateParameters(updateParams);

      if (res.code === 200) {
        message.success('财务参数保存成功');
        if (onUpdateSuccess) {
          onUpdateSuccess();
        }
      } else {
        message.error(res.message || '保存失败');
      }
    } catch (error) {
      console.error('Error saving finance settings:', error);
      if (error.errorFields) {
        message.error('请检查表单填写');
      } else {
        message.error('保存失败');
      }
    } finally {
      setLoading(false);
    }
  };

  // 恢复默认值
  const handleReset = () => {
    confirm({
      title: '确认恢复默认值？',
      content: '此操作将恢复所有财务参数为系统默认值，是否继续？',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        setLoading(true);
        try {
          const res = await resetToDefaults('finance');

          if (res.code === 200) {
            message.success('已恢复默认值');
            if (onUpdateSuccess) {
              onUpdateSuccess();
            }
          } else {
            message.error(res.message || '恢复默认值失败');
          }
        } catch (error) {
          console.error('Error resetting finance settings:', error);
          message.error('恢复默认值失败');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  return (
    <div className="parameter-form-container">
      <Form
        form={form}
        layout="vertical"
        className="parameter-form"
      >
        {/* 价格区间配置 */}
        <div className="form-section">
          <h3>各效果类型单价区间</h3>
          <p className="section-desc">配置不同效果类型的单价范围（元/张）</p>

          {/* 简单效果 */}
          <div className="price-range-group">
            <h4>简单效果</h4>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  label="最低价"
                  name="price_simple_min"
                  rules={[
                    { required: true, message: '请输入最低价' },
                    { type: 'number', min: 1, message: '最低价必须大于0' }
                  ]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="请输入"
                    addonAfter="元"
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="最高价"
                  name="price_simple_max"
                  rules={[
                    { required: true, message: '请输入最高价' },
                    { type: 'number', min: 1, message: '最高价必须大于0' }
                  ]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="请输入"
                    addonAfter="元"
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="默认单价"
                  name="price_simple_default"
                  rules={[
                    { required: true, message: '请输入默认单价' },
                    { type: 'number', min: 1, message: '默认单价必须大于0' }
                  ]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="请输入"
                    addonAfter="元"
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>

          {/* 标准效果 */}
          <div className="price-range-group">
            <h4>标准效果</h4>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  label="最低价"
                  name="price_standard_min"
                  rules={[
                    { required: true, message: '请输入最低价' },
                    { type: 'number', min: 1, message: '最低价必须大于0' }
                  ]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="请输入"
                    addonAfter="元"
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="最高价"
                  name="price_standard_max"
                  rules={[
                    { required: true, message: '请输入最高价' },
                    { type: 'number', min: 1, message: '最高价必须大于0' }
                  ]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="请输入"
                    addonAfter="元"
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="默认单价"
                  name="price_standard_default"
                  rules={[
                    { required: true, message: '请输入默认单价' },
                    { type: 'number', min: 1, message: '默认单价必须大于0' }
                  ]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="请输入"
                    addonAfter="元"
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>

          {/* 高级效果 */}
          <div className="price-range-group">
            <h4>高级效果</h4>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  label="最低价"
                  name="price_advanced_min"
                  rules={[
                    { required: true, message: '请输入最低价' },
                    { type: 'number', min: 1, message: '最低价必须大于0' }
                  ]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="请输入"
                    addonAfter="元"
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="最高价"
                  name="price_advanced_max"
                  rules={[
                    { required: true, message: '请输入最高价' },
                    { type: 'number', min: 1, message: '最高价必须大于0' }
                  ]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="请输入"
                    addonAfter="元"
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="默认单价"
                  name="price_advanced_default"
                  rules={[
                    { required: true, message: '请输入默认单价' },
                    { type: 'number', min: 1, message: '默认单价必须大于0' }
                  ]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="请输入"
                    addonAfter="元"
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>

          {/* 精修效果 */}
          <div className="price-range-group">
            <h4>精修效果</h4>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  label="最低价"
                  name="price_premium_min"
                  rules={[
                    { required: true, message: '请输入最低价' },
                    { type: 'number', min: 1, message: '最低价必须大于0' }
                  ]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="请输入"
                    addonAfter="元"
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="最高价"
                  name="price_premium_max"
                  rules={[
                    { required: true, message: '请输入最高价' },
                    { type: 'number', min: 1, message: '最高价必须大于0' }
                  ]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="请输入"
                    addonAfter="元"
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="默认单价"
                  name="price_premium_default"
                  rules={[
                    { required: true, message: '请输入默认单价' },
                    { type: 'number', min: 1, message: '默认单价必须大于0' }
                  ]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="请输入"
                    addonAfter="元"
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>
        </div>

        {/* 坏账超期阈值 */}
        <Form.Item
          label="坏账超期阈值"
          name="bad_debt_days_threshold"
          extra="订单未收款超过此天数将标记为坏账"
          rules={[
            { required: true, message: '请输入坏账超期阈值' },
            { type: 'number', min: 1, max: 365, message: '请输入1-365之间的数值' }
          ]}
        >
          <InputNumber
            style={{ width: '200px' }}
            placeholder="请输入"
            addonAfter="天"
          />
        </Form.Item>

        {/* 收款预警阈值 */}
        <Form.Item
          label="收款预警阈值"
          name="payment_warning_days"
          extra="订单未收款超过此天数将发出预警"
          rules={[
            { required: true, message: '请输入收款预警阈值' },
            { type: 'number', min: 1, max: 365, message: '请输入1-365之间的数值' }
          ]}
        >
          <InputNumber
            style={{ width: '200px' }}
            placeholder="请输入"
            addonAfter="天"
          />
        </Form.Item>

        {/* 订单折扣上限 */}
        <Form.Item
          label="订单折扣上限"
          name="max_discount_percentage"
          extra="订单允许的最大折扣百分比"
          rules={[
            { required: true, message: '请输入折扣上限' },
            { type: 'number', min: 0, max: 100, message: '请输入0-100之间的数值' }
          ]}
        >
          <InputNumber
            style={{ width: '200px' }}
            placeholder="请输入"
            addonAfter="%"
          />
        </Form.Item>

        {/* 最低订单金额 */}
        <Form.Item
          label="最低订单金额"
          name="min_order_amount"
          extra="系统允许的最低订单金额"
          rules={[
            { required: true, message: '请输入最低订单金额' },
            { type: 'number', min: 0, message: '最低订单金额不能小于0' }
          ]}
        >
          <InputNumber
            style={{ width: '200px' }}
            placeholder="请输入"
            addonBefore="¥"
          />
        </Form.Item>

        {/* 操作按钮 */}
        <Form.Item>
          <Space>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSubmit}
              loading={loading}
            >
              保存配置
            </Button>
            <Button
              icon={<UndoOutlined />}
              onClick={handleReset}
              loading={loading}
            >
              恢复默认
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  );
}

export default FinanceSettings;

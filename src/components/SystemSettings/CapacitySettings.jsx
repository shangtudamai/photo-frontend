/**
 * 产能参数配置表单
 */

import React, { useState, useEffect } from 'react';
import { Form, InputNumber, Button, Space, message, Modal } from 'antd';
import { SaveOutlined, UndoOutlined } from '@ant-design/icons';
import { batchUpdateParameters, resetToDefaults } from '@/services/settingService';

const { confirm } = Modal;

function CapacitySettings({ parameters, onUpdateSuccess }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // 初始化表单值
  useEffect(() => {
    if (parameters && parameters.length > 0) {
      const initialValues = {};

      parameters.forEach(param => {
        const key = param.parameterKey;
        let value = param.parameterValue;

        // 处理效果系数（JSON格式）
        if (key === 'effect_coefficients') {
          initialValues.effect_simple = value.simple || 0.8;
          initialValues.effect_standard = value.standard || 1.0;
          initialValues.effect_advanced = value.advanced || 1.5;
          initialValues.effect_premium = value.premium || 2.0;
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

      // 基础参数
      const basicParams = [
        'base_time_per_tile',
        'order_switch_buffer_hours',
        'photography_max_hours',
        'retouching_minutes_per_image',
        'employee_max_capacity_hours',
        'capacity_warning_threshold',
        'capacity_critical_threshold'
      ];

      basicParams.forEach(key => {
        if (values[key] !== undefined) {
          updateParams.push({
            parameterKey: key,
            parameterValue: values[key],
            changeReason: '更新产能参数'
          });
        }
      });

      // 效果系数（组合为JSON）
      if (
        values.effect_simple !== undefined &&
        values.effect_standard !== undefined &&
        values.effect_advanced !== undefined &&
        values.effect_premium !== undefined
      ) {
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
      }

      // 调用批量更新接口
      const res = await batchUpdateParameters(updateParams);

      if (res.code === 200) {
        message.success('产能参数保存成功');
        if (onUpdateSuccess) {
          onUpdateSuccess();
        }
      } else {
        message.error(res.message || '保存失败');
      }
    } catch (error) {
      console.error('Error saving capacity settings:', error);
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
      content: '此操作将恢复所有产能参数为系统默认值，是否继续？',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        setLoading(true);
        try {
          const res = await resetToDefaults('capacity');

          if (res.code === 200) {
            message.success('已恢复默认值');
            if (onUpdateSuccess) {
              onUpdateSuccess();
            }
          } else {
            message.error(res.message || '恢复默认值失败');
          }
        } catch (error) {
          console.error('Error resetting capacity settings:', error);
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
        {/* 平铺基准耗时 */}
        <Form.Item
          label="平铺基准耗时"
          name="base_time_per_tile"
          extra="单张平铺的基准耗时（分钟）"
          rules={[
            { required: true, message: '请输入平铺基准耗时' },
            { type: 'number', min: 1, max: 60, message: '请输入1-60之间的数值' }
          ]}
        >
          <InputNumber
            style={{ width: '200px' }}
            placeholder="请输入"
            addonAfter="分钟"
          />
        </Form.Item>

        {/* 效果系数 */}
        <div className="form-section">
          <h3>效果类型时间系数</h3>
          <p className="section-desc">不同效果类型的时间系数，用于计算实际耗时</p>

          <Form.Item
            label="简单效果系数"
            name="effect_simple"
            rules={[
              { required: true, message: '请输入简单效果系数' },
              { type: 'number', min: 0.1, max: 5, message: '请输入0.1-5之间的数值' }
            ]}
          >
            <InputNumber
              style={{ width: '200px' }}
              placeholder="请输入"
              step={0.1}
            />
          </Form.Item>

          <Form.Item
            label="标准效果系数"
            name="effect_standard"
            rules={[
              { required: true, message: '请输入标准效果系数' },
              { type: 'number', min: 0.1, max: 5, message: '请输入0.1-5之间的数值' }
            ]}
          >
            <InputNumber
              style={{ width: '200px' }}
              placeholder="请输入"
              step={0.1}
            />
          </Form.Item>

          <Form.Item
            label="高级效果系数"
            name="effect_advanced"
            rules={[
              { required: true, message: '请输入高级效果系数' },
              { type: 'number', min: 0.1, max: 5, message: '请输入0.1-5之间的数值' }
            ]}
          >
            <InputNumber
              style={{ width: '200px' }}
              placeholder="请输入"
              step={0.1}
            />
          </Form.Item>

          <Form.Item
            label="精修效果系数"
            name="effect_premium"
            rules={[
              { required: true, message: '请输入精修效果系数' },
              { type: 'number', min: 0.1, max: 5, message: '请输入0.1-5之间的数值' }
            ]}
          >
            <InputNumber
              style={{ width: '200px' }}
              placeholder="请输入"
              step={0.1}
            />
          </Form.Item>
        </div>

        {/* 订单切换缓冲时间 */}
        <Form.Item
          label="订单切换缓冲时间"
          name="order_switch_buffer_hours"
          extra="员工切换订单时的缓冲时间（小时）"
          rules={[
            { required: true, message: '请输入订单切换缓冲时间' },
            { type: 'number', min: 1, max: 24, message: '请输入1-24之间的数值' }
          ]}
        >
          <InputNumber
            style={{ width: '200px' }}
            placeholder="请输入"
            addonAfter="小时"
          />
        </Form.Item>

        {/* 摄影任务单次最大耗时 */}
        <Form.Item
          label="摄影任务单次最大耗时"
          name="photography_max_hours"
          extra="单次摄影任务的最大耗时（小时）"
          rules={[
            { required: true, message: '请输入摄影任务最大耗时' },
            { type: 'number', min: 1, max: 24, message: '请输入1-24之间的数值' }
          ]}
        >
          <InputNumber
            style={{ width: '200px' }}
            placeholder="请输入"
            addonAfter="小时"
          />
        </Form.Item>

        {/* 修图任务单张平均耗时 */}
        <Form.Item
          label="修图任务单张平均耗时"
          name="retouching_minutes_per_image"
          extra="修图任务每张图片的平均耗时（分钟）"
          rules={[
            { required: true, message: '请输入修图单张耗时' },
            { type: 'number', min: 1, max: 120, message: '请输入1-120之间的数值' }
          ]}
        >
          <InputNumber
            style={{ width: '200px' }}
            placeholder="请输入"
            addonAfter="分钟"
          />
        </Form.Item>

        {/* 员工每日最大产能 */}
        <Form.Item
          label="员工每日最大产能"
          name="employee_max_capacity_hours"
          extra="员工每日的最大工作产能（小时）"
          rules={[
            { required: true, message: '请输入员工最大产能' },
            { type: 'number', min: 1, max: 24, message: '请输入1-24之间的数值' }
          ]}
        >
          <InputNumber
            style={{ width: '200px' }}
            placeholder="请输入"
            addonAfter="小时"
          />
        </Form.Item>

        {/* 产能预警阈值 */}
        <Form.Item
          label="产能预警阈值"
          name="capacity_warning_threshold"
          extra="产能达到此百分比时发出预警（%）"
          rules={[
            { required: true, message: '请输入产能预警阈值' },
            { type: 'number', min: 50, max: 100, message: '请输入50-100之间的数值' }
          ]}
        >
          <InputNumber
            style={{ width: '200px' }}
            placeholder="请输入"
            addonAfter="%"
          />
        </Form.Item>

        {/* 产能严重预警阈值 */}
        <Form.Item
          label="产能严重预警阈值"
          name="capacity_critical_threshold"
          extra="产能达到此百分比时发出严重预警（%）"
          rules={[
            { required: true, message: '请输入产能严重预警阈值' },
            { type: 'number', min: 50, max: 100, message: '请输入50-100之间的数值' }
          ]}
        >
          <InputNumber
            style={{ width: '200px' }}
            placeholder="请输入"
            addonAfter="%"
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

export default CapacitySettings;

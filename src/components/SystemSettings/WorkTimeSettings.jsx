/**
 * 工作时间参数配置表单
 */

import React, { useState, useEffect } from 'react';
import { Form, InputNumber, Button, Space, message, Modal, Checkbox, TimePicker, Select } from 'antd';
import { SaveOutlined, UndoOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { batchUpdateParameters, resetToDefaults } from '@/services/settingService';

const { confirm } = Modal;
const { Option } = Select;

function WorkTimeSettings({ parameters, onUpdateSuccess }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [workDays, setWorkDays] = useState([1, 2, 3, 4, 5]); // 默认周一至周五
  const [holidays, setHolidays] = useState([]);

  // 初始化表单值
  useEffect(() => {
    if (parameters && parameters.length > 0) {
      const initialValues = {};

      parameters.forEach(param => {
        const key = param.parameterKey;
        let value = param.parameterValue;

        if (key === 'work_days') {
          // 工作日数组
          setWorkDays(value);
        } else if (key === 'work_time_range') {
          // 工作时间段
          initialValues.work_start = value.start ? dayjs(value.start, 'HH:mm') : null;
          initialValues.work_end = value.end ? dayjs(value.end, 'HH:mm') : null;
          initialValues.break_start = value.break_start ? dayjs(value.break_start, 'HH:mm') : null;
          initialValues.break_end = value.break_end ? dayjs(value.break_end, 'HH:mm') : null;
        } else if (key === 'holidays') {
          // 节假日列表
          setHolidays(value);
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

      // 每日有效工作时间
      if (values.daily_work_hours !== undefined) {
        updateParams.push({
          parameterKey: 'daily_work_hours',
          parameterValue: values.daily_work_hours,
          changeReason: '更新每日工作时间'
        });
      }

      // 工作日配置
      updateParams.push({
        parameterKey: 'work_days',
        parameterValue: workDays,
        changeReason: '更新工作日配置'
      });

      // 工作时间段
      if (
        values.work_start &&
        values.work_end &&
        values.break_start &&
        values.break_end
      ) {
        updateParams.push({
          parameterKey: 'work_time_range',
          parameterValue: {
            start: values.work_start.format('HH:mm'),
            end: values.work_end.format('HH:mm'),
            break_start: values.break_start.format('HH:mm'),
            break_end: values.break_end.format('HH:mm')
          },
          changeReason: '更新工作时间段'
        });
      }

      // 节假日列表
      updateParams.push({
        parameterKey: 'holidays',
        parameterValue: holidays,
        changeReason: '更新节假日配置'
      });

      // 加班费系数
      if (values.overtime_rate !== undefined) {
        updateParams.push({
          parameterKey: 'overtime_rate',
          parameterValue: values.overtime_rate,
          changeReason: '更新加班费系数'
        });
      }

      // 周末加班费系数
      if (values.weekend_overtime_rate !== undefined) {
        updateParams.push({
          parameterKey: 'weekend_overtime_rate',
          parameterValue: values.weekend_overtime_rate,
          changeReason: '更新周末加班费系数'
        });
      }

      // 调用批量更新接口
      const res = await batchUpdateParameters(updateParams);

      if (res.code === 200) {
        message.success('工作时间参数保存成功');
        if (onUpdateSuccess) {
          onUpdateSuccess();
        }
      } else {
        message.error(res.message || '保存失败');
      }
    } catch (error) {
      console.error('Error saving worktime settings:', error);
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
      content: '此操作将恢复所有工作时间参数为系统默认值，是否继续？',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        setLoading(true);
        try {
          const res = await resetToDefaults('worktime');

          if (res.code === 200) {
            message.success('已恢复默认值');
            if (onUpdateSuccess) {
              onUpdateSuccess();
            }
          } else {
            message.error(res.message || '恢复默认值失败');
          }
        } catch (error) {
          console.error('Error resetting worktime settings:', error);
          message.error('恢复默认值失败');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // 工作日选项
  const weekDayOptions = [
    { label: '周日', value: 0 },
    { label: '周一', value: 1 },
    { label: '周二', value: 2 },
    { label: '周三', value: 3 },
    { label: '周四', value: 4 },
    { label: '周五', value: 5 },
    { label: '周六', value: 6 }
  ];

  // 2025年法定节假日预设
  const presetHolidays2025 = [
    '2025-01-01', // 元旦
    '2025-02-10', '2025-02-11', '2025-02-12', '2025-02-13', '2025-02-14', '2025-02-15', '2025-02-16', // 春节
    '2025-04-04', '2025-04-05', '2025-04-06', // 清明节
    '2025-05-01', '2025-05-02', '2025-05-03', // 劳动节
    '2025-06-10', // 端午节
    '2025-09-15', '2025-09-16', '2025-09-17', // 中秋节
    '2025-10-01', '2025-10-02', '2025-10-03', '2025-10-04', '2025-10-05', '2025-10-06', '2025-10-07' // 国庆节
  ];

  // 加载预设节假日
  const loadPresetHolidays = () => {
    setHolidays(presetHolidays2025);
    message.success('已加载2025年法定节假日');
  };

  return (
    <div className="parameter-form-container">
      <Form
        form={form}
        layout="vertical"
        className="parameter-form"
      >
        {/* 每日有效工作时间 */}
        <Form.Item
          label="每日有效工作时间"
          name="daily_work_hours"
          extra="员工每天的有效工作时间（小时）"
          rules={[
            { required: true, message: '请输入每日工作时间' },
            { type: 'number', min: 1, max: 24, message: '请输入1-24之间的数值' }
          ]}
        >
          <InputNumber
            style={{ width: '200px' }}
            placeholder="请输入"
            addonAfter="小时"
          />
        </Form.Item>

        {/* 工作日配置 */}
        <Form.Item
          label="工作日配置"
          extra="选择一周中的工作日"
        >
          <Checkbox.Group
            options={weekDayOptions}
            value={workDays}
            onChange={(checkedValues) => setWorkDays(checkedValues)}
          />
        </Form.Item>

        {/* 工作时间段 */}
        <div className="form-section">
          <h3>工作时间段</h3>
          <p className="section-desc">配置每日的上下班时间和休息时间</p>

          <Form.Item
            label="上班时间"
            name="work_start"
            rules={[{ required: true, message: '请选择上班时间' }]}
          >
            <TimePicker
              style={{ width: '200px' }}
              format="HH:mm"
              placeholder="请选择"
            />
          </Form.Item>

          <Form.Item
            label="下班时间"
            name="work_end"
            rules={[{ required: true, message: '请选择下班时间' }]}
          >
            <TimePicker
              style={{ width: '200px' }}
              format="HH:mm"
              placeholder="请选择"
            />
          </Form.Item>

          <Form.Item
            label="午休开始时间"
            name="break_start"
            rules={[{ required: true, message: '请选择午休开始时间' }]}
          >
            <TimePicker
              style={{ width: '200px' }}
              format="HH:mm"
              placeholder="请选择"
            />
          </Form.Item>

          <Form.Item
            label="午休结束时间"
            name="break_end"
            rules={[{ required: true, message: '请选择午休结束时间' }]}
          >
            <TimePicker
              style={{ width: '200px' }}
              format="HH:mm"
              placeholder="请选择"
            />
          </Form.Item>
        </div>

        {/* 法定节假日 */}
        <div className="form-section">
          <h3>法定节假日</h3>
          <p className="section-desc">
            配置年度法定节假日列表
            <Button
              type="link"
              size="small"
              onClick={loadPresetHolidays}
            >
              加载2025年法定节假日
            </Button>
          </p>

          <Select
            mode="tags"
            style={{ width: '100%' }}
            placeholder="输入日期（格式：YYYY-MM-DD）或选择预设日期"
            value={holidays}
            onChange={(value) => setHolidays(value)}
          >
            {presetHolidays2025.map(date => (
              <Option key={date} value={date}>
                {date}
              </Option>
            ))}
          </Select>
          <p style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
            已配置 {holidays.length} 个节假日
          </p>
        </div>

        {/* 加班费系数 */}
        <Form.Item
          label="加班费系数"
          name="overtime_rate"
          extra="工作日加班费系数"
          rules={[
            { required: true, message: '请输入加班费系数' },
            { type: 'number', min: 1, max: 5, message: '请输入1-5之间的数值' }
          ]}
        >
          <InputNumber
            style={{ width: '200px' }}
            placeholder="请输入"
            step={0.1}
          />
        </Form.Item>

        {/* 周末加班费系数 */}
        <Form.Item
          label="周末加班费系数"
          name="weekend_overtime_rate"
          extra="周末加班费系数"
          rules={[
            { required: true, message: '请输入周末加班费系数' },
            { type: 'number', min: 1, max: 5, message: '请输入1-5之间的数值' }
          ]}
        >
          <InputNumber
            style={{ width: '200px' }}
            placeholder="请输入"
            step={0.1}
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

export default WorkTimeSettings;

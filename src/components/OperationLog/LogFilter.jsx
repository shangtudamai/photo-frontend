/**
 * 日志筛选组件
 */

import React, { useState, useEffect } from 'react';
import { Form, Select, DatePicker, Button, Row, Col, Space } from 'antd';
import { SearchOutlined, ReloadOutlined, ExportOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

function LogFilter({ filters, onSearch, onReset, onExport, exportLoading }) {
  const [form] = Form.useForm();

  // 初始化表单值
  useEffect(() => {
    form.setFieldsValue({
      userId: filters.userId,
      operationType: filters.operationType,
      targetType: filters.targetType,
      timeRange: filters.startTime && filters.endTime
        ? [dayjs(filters.startTime), dayjs(filters.endTime)]
        : null
    });
  }, [filters, form]);

  // 搜索
  const handleSearch = () => {
    const values = form.getFieldsValue();

    const searchFilters = {
      userId: values.userId || null,
      operationType: values.operationType || null,
      targetType: values.targetType || null,
      startTime: values.timeRange ? values.timeRange[0].format('YYYY-MM-DD 00:00:00') : null,
      endTime: values.timeRange ? values.timeRange[1].format('YYYY-MM-DD 23:59:59') : null
    };

    onSearch(searchFilters);
  };

  // 重置
  const handleReset = () => {
    form.resetFields();
    onReset();
  };

  // 操作类型选项
  const operationTypeOptions = [
    { value: 'create', label: '创建' },
    { value: 'update', label: '更新' },
    { value: 'delete', label: '删除' },
    { value: 'assign', label: '分配' },
    { value: 'approve', label: '批准' },
    { value: 'reject', label: '退回' },
    { value: 'status_change', label: '状态变更' },
    { value: 'payment', label: '收款' },
    { value: 'export', label: '导出' }
  ];

  // 操作对象类型选项
  const targetTypeOptions = [
    { value: 'order', label: '订单' },
    { value: 'task', label: '任务' },
    { value: 'client', label: '客户' },
    { value: 'payment', label: '收款记录' },
    { value: 'user', label: '用户' },
    { value: 'setting', label: '系统参数' }
  ];

  return (
    <Form form={form} layout="vertical">
      <Row gutter={16}>
        <Col xs={24} sm={12} md={6}>
          <Form.Item label="操作类型" name="operationType">
            <Select placeholder="请选择" allowClear>
              {operationTypeOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Form.Item label="操作对象类型" name="targetType">
            <Select placeholder="请选择" allowClear>
              {targetTypeOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>

        <Col xs={24} sm={24} md={8}>
          <Form.Item label="时间范围" name="timeRange">
            <RangePicker
              style={{ width: '100%' }}
              showTime
              format="YYYY-MM-DD"
            />
          </Form.Item>
        </Col>

        <Col xs={24} sm={24} md={4}>
          <Form.Item label=" ">
            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleSearch}
              >
                搜索
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleReset}
              >
                重置
              </Button>
              <Button
                icon={<ExportOutlined />}
                onClick={onExport}
                loading={exportLoading}
              >
                导出
              </Button>
            </Space>
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
}

export default LogFilter;

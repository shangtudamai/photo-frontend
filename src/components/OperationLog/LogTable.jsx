/**
 * 日志表格组件
 */

import React from 'react';
import { Table, Tag, Button, Tooltip } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

function LogTable({ loading, logs, pagination, onTableChange, onViewDetail }) {
  // 操作类型标签颜色
  const getOperationTypeColor = (type) => {
    const colorMap = {
      create: 'green',
      update: 'blue',
      delete: 'red',
      assign: 'orange',
      approve: 'cyan',
      reject: 'volcano',
      status_change: 'purple',
      payment: 'gold',
      export: 'geekblue'
    };
    return colorMap[type] || 'default';
  };

  // 操作类型文本
  const getOperationTypeText = (type) => {
    const textMap = {
      create: '创建',
      update: '更新',
      delete: '删除',
      assign: '分配',
      approve: '批准',
      reject: '退回',
      status_change: '状态变更',
      payment: '收款',
      export: '导出'
    };
    return textMap[type] || type;
  };

  // 操作对象类型文本
  const getTargetTypeText = (type) => {
    const textMap = {
      order: '订单',
      task: '任务',
      client: '客户',
      payment: '收款记录',
      user: '用户',
      setting: '系统参数'
    };
    return textMap[type] || type;
  };

  // 格式化详情摘要
  const formatDetailsSummary = (details) => {
    if (!details) return '-';

    if (details.changes && details.changes.length > 0) {
      const firstChange = details.changes[0];
      const summary = `${firstChange.fieldName}: ${firstChange.oldValueText || firstChange.oldValue || '-'} → ${firstChange.newValueText || firstChange.newValue || '-'}`;

      if (details.changes.length > 1) {
        return `${summary} 等${details.changes.length}项变更`;
      }

      return summary;
    }

    if (details.remark) {
      return details.remark;
    }

    return JSON.stringify(details).substring(0, 50) + '...';
  };

  // 表格列
  const columns = [
    {
      title: '操作时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm:ss')
    },
    {
      title: '操作人',
      dataIndex: 'userName',
      key: 'userName',
      width: 120
    },
    {
      title: '操作类型',
      dataIndex: 'operationType',
      key: 'operationType',
      width: 120,
      render: (text) => (
        <Tag color={getOperationTypeColor(text)}>
          {getOperationTypeText(text)}
        </Tag>
      )
    },
    {
      title: '操作对象类型',
      dataIndex: 'targetType',
      key: 'targetType',
      width: 130,
      render: (text) => getTargetTypeText(text)
    },
    {
      title: '操作对象',
      dataIndex: 'targetName',
      key: 'targetName',
      width: 150,
      ellipsis: true,
      render: (text, record) => {
        if (text) {
          return (
            <Tooltip title={text}>
              <span>{text}</span>
            </Tooltip>
          );
        }
        return record.targetId ? `ID: ${record.targetId}` : '-';
      }
    },
    {
      title: '详情摘要',
      dataIndex: 'details',
      key: 'details',
      ellipsis: true,
      render: (details) => {
        const summary = formatDetailsSummary(details);
        return (
          <Tooltip title={summary}>
            <span>{summary}</span>
          </Tooltip>
        );
      }
    },
    {
      title: 'IP地址',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 140
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => onViewDetail(record)}
        >
          详情
        </Button>
      )
    }
  ];

  return (
    <Table
      dataSource={logs}
      columns={columns}
      loading={loading}
      pagination={{
        ...pagination,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total) => `共 ${total} 条记录`
      }}
      onChange={onTableChange}
      rowKey="logId"
      scroll={{ x: 1200 }}
      size="small"
    />
  );
}

export default LogTable;

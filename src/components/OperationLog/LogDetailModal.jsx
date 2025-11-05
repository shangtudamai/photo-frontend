/**
 * 日志详情弹窗
 */

import React from 'react';
import { Modal, Descriptions, Tag, Empty, Table } from 'antd';
import dayjs from 'dayjs';

function LogDetailModal({ visible, log, onClose }) {
  if (!log) {
    return null;
  }

  // 操作类型颜色
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

  // 变更记录表格列
  const changeColumns = [
    {
      title: '字段名称',
      dataIndex: 'fieldName',
      key: 'fieldName',
      width: 150
    },
    {
      title: '旧值',
      dataIndex: 'oldValue',
      key: 'oldValue',
      render: (text, record) => {
        const value = record.oldValueText || text || '-';
        return <span style={{ color: '#999' }}>{value}</span>;
      }
    },
    {
      title: '',
      key: 'arrow',
      width: 50,
      align: 'center',
      render: () => '→'
    },
    {
      title: '新值',
      dataIndex: 'newValue',
      key: 'newValue',
      render: (text, record) => {
        const value = record.newValueText || text || '-';
        return <span style={{ color: '#1890ff', fontWeight: 500 }}>{value}</span>;
      }
    }
  ];

  // 渲染操作详情
  const renderDetails = () => {
    if (!log.details) {
      return <Empty description="无详情信息" />;
    }

    // 如果有 changes 字段，显示变更表格
    if (log.details.changes && log.details.changes.length > 0) {
      return (
        <div>
          <h4 style={{ marginBottom: 16 }}>字段变更记录</h4>
          <Table
            dataSource={log.details.changes}
            columns={changeColumns}
            pagination={false}
            size="small"
            rowKey="field"
          />
          {log.details.remark && (
            <div style={{ marginTop: 16 }}>
              <strong>备注：</strong>
              <span style={{ marginLeft: 8 }}>{log.details.remark}</span>
            </div>
          )}
        </div>
      );
    }

    // 否则显示JSON格式
    return (
      <pre style={{
        background: '#f5f5f5',
        padding: 16,
        borderRadius: 4,
        overflow: 'auto',
        maxHeight: 300
      }}>
        {JSON.stringify(log.details, null, 2)}
      </pre>
    );
  };

  return (
    <Modal
      title="操作日志详情"
      open={visible}
      onCancel={onClose}
      width={800}
      footer={null}
      destroyOnClose
    >
      <Descriptions column={2} bordered size="small">
        <Descriptions.Item label="日志ID">
          {log.logId}
        </Descriptions.Item>

        <Descriptions.Item label="操作时间">
          {dayjs(log.createdAt).format('YYYY-MM-DD HH:mm:ss')}
        </Descriptions.Item>

        <Descriptions.Item label="操作人">
          {log.userName} (ID: {log.userId})
        </Descriptions.Item>

        <Descriptions.Item label="IP地址">
          {log.ipAddress}
        </Descriptions.Item>

        <Descriptions.Item label="操作类型">
          <Tag color={getOperationTypeColor(log.operationType)}>
            {getOperationTypeText(log.operationType)}
          </Tag>
        </Descriptions.Item>

        <Descriptions.Item label="操作对象类型">
          {getTargetTypeText(log.targetType)}
        </Descriptions.Item>

        <Descriptions.Item label="操作对象ID">
          {log.targetId || '-'}
        </Descriptions.Item>

        <Descriptions.Item label="操作对象名称">
          {log.targetName || '-'}
        </Descriptions.Item>

        {log.userAgent && (
          <Descriptions.Item label="浏览器信息" span={2}>
            <div style={{
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {log.userAgent}
            </div>
          </Descriptions.Item>
        )}
      </Descriptions>

      <div style={{ marginTop: 24 }}>
        {renderDetails()}
      </div>
    </Modal>
  );
}

export default LogDetailModal;

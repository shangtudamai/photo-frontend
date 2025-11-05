import React from 'react';
import { Table, Tag, Button, Space, Modal, message, Tooltip } from 'antd';
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  CrownOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { deleteClient } from '../../services/clientService';
import dayjs from 'dayjs';
import './ClientTable.less';

/**
 * 客户表格组件
 */
const ClientTable = ({
  data,
  loading,
  pagination,
  onPageChange,
  onView,
  onEdit,
  onRefresh,
  currentUser
}) => {
  // 客户等级映射
  const clientLevelMap = {
    'normal': { text: '普通', color: 'default' },
    'vip': { text: 'VIP', color: 'gold', icon: <CrownOutlined /> }
  };

  // 检查是否有编辑权限
  const hasEditPermission = () => {
    if (!currentUser || !currentUser.roles) return false;
    return currentUser.roles.includes('admin') ||
           currentUser.roles.includes('client_manager');
  };

  // 检查是否是财务角色
  const isFinanceRole = () => {
    if (!currentUser || !currentUser.roles) return false;
    return currentUser.roles.includes('finance');
  };

  // 处理删除客户
  const handleDelete = (record) => {
    // 检查是否有历史订单
    if (record.orderCount > 0) {
      Modal.warning({
        title: '无法删除',
        content: `客户 ${record.clientName} 有 ${record.orderCount} 个历史订单，无法删除。`,
        okText: '我知道了'
      });
      return;
    }

    Modal.confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>确定要删除客户 <strong>{record.clientName}</strong> 吗？</p>
          <p style={{ color: '#ff4d4f' }}>
            删除后数据无法恢复，请谨慎操作！
          </p>
        </div>
      ),
      okText: '确认删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        try {
          const res = await deleteClient(record.clientId);

          if (res.code === 200) {
            message.success('客户删除成功');
            onRefresh();
          } else {
            message.error(res.message || '客户删除失败');
          }
        } catch (error) {
          console.error('客户删除失败:', error);
          message.error('客户删除失败');
        }
      }
    });
  };

  // 表格列定义
  const columns = [
    {
      title: '客户名称',
      dataIndex: 'clientName',
      key: 'clientName',
      width: 150,
      fixed: 'left',
      render: (text, record) => (
        <Space>
          <span style={{ fontWeight: 500 }}>{text}</span>
          {record.clientLevel === 'vip' && (
            <Tooltip title="VIP客户">
              <CrownOutlined style={{ color: '#faad14' }} />
            </Tooltip>
          )}
        </Space>
      )
    },
    {
      title: '联系人',
      dataIndex: 'contactPerson',
      key: 'contactPerson',
      width: 100
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone',
      width: 130
    },
    {
      title: '客户等级',
      dataIndex: 'clientLevel',
      key: 'clientLevel',
      width: 100,
      render: (level) => {
        const levelInfo = clientLevelMap[level];
        return (
          <Tag color={levelInfo?.color} icon={levelInfo?.icon}>
            {levelInfo?.text}
          </Tag>
        );
      }
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 200,
      render: (tags) => (
        <>
          {tags && tags.length > 0 ? (
            tags.slice(0, 3).map(tag => (
              <Tag key={tag.tagId} color="blue">
                {tag.tagName}
              </Tag>
            ))
          ) : (
            <span style={{ color: '#999' }}>-</span>
          )}
          {tags && tags.length > 3 && (
            <Tag>+{tags.length - 3}</Tag>
          )}
        </>
      )
    },
    {
      title: '订单数',
      dataIndex: 'orderCount',
      key: 'orderCount',
      width: 90,
      align: 'center',
      sorter: true
    },
    {
      title: '累计消费',
      dataIndex: 'totalConsumption',
      key: 'totalConsumption',
      width: 120,
      align: 'right',
      sorter: true,
      render: (amount) => (
        <span style={{ fontWeight: 600, color: '#1890ff' }}>
          ¥{amount?.toLocaleString() || '0.00'}
        </span>
      )
    }
  ];

  // 财务角色额外显示未收款金额
  if (isFinanceRole()) {
    columns.push({
      title: '未收款金额',
      dataIndex: 'unpaidAmount',
      key: 'unpaidAmount',
      width: 120,
      align: 'right',
      render: (amount) => (
        <span style={{ fontWeight: 600, color: '#ff4d4f' }}>
          ¥{amount?.toLocaleString() || '0.00'}
        </span>
      )
    });
  }

  columns.push(
    {
      title: '最近下单',
      dataIndex: 'lastOrderTime',
      key: 'lastOrderTime',
      width: 120,
      sorter: true,
      render: (time) => time ? dayjs(time).format('YYYY-MM-DD') : '-'
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: hasEditPermission() ? 200 : 100,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => onView(record)}
          >
            详情
          </Button>

          {hasEditPermission() && (
            <>
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEdit(record)}
              >
                编辑
              </Button>
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(record)}
              >
                删除
              </Button>
            </>
          )}
        </Space>
      )
    }
  );

  // 处理表格变化
  const handleTableChange = (pagination, filters, sorter) => {
    const params = {
      page: pagination.current,
      limit: pagination.pageSize
    };

    // 处理排序
    if (sorter.field) {
      params.sort_by = sorter.field;
      params.sort_order = sorter.order === 'ascend' ? 'asc' : 'desc';
    }

    onPageChange(params);
  };

  return (
    <div className="client-table">
      <Table
        columns={columns}
        dataSource={data}
        rowKey="clientId"
        loading={loading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
          pageSizeOptions: ['15', '30', '50', '100']
        }}
        onChange={handleTableChange}
        scroll={{ x: 1400 }}
        size="middle"
      />
    </div>
  );
};

export default ClientTable;

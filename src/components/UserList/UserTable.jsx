import React from 'react';
import { Table, Tag, Button, Space, Switch, Modal, message } from 'antd';
import {
  EditOutlined,
  KeyOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { toggleUserStatus } from '../../services/userService';
import dayjs from 'dayjs';
import './UserTable.less';

/**
 * 用户表格组件
 */
const UserTable = ({
  data,
  loading,
  pagination,
  onPageChange,
  onEdit,
  onResetPassword,
  onRefresh
}) => {
  // 角色映射
  const roleMap = {
    'admin': { text: '管理员', color: 'red' },
    'client_manager': { text: '客户对接人', color: 'blue' },
    'photographer': { text: '摄影师', color: 'green' },
    'retoucher': { text: '后期', color: 'purple' },
    'finance': { text: '财务', color: 'orange' }
  };

  // 处理启用/禁用状态切换
  const handleStatusToggle = (record, checked) => {
    const action = checked ? '启用' : '禁用';

    Modal.confirm({
      title: `确认${action}用户`,
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>确定要{action}用户 <strong>{record.realName}</strong> ({record.username}) 吗？</p>
          {!checked && (
            <p style={{ color: '#ff4d4f' }}>
              禁用后该用户将无法登录系统，请谨慎操作！
            </p>
          )}
        </div>
      ),
      okText: '确认',
      cancelText: '取消',
      okButtonProps: {
        danger: !checked
      },
      onOk: async () => {
        try {
          const res = await toggleUserStatus(record.userId, checked ? 'active' : 'disabled');

          if (res.code === 200) {
            message.success(`用户${action}成功`);
            onRefresh();
          } else {
            message.error(res.message || `用户${action}失败`);
          }
        } catch (error) {
          console.error('状态切换失败:', error);
          message.error(`用户${action}失败`);
        }
      }
    });
  };

  // 表格列定义
  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 120,
      fixed: 'left',
      render: (text) => (
        <span style={{ fontWeight: 500 }}>{text}</span>
      )
    },
    {
      title: '姓名',
      dataIndex: 'realName',
      key: 'realName',
      width: 120
    },
    {
      title: '角色',
      dataIndex: 'roles',
      key: 'roles',
      width: 150,
      render: (roles) => (
        <>
          {roles?.map(role => (
            <Tag key={role} color={roleMap[role]?.color}>
              {roleMap[role]?.text || role}
            </Tag>
          ))}
        </>
      )
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 180,
      ellipsis: true,
      render: (text) => text || '-'
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
      render: (text) => text || '-'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status, record) => (
        <Switch
          checked={status === 'active'}
          checkedChildren="启用"
          unCheckedChildren="禁用"
          onChange={(checked) => handleStatusToggle(record, checked)}
        />
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 160,
      sorter: true,
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 180,
      render: (_, record) => (
        <Space size="small">
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
            icon={<KeyOutlined />}
            onClick={() => onResetPassword(record)}
          >
            重置密码
          </Button>
        </Space>
      )
    }
  ];

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
    <div className="user-table">
      <Table
        columns={columns}
        dataSource={data}
        rowKey="userId"
        loading={loading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
          pageSizeOptions: ['10', '20', '50', '100']
        }}
        onChange={handleTableChange}
        scroll={{ x: 1200 }}
        size="middle"
      />
    </div>
  );
};

export default UserTable;

import React from 'react';
import { Table, Tag, Button, Space, Dropdown, Menu, Popconfirm, message } from 'antd';
import {
  EyeOutlined,
  EditOutlined,
  MoreOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { updateOrderStatus } from '../../services/orderService';
import dayjs from 'dayjs';
import './OrderTable.less';

/**
 * 订单表格组件
 */
const OrderTable = ({
  data,
  loading,
  pagination,
  onPageChange,
  onView,
  onEdit,
  onRefresh,
  currentUser
}) => {
  // 订单状态映射
  const orderStatusMap = {
    1: { text: '待确认', color: 'default' },
    2: { text: '进行中', color: 'processing' },
    3: { text: '待验收', color: 'warning' },
    4: { text: '已完成', color: 'success' },
    5: { text: '已取消', color: 'error' }
  };

  // 支付状态映射
  const paymentStatusMap = {
    1: { text: '未付款', color: 'error' },
    2: { text: '部分付款', color: 'warning' },
    3: { text: '已付清', color: 'success' }
  };

  // 优先级映射
  const priorityMap = {
    1: { text: '最高', color: 'red' },
    2: { text: '高', color: 'orange' },
    3: { text: '普通', color: 'default' },
    4: { text: '低', color: 'blue' },
    5: { text: '最低', color: 'gray' }
  };

  // 检查用户权限
  const hasEditPermission = () => {
    if (!currentUser || !currentUser.roles) return false;
    return currentUser.roles.includes('admin') ||
           currentUser.roles.includes('client_manager');
  };

  // 获取可切换的状态选项
  const getAvailableStatuses = (currentStatus) => {
    const statusFlow = {
      1: [2, 5], // 待确认 -> 进行中/已取消
      2: [3, 5], // 进行中 -> 待验收/已取消
      3: [2, 4, 5], // 待验收 -> 进行中/已完成/已取消
      4: [], // 已完成（不可变更）
      5: [] // 已取消（不可变更）
    };

    return statusFlow[currentStatus] || [];
  };

  // 处理状态更新
  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const res = await updateOrderStatus(orderId, newStatus);
      if (res.code === 200) {
        message.success('状态更新成功');
        onRefresh();
      } else {
        message.error(res.message || '状态更新失败');
      }
    } catch (error) {
      console.error('状态更新失败:', error);
      message.error('状态更新失败');
    }
  };

  // 生成状态更新菜单
  const getStatusMenu = (record) => {
    const availableStatuses = getAvailableStatuses(record.orderStatus);

    if (availableStatuses.length === 0) {
      return null;
    }

    return (
      <Menu>
        {availableStatuses.map(status => (
          <Menu.Item
            key={status}
            onClick={() => {
              Popconfirm.confirm({
                title: '确认更新状态',
                content: `确定将订单状态更新为"${orderStatusMap[status].text}"吗？`,
                onOk: () => handleStatusUpdate(record.orderId, status)
              });
            }}
          >
            <Tag color={orderStatusMap[status].color}>
              {orderStatusMap[status].text}
            </Tag>
          </Menu.Item>
        ))}
      </Menu>
    );
  };

  // 表格列定义
  const columns = [
    {
      title: '订单编号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 150,
      fixed: 'left',
      render: (text) => (
        <span className="order-no">{text}</span>
      )
    },
    {
      title: '客户名称',
      dataIndex: 'clientName',
      key: 'clientName',
      width: 150,
      ellipsis: true
    },
    {
      title: '创建日期',
      dataIndex: 'orderDate',
      key: 'orderDate',
      width: 120,
      sorter: true,
      render: (date) => dayjs(date).format('YYYY-MM-DD')
    },
    {
      title: '交付日期',
      dataIndex: 'deliveryDate',
      key: 'deliveryDate',
      width: 120,
      render: (date) => date ? dayjs(date).format('YYYY-MM-DD') : '-'
    },
    {
      title: '总件数',
      dataIndex: 'totalPieces',
      key: 'totalPieces',
      width: 100,
      align: 'center'
    },
    {
      title: '最终金额',
      dataIndex: 'finalAmount',
      key: 'finalAmount',
      width: 120,
      align: 'right',
      sorter: true,
      render: (amount) => (
        <span className="amount">¥{amount?.toLocaleString() || '0.00'}</span>
      )
    },
    {
      title: '订单状态',
      dataIndex: 'orderStatus',
      key: 'orderStatus',
      width: 100,
      filters: [
        { text: '待确认', value: 1 },
        { text: '进行中', value: 2 },
        { text: '待验收', value: 3 },
        { text: '已完成', value: 4 },
        { text: '已取消', value: 5 }
      ],
      render: (status) => (
        <Tag color={orderStatusMap[status]?.color}>
          {orderStatusMap[status]?.text}
        </Tag>
      )
    },
    {
      title: '支付状态',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      width: 100,
      filters: [
        { text: '未付款', value: 1 },
        { text: '部分付款', value: 2 },
        { text: '已付清', value: 3 }
      ],
      render: (status) => (
        <Tag color={paymentStatusMap[status]?.color}>
          {paymentStatusMap[status]?.text}
        </Tag>
      )
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (priority) => (
        <Tag color={priorityMap[priority]?.color} size="small">
          {priorityMap[priority]?.text}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 180,
      render: (_, record) => {
        const statusMenu = getStatusMenu(record);

        return (
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
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEdit(record)}
              >
                编辑
              </Button>
            )}

            {hasEditPermission() && statusMenu && (
              <Dropdown overlay={statusMenu} trigger={['click']}>
                <Button
                  type="link"
                  size="small"
                  icon={<CheckCircleOutlined />}
                >
                  更新状态
                </Button>
              </Dropdown>
            )}
          </Space>
        );
      }
    }
  ];

  // 处理表格变化
  const handleTableChange = (pagination, filters, sorter) => {
    const params = {
      page: pagination.current,
      limit: pagination.pageSize,
      ...filters
    };

    // 处理排序
    if (sorter.field) {
      params.sort_by = sorter.field;
      params.sort_order = sorter.order === 'ascend' ? 'asc' : 'desc';
    }

    onPageChange(params);
  };

  return (
    <div className="order-table">
      <Table
        columns={columns}
        dataSource={data}
        rowKey="orderId"
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

export default OrderTable;

import React from 'react';
import { Card, Table, Tag, Progress } from 'antd';
import { useNavigate } from 'react-router-dom';
import './RecentOrders.less';

/**
 * 最近订单列表组件
 */
const RecentOrders = ({ orders, loading }) => {
  const navigate = useNavigate();

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

  // 计算订单进度
  const calculateProgress = (order) => {
    if (!order.totalPieces) return 0;

    // 根据订单状态返回进度
    switch (order.orderStatus) {
      case 1:
        return 0;
      case 2:
        // 进行中，根据已完成件数计算
        return Math.round((order.completedPieces || 0) / order.totalPieces * 100);
      case 3:
        return 95;
      case 4:
        return 100;
      case 5:
        return 0;
      default:
        return 0;
    }
  };

  const columns = [
    {
      title: '订单编号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 150,
      render: (text) => <span className="order-no">{text}</span>
    },
    {
      title: '客户名称',
      dataIndex: 'clientName',
      key: 'clientName',
      width: 120,
      ellipsis: true
    },
    {
      title: '总件数',
      dataIndex: 'totalPieces',
      key: 'totalPieces',
      width: 80,
      align: 'center'
    },
    {
      title: '订单状态',
      dataIndex: 'orderStatus',
      key: 'orderStatus',
      width: 100,
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
      render: (status) => (
        <Tag color={paymentStatusMap[status]?.color}>
          {paymentStatusMap[status]?.text}
        </Tag>
      )
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      width: 150,
      render: (_, record) => {
        const progress = calculateProgress(record);
        return (
          <Progress
            percent={progress}
            size="small"
            status={progress === 100 ? 'success' : 'active'}
          />
        );
      }
    }
  ];

  const handleRowClick = (record) => {
    navigate(`/orders/${record.orderId}`);
  };

  return (
    <Card
      title="最近订单"
      className="recent-orders-card"
      extra={<a onClick={() => navigate('/orders')}>查看全部</a>}
    >
      <Table
        columns={columns}
        dataSource={orders}
        loading={loading}
        rowKey="orderId"
        pagination={false}
        size="small"
        onRow={(record) => ({
          onClick: () => handleRowClick(record),
          className: 'clickable-row'
        })}
        scroll={{ y: 400 }}
      />
    </Card>
  );
};

export default RecentOrders;

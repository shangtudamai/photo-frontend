import React from 'react';
import { Card, Row, Col, Statistic } from 'antd';
import {
  ShoppingOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './StatisticsCards.less';

/**
 * 仪表盘统计卡片组件
 */
const StatisticsCards = ({ stats, loading }) => {
  const navigate = useNavigate();

  const cardData = [
    {
      title: '今日订单数',
      value: stats?.todayOrders || 0,
      prefix: <ShoppingOutlined />,
      valueStyle: { color: '#3f8600' },
      onClick: () => navigate('/orders?filter=today'),
      loading
    },
    {
      title: '总待处理任务',
      value: stats?.pendingTasks || 0,
      prefix: <CheckCircleOutlined />,
      valueStyle: { color: '#1890ff' },
      onClick: () => navigate('/tasks?status=pending'),
      loading
    },
    {
      title: '今日营收',
      value: stats?.todayRevenue || 0,
      prefix: <DollarOutlined />,
      suffix: '元',
      precision: 2,
      valueStyle: { color: '#cf1322' },
      onClick: () => navigate('/finance/revenue?date=today'),
      loading
    },
    {
      title: '逾期未收款',
      value: stats?.overduePayments || 0,
      prefix: <ExclamationCircleOutlined />,
      suffix: '元',
      precision: 2,
      valueStyle: { color: '#fa8c16' },
      onClick: () => navigate('/finance/overdue'),
      loading
    }
  ];

  return (
    <Row gutter={16} className="statistics-cards">
      {cardData.map((card, index) => (
        <Col xs={24} sm={12} lg={6} key={index}>
          <Card
            hoverable
            className="stat-card"
            onClick={card.onClick}
            loading={card.loading}
          >
            <Statistic
              title={card.title}
              value={card.value}
              prefix={card.prefix}
              suffix={card.suffix}
              precision={card.precision}
              valueStyle={card.valueStyle}
            />
          </Card>
        </Col>
      ))}
    </Row>
  );
};

export default StatisticsCards;

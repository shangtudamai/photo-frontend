import React, { useState, useEffect } from 'react';
import { Row, Col, Input, Select, DatePicker, Button, Space } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { getClientList } from '../../services/orderService';
import dayjs from 'dayjs';
import './OrderSearchBar.less';

const { RangePicker } = DatePicker;
const { Option } = Select;

/**
 * 订单搜索栏组件
 */
const OrderSearchBar = ({ onSearch, onReset, onCreate, hasCreatePermission }) => {
  const [searchParams, setSearchParams] = useState({
    keyword: '',
    orderStatus: undefined,
    paymentStatus: undefined,
    clientId: undefined,
    dateRange: null
  });
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);

  // 订单状态选项
  const orderStatusOptions = [
    { label: '全部', value: undefined },
    { label: '待确认', value: 1 },
    { label: '进行中', value: 2 },
    { label: '待验收', value: 3 },
    { label: '已完成', value: 4 },
    { label: '已取消', value: 5 }
  ];

  // 支付状态选项
  const paymentStatusOptions = [
    { label: '全部', value: undefined },
    { label: '未付款', value: 1 },
    { label: '部分付款', value: 2 },
    { label: '已付清', value: 3 }
  ];

  // 加载客户列表
  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await getClientList();
      if (res.code === 200) {
        setClients(res.data.data || []);
      }
    } catch (error) {
      console.error('获取客户列表失败:', error);
    }
  };

  // 处理搜索参数变化
  const handleChange = (field, value) => {
    setSearchParams(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 处理搜索
  const handleSearch = () => {
    setLoading(true);

    // 构建查询参数
    const params = {
      keyword: searchParams.keyword || undefined,
      order_status: searchParams.orderStatus,
      payment_status: searchParams.paymentStatus,
      client_id: searchParams.clientId,
      start_date: searchParams.dateRange?.[0]?.format('YYYY-MM-DD'),
      end_date: searchParams.dateRange?.[1]?.format('YYYY-MM-DD')
    };

    // 移除undefined的参数
    Object.keys(params).forEach(key => {
      if (params[key] === undefined) {
        delete params[key];
      }
    });

    onSearch(params);
    setLoading(false);
  };

  // 处理重置
  const handleReset = () => {
    setSearchParams({
      keyword: '',
      orderStatus: undefined,
      paymentStatus: undefined,
      clientId: undefined,
      dateRange: null
    });
    onReset();
  };

  // 回车搜索
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="order-search-bar">
      <Row gutter={[16, 16]}>
        {/* 第一行：关键词搜索和创建按钮 */}
        <Col xs={24} sm={24} md={16} lg={12}>
          <Input
            placeholder="搜索订单编号、客户名称"
            prefix={<SearchOutlined />}
            value={searchParams.keyword}
            onChange={(e) => handleChange('keyword', e.target.value)}
            onPressEnter={handleKeyPress}
            allowClear
          />
        </Col>
        <Col xs={24} sm={24} md={8} lg={12} className="search-actions">
          <Space>
            {hasCreatePermission && (
              <Button type="primary" onClick={onCreate}>
                创建订单
              </Button>
            )}
          </Space>
        </Col>

        {/* 第二行：筛选条件 */}
        <Col xs={24} sm={12} md={6}>
          <Select
            placeholder="订单状态"
            value={searchParams.orderStatus}
            onChange={(value) => handleChange('orderStatus', value)}
            style={{ width: '100%' }}
            allowClear
          >
            {orderStatusOptions.map(option => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Select
            placeholder="支付状态"
            value={searchParams.paymentStatus}
            onChange={(value) => handleChange('paymentStatus', value)}
            style={{ width: '100%' }}
            allowClear
          >
            {paymentStatusOptions.map(option => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Select
            showSearch
            placeholder="选择客户"
            value={searchParams.clientId}
            onChange={(value) => handleChange('clientId', value)}
            style={{ width: '100%' }}
            filterOption={(input, option) =>
              option.children.toLowerCase().includes(input.toLowerCase())
            }
            allowClear
          >
            {clients.map(client => (
              <Option key={client.clientId} value={client.clientId}>
                {client.clientName}
              </Option>
            ))}
          </Select>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <RangePicker
            value={searchParams.dateRange}
            onChange={(dates) => handleChange('dateRange', dates)}
            style={{ width: '100%' }}
            placeholder={['开始日期', '结束日期']}
            format="YYYY-MM-DD"
          />
        </Col>

        {/* 搜索和重置按钮 */}
        <Col xs={24}>
          <Space>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={handleSearch}
              loading={loading}
            >
              搜索
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleReset}
            >
              重置
            </Button>
          </Space>
        </Col>
      </Row>
    </div>
  );
};

export default OrderSearchBar;

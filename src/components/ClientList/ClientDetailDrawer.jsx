import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Tabs,
  Descriptions,
  Tag,
  Button,
  Space,
  Table,
  Empty,
  Card,
  Select,
  message,
  Modal,
  Spin
} from 'antd';
import {
  EditOutlined,
  PlusOutlined,
  DeleteOutlined,
  CrownOutlined
} from '@ant-design/icons';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  getClientDetail,
  getClientOrders,
  getClientConsumptionTrend,
  getClientTags,
  updateClientTags,
  createClientTag
} from '../../services/clientService';
import dayjs from 'dayjs';
import './ClientDetailDrawer.less';

const { TabPane } = Tabs;
const { Option } = Select;

/**
 * 客户详情抽屉组件
 */
const ClientDetailDrawer = ({ visible, clientId, onClose, onEdit, currentUser }) => {
  const [loading, setLoading] = useState(false);
  const [clientDetail, setClientDetail] = useState(null);
  const [orders, setOrders] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [activeTab, setActiveTab] = useState('1');

  // 客户等级映射
  const clientLevelMap = {
    'normal': { text: '普通', color: 'default' },
    'vip': { text: 'VIP', color: 'gold', icon: <CrownOutlined /> }
  };

  // 订单状态映射
  const orderStatusMap = {
    1: { text: '待确认', color: 'default' },
    2: { text: '进行中', color: 'processing' },
    3: { text: '待验收', color: 'warning' },
    4: { text: '已完成', color: 'success' },
    5: { text: '已取消', color: 'error' }
  };

  // 检查是否有编辑权限
  const hasEditPermission = () => {
    if (!currentUser || !currentUser.roles) return false;
    return currentUser.roles.includes('admin') ||
           currentUser.roles.includes('client_manager');
  };

  useEffect(() => {
    if (visible && clientId) {
      fetchClientDetail();
      fetchClientOrders();
      fetchConsumptionTrend();
      fetchAvailableTags();
    }
  }, [visible, clientId]);

  // 获取客户详情
  const fetchClientDetail = async () => {
    setLoading(true);
    try {
      const res = await getClientDetail(clientId);
      if (res.code === 200) {
        setClientDetail(res.data);
        setSelectedTags(res.data.tags?.map(tag => tag.tagId) || []);
      }
    } catch (error) {
      console.error('获取客户详情失败:', error);
      message.error('获取客户详情失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取历史订单
  const fetchClientOrders = async () => {
    try {
      const res = await getClientOrders(clientId, {
        page: 1,
        limit: 20,
        sort_by: 'orderDate',
        sort_order: 'desc'
      });
      if (res.code === 200) {
        setOrders(res.data.data || []);
      }
    } catch (error) {
      console.error('获取历史订单失败:', error);
    }
  };

  // 获取消费趋势
  const fetchConsumptionTrend = async () => {
    try {
      const res = await getClientConsumptionTrend(clientId, {
        months: 12
      });
      if (res.code === 200) {
        setTrendData(res.data || []);
      }
    } catch (error) {
      console.error('获取消费趋势失败:', error);
    }
  };

  // 获取可用标签
  const fetchAvailableTags = async () => {
    try {
      const res = await getClientTags();
      if (res.code === 200) {
        setAvailableTags(res.data || []);
      }
    } catch (error) {
      console.error('获取标签列表失败:', error);
    }
  };

  // 处理标签变更
  const handleTagsChange = async (newTags) => {
    try {
      const res = await updateClientTags(clientId, newTags);
      if (res.code === 200) {
        message.success('标签更新成功');
        setSelectedTags(newTags);
        fetchClientDetail(); // 刷新客户详情
      } else {
        message.error(res.message || '标签更新失败');
      }
    } catch (error) {
      console.error('标签更新失败:', error);
      message.error('标签更新失败');
    }
  };

  // 处理创建新标签
  const handleCreateTag = async (tagName) => {
    try {
      const res = await createClientTag({ tagName });
      if (res.code === 200 || res.code === 201) {
        message.success('标签创建成功');
        await fetchAvailableTags();
        // 自动添加到当前客户
        const newTagId = res.data.tagId;
        await handleTagsChange([...selectedTags, newTagId]);
      } else {
        message.error(res.message || '标签创建失败');
      }
    } catch (error) {
      console.error('创建标签失败:', error);
      message.error('创建标签失败');
    }
  };

  // 渲染基础信息标签页
  const renderBasicInfoTab = () => (
    <div className="tab-content">
      <Card
        title="基本信息"
        size="small"
        extra={
          hasEditPermission() && (
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => onEdit(clientDetail)}
            >
              编辑
            </Button>
          )
        }
      >
        <Descriptions column={2} size="small">
          <Descriptions.Item label="客户名称">
            {clientDetail?.clientName}
          </Descriptions.Item>
          <Descriptions.Item label="客户等级">
            <Tag
              color={clientLevelMap[clientDetail?.clientLevel]?.color}
              icon={clientLevelMap[clientDetail?.clientLevel]?.icon}
            >
              {clientLevelMap[clientDetail?.clientLevel]?.text}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="联系人">
            {clientDetail?.contactPerson}
          </Descriptions.Item>
          <Descriptions.Item label="电话">
            {clientDetail?.phone}
          </Descriptions.Item>
          <Descriptions.Item label="邮箱">
            {clientDetail?.email || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="地址">
            {clientDetail?.address || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {dayjs(clientDetail?.createTime).format('YYYY-MM-DD HH:mm')}
          </Descriptions.Item>
          <Descriptions.Item label="最近下单">
            {clientDetail?.lastOrderTime ? dayjs(clientDetail.lastOrderTime).format('YYYY-MM-DD') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="备注" span={2}>
            {clientDetail?.remark || '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="统计信息" size="small" style={{ marginTop: 16 }}>
        <Descriptions column={3} size="small">
          <Descriptions.Item label="订单总数">
            <span style={{ fontSize: 18, fontWeight: 600, color: '#1890ff' }}>
              {clientDetail?.orderCount || 0}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="累计消费">
            <span style={{ fontSize: 18, fontWeight: 600, color: '#52c41a' }}>
              ¥{clientDetail?.totalConsumption?.toLocaleString() || '0.00'}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="未收款金额">
            <span style={{ fontSize: 18, fontWeight: 600, color: '#ff4d4f' }}>
              ¥{clientDetail?.unpaidAmount?.toLocaleString() || '0.00'}
            </span>
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );

  // 渲染标签管理标签页
  const renderTagsTab = () => (
    <div className="tab-content">
      <Card
        title="标签管理"
        size="small"
        extra={
          hasEditPermission() && (
            <span style={{ color: '#999', fontSize: 12 }}>
              可选择已有标签或输入新标签名称
            </span>
          )
        }
      >
        {hasEditPermission() ? (
          <Select
            mode="tags"
            placeholder="请选择或输入新标签"
            value={selectedTags}
            onChange={handleTagsChange}
            style={{ width: '100%' }}
            tokenSeparators={[',']}
            onSelect={(value) => {
              // 如果是新标签（字符串而非数字ID）
              if (typeof value === 'string') {
                handleCreateTag(value);
              }
            }}
          >
            {availableTags.map(tag => (
              <Option key={tag.tagId} value={tag.tagId}>
                {tag.tagName}
              </Option>
            ))}
          </Select>
        ) : (
          <div>
            {clientDetail?.tags && clientDetail.tags.length > 0 ? (
              clientDetail.tags.map(tag => (
                <Tag key={tag.tagId} color="blue" style={{ marginBottom: 8 }}>
                  {tag.tagName}
                </Tag>
              ))
            ) : (
              <Empty description="暂无标签" />
            )}
          </div>
        )}
      </Card>
    </div>
  );

  // 历史订单表格列
  const orderColumns = [
    {
      title: '订单编号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 150
    },
    {
      title: '订单金额',
      dataIndex: 'finalAmount',
      key: 'finalAmount',
      width: 120,
      align: 'right',
      render: (amount) => (
        <span style={{ fontWeight: 600, color: '#1890ff' }}>
          ¥{amount?.toLocaleString() || '0.00'}
        </span>
      )
    },
    {
      title: '状态',
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
      title: '下单时间',
      dataIndex: 'orderDate',
      key: 'orderDate',
      width: 120,
      render: (date) => dayjs(date).format('YYYY-MM-DD')
    }
  ];

  // 渲染历史订单标签页
  const renderOrdersTab = () => (
    <div className="tab-content">
      <Table
        columns={orderColumns}
        dataSource={orders}
        rowKey="orderId"
        pagination={false}
        size="small"
        locale={{ emptyText: <Empty description="暂无订单" /> }}
      />
    </div>
  );

  // 渲染消费趋势标签页
  const renderTrendTab = () => (
    <div className="tab-content">
      <Card title="近12个月消费趋势" size="small">
        {trendData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="amount"
                name="消费金额(¥)"
                stroke="#1890ff"
                strokeWidth={2}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="orderCount"
                name="订单数量"
                stroke="#52c41a"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <Empty description="暂无数据" />
        )}
      </Card>
    </div>
  );

  return (
    <Drawer
      title="客户详情"
      placement="right"
      width={900}
      open={visible}
      onClose={onClose}
      destroyOnClose
      className="client-detail-drawer"
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
        </div>
      ) : (
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="基础信息" key="1">
            {renderBasicInfoTab()}
          </TabPane>
          <TabPane tab="标签管理" key="2">
            {renderTagsTab()}
          </TabPane>
          <TabPane tab="历史订单" key="3">
            {renderOrdersTab()}
          </TabPane>
          <TabPane tab="消费趋势" key="4">
            {renderTrendTab()}
          </TabPane>
        </Tabs>
      )}
    </Drawer>
  );
};

export default ClientDetailDrawer;

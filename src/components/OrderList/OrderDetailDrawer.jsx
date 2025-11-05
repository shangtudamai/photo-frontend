import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Tabs,
  Descriptions,
  Table,
  Tag,
  Button,
  Upload,
  message,
  Timeline,
  Progress,
  Space,
  Image,
  Modal,
  Form,
  InputNumber,
  Input,
  Select,
  Divider,
  Card,
  Empty
} from 'antd';
import {
  UploadOutlined,
  DownloadOutlined,
  DeleteOutlined,
  PlusOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import {
  getOrderDetail,
  getOrderTasks,
  getOrderPayments,
  getOrderAttachments,
  getOrderHistory,
  uploadOrderAttachment,
  deleteOrderAttachment,
  addPaymentRecord,
  updateTaskProgress
} from '../../services/orderService';
import dayjs from 'dayjs';
import './OrderDetailDrawer.less';

const { TabPane } = Tabs;
const { TextArea } = Input;

/**
 * 订单详情抽屉组件
 */
const OrderDetailDrawer = ({ visible, orderId, onClose, currentUser }) => {
  const [loading, setLoading] = useState(false);
  const [orderDetail, setOrderDetail] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [payments, setPayments] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('1');
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [progressModalVisible, setProgressModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [paymentForm] = Form.useForm();
  const [progressForm] = Form.useForm();

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

  // 任务状态映射
  const taskStatusMap = {
    1: { text: '待开始', color: 'default' },
    2: { text: '进行中', color: 'processing' },
    3: { text: '已完成', color: 'success' },
    4: { text: '已暂停', color: 'warning' }
  };

  useEffect(() => {
    if (visible && orderId) {
      fetchOrderDetail();
      fetchOrderTasks();
      fetchOrderPayments();
      fetchOrderAttachments();
      fetchOrderHistory();
    }
  }, [visible, orderId]);

  // 获取订单详情
  const fetchOrderDetail = async () => {
    setLoading(true);
    try {
      const res = await getOrderDetail(orderId);
      if (res.code === 200) {
        setOrderDetail(res.data);
      }
    } catch (error) {
      console.error('获取订单详情失败:', error);
      message.error('获取订单详情失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取任务列表
  const fetchOrderTasks = async () => {
    try {
      const res = await getOrderTasks(orderId);
      if (res.code === 200) {
        setTasks(res.data || []);
      }
    } catch (error) {
      console.error('获取任务列表失败:', error);
    }
  };

  // 获取收款记录
  const fetchOrderPayments = async () => {
    try {
      const res = await getOrderPayments(orderId);
      if (res.code === 200) {
        setPayments(res.data || []);
      }
    } catch (error) {
      console.error('获取收款记录失败:', error);
    }
  };

  // 获取附件列表
  const fetchOrderAttachments = async () => {
    try {
      const res = await getOrderAttachments(orderId);
      if (res.code === 200) {
        setAttachments(res.data || []);
      }
    } catch (error) {
      console.error('获取附件列表失败:', error);
    }
  };

  // 获取历史记录
  const fetchOrderHistory = async () => {
    try {
      const res = await getOrderHistory(orderId);
      if (res.code === 200) {
        setHistory(res.data || []);
      }
    } catch (error) {
      console.error('获取历史记录失败:', error);
    }
  };

  // 处理文件上传
  const handleUpload = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await uploadOrderAttachment(orderId, formData);
      if (res.code === 200) {
        message.success('文件上传成功');
        fetchOrderAttachments();
      } else {
        message.error(res.message || '文件上传失败');
      }
    } catch (error) {
      console.error('文件上传失败:', error);
      message.error('文件上传失败');
    }

    return false; // 阻止自动上传
  };

  // 处理文件删除
  const handleDeleteAttachment = async (attachmentId) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该附件吗？',
      onOk: async () => {
        try {
          const res = await deleteOrderAttachment(orderId, attachmentId);
          if (res.code === 200) {
            message.success('删除成功');
            fetchOrderAttachments();
          } else {
            message.error(res.message || '删除失败');
          }
        } catch (error) {
          console.error('删除失败:', error);
          message.error('删除失败');
        }
      }
    });
  };

  // 显示添加收款记录弹窗
  const showPaymentModal = () => {
    paymentForm.resetFields();
    setPaymentModalVisible(true);
  };

  // 处理添加收款记录
  const handleAddPayment = async () => {
    try {
      const values = await paymentForm.validateFields();
      const res = await addPaymentRecord(orderId, values);

      if (res.code === 200 || res.code === 201) {
        message.success('收款记录添加成功');
        setPaymentModalVisible(false);
        fetchOrderPayments();
        fetchOrderDetail(); // 刷新订单信息（支付状态可能变化）
      } else {
        message.error(res.message || '添加失败');
      }
    } catch (error) {
      console.error('添加收款记录失败:', error);
      message.error('添加失败');
    }
  };

  // 显示更新进度弹窗
  const showProgressModal = (task) => {
    setSelectedTask(task);
    progressForm.setFieldsValue({
      progress: task.progress,
      remark: ''
    });
    setProgressModalVisible(true);
  };

  // 处理更新任务进度
  const handleUpdateProgress = async () => {
    try {
      const values = await progressForm.validateFields();
      const res = await updateTaskProgress(orderId, selectedTask.taskId, values);

      if (res.code === 200) {
        message.success('进度更新成功');
        setProgressModalVisible(false);
        fetchOrderTasks();
        fetchOrderHistory();
      } else {
        message.error(res.message || '更新失败');
      }
    } catch (error) {
      console.error('更新进度失败:', error);
      message.error('更新失败');
    }
  };

  // 检查是否有财务权限
  const hasFinancePermission = () => {
    if (!currentUser || !currentUser.roles) return false;
    return currentUser.roles.includes('admin') ||
           currentUser.roles.includes('finance');
  };

  // 检查是否可以更新任务进度
  const canUpdateTaskProgress = (task) => {
    if (!currentUser || !currentUser.roles) return false;

    // 管理员可以更新所有任务
    if (currentUser.roles.includes('admin')) return true;

    // 任务负责人可以更新自己的任务
    return task.assigneeId === currentUser.userId;
  };

  // 产品明细表格列
  const productColumns = [
    {
      title: '效果类型',
      dataIndex: 'effectType',
      key: 'effectType'
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'center'
    },
    {
      title: '单价',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      align: 'right',
      render: (price) => `¥${price?.toFixed(2)}`
    },
    {
      title: '小计',
      key: 'subtotal',
      align: 'right',
      render: (_, record) => {
        const subtotal = (record.quantity || 0) * (record.unitPrice || 0);
        return `¥${subtotal.toFixed(2)}`;
      }
    }
  ];

  // 任务列表表格列
  const taskColumns = [
    {
      title: '任务类型',
      dataIndex: 'taskType',
      key: 'taskType',
      render: (type) => {
        const typeMap = {
          'photography': '摄影',
          'retouching': '修图',
          'review': '审核'
        };
        return typeMap[type] || type;
      }
    },
    {
      title: '负责人',
      dataIndex: 'assigneeName',
      key: 'assigneeName'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={taskStatusMap[status]?.color}>
          {taskStatusMap[status]?.text}
        </Tag>
      )
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      render: (progress) => (
        <Progress percent={progress || 0} size="small" style={{ minWidth: 100 }} />
      )
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (time) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'
    },
    {
      title: '完成时间',
      dataIndex: 'endTime',
      key: 'endTime',
      render: (time) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        canUpdateTaskProgress(record) && record.status !== 3 && (
          <Button
            type="link"
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => showProgressModal(record)}
          >
            更新进度
          </Button>
        )
      )
    }
  ];

  // 收款记录表格列
  const paymentColumns = [
    {
      title: '收款日期',
      dataIndex: 'paymentDate',
      key: 'paymentDate',
      render: (date) => dayjs(date).format('YYYY-MM-DD')
    },
    {
      title: '收款金额',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      render: (amount) => (
        <span style={{ color: '#52c41a', fontWeight: 600 }}>
          ¥{amount?.toLocaleString()}
        </span>
      )
    },
    {
      title: '收款方式',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      render: (method) => {
        const methodMap = {
          'cash': '现金',
          'bank_transfer': '银行转账',
          'alipay': '支付宝',
          'wechat': '微信',
          'other': '其他'
        };
        return methodMap[method] || method;
      }
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      ellipsis: true,
      render: (text) => text || '-'
    },
    {
      title: '记录人',
      dataIndex: 'createdBy',
      key: 'createdBy'
    }
  ];

  // 渲染订单基本信息
  const renderBasicInfo = () => (
    <Card title="基本信息" size="small" style={{ marginBottom: 16 }}>
      <Descriptions column={2} size="small">
        <Descriptions.Item label="订单编号">
          {orderDetail?.orderNo}
        </Descriptions.Item>
        <Descriptions.Item label="客户名称">
          {orderDetail?.clientName}
        </Descriptions.Item>
        <Descriptions.Item label="创建日期">
          {dayjs(orderDetail?.orderDate).format('YYYY-MM-DD')}
        </Descriptions.Item>
        <Descriptions.Item label="交付日期">
          {orderDetail?.deliveryDate ? dayjs(orderDetail.deliveryDate).format('YYYY-MM-DD') : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="拍摄类型">
          {orderDetail?.shootingType || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="优先级">
          <Tag color={
            orderDetail?.priority === 1 ? 'red' :
            orderDetail?.priority === 2 ? 'orange' :
            orderDetail?.priority === 4 ? 'blue' :
            orderDetail?.priority === 5 ? 'gray' : 'default'
          }>
            {orderDetail?.priority === 1 ? '最高' :
             orderDetail?.priority === 2 ? '高' :
             orderDetail?.priority === 3 ? '普通' :
             orderDetail?.priority === 4 ? '低' : '最低'}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="订单状态">
          <Tag color={orderStatusMap[orderDetail?.orderStatus]?.color}>
            {orderStatusMap[orderDetail?.orderStatus]?.text}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="支付状态">
          <Tag color={paymentStatusMap[orderDetail?.paymentStatus]?.color}>
            {paymentStatusMap[orderDetail?.paymentStatus]?.text}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="备注" span={2}>
          {orderDetail?.remark || '-'}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );

  // 渲染金额信息
  const renderAmountInfo = () => (
    <Card title="金额信息" size="small" style={{ marginBottom: 16 }}>
      <Descriptions column={2} size="small">
        <Descriptions.Item label="基础金额">
          ¥{orderDetail?.baseAmount?.toLocaleString() || '0.00'}
        </Descriptions.Item>
        <Descriptions.Item label="折扣金额">
          -¥{orderDetail?.discountAmount?.toLocaleString() || '0.00'}
        </Descriptions.Item>
        <Descriptions.Item label="额外费用">
          ¥{orderDetail?.extraAmount?.toLocaleString() || '0.00'}
        </Descriptions.Item>
        <Descriptions.Item label="最终金额">
          <span style={{ fontSize: 16, fontWeight: 600, color: '#1890ff' }}>
            ¥{orderDetail?.finalAmount?.toLocaleString() || '0.00'}
          </span>
        </Descriptions.Item>
        <Descriptions.Item label="已收款">
          <span style={{ fontSize: 16, fontWeight: 600, color: '#52c41a' }}>
            ¥{orderDetail?.paidAmount?.toLocaleString() || '0.00'}
          </span>
        </Descriptions.Item>
        <Descriptions.Item label="待收款">
          <span style={{ fontSize: 16, fontWeight: 600, color: '#ff4d4f' }}>
            ¥{((orderDetail?.finalAmount || 0) - (orderDetail?.paidAmount || 0)).toLocaleString()}
          </span>
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );

  // 渲染产品明细标签页
  const renderProductTab = () => (
    <div className="tab-content">
      {renderBasicInfo()}
      {renderAmountInfo()}
      <Card title="产品明细" size="small">
        <Table
          columns={productColumns}
          dataSource={orderDetail?.items || []}
          rowKey="itemId"
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  );

  // 渲染任务标签页
  const renderTaskTab = () => (
    <div className="tab-content">
      <Table
        columns={taskColumns}
        dataSource={tasks}
        rowKey="taskId"
        loading={loading}
        pagination={false}
        size="small"
        locale={{ emptyText: <Empty description="暂无任务" /> }}
      />
    </div>
  );

  // 渲染收款记录标签页
  const renderPaymentTab = () => (
    <div className="tab-content">
      {hasFinancePermission() && (
        <div style={{ marginBottom: 16, textAlign: 'right' }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={showPaymentModal}
          >
            添加收款记录
          </Button>
        </div>
      )}

      <Card size="small" style={{ marginBottom: 16 }}>
        <Descriptions column={3} size="small">
          <Descriptions.Item label="订单总额">
            <span style={{ fontSize: 16, fontWeight: 600 }}>
              ¥{orderDetail?.finalAmount?.toLocaleString() || '0.00'}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="已收款">
            <span style={{ fontSize: 16, fontWeight: 600, color: '#52c41a' }}>
              ¥{orderDetail?.paidAmount?.toLocaleString() || '0.00'}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="待收款">
            <span style={{ fontSize: 16, fontWeight: 600, color: '#ff4d4f' }}>
              ¥{((orderDetail?.finalAmount || 0) - (orderDetail?.paidAmount || 0)).toLocaleString()}
            </span>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Table
        columns={paymentColumns}
        dataSource={payments}
        rowKey="paymentId"
        pagination={false}
        size="small"
        locale={{ emptyText: <Empty description="暂无收款记录" /> }}
      />
    </div>
  );

  // 渲染附件标签页
  const renderAttachmentTab = () => (
    <div className="tab-content">
      <div style={{ marginBottom: 16 }}>
        <Upload
          beforeUpload={handleUpload}
          showUploadList={false}
          multiple
        >
          <Button icon={<UploadOutlined />}>上传文件</Button>
        </Upload>
        <span style={{ marginLeft: 16, color: '#999', fontSize: 12 }}>
          支持上传图片、文档等文件，单个文件不超过10MB
        </span>
      </div>

      <Divider />

      {attachments.length > 0 ? (
        <div className="attachment-list">
          {attachments.map((file) => (
            <Card key={file.attachmentId} size="small" style={{ marginBottom: 12 }}>
              <div className="attachment-item">
                <div className="attachment-info">
                  {file.fileType?.startsWith('image/') ? (
                    <Image
                      src={file.fileUrl}
                      alt={file.fileName}
                      width={80}
                      height={80}
                      style={{ objectFit: 'cover', borderRadius: 4 }}
                    />
                  ) : (
                    <div className="file-icon">
                      <DownloadOutlined style={{ fontSize: 32, color: '#1890ff' }} />
                    </div>
                  )}
                  <div className="file-details">
                    <div className="file-name">{file.fileName}</div>
                    <div className="file-meta">
                      <span>大小: {(file.fileSize / 1024).toFixed(2)} KB</span>
                      <span style={{ margin: '0 8px' }}>|</span>
                      <span>上传时间: {dayjs(file.uploadTime).format('YYYY-MM-DD HH:mm')}</span>
                      <span style={{ margin: '0 8px' }}>|</span>
                      <span>上传人: {file.uploaderName}</span>
                    </div>
                  </div>
                </div>
                <Space>
                  <Button
                    type="link"
                    icon={<DownloadOutlined />}
                    href={file.fileUrl}
                    download={file.fileName}
                  >
                    下载
                  </Button>
                  <Button
                    type="link"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDeleteAttachment(file.attachmentId)}
                  >
                    删除
                  </Button>
                </Space>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Empty description="暂无附件" />
      )}
    </div>
  );

  // 渲染历史记录标签页
  const renderHistoryTab = () => (
    <div className="tab-content">
      {history.length > 0 ? (
        <Timeline mode="left">
          {history.map((item, index) => (
            <Timeline.Item
              key={index}
              label={dayjs(item.operationTime).format('YYYY-MM-DD HH:mm:ss')}
              color={item.operationType === 'create' ? 'green' : 'blue'}
            >
              <Card size="small">
                <div className="history-item">
                  <div className="history-header">
                    <span className="operator">{item.operatorName}</span>
                    <span className="operation">{item.operationDesc}</span>
                  </div>
                  {item.details && (
                    <div className="history-details">
                      {item.details}
                    </div>
                  )}
                </div>
              </Card>
            </Timeline.Item>
          ))}
        </Timeline>
      ) : (
        <Empty description="暂无历史记录" />
      )}
    </div>
  );

  return (
    <>
      <Drawer
        title="订单详情"
        placement="right"
        width={800}
        open={visible}
        onClose={onClose}
        destroyOnClose
        className="order-detail-drawer"
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="产品明细" key="1">
            {renderProductTab()}
          </TabPane>
          <TabPane tab="任务分配" key="2">
            {renderTaskTab()}
          </TabPane>
          <TabPane tab="收款记录" key="3">
            {renderPaymentTab()}
          </TabPane>
          <TabPane tab="附件文件" key="4">
            {renderAttachmentTab()}
          </TabPane>
          <TabPane tab="操作历史" key="5">
            {renderHistoryTab()}
          </TabPane>
        </Tabs>
      </Drawer>

      {/* 添加收款记录弹窗 */}
      <Modal
        title="添加收款记录"
        open={paymentModalVisible}
        onOk={handleAddPayment}
        onCancel={() => setPaymentModalVisible(false)}
        width={500}
      >
        <Form form={paymentForm} layout="vertical">
          <Form.Item
            name="amount"
            label="收款金额"
            rules={[
              { required: true, message: '请输入收款金额' },
              { type: 'number', min: 0.01, message: '金额必须大于0' }
            ]}
          >
            <InputNumber
              min={0.01}
              precision={2}
              style={{ width: '100%' }}
              addonBefore="¥"
              placeholder="请输入收款金额"
            />
          </Form.Item>

          <Form.Item
            name="paymentMethod"
            label="收款方式"
            rules={[{ required: true, message: '请选择收款方式' }]}
          >
            <Select placeholder="请选择收款方式">
              <Select.Option value="cash">现金</Select.Option>
              <Select.Option value="bank_transfer">银行转账</Select.Option>
              <Select.Option value="alipay">支付宝</Select.Option>
              <Select.Option value="wechat">微信</Select.Option>
              <Select.Option value="other">其他</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="remark"
            label="备注"
          >
            <TextArea rows={3} placeholder="备注信息（可选）" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 更新任务进度弹窗 */}
      <Modal
        title="更新任务进度"
        open={progressModalVisible}
        onOk={handleUpdateProgress}
        onCancel={() => setProgressModalVisible(false)}
        width={500}
      >
        <Form form={progressForm} layout="vertical">
          <Form.Item
            name="progress"
            label="进度百分比"
            rules={[
              { required: true, message: '请输入进度' },
              { type: 'number', min: 0, max: 100, message: '进度范围为0-100' }
            ]}
          >
            <InputNumber
              min={0}
              max={100}
              style={{ width: '100%' }}
              addonAfter="%"
              placeholder="请输入进度"
            />
          </Form.Item>

          <Form.Item
            name="remark"
            label="进度说明"
          >
            <TextArea rows={3} placeholder="说明当前进度情况（可选）" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default OrderDetailDrawer;

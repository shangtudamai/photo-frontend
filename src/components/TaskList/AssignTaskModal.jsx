import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Select,
  DatePicker,
  Input,
  message,
  Alert,
  Space,
  Checkbox,
  Spin,
  Card,
  Descriptions
} from 'antd';
import {
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';
import {
  createTask,
  getOrderListForTask,
  getEmployeeList,
  checkEmployeeCapacity
} from '../../services/taskService';
import dayjs from 'dayjs';
import './AssignTaskModal.less';

const { Option } = Select;
const { TextArea } = Input;

/**
 * 分配任务弹窗组件
 */
const AssignTaskModal = ({ visible, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [capacityCheck, setCapacityCheck] = useState(null);
  const [checkingCapacity, setCheckingCapacity] = useState(false);
  const [forceAssign, setForceAssign] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    if (visible) {
      fetchOrders();
      fetchEmployees();
      resetForm();
    }
  }, [visible]);

  // 获取订单列表（只获取进行中的订单）
  const fetchOrders = async () => {
    try {
      const res = await getOrderListForTask({
        order_status: 2, // 只获取进行中的订单
        page: 1,
        limit: 100
      });
      if (res.code === 200) {
        setOrders(res.data.data || []);
      }
    } catch (error) {
      console.error('获取订单列表失败:', error);
    }
  };

  // 获取员工列表
  const fetchEmployees = async () => {
    try {
      const res = await getEmployeeList({
        page: 1,
        limit: 100,
        status: 'active' // 只获取在职员工
      });
      if (res.code === 200) {
        setEmployees(res.data.data || []);
      }
    } catch (error) {
      console.error('获取员工列表失败:', error);
    }
  };

  // 重置表单
  const resetForm = () => {
    form.resetFields();
    setCapacityCheck(null);
    setForceAssign(false);
    setSelectedOrder(null);
  };

  // 处理订单选择
  const handleOrderSelect = (orderId) => {
    const order = orders.find(o => o.orderId === orderId);
    setSelectedOrder(order);
  };

  // 处理员工选择或截止日期变化 - 检查产能
  const handleCapacityCheck = async () => {
    const employeeId = form.getFieldValue('assigneeId');
    const deadline = form.getFieldValue('deadline');

    if (!employeeId || !deadline) {
      setCapacityCheck(null);
      return;
    }

    setCheckingCapacity(true);
    try {
      const res = await checkEmployeeCapacity(
        employeeId,
        deadline.format('YYYY-MM-DD HH:mm:ss')
      );

      if (res.code === 200) {
        setCapacityCheck(res.data);
      }
    } catch (error) {
      console.error('产能检查失败:', error);
      message.error('产能检查失败');
    } finally {
      setCheckingCapacity(false);
    }
  };

  // 渲染产能检查结果
  const renderCapacityAlert = () => {
    if (!capacityCheck) return null;

    const { status, currentLoad, maxLoad, availableSlots, message: msg } = capacityCheck;

    let type = 'success';
    let icon = <CheckCircleOutlined />;
    let description = msg;

    if (status === 'overload') {
      type = 'error';
      icon = <ExclamationCircleOutlined />;
    } else if (status === 'warning') {
      type = 'warning';
      icon = <WarningOutlined />;
    }

    return (
      <Alert
        message="产能检查结果"
        description={
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>{description}</div>
            <Descriptions size="small" column={2}>
              <Descriptions.Item label="当前负载">
                {currentLoad} / {maxLoad}
              </Descriptions.Item>
              <Descriptions.Item label="可用槽位">
                {availableSlots}
              </Descriptions.Item>
            </Descriptions>
            {status === 'overload' && (
              <Checkbox
                checked={forceAssign}
                onChange={(e) => setForceAssign(e.target.checked)}
              >
                强制分配（需管理员确认）
              </Checkbox>
            )}
          </Space>
        }
        type={type}
        icon={icon}
        showIcon
        style={{ marginTop: 16 }}
      />
    );
  };

  // 处理表单提交
  const handleSubmit = async () => {
    try {
      // 如果产能超载且未勾选强制分配，则阻止提交
      if (capacityCheck?.status === 'overload' && !forceAssign) {
        message.warning('员工产能不足，请勾选强制分配或选择其他员工');
        return;
      }

      const values = await form.validateFields();
      setLoading(true);

      const taskData = {
        orderId: values.orderId,
        taskType: values.taskType,
        assigneeId: values.assigneeId,
        deadline: values.deadline.format('YYYY-MM-DD HH:mm:ss'),
        description: values.description,
        forceAssign: forceAssign
      };

      const res = await createTask(taskData);

      if (res.code === 200 || res.code === 201) {
        message.success('任务分配成功');
        onSuccess();
        handleCancel();
      } else {
        message.error(res.message || '任务分配失败');
      }
    } catch (error) {
      console.error('任务分配失败:', error);
      message.error('任务分配失败，请检查表单');
    } finally {
      setLoading(false);
    }
  };

  // 处理取消
  const handleCancel = () => {
    resetForm();
    onCancel();
  };

  // 根据任务类型筛选员工
  const getFilteredEmployees = () => {
    const taskType = form.getFieldValue('taskType');
    if (!taskType) return employees;

    // 根据任务类型筛选对应角色的员工
    const roleMap = {
      'photography': ['photographer'],
      'retouching': ['retoucher']
    };

    const allowedRoles = roleMap[taskType] || [];
    return employees.filter(emp =>
      emp.roles?.some(role => allowedRoles.includes(role))
    );
  };

  return (
    <Modal
      title="分配任务"
      open={visible}
      onCancel={handleCancel}
      onOk={handleSubmit}
      width={700}
      confirmLoading={loading}
      destroyOnClose
      maskClosable={false}
      className="assign-task-modal"
    >
      <Form
        form={form}
        layout="vertical"
      >
        {/* 订单选择 */}
        <Form.Item
          name="orderId"
          label="关联订单"
          rules={[{ required: true, message: '请选择关联订单' }]}
        >
          <Select
            showSearch
            placeholder="选择订单"
            onChange={handleOrderSelect}
            filterOption={(input, option) =>
              option.children.toLowerCase().includes(input.toLowerCase())
            }
          >
            {orders.map(order => (
              <Option key={order.orderId} value={order.orderId}>
                {order.orderNo} - {order.clientName}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* 显示订单信息 */}
        {selectedOrder && (
          <Card size="small" style={{ marginBottom: 16, background: '#fafafa' }}>
            <Descriptions size="small" column={2}>
              <Descriptions.Item label="客户">
                {selectedOrder.clientName}
              </Descriptions.Item>
              <Descriptions.Item label="订单金额">
                ¥{selectedOrder.finalAmount?.toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="交付日期">
                {selectedOrder.deliveryDate ? dayjs(selectedOrder.deliveryDate).format('YYYY-MM-DD') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="总件数">
                {selectedOrder.totalPieces || 0}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        )}

        {/* 任务类型 */}
        <Form.Item
          name="taskType"
          label="任务类型"
          rules={[{ required: true, message: '请选择任务类型' }]}
        >
          <Select
            placeholder="选择任务类型"
            onChange={() => {
              // 任务类型变化时，清空负责人选择和产能检查结果
              form.setFieldsValue({ assigneeId: undefined });
              setCapacityCheck(null);
            }}
          >
            <Option value="photography">拍摄</Option>
            <Option value="retouching">后期</Option>
          </Select>
        </Form.Item>

        {/* 负责人 */}
        <Form.Item
          name="assigneeId"
          label="负责人"
          rules={[{ required: true, message: '请选择负责人' }]}
        >
          <Select
            showSearch
            placeholder="选择负责人"
            onChange={handleCapacityCheck}
            filterOption={(input, option) =>
              option.children.toLowerCase().includes(input.toLowerCase())
            }
            disabled={!form.getFieldValue('taskType')}
          >
            {getFilteredEmployees().map(emp => (
              <Option key={emp.employeeId} value={emp.employeeId}>
                {emp.employeeName} - {emp.department || '未分配部门'}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* 截止日期 */}
        <Form.Item
          name="deadline"
          label="截止日期"
          rules={[{ required: true, message: '请选择截止日期' }]}
        >
          <DatePicker
            showTime
            format="YYYY-MM-DD HH:mm"
            placeholder="选择截止日期"
            style={{ width: '100%' }}
            disabledDate={(current) => {
              // 不能选择过去的日期
              return current && current < dayjs().startOf('day');
            }}
            onChange={handleCapacityCheck}
          />
        </Form.Item>

        {/* 任务描述 */}
        <Form.Item
          name="description"
          label="任务描述"
        >
          <TextArea
            rows={4}
            placeholder="请输入任务描述、注意事项等"
          />
        </Form.Item>

        {/* 产能检查结果 */}
        {checkingCapacity ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Spin tip="正在检查产能..." />
          </div>
        ) : (
          renderCapacityAlert()
        )}
      </Form>
    </Modal>
  );
};

export default AssignTaskModal;

import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Radio,
  Input,
  message,
  Alert,
  Space
} from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { returnTask } from '../../services/taskService';

const { TextArea } = Input;

/**
 * 任务退回弹窗组件
 */
const ReturnTaskModal = ({ visible, task, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [returnType, setReturnType] = useState('reshoot');

  useEffect(() => {
    if (visible && task) {
      // 根据任务类型设置默认退回类型
      const defaultType = task.taskType === 'photography' ? 'reshoot' : 'retouch';
      setReturnType(defaultType);
      form.setFieldsValue({
        returnType: defaultType,
        reason: ''
      });
    }
  }, [visible, task, form]);

  // 处理退回类型变化
  const handleReturnTypeChange = (e) => {
    setReturnType(e.target.value);
  };

  // 处理表单提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const res = await returnTask(task.taskId, {
        returnType: values.returnType,
        reason: values.reason
      });

      if (res.code === 200) {
        message.success('任务退回成功');
        onSuccess();
        handleCancel();
      } else {
        message.error(res.message || '任务退回失败');
      }
    } catch (error) {
      console.error('任务退回失败:', error);
      message.error('任务退回失败，请检查表单');
    } finally {
      setLoading(false);
    }
  };

  // 处理取消
  const handleCancel = () => {
    form.resetFields();
    setReturnType('reshoot');
    onCancel();
  };

  return (
    <Modal
      title={
        <Space>
          <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
          <span>退回任务</span>
        </Space>
      }
      open={visible}
      onCancel={handleCancel}
      onOk={handleSubmit}
      width={600}
      confirmLoading={loading}
      destroyOnClose
      maskClosable={false}
      okText="确认退回"
      okButtonProps={{ danger: true }}
    >
      {task && (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* 警告提示 */}
          <Alert
            message="重要提示"
            description="退回任务后，该任务将被标记为"已退回"状态，负责人会收到通知。请谨慎操作并详细说明退回原因。"
            type="warning"
            showIcon
          />

          {/* 任务信息 */}
          <Alert
            message="任务信息"
            description={
              <div>
                <p><strong>订单编号：</strong>{task.orderNo}</p>
                <p><strong>任务类型：</strong>
                  {task.taskType === 'photography' ? '拍摄' : '后期'}
                </p>
                <p><strong>负责人：</strong>{task.assigneeName}</p>
                <p><strong>当前进度：</strong>{task.progress || 0}%</p>
              </div>
            }
            type="info"
            showIcon
          />

          <Form form={form} layout="vertical">
            {/* 退回类型 */}
            <Form.Item
              name="returnType"
              label="退回类型"
              rules={[{ required: true, message: '请选择退回类型' }]}
            >
              <Radio.Group onChange={handleReturnTypeChange}>
                <Space direction="vertical">
                  <Radio value="reshoot">
                    重拍
                    <span style={{ color: '#999', marginLeft: 8 }}>
                      (要求重新拍摄，适用于拍摄质量不合格)
                    </span>
                  </Radio>
                  <Radio value="retouch">
                    重修
                    <span style={{ color: '#999', marginLeft: 8 }}>
                      (要求重新修图，适用于后期效果不满意)
                    </span>
                  </Radio>
                  <Radio value="supplement">
                    补拍/补修
                    <span style={{ color: '#999', marginLeft: 8 }}>
                      (要求补充拍摄或修改部分内容)
                    </span>
                  </Radio>
                </Space>
              </Radio.Group>
            </Form.Item>

            {/* 退回原因 */}
            <Form.Item
              name="reason"
              label="退回原因"
              rules={[
                { required: true, message: '请输入退回原因' },
                { min: 10, message: '请详细说明退回原因（至少10个字）' }
              ]}
            >
              <TextArea
                rows={6}
                placeholder="请详细说明退回原因，包括：&#10;1. 具体不满意的地方&#10;2. 需要改进的方向&#10;3. 预期效果要求&#10;&#10;详细的说明有助于负责人更好地完成任务"
              />
            </Form.Item>
          </Form>

          {/* 退回影响说明 */}
          <Alert
            message="退回影响"
            description={
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li>任务状态将更新为"已退回"</li>
                <li>任务进度将重置为0%</li>
                <li>负责人将收到退回通知</li>
                <li>截止日期可能需要重新协商</li>
                <li>关联订单的进度可能会受到影响</li>
              </ul>
            }
            type="error"
            showIcon
          />
        </Space>
      )}
    </Modal>
  );
};

export default ReturnTaskModal;

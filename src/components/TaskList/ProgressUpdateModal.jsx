import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Slider,
  Input,
  message,
  Alert,
  Space,
  Progress
} from 'antd';
import { updateTaskProgress } from '../../services/taskService';

const { TextArea } = Input;

/**
 * 进度更新弹窗组件
 */
const ProgressUpdateModal = ({ visible, task, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (visible && task) {
      form.setFieldsValue({
        progress: task.progress || 0,
        remark: ''
      });
      setProgress(task.progress || 0);
    }
  }, [visible, task, form]);

  // 处理进度变化
  const handleProgressChange = (value) => {
    setProgress(value);
    form.setFieldsValue({ progress: value });
  };

  // 处理表单提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const res = await updateTaskProgress(task.taskId, {
        progress: values.progress,
        remark: values.remark
      });

      if (res.code === 200) {
        message.success('进度更新成功');

        // 如果进度达到100%，提示任务已自动标记为完成
        if (values.progress === 100) {
          message.info('任务已自动标记为已完成');
        }

        onSuccess();
        handleCancel();
      } else {
        message.error(res.message || '进度更新失败');
      }
    } catch (error) {
      console.error('进度更新失败:', error);
      message.error('进度更新失败，请检查表单');
    } finally {
      setLoading(false);
    }
  };

  // 处理取消
  const handleCancel = () => {
    form.resetFields();
    setProgress(0);
    onCancel();
  };

  // 获取进度提示信息
  const getProgressTip = () => {
    if (progress === 0) {
      return '任务尚未开始';
    } else if (progress < 30) {
      return '任务刚刚起步';
    } else if (progress < 60) {
      return '任务进行中';
    } else if (progress < 90) {
      return '任务接近完成';
    } else if (progress < 100) {
      return '任务即将完成';
    } else {
      return '任务已完成';
    }
  };

  // 进度标记
  const marks = {
    0: '0%',
    25: '25%',
    50: '50%',
    75: '75%',
    100: '100%'
  };

  return (
    <Modal
      title="更新任务进度"
      open={visible}
      onCancel={handleCancel}
      onOk={handleSubmit}
      width={600}
      confirmLoading={loading}
      destroyOnClose
      maskClosable={false}
    >
      {task && (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* 任务信息 */}
          <Alert
            message="任务信息"
            description={
              <div>
                <p><strong>订单编号：</strong>{task.orderNo}</p>
                <p><strong>任务类型：</strong>
                  {task.taskType === 'photography' ? '拍摄' : '后期'}
                </p>
                <p><strong>当前进度：</strong>{task.progress || 0}%</p>
              </div>
            }
            type="info"
            showIcon
          />

          <Form form={form} layout="vertical">
            {/* 进度滑块 */}
            <Form.Item
              name="progress"
              label="任务进度"
              rules={[{ required: true, message: '请设置任务进度' }]}
            >
              <div>
                <Slider
                  marks={marks}
                  step={1}
                  value={progress}
                  onChange={handleProgressChange}
                  tooltip={{
                    formatter: (value) => `${value}%`
                  }}
                />
                <div style={{ marginTop: 16, textAlign: 'center' }}>
                  <Progress
                    type="circle"
                    percent={progress}
                    width={120}
                    format={(percent) => (
                      <div>
                        <div style={{ fontSize: 24, fontWeight: 600 }}>
                          {percent}%
                        </div>
                        <div style={{ fontSize: 12, color: '#999' }}>
                          {getProgressTip()}
                        </div>
                      </div>
                    )}
                  />
                </div>
              </div>
            </Form.Item>

            {/* 进度说明 */}
            <Form.Item
              name="remark"
              label="进度说明"
              rules={[{ required: true, message: '请输入进度说明' }]}
            >
              <TextArea
                rows={4}
                placeholder="请详细说明当前进度情况、遇到的问题或需要的支持"
              />
            </Form.Item>
          </Form>

          {/* 进度100%提示 */}
          {progress === 100 && (
            <Alert
              message="提示"
              description="进度设置为100%后，任务状态将自动更新为"已完成""
              type="warning"
              showIcon
            />
          )}
        </Space>
      )}
    </Modal>
  );
};

export default ProgressUpdateModal;

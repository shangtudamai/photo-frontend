/**
 * MobileUpload 组件使用示例
 */

import React, { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import MobileUpload from '@/components/MobileUpload';
import axios from 'axios';

const TaskResultUploadExample = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  /**
   * 上传文件到服务器
   */
  const uploadFile = async (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('taskId', '123'); // 任务ID

    try {
      const response = await axios.post('/api/upload/task-result', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress?.(percentCompleted);
        },
      });

      return {
        url: response.data.data.url,
        fileId: response.data.data.fileId,
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || '上传失败');
    }
  };

  /**
   * 提交表单
   */
  const handleSubmit = async (values) => {
    console.log('表单数据:', values);

    // 检查是否有待上传的文件
    const readyFiles = values.images?.filter(f => f.status === 'ready') || [];
    if (readyFiles.length > 0) {
      message.warning('请先上传所有图片');
      return;
    }

    // 获取已上传的文件URL
    const uploadedUrls = values.images
      ?.filter(f => f.status === 'success')
      .map(f => f.url) || [];

    if (uploadedUrls.length === 0) {
      message.warning('请至少上传一张图片');
      return;
    }

    setLoading(true);
    try {
      await axios.post('/api/tasks/submit-result', {
        taskId: 123,
        description: values.description,
        images: uploadedUrls,
      });

      message.success('提交成功');
      form.resetFields();
    } catch (error) {
      message.error(error.response?.data?.message || '提交失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="task-result-upload-page" style={{ padding: 16 }}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        className="mobile-form"
      >
        <Form.Item
          label="成果说明"
          name="description"
          rules={[{ required: true, message: '请输入成果说明' }]}
        >
          <Input.TextArea
            rows={4}
            placeholder="请描述您的工作成果..."
            maxLength={500}
            showCount
          />
        </Form.Item>

        <Form.Item
          label="成果图片"
          name="images"
          rules={[
            {
              validator: (_, value) => {
                const uploadedFiles = value?.filter(f => f.status === 'success') || [];
                if (uploadedFiles.length === 0) {
                  return Promise.reject(new Error('请至少上传一张图片'));
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <MobileUpload
            maxCount={9}
            compress={true}
            compressQuality={0.8}
            onUpload={uploadFile}
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            block
            size="large"
            loading={loading}
            style={{ marginTop: 24 }}
          >
            提交成果
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default TaskResultUploadExample;

import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Form,
  Input,
  Select,
  Button,
  message,
  Space
} from 'antd';
import {
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';
import {
  createClient,
  updateClient,
  checkClientNameExists,
  getClientTags,
  createClientTag
} from '../../services/clientService';
import './ClientFormDrawer.less';

const { Option } = Select;
const { TextArea } = Input;

/**
 * 客户表单抽屉组件
 */
const ClientFormDrawer = ({ visible, editData, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [availableTags, setAvailableTags] = useState([]);

  const isEditMode = !!editData;

  // 客户等级选项
  const levelOptions = [
    { label: '普通客户', value: 'normal' },
    { label: 'VIP客户', value: 'vip' }
  ];

  useEffect(() => {
    if (visible) {
      fetchTags();
      if (isEditMode) {
        // 编辑模式：加载客户数据
        form.setFieldsValue({
          clientName: editData.clientName,
          contactPerson: editData.contactPerson,
          phone: editData.phone,
          email: editData.email,
          address: editData.address,
          clientLevel: editData.clientLevel,
          tags: editData.tags?.map(tag => tag.tagId) || [],
          remark: editData.remark
        });
      } else {
        // 新增模式：设置默认值
        form.setFieldsValue({
          clientLevel: 'normal'
        });
      }
    }
  }, [visible, editData, isEditMode, form]);

  // 获取标签列表
  const fetchTags = async () => {
    try {
      const res = await getClientTags();
      if (res.code === 200) {
        setAvailableTags(res.data || []);
      }
    } catch (error) {
      console.error('获取标签列表失败:', error);
    }
  };

  // 处理新标签添加
  const handleCreateTag = async (tagName) => {
    try {
      const res = await createClientTag({ tagName });
      if (res.code === 200 || res.code === 201) {
        message.success('标签创建成功');
        await fetchTags();
        return res.data.tagId;
      } else {
        message.error(res.message || '标签创建失败');
        return null;
      }
    } catch (error) {
      console.error('创建标签失败:', error);
      message.error('创建标签失败');
      return null;
    }
  };

  // 验证客户名称唯一性
  const validateClientName = async (_, value) => {
    if (!value) {
      return Promise.resolve();
    }

    // 编辑模式且名称未变更时不验证
    if (isEditMode && value === editData.clientName) {
      return Promise.resolve();
    }

    try {
      const res = await checkClientNameExists(value);
      if (res.code === 200) {
        if (res.data.exists) {
          return Promise.reject(new Error('该客户名称已存在'));
        }
        return Promise.resolve();
      }
      return Promise.resolve();
    } catch (error) {
      return Promise.resolve();
    }
  };

  // 验证邮箱格式
  const validateEmail = (_, value) => {
    if (!value) {
      return Promise.resolve();
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return Promise.reject(new Error('请输入正确的邮箱格式'));
    }
    return Promise.resolve();
  };

  // 验证手机号格式
  const validatePhone = (_, value) => {
    if (!value) {
      return Promise.reject(new Error('请输入电话号码'));
    }

    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(value)) {
      return Promise.reject(new Error('请输入正确的手机号格式'));
    }
    return Promise.resolve();
  };

  // 处理提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const clientData = {
        clientName: values.clientName,
        contactPerson: values.contactPerson,
        phone: values.phone,
        email: values.email,
        address: values.address,
        clientLevel: values.clientLevel,
        tags: values.tags || [],
        remark: values.remark
      };

      let res;
      if (isEditMode) {
        res = await updateClient(editData.clientId, clientData);
      } else {
        res = await createClient(clientData);
      }

      if (res.code === 200 || res.code === 201) {
        message.success(isEditMode ? '客户更新成功' : '客户创建成功');
        onSuccess();
        handleClose();
      } else {
        message.error(res.message || '操作失败');
      }
    } catch (error) {
      if (error.errorFields) {
        // 表单验证错误
        return;
      }
      console.error('操作失败:', error);
      message.error('操作失败，请检查表单');
    } finally {
      setLoading(false);
    }
  };

  // 关闭抽屉
  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Drawer
      title={isEditMode ? '编辑客户' : '新增客户'}
      placement="right"
      width={600}
      open={visible}
      onClose={handleClose}
      destroyOnClose
      className="client-form-drawer"
      footer={
        <Space style={{ float: 'right' }}>
          <Button onClick={handleClose}>取消</Button>
          <Button type="primary" onClick={handleSubmit} loading={loading}>
            {isEditMode ? '保存' : '创建'}
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
      >
        {/* 客户名称 */}
        <Form.Item
          name="clientName"
          label="客户名称"
          rules={[
            { required: true, message: '请输入客户名称' },
            { max: 50, message: '客户名称最多50个字符' },
            { validator: validateClientName }
          ]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="请输入客户名称"
          />
        </Form.Item>

        {/* 联系人 */}
        <Form.Item
          name="contactPerson"
          label="联系人"
          rules={[
            { required: true, message: '请输入联系人' },
            { max: 20, message: '联系人最多20个字符' }
          ]}
        >
          <Input placeholder="请输入联系人" />
        </Form.Item>

        {/* 电话 */}
        <Form.Item
          name="phone"
          label="电话"
          rules={[
            { validator: validatePhone }
          ]}
        >
          <Input
            prefix={<PhoneOutlined />}
            placeholder="请输入手机号"
          />
        </Form.Item>

        {/* 邮箱 */}
        <Form.Item
          name="email"
          label="邮箱"
          rules={[
            { validator: validateEmail }
          ]}
        >
          <Input
            prefix={<MailOutlined />}
            placeholder="请输入邮箱（选填）"
          />
        </Form.Item>

        {/* 地址 */}
        <Form.Item
          name="address"
          label="地址"
        >
          <Input
            prefix={<EnvironmentOutlined />}
            placeholder="请输入地址（选填）"
          />
        </Form.Item>

        {/* 客户等级 */}
        <Form.Item
          name="clientLevel"
          label="客户等级"
          rules={[
            { required: true, message: '请选择客户等级' }
          ]}
        >
          <Select placeholder="请选择客户等级">
            {levelOptions.map(option => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* 标签 */}
        <Form.Item
          name="tags"
          label="标签"
          tooltip="可选择已有标签或输入新标签名称后回车添加"
        >
          <Select
            mode="tags"
            placeholder="请选择或输入新标签"
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
        </Form.Item>

        {/* 备注 */}
        <Form.Item
          name="remark"
          label="备注"
        >
          <TextArea
            rows={4}
            placeholder="请输入备注信息（选填）"
            maxLength={200}
            showCount
          />
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default ClientFormDrawer;

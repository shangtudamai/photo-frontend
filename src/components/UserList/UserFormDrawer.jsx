import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Form,
  Input,
  Select,
  Button,
  message,
  Space,
  Alert,
  Divider
} from 'antd';
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  CopyOutlined
} from '@ant-design/icons';
import {
  createUser,
  updateUser,
  checkUsernameExists,
  generateRandomPassword
} from '../../services/userService';
import './UserFormDrawer.less';

const { Option } = Select;
const { TextArea } = Input;

/**
 * 用户表单抽屉组件
 */
const UserFormDrawer = ({ visible, editData, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const isEditMode = !!editData;

  // 角色选项
  const roleOptions = [
    { label: '管理员', value: 'admin' },
    { label: '客户对接人', value: 'client_manager' },
    { label: '摄影师', value: 'photographer' },
    { label: '后期', value: 'retoucher' },
    { label: '财务', value: 'finance' }
  ];

  useEffect(() => {
    if (visible) {
      if (isEditMode) {
        // 编辑模式：加载用户数据
        form.setFieldsValue({
          username: editData.username,
          realName: editData.realName,
          roles: editData.roles,
          email: editData.email,
          phone: editData.phone,
          remark: editData.remark
        });
        setGeneratedPassword('');
        setShowPassword(false);
      } else {
        // 新增模式：生成随机密码
        const password = generateRandomPassword(8);
        setGeneratedPassword(password);
        form.setFieldsValue({
          password: password
        });
        setShowPassword(true);
      }
    }
  }, [visible, editData, isEditMode, form]);

  // 重新生成密码
  const handleRegeneratePassword = () => {
    const password = generateRandomPassword(8);
    setGeneratedPassword(password);
    form.setFieldsValue({
      password: password
    });
  };

  // 复制密码
  const handleCopyPassword = () => {
    const password = form.getFieldValue('password');
    if (password) {
      navigator.clipboard.writeText(password).then(() => {
        message.success('密码已复制到剪贴板');
      }).catch(() => {
        message.error('复制失败，请手动复制');
      });
    }
  };

  // 验证用户名唯一性
  const validateUsername = async (_, value) => {
    if (!value) {
      return Promise.resolve();
    }

    // 编辑模式下不验证用户名
    if (isEditMode) {
      return Promise.resolve();
    }

    try {
      const res = await checkUsernameExists(value);
      if (res.code === 200) {
        if (res.data.exists) {
          return Promise.reject(new Error('该用户名已存在'));
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
      return Promise.resolve();
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

      const userData = {
        username: values.username,
        realName: values.realName,
        roles: values.roles,
        email: values.email,
        phone: values.phone,
        remark: values.remark
      };

      // 新增模式需要密码
      if (!isEditMode) {
        userData.password = values.password;
      }

      let res;
      if (isEditMode) {
        res = await updateUser(editData.userId, userData);
      } else {
        res = await createUser(userData);
      }

      if (res.code === 200 || res.code === 201) {
        message.success(isEditMode ? '用户更新成功' : '用户创建成功');

        // 如果是新增用户，显示密码提示
        if (!isEditMode) {
          Modal.info({
            title: '用户创建成功',
            content: (
              <div>
                <p>用户 <strong>{values.username}</strong> 已创建成功！</p>
                <p>初始密码：<strong style={{ color: '#1890ff' }}>{values.password}</strong></p>
                <p style={{ color: '#ff4d4f', marginTop: 16 }}>
                  请将密码告知用户，用户首次登录后建议修改密码。
                </p>
              </div>
            ),
            okText: '我知道了'
          });
        }

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
    setGeneratedPassword('');
    setShowPassword(false);
    onClose();
  };

  return (
    <Drawer
      title={isEditMode ? '编辑用户' : '新增用户'}
      placement="right"
      width={600}
      open={visible}
      onClose={handleClose}
      destroyOnClose
      className="user-form-drawer"
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
        {/* 用户名 */}
        <Form.Item
          name="username"
          label="用户名"
          rules={[
            { required: true, message: '请输入用户名' },
            { min: 3, message: '用户名至少3个字符' },
            { max: 20, message: '用户名最多20个字符' },
            { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线' },
            { validator: validateUsername }
          ]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="请输入用户名"
            disabled={isEditMode}
          />
        </Form.Item>

        {/* 姓名 */}
        <Form.Item
          name="realName"
          label="姓名"
          rules={[
            { required: true, message: '请输入姓名' },
            { max: 20, message: '姓名最多20个字符' }
          ]}
        >
          <Input placeholder="请输入姓名" />
        </Form.Item>

        {/* 密码（仅新增模式） */}
        {!isEditMode && (
          <>
            <Divider />
            <Alert
              message="初始密码"
              description={
                <div>
                  <p>系统已自动生成8位随机密码，请妥善保管并告知用户。</p>
                  <p style={{ color: '#999', fontSize: 12 }}>
                    用户首次登录后建议修改密码。
                  </p>
                </div>
              }
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Form.Item
              name="password"
              label="初始密码"
              rules={[
                { required: true, message: '请生成密码' }
              ]}
            >
              <Input
                prefix={<LockOutlined />}
                placeholder="密码"
                readOnly
                addonAfter={
                  <Space>
                    <Button
                      type="link"
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={handleCopyPassword}
                    >
                      复制
                    </Button>
                    <Button
                      type="link"
                      size="small"
                      onClick={handleRegeneratePassword}
                    >
                      重新生成
                    </Button>
                  </Space>
                }
              />
            </Form.Item>
            <Divider />
          </>
        )}

        {/* 角色 */}
        <Form.Item
          name="roles"
          label="角色"
          rules={[
            { required: true, message: '请选择至少一个角色' }
          ]}
        >
          <Select
            mode="multiple"
            placeholder="请选择角色"
            optionFilterProp="children"
          >
            {roleOptions.map(option => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
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
            placeholder="请输入邮箱"
          />
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

export default UserFormDrawer;

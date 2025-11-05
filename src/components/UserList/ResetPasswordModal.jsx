import React, { useState, useEffect } from 'react';
import {
  Modal,
  Alert,
  Space,
  Button,
  message,
  Descriptions,
  Input
} from 'antd';
import {
  CopyOutlined,
  KeyOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { resetUserPassword } from '../../services/userService';

/**
 * 重置密码弹窗组件
 */
const ResetPasswordModal = ({ visible, user, onCancel, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!visible) {
      setNewPassword('');
      setShowPassword(false);
    }
  }, [visible]);

  // 处理重置密码
  const handleResetPassword = async () => {
    setLoading(true);
    try {
      const res = await resetUserPassword(user.userId);

      if (res.code === 200) {
        // 获取新密码
        const password = res.data.password;
        setNewPassword(password);
        setShowPassword(true);
        message.success('密码重置成功');
        onSuccess();
      } else {
        message.error(res.message || '密码重置失败');
      }
    } catch (error) {
      console.error('密码重置失败:', error);
      message.error('密码重置失败');
    } finally {
      setLoading(false);
    }
  };

  // 复制密码
  const handleCopyPassword = () => {
    if (newPassword) {
      navigator.clipboard.writeText(newPassword).then(() => {
        message.success('密码已复制到剪贴板');
      }).catch(() => {
        message.error('复制失败，请手动复制');
      });
    }
  };

  // 处理关闭
  const handleClose = () => {
    setNewPassword('');
    setShowPassword(false);
    onCancel();
  };

  return (
    <Modal
      title={
        <Space>
          <KeyOutlined />
          <span>重置密码</span>
        </Space>
      }
      open={visible}
      onCancel={handleClose}
      footer={
        showPassword ? (
          <Space>
            <Button onClick={handleClose}>关闭</Button>
            <Button type="primary" icon={<CopyOutlined />} onClick={handleCopyPassword}>
              复制密码
            </Button>
          </Space>
        ) : (
          <Space>
            <Button onClick={handleClose}>取消</Button>
            <Button
              type="primary"
              danger
              onClick={handleResetPassword}
              loading={loading}
            >
              确认重置
            </Button>
          </Space>
        )
      }
      width={500}
      destroyOnClose
    >
      {user && (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* 用户信息 */}
          <Alert
            message="用户信息"
            description={
              <Descriptions size="small" column={1}>
                <Descriptions.Item label="用户名">
                  {user.username}
                </Descriptions.Item>
                <Descriptions.Item label="姓名">
                  {user.realName}
                </Descriptions.Item>
                <Descriptions.Item label="邮箱">
                  {user.email || '-'}
                </Descriptions.Item>
              </Descriptions>
            }
            type="info"
            showIcon
          />

          {/* 密码重置前警告 */}
          {!showPassword && (
            <Alert
              message="重要提示"
              description={
                <div>
                  <p>
                    <ExclamationCircleOutlined style={{ color: '#ff4d4f', marginRight: 4 }} />
                    重置密码后，该用户的旧密码将失效。
                  </p>
                  <p>系统将生成新的8位随机密码，请妥善保管并告知用户。</p>
                  <p style={{ color: '#ff4d4f', marginTop: 8 }}>
                    确定要重置用户 <strong>{user.realName}</strong> 的密码吗？
                  </p>
                </div>
              }
              type="warning"
              showIcon
            />
          )}

          {/* 新密码显示 */}
          {showPassword && (
            <Alert
              message="新密码"
              description={
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <p>密码已成功重置，新密码为：</p>
                    <Input
                      value={newPassword}
                      readOnly
                      size="large"
                      style={{
                        fontSize: 18,
                        fontWeight: 600,
                        color: '#1890ff',
                        textAlign: 'center'
                      }}
                      addonAfter={
                        <Button
                          type="link"
                          size="small"
                          icon={<CopyOutlined />}
                          onClick={handleCopyPassword}
                        >
                          复制
                        </Button>
                      }
                    />
                  </div>
                  <div style={{ marginTop: 16 }}>
                    <p style={{ color: '#ff4d4f', margin: 0 }}>
                      ⚠️ 请立即将新密码告知用户，关闭此窗口后将无法再次查看！
                    </p>
                    <p style={{ color: '#999', margin: '8px 0 0 0', fontSize: 12 }}>
                      建议用户首次登录后立即修改密码。
                    </p>
                  </div>
                </Space>
              }
              type="success"
              showIcon
            />
          )}
        </Space>
      )}
    </Modal>
  );
};

export default ResetPasswordModal;

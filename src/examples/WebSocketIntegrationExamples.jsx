/**
 * WebSocket 集成示例
 * 演示如何在应用中使用 WebSocket 功能
 */

// ========================================
// 示例 1: 在 App.jsx 中集成 WebSocketProvider
// ========================================

import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { WebSocketProvider } from './contexts/WebSocketContext';
import store from './store';
import AppRoutes from './routes';

function App() {
  return (
    <Provider store={store}>
      {/* WebSocketProvider 应该在 Redux Provider 内部 */}
      <WebSocketProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </WebSocketProvider>
    </Provider>
  );
}

export default App;

// ========================================
// 示例 2: 在订单列表中触发 WebSocket 推送
// ========================================

import React, { useState } from 'react';
import { Button, message } from 'antd';
import { updateOrderStatus } from '@/services/orderService';

function OrderList() {
  const [loading, setLoading] = useState(false);

  // 更新订单状态
  const handleUpdateStatus = async (orderId, newStatus) => {
    setLoading(true);
    try {
      // 调用 API 更新订单状态
      const res = await updateOrderStatus(orderId, {
        orderStatus: newStatus
      });

      if (res.code === 200) {
        message.success('订单状态更新成功');

        // 后端会自动通过 WebSocket 推送消息给相关用户
        // 无需前端手动处理

        // 刷新订单列表
        fetchOrders();
      } else {
        message.error(res.message || '更新失败');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      message.error('更新失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Button
        type="primary"
        loading={loading}
        onClick={() => handleUpdateStatus(123, 4)}
      >
        标记为已完成
      </Button>
    </div>
  );
}

// ========================================
// 示例 3: 在任务分配模态框中触发 WebSocket 推送
// ========================================

import React, { useState } from 'react';
import { Modal, Form, Select, message } from 'antd';
import { assignTask } from '@/services/taskService';

function AssignTaskModal({ visible, onClose, taskId, orderId }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const values = await form.validateFields();

      // 调用 API 分配任务
      const res = await assignTask(taskId, values);

      if (res.code === 200) {
        message.success('任务分配成功');

        // 后端会自动通过 WebSocket 推送消息给任务负责人和管理员
        // 负责人会收到"新任务分配给您"的通知

        onClose();
        form.resetFields();
      } else {
        message.error(res.message || '分配失败');
      }
    } catch (error) {
      console.error('Error assigning task:', error);
      message.error('分配失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="分配任务"
      open={visible}
      onOk={handleSubmit}
      onCancel={onClose}
      confirmLoading={loading}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="assigneeId"
          label="负责人"
          rules={[{ required: true, message: '请选择负责人' }]}
        >
          <Select placeholder="请选择负责人">
            {/* 员工选项 */}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
}

// ========================================
// 示例 4: 使用 WebSocketContext 获取连接状态
// ========================================

import React from 'react';
import { Badge } from 'antd';
import { useWebSocketContext } from '@/contexts/WebSocketContext';

function Header() {
  const { isConnected, isConnecting } = useWebSocketContext();

  return (
    <div className="header">
      <div className="ws-status">
        {isConnecting && (
          <Badge status="processing" text="连接中..." />
        )}
        {isConnected && (
          <Badge status="success" text="在线" />
        )}
        {!isConnecting && !isConnected && (
          <Badge status="error" text="离线" />
        )}
      </div>
    </div>
  );
}

// ========================================
// 示例 5: 在组件中手动发送 WebSocket 消息
// ========================================

import React from 'react';
import { Button } from 'antd';
import { useWebSocketContext } from '@/contexts/WebSocketContext';

function CustomComponent() {
  const { sendMessage, isConnected } = useWebSocketContext();

  const handleSendCustomMessage = () => {
    if (!isConnected) {
      console.warn('WebSocket is not connected');
      return;
    }

    // 发送自定义消息
    sendMessage({
      type: 'custom_message',
      payload: {
        message: 'Hello WebSocket!'
      }
    });
  };

  return (
    <Button onClick={handleSendCustomMessage} disabled={!isConnected}>
      发送自定义消息
    </Button>
  );
}

// ========================================
// 示例 6: 加入/离开房间（可选）
// ========================================

import React, { useEffect } from 'react';
import { useWebSocketContext } from '@/contexts/WebSocketContext';

function OrderDetailPage({ orderId }) {
  const { joinRoom, leaveRoom, isConnected } = useWebSocketContext();

  useEffect(() => {
    if (isConnected) {
      // 加入订单房间，接收该订单的实时更新
      joinRoom(`order_${orderId}`);

      return () => {
        // 离开订单房间
        leaveRoom(`order_${orderId}`);
      };
    }
  }, [orderId, isConnected, joinRoom, leaveRoom]);

  return (
    <div>
      <h1>订单详情 #{orderId}</h1>
      {/* 订单详情内容 */}
    </div>
  );
}

// ========================================
// 示例 7: 后端触发 WebSocket 推送
// ========================================

// 在后端 API 中调用 WebSocket 推送函数

// orderController.js
const { notifyOrderStatusChange } = require('../websocket/websocketServer');

// 更新订单状态
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { orderStatus } = req.body;
    const userId = req.user.userId;

    // 1. 获取旧订单数据
    const oldOrder = await Order.findById(orderId);

    // 2. 更新订单状态
    await Order.update(orderId, { orderStatus });

    // 3. 获取新订单数据
    const newOrder = await Order.findById(orderId);

    // 4. 确定需要推送的用户
    const affectedUserIds = [
      oldOrder.createdBy, // 订单创建人
      // 订单相关任务的负责人
      // ...可以从数据库查询
    ];

    // 5. 触发 WebSocket 推送
    notifyOrderStatusChange(orderId, {
      orderNo: newOrder.orderNo,
      oldStatus: oldOrder.orderStatus,
      newStatus: newOrder.orderStatus,
      clientName: newOrder.clientName,
      updatedBy: req.user.userName,
      updatedAt: new Date()
    }, affectedUserIds);

    res.json({
      code: 200,
      message: '订单状态更新成功'
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      code: 500,
      message: '更新失败'
    });
  }
};

// ========================================
// 示例 8: 自定义通知样式
// ========================================

import { notification } from 'antd';
import { BellOutlined } from '@ant-design/icons';

// 在 notificationHandler.js 中添加自定义通知
export const showCustomNotification = (title, description) => {
  notification.open({
    message: title,
    description,
    icon: <BellOutlined style={{ color: '#1890ff' }} />,
    duration: 4.5,
    style: {
      // 自定义样式
      backgroundColor: '#f6ffed',
      border: '1px solid #b7eb8f'
    },
    onClick: () => {
      console.log('Notification clicked!');
    }
  });
};

// ========================================
// 示例 9: 在 Redux Store 中配置 token
// ========================================

// store/userSlice.js
import { createSlice } from '@reduxjs/toolkit';

const userSlice = createSlice({
  name: 'user',
  initialState: {
    currentUser: null,
    token: null
  },
  reducers: {
    setUser: (state, action) => {
      state.currentUser = action.payload.user;
      state.token = action.payload.token;
    },
    clearUser: (state) => {
      state.currentUser = null;
      state.token = null;
    }
  }
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;

// ========================================
// 示例 10: 登录时设置 token
// ========================================

import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setUser } from '@/store/userSlice';
import { login } from '@/services/authService';

function LoginPage() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (values) => {
    setLoading(true);
    try {
      const res = await login(values);

      if (res.code === 200) {
        const { user, token } = res.data;

        // 保存用户信息和 token 到 Redux
        dispatch(setUser({ user, token }));

        // WebSocketProvider 会自动检测到 token 并建立连接

        message.success('登录成功');
      } else {
        message.error(res.message || '登录失败');
      }
    } catch (error) {
      console.error('Login error:', error);
      message.error('登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* 登录表单 */}
    </div>
  );
}

export default LoginPage;

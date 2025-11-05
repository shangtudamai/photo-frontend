/**
 * WebSocket Context
 * 提供全局 WebSocket 连接和消息处理
 */

import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useWebSocket } from '../hooks/useWebSocket';
import { handleWebSocketMessage } from '../utils/notificationHandler';

// 创建 WebSocket Context
const WebSocketContext = createContext(null);

/**
 * WebSocket Provider
 * 在应用顶层使用，为所有子组件提供 WebSocket 连接
 */
export const WebSocketProvider = ({ children }) => {
  // 从 Redux 获取当前用户信息
  const currentUser = useSelector((state) => state.user?.currentUser);
  const token = useSelector((state) => state.user?.token);

  // WebSocket 服务器地址
  // 开发环境
  const WS_URL = process.env.NODE_ENV === 'production'
    ? `wss://${window.location.host}/ws`
    : 'ws://localhost:3000/ws';

  // 消息处理函数
  const handleMessage = (data) => {
    console.log('[WS Provider] Received message:', data);

    // 根据用户角色过滤消息
    if (!shouldReceiveMessage(data, currentUser)) {
      console.log('[WS Provider] Message filtered by role');
      return;
    }

    // 调用通知处理器
    handleWebSocketMessage(data, currentUser);
  };

  // 连接成功回调
  const handleConnect = () => {
    console.log('[WS Provider] Connected successfully');
  };

  // 断开连接回调
  const handleDisconnect = () => {
    console.log('[WS Provider] Disconnected');
  };

  // 错误处理回调
  const handleError = (error) => {
    console.error('[WS Provider] Error:', error);
  };

  // 使用 WebSocket Hook
  const ws = useWebSocket(WS_URL, {
    token,
    onMessage: handleMessage,
    onConnect: handleConnect,
    onDisconnect: handleDisconnect,
    onError: handleError,
    autoConnect: !!token, // 只有在有token时才自动连接
    autoReconnect: true
  });

  // Context value
  const contextValue = useMemo(() => ({
    ...ws,
    currentUser
  }), [ws, currentUser]);

  // 如果用户未登录，则不渲染 WebSocket Provider
  if (!currentUser || !token) {
    return <>{children}</>;
  }

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

/**
 * 判断用户是否应该接收该消息
 * 根据用户角色和消息类型进行过滤
 */
function shouldReceiveMessage(data, currentUser) {
  if (!currentUser) return false;

  const { type, data: messageData } = data;
  const { userId, roles } = currentUser;

  // 管理员接收所有消息
  if (roles.includes('admin')) {
    return true;
  }

  switch (type) {
    case 'order_status_change':
      // 客户经理、订单创建人、订单相关任务的负责人
      return (
        roles.includes('client_manager') ||
        messageData.createdBy === userId ||
        messageData.affectedUserIds?.includes(userId)
      );

    case 'task_assigned':
      // 任务负责人、客户经理
      return (
        messageData.assigneeId === userId ||
        roles.includes('client_manager')
      );

    case 'task_progress':
      // 客户经理、订单创建人
      return (
        roles.includes('client_manager') ||
        messageData.affectedUserIds?.includes(userId)
      );

    case 'payment_created':
      // 财务、客户经理
      return (
        roles.includes('finance') ||
        roles.includes('client_manager')
      );

    case 'capacity_alert':
      // 客户经理
      return roles.includes('client_manager');

    default:
      return false;
  }
}

/**
 * 使用 WebSocket Context Hook
 */
export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);

  if (!context) {
    console.warn('[WS Context] WebSocketContext is not available');
    return {
      status: 3,
      isConnected: false,
      isConnecting: false,
      connect: () => {},
      disconnect: () => {},
      sendMessage: () => false,
      sendPing: () => {},
      joinRoom: () => {},
      leaveRoom: () => {},
      currentUser: null
    };
  }

  return context;
};

export default WebSocketContext;

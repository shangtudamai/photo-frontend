/**
 * WebSocket Hook
 * 提供 WebSocket 连接管理和自动重连功能
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { message } from 'antd';

// WebSocket 连接状态
export const WS_STATUS = {
  CONNECTING: 0,
  CONNECTED: 1,
  DISCONNECTING: 2,
  DISCONNECTED: 3
};

// 重连配置
const RECONNECT_DELAY = 3000; // 3秒后重连
const MAX_RECONNECT_ATTEMPTS = 10; // 最大重连次数

/**
 * WebSocket Hook
 * @param {string} url - WebSocket服务器地址
 * @param {object} options - 配置选项
 * @param {string} options.token - JWT令牌
 * @param {function} options.onMessage - 消息处理函数
 * @param {function} options.onConnect - 连接成功回调
 * @param {function} options.onDisconnect - 断开连接回调
 * @param {function} options.onError - 错误处理回调
 * @param {boolean} options.autoConnect - 是否自动连接（默认true）
 * @param {boolean} options.autoReconnect - 是否自动重连（默认true）
 */
export const useWebSocket = (url, options = {}) => {
  const {
    token,
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    autoConnect = true,
    autoReconnect = true
  } = options;

  // WebSocket实例引用
  const wsRef = useRef(null);

  // 重连定时器引用
  const reconnectTimerRef = useRef(null);

  // 重连次数
  const reconnectAttemptsRef = useRef(0);

  // 连接状态
  const [status, setStatus] = useState(WS_STATUS.DISCONNECTED);

  // 是否手动关闭
  const manualCloseRef = useRef(false);

  /**
   * 清除重连定时器
   */
  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  /**
   * 连接 WebSocket
   */
  const connect = useCallback(() => {
    // 如果已经连接或正在连接，则不重复连接
    if (wsRef.current &&
        (wsRef.current.readyState === WebSocket.CONNECTING ||
         wsRef.current.readyState === WebSocket.OPEN)) {
      return;
    }

    // 检查token
    if (!token) {
      console.error('[WS Hook] Token is required for WebSocket connection');
      return;
    }

    try {
      // 构建WebSocket URL（带token参数）
      const wsUrl = `${url}?token=${encodeURIComponent(token)}`;

      console.log('[WS Hook] Connecting to WebSocket server...');
      setStatus(WS_STATUS.CONNECTING);

      // 创建WebSocket连接
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      // 连接成功
      ws.onopen = () => {
        console.log('[WS Hook] WebSocket connected');
        setStatus(WS_STATUS.CONNECTED);
        reconnectAttemptsRef.current = 0; // 重置重连次数
        clearReconnectTimer();

        // 调用连接成功回调
        if (onConnect) {
          onConnect();
        }
      };

      // 接收消息
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[WS Hook] Message received:', data);

          // 调用消息处理函数
          if (onMessage) {
            onMessage(data);
          }
        } catch (error) {
          console.error('[WS Hook] Failed to parse message:', error);
        }
      };

      // 连接关闭
      ws.onclose = (event) => {
        console.log('[WS Hook] WebSocket disconnected', event);
        setStatus(WS_STATUS.DISCONNECTED);
        wsRef.current = null;

        // 调用断开连接回调
        if (onDisconnect) {
          onDisconnect();
        }

        // 如果不是手动关闭且允许自动重连，则尝试重连
        if (!manualCloseRef.current && autoReconnect) {
          if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttemptsRef.current++;
            console.log(
              `[WS Hook] Reconnecting in ${RECONNECT_DELAY / 1000}s... (Attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`
            );

            reconnectTimerRef.current = setTimeout(() => {
              connect();
            }, RECONNECT_DELAY);
          } else {
            console.error('[WS Hook] Max reconnect attempts reached');
            message.error('WebSocket连接失败，请刷新页面重试');
          }
        }
      };

      // 连接错误
      ws.onerror = (error) => {
        console.error('[WS Hook] WebSocket error:', error);

        // 调用错误处理回调
        if (onError) {
          onError(error);
        }
      };
    } catch (error) {
      console.error('[WS Hook] Failed to create WebSocket:', error);
      setStatus(WS_STATUS.DISCONNECTED);
    }
  }, [url, token, onMessage, onConnect, onDisconnect, onError, autoReconnect, clearReconnectTimer]);

  /**
   * 断开 WebSocket
   */
  const disconnect = useCallback(() => {
    manualCloseRef.current = true;
    clearReconnectTimer();

    if (wsRef.current) {
      console.log('[WS Hook] Disconnecting WebSocket...');
      setStatus(WS_STATUS.DISCONNECTING);
      wsRef.current.close();
      wsRef.current = null;
    }
  }, [clearReconnectTimer]);

  /**
   * 发送消息
   */
  const sendMessage = useCallback((data) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      wsRef.current.send(message);
      console.log('[WS Hook] Message sent:', data);
      return true;
    } else {
      console.warn('[WS Hook] WebSocket is not connected, cannot send message');
      return false;
    }
  }, []);

  /**
   * 发送心跳
   */
  const sendPing = useCallback(() => {
    sendMessage({
      type: 'ping',
      timestamp: Date.now()
    });
  }, [sendMessage]);

  /**
   * 加入房间
   */
  const joinRoom = useCallback((roomId) => {
    sendMessage({
      type: 'join_room',
      payload: { roomId }
    });
  }, [sendMessage]);

  /**
   * 离开房间
   */
  const leaveRoom = useCallback((roomId) => {
    sendMessage({
      type: 'leave_room',
      payload: { roomId }
    });
  }, [sendMessage]);

  // 自动连接
  useEffect(() => {
    if (autoConnect && token) {
      manualCloseRef.current = false;
      connect();
    }

    // 组件卸载时断开连接
    return () => {
      disconnect();
    };
  }, [autoConnect, token, connect, disconnect]);

  return {
    status,
    isConnected: status === WS_STATUS.CONNECTED,
    isConnecting: status === WS_STATUS.CONNECTING,
    connect,
    disconnect,
    sendMessage,
    sendPing,
    joinRoom,
    leaveRoom
  };
};

export default useWebSocket;

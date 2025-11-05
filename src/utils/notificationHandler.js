/**
 * WebSocket 消息通知处理器
 * 根据不同的消息类型显示相应的通知
 */

import { notification } from 'antd';
import {
  BellOutlined,
  FileTextOutlined,
  DollarOutlined,
  WarningOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';

/**
 * 处理 WebSocket 消息
 * @param {object} message - WebSocket消息对象
 * @param {object} currentUser - 当前用户信息
 */
export const handleWebSocketMessage = (message, currentUser) => {
  const { type, data, timestamp } = message;

  console.log('[Notification Handler] Processing message:', type);

  switch (type) {
    case 'connected':
      handleConnectedMessage(data);
      break;

    case 'order_status_change':
      handleOrderStatusChange(data);
      break;

    case 'task_assigned':
      handleTaskAssigned(data, currentUser);
      break;

    case 'task_progress':
      handleTaskProgress(data);
      break;

    case 'payment_created':
      handlePaymentCreated(data);
      break;

    case 'capacity_alert':
      handleCapacityAlert(data);
      break;

    default:
      console.log('[Notification Handler] Unknown message type:', type);
  }
};

/**
 * 处理连接成功消息
 */
function handleConnectedMessage(data) {
  // 不显示通知，只在控制台输出
  console.log('[Notification Handler] WebSocket connected:', data.message);
}

/**
 * 处理订单状态变更消息
 */
function handleOrderStatusChange(data) {
  const {
    orderNo,
    oldStatus,
    newStatus,
    statusText,
    clientName,
    updatedBy,
    updatedAt
  } = data;

  // 根据状态变化确定通知类型
  let notificationType = 'info';
  if (newStatus === 4) {
    notificationType = 'success'; // 已完成
  } else if (newStatus === 5) {
    notificationType = 'warning'; // 已取消
  }

  notification[notificationType]({
    message: '订单状态变更',
    description: (
      <div>
        <div>订单编号：{orderNo}</div>
        <div>客户名称：{clientName}</div>
        <div>状态变更：{getOrderStatusText(oldStatus)} → {statusText}</div>
        <div>操作人：{updatedBy}</div>
      </div>
    ),
    icon: <FileTextOutlined style={{ color: notificationType === 'success' ? '#52c41a' : '#1890ff' }} />,
    duration: 4.5,
    onClick: () => {
      // 可以跳转到订单详情页
      window.location.href = `#/orders?orderId=${data.orderId}`;
    }
  });

  // 播放提示音（可选）
  playNotificationSound();
}

/**
 * 处理任务分配消息
 */
function handleTaskAssigned(data, currentUser) {
  const {
    taskType,
    orderNo,
    assigneeName,
    deadline,
    description,
    assignedBy
  } = data;

  // 如果是分配给自己的任务，使用特殊样式
  const isAssignedToMe = currentUser && data.assigneeId === currentUser.userId;

  notification.info({
    message: isAssignedToMe ? '🎯 新任务分配给您' : '任务分配通知',
    description: (
      <div>
        <div>任务类型：{getTaskTypeText(taskType)}</div>
        <div>订单编号：{orderNo}</div>
        <div>负责人：{assigneeName}</div>
        <div>截止日期：{deadline}</div>
        {description && <div>任务说明：{description}</div>}
        <div>分配人：{assignedBy}</div>
      </div>
    ),
    icon: <BellOutlined style={{ color: isAssignedToMe ? '#ff4d4f' : '#1890ff' }} />,
    duration: 6,
    onClick: () => {
      // 跳转到任务详情页
      window.location.href = `#/tasks?taskId=${data.taskId}`;
    }
  });

  // 如果是分配给自己的，播放提示音
  if (isAssignedToMe) {
    playNotificationSound();
  }
}

/**
 * 处理任务进度更新消息
 */
function handleTaskProgress(data) {
  const {
    taskType,
    orderNo,
    progress,
    status,
    statusText,
    updatedBy,
    remark
  } = data;

  // 根据任务状态确定通知类型
  let notificationType = 'info';
  let icon = <FileTextOutlined style={{ color: '#1890ff' }} />;

  if (status === 3) {
    notificationType = 'success'; // 已完成
    icon = <CheckCircleOutlined style={{ color: '#52c41a' }} />;
  } else if (status === 4) {
    notificationType = 'warning'; // 已退回
    icon = <WarningOutlined style={{ color: '#faad14' }} />;
  }

  notification[notificationType]({
    message: '任务进度更新',
    description: (
      <div>
        <div>任务类型：{getTaskTypeText(taskType)}</div>
        <div>订单编号：{orderNo}</div>
        <div>任务状态：{statusText}</div>
        {progress !== null && <div>进度：{progress}%</div>}
        {remark && <div>备注：{remark}</div>}
        <div>更新人：{updatedBy}</div>
      </div>
    ),
    icon,
    duration: 4.5,
    onClick: () => {
      // 跳转到任务详情页
      window.location.href = `#/tasks?taskId=${data.taskId}`;
    }
  });

  // 任务完成时播放提示音
  if (status === 3) {
    playNotificationSound();
  }
}

/**
 * 处理收款记录创建消息
 */
function handlePaymentCreated(data) {
  const {
    orderNo,
    amount,
    paymentMethod,
    clientName,
    createdBy
  } = data;

  notification.success({
    message: '💰 新收款记录',
    description: (
      <div>
        <div>订单编号：{orderNo}</div>
        <div>客户名称：{clientName}</div>
        <div>收款金额：¥{amount.toLocaleString()}</div>
        <div>收款方式：{getPaymentMethodText(paymentMethod)}</div>
        <div>创建人：{createdBy}</div>
      </div>
    ),
    icon: <DollarOutlined style={{ color: '#52c41a' }} />,
    duration: 5,
    onClick: () => {
      // 跳转到订单详情页（收款记录标签页）
      window.location.href = `#/orders?orderId=${data.orderId}`;
    }
  });

  playNotificationSound();
}

/**
 * 处理产能预警消息
 */
function handleCapacityAlert(data) {
  const {
    employeeName,
    currentLoad,
    maxLoad,
    loadPercentage,
    availableSlots,
    alertLevel
  } = data;

  // 根据预警等级确定通知类型
  const notificationType = alertLevel === 'critical' ? 'error' : 'warning';
  const color = alertLevel === 'critical' ? '#ff4d4f' : '#faad14';

  notification[notificationType]({
    message: '⚠️ 产能预警',
    description: (
      <div>
        <div>员工姓名：{employeeName}</div>
        <div>当前负荷：{currentLoad} / {maxLoad} ({loadPercentage}%)</div>
        <div>剩余空位：{availableSlots}</div>
        <div style={{ color, fontWeight: 'bold' }}>
          {alertLevel === 'critical' ? '产能已严重不足！' : '产能接近饱和！'}
        </div>
      </div>
    ),
    icon: <WarningOutlined style={{ color }} />,
    duration: 8,
    onClick: () => {
      // 跳转到任务管理页
      window.location.href = `#/tasks`;
    }
  });

  playNotificationSound();
}

/**
 * 获取订单状态文本
 */
function getOrderStatusText(status) {
  const statusMap = {
    1: '待确认',
    2: '进行中',
    3: '待验收',
    4: '已完成',
    5: '已取消'
  };
  return statusMap[status] || '未知';
}

/**
 * 获取任务类型文本
 */
function getTaskTypeText(type) {
  const typeMap = {
    1: '摄影任务',
    2: '修图任务'
  };
  return typeMap[type] || '未知';
}

/**
 * 获取收款方式文本
 */
function getPaymentMethodText(method) {
  const methodMap = {
    1: '现金',
    2: '微信',
    3: '支付宝',
    4: '银行转账',
    5: '其他'
  };
  return methodMap[method] || '未知';
}

/**
 * 播放通知提示音
 */
function playNotificationSound() {
  try {
    // 使用Web Audio API播放提示音
    // 可以替换为自定义音频文件
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (error) {
    console.warn('[Notification Handler] Failed to play notification sound:', error);
  }
}

export default handleWebSocketMessage;

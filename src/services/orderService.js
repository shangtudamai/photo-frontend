import request from '../utils/request';

/**
 * 订单管理服务
 */

/**
 * 获取订单列表
 * @param {object} params - 查询参数
 */
export const getOrderList = (params) => {
  return request.get('/api/orders', { params });
};

/**
 * 获取订单详情
 * @param {number} orderId - 订单ID
 */
export const getOrderDetail = (orderId) => {
  return request.get(`/api/orders/${orderId}`);
};

/**
 * 创建订单
 * @param {object} data - 订单数据
 */
export const createOrder = (data) => {
  return request.post('/api/orders', data);
};

/**
 * 更新订单
 * @param {number} orderId - 订单ID
 * @param {object} data - 更新数据
 */
export const updateOrder = (orderId, data) => {
  return request.put(`/api/orders/${orderId}`, data);
};

/**
 * 更新订单状态
 * @param {number} orderId - 订单ID
 * @param {number} status - 新状态
 */
export const updateOrderStatus = (orderId, status) => {
  return request.put(`/api/orders/${orderId}/status`, { status });
};

/**
 * 删除订单
 * @param {number} orderId - 订单ID
 */
export const deleteOrder = (orderId) => {
  return request.delete(`/api/orders/${orderId}`);
};

/**
 * 获取客户列表（用于下拉选择）
 */
export const getClientList = () => {
  return request.get('/api/clients', {
    params: { page: 1, limit: 1000, status: 1 }
  });
};

/**
 * 获取客户详情
 * @param {number} clientId - 客户ID
 */
export const getClientDetail = (clientId) => {
  return request.get(`/api/clients/${clientId}`);
};

/**
 * 获取产品效果类型列表
 */
export const getEffectTypes = () => {
  return request.get('/api/orders/effect-types');
};

/**
 * 获取订单产品明细
 * @param {number} orderId - 订单ID
 */
export const getOrderItems = (orderId) => {
  return request.get(`/api/orders/${orderId}/items`);
};

/**
 * 获取订单任务列表
 * @param {number} orderId - 订单ID
 */
export const getOrderTasks = (orderId) => {
  return request.get(`/api/orders/${orderId}/tasks`);
};

/**
 * 获取订单收款记录
 * @param {number} orderId - 订单ID
 */
export const getOrderPayments = (orderId) => {
  return request.get(`/api/payments`, {
    params: { order_id: orderId }
  });
};

/**
 * 上传订单附件
 * @param {number} orderId - 订单ID
 * @param {FormData} formData - 文件数据
 */
export const uploadOrderAttachment = (orderId, formData) => {
  return request.post(`/api/orders/${orderId}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

/**
 * 获取订单历史日志
 * @param {number} orderId - 订单ID
 */
export const getOrderHistory = (orderId) => {
  return request.get(`/api/orders/${orderId}/history`);
};

/**
 * 计算订单金额
 * @param {object} data - 订单数据（产品明细、折扣等）
 */
export const calculateOrderAmount = (data) => {
  return request.post('/api/orders/calculate-amount', data);
};

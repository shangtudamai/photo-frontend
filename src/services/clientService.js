import request from '../utils/request';

/**
 * 客户管理相关 API 服务
 */

// 获取客户列表
export const getClientList = (params) => {
  return request.get('/api/clients', { params });
};

// 获取客户详情
export const getClientDetail = (clientId) => {
  return request.get(`/api/clients/${clientId}`);
};

// 创建客户
export const createClient = (data) => {
  return request.post('/api/clients', data);
};

// 更新客户
export const updateClient = (clientId, data) => {
  return request.put(`/api/clients/${clientId}`, data);
};

// 删除客户
export const deleteClient = (clientId) => {
  return request.delete(`/api/clients/${clientId}`);
};

// 检查客户名称是否存在
export const checkClientNameExists = (clientName) => {
  return request.get('/api/clients/check-name', {
    params: { clientName }
  });
};

// 获取客户历史订单
export const getClientOrders = (clientId, params) => {
  return request.get(`/api/clients/${clientId}/orders`, { params });
};

// 获取客户消费趋势
export const getClientConsumptionTrend = (clientId, params) => {
  return request.get(`/api/clients/${clientId}/consumption-trend`, { params });
};

// 获取所有标签
export const getClientTags = () => {
  return request.get('/api/clients/tags');
};

// 创建新标签
export const createClientTag = (data) => {
  return request.post('/api/clients/tags', data);
};

// 更新客户标签
export const updateClientTags = (clientId, tags) => {
  return request.put(`/api/clients/${clientId}/tags`, { tags });
};

// 获取客户统计数据
export const getClientStatistics = (clientId) => {
  return request.get(`/api/clients/${clientId}/statistics`);
};

// 批量删除客户
export const batchDeleteClients = (clientIds) => {
  return request.post('/api/clients/batch-delete', { clientIds });
};

export default {
  getClientList,
  getClientDetail,
  createClient,
  updateClient,
  deleteClient,
  checkClientNameExists,
  getClientOrders,
  getClientConsumptionTrend,
  getClientTags,
  createClientTag,
  updateClientTags,
  getClientStatistics,
  batchDeleteClients
};

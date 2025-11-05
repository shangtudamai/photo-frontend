/**
 * 系统参数设置 API 服务
 */

import request from '../utils/request';

/**
 * 获取所有参数（按类别分组）
 */
export const getAllParameters = () => {
  return request.get('/api/settings');
};

/**
 * 批量更新参数
 * @param {Array} parameters - 参数数组
 * @param {string} parameters[].parameterKey - 参数键
 * @param {any} parameters[].parameterValue - 参数值
 * @param {string} parameters[].changeReason - 变更原因（可选）
 */
export const batchUpdateParameters = (parameters) => {
  return request.patch('/api/settings', { parameters });
};

/**
 * 恢复默认值
 * @param {string} category - 参数类别 (capacity/finance/reward/worktime)
 */
export const resetToDefaults = (category) => {
  return request.post(`/api/settings/reset/${category}`);
};

/**
 * 获取参数变更日志
 * @param {string} parameterKey - 参数键（可选，用于过滤）
 * @param {number} page - 页码
 * @param {number} limit - 每页数量
 */
export const getChangeLogs = (parameterKey = null, page = 1, limit = 50) => {
  const params = { page, limit };
  if (parameterKey) {
    params.parameterKey = parameterKey;
  }
  return request.get('/api/settings/change-logs', { params });
};

/**
 * 刷新缓存（手动触发）
 */
export const refreshCache = () => {
  return request.post('/api/settings/refresh-cache');
};

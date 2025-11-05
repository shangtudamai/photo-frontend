/**
 * 操作日志 API 服务
 */

import request from '../utils/request';

/**
 * 获取操作日志列表
 * @param {object} params - 查询参数
 * @param {number} params.userId - 操作用户ID
 * @param {string} params.operationType - 操作类型
 * @param {string} params.targetType - 操作对象类型
 * @param {number} params.targetId - 操作对象ID
 * @param {string} params.startTime - 开始时间
 * @param {string} params.endTime - 结束时间
 * @param {number} params.page - 页码
 * @param {number} params.limit - 每页数量
 */
export const getLogs = (params) => {
  return request.get('/api/logs', { params });
};

/**
 * 导出操作日志为Excel
 * @param {object} params - 查询参数
 */
export const exportLogs = (params) => {
  return request.get('/api/logs/export', {
    params,
    responseType: 'blob'
  });
};

/**
 * 获取日志统计信息
 * @param {string} startTime - 开始时间
 * @param {string} endTime - 结束时间
 */
export const getStatistics = (startTime, endTime) => {
  return request.get('/api/logs/statistics', {
    params: { startTime, endTime }
  });
};

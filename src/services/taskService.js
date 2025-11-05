import request from '../utils/request';

/**
 * 任务管理相关 API 服务
 */

// 获取任务列表
export const getTaskList = (params) => {
  return request.get('/api/tasks', { params });
};

// 获取任务详情
export const getTaskDetail = (taskId) => {
  return request.get(`/api/tasks/${taskId}`);
};

// 创建任务（分配任务）
export const createTask = (data) => {
  return request.post('/api/tasks', data);
};

// 更新任务
export const updateTask = (taskId, data) => {
  return request.put(`/api/tasks/${taskId}`, data);
};

// 更新任务进度
export const updateTaskProgress = (taskId, data) => {
  return request.put(`/api/tasks/${taskId}/progress`, data);
};

// 退回任务
export const returnTask = (taskId, data) => {
  return request.post(`/api/tasks/${taskId}/return`, data);
};

// 删除任务
export const deleteTask = (taskId) => {
  return request.delete(`/api/tasks/${taskId}`);
};

// 检查员工产能
export const checkEmployeeCapacity = (employeeId, deadline) => {
  return request.post('/api/tasks/check-capacity', {
    employeeId,
    deadline
  });
};

// 获取任务进度历史记录
export const getTaskProgressHistory = (taskId) => {
  return request.get(`/api/tasks/${taskId}/progress-history`);
};

// 上传任务成果
export const uploadTaskResult = (taskId, formData) => {
  return request.post(`/api/tasks/${taskId}/results`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

// 获取任务成果列表
export const getTaskResults = (taskId) => {
  return request.get(`/api/tasks/${taskId}/results`);
};

// 删除任务成果
export const deleteTaskResult = (taskId, resultId) => {
  return request.delete(`/api/tasks/${taskId}/results/${resultId}`);
};

// 获取员工列表（用于分配任务）
export const getEmployeeList = (params) => {
  return request.get('/api/employees', { params });
};

// 获取订单列表（用于分配任务）
export const getOrderListForTask = (params) => {
  return request.get('/api/orders', { params });
};

// 批量分配任务
export const batchCreateTasks = (data) => {
  return request.post('/api/tasks/batch', data);
};

// 获取任务统计数据
export const getTaskStatistics = (params) => {
  return request.get('/api/tasks/statistics', { params });
};

// 接受任务
export const acceptTask = (taskId) => {
  return request.post(`/api/tasks/${taskId}/accept`);
};

// 拒绝任务
export const rejectTask = (taskId, data) => {
  return request.post(`/api/tasks/${taskId}/reject`, data);
};

// 获取我的任务列表
export const getMyTasks = (params) => {
  return request.get('/api/tasks/my-tasks', { params });
};

export default {
  getTaskList,
  getTaskDetail,
  createTask,
  updateTask,
  updateTaskProgress,
  returnTask,
  deleteTask,
  checkEmployeeCapacity,
  getTaskProgressHistory,
  uploadTaskResult,
  getTaskResults,
  deleteTaskResult,
  getEmployeeList,
  getOrderListForTask,
  batchCreateTasks,
  getTaskStatistics,
  acceptTask,
  rejectTask,
  getMyTasks
};
